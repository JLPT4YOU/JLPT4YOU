/**
 * LocalStorage Service for JLPT Study
 * Manages user answers, progress, and practice history locally
 */

// Storage keys
export const STORAGE_KEYS = {
  PRACTICE_HISTORY: 'jlpt_practice_history',
  USER_ANSWERS: 'jlpt_user_answers',
  PROGRESS: 'jlpt_progress',
  SETTINGS: 'jlpt_practice_settings',
  CURRENT_SESSION: 'jlpt_current_session'
} as const;

// Type definitions
export interface PracticeSession {
  id: string;
  exerciseSetId: string | null;
  level: string;
  type: string;
  startedAt: string;
  completedAt?: string;
  questions: any[];
  answers: UserAnswer[];
  score?: number;
  totalQuestions: number;
  timeSpent?: number; // in seconds
}

export interface UserAnswer {
  questionId: string;
  questionIndex: number;
  userAnswer: string | number;
  correctAnswer: string | number;
  isCorrect: boolean;
  timeSpent?: number;
  answeredAt: string;
}

export interface UserProgress {
  [level: string]: {
    [type: string]: {
      completed: number;
      total: number;
      accuracy: number;
      lastPracticed?: string;
      streak?: number;
    };
  };
}

export interface PracticeSettings {
  showTimer: boolean;
  showExplanations: boolean;
  autoNext: boolean;
  soundEnabled: boolean;
  defaultQuestionCount: number;
  defaultDifficulty: 'easy' | 'medium' | 'hard' | 'extremely_hard';
}

/**
 * LocalStorage Service Class
 */
export class LocalStorageService {
  private isClient: boolean;

  constructor() {
    this.isClient = typeof window !== 'undefined';
  }

  /**
   * Generic storage methods
   */
  private getItem<T>(key: string): T | null {
    if (!this.isClient) return null;
    
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error(`Error reading from localStorage [${key}]:`, error);
      return null;
    }
  }

  private setItem<T>(key: string, value: T): boolean {
    if (!this.isClient) return false;
    
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Error writing to localStorage [${key}]:`, error);
      return false;
    }
  }

  private removeItem(key: string): boolean {
    if (!this.isClient) return false;
    
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Error removing from localStorage [${key}]:`, error);
      return false;
    }
  }

  /**
   * Practice Session Management
   */
  startSession(exerciseSetId: string | null, level: string, type: string, questions: any[]): PracticeSession {
    const session: PracticeSession = {
      id: `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      exerciseSetId,
      level,
      type,
      startedAt: new Date().toISOString(),
      questions,
      answers: [],
      totalQuestions: questions.length
    };
    
    this.setItem(STORAGE_KEYS.CURRENT_SESSION, session);
    return session;
  }

  getCurrentSession(): PracticeSession | null {
    return this.getItem<PracticeSession>(STORAGE_KEYS.CURRENT_SESSION);
  }

  clearCurrentSession(): void {
    this.removeItem(STORAGE_KEYS.CURRENT_SESSION);
  }

  saveAnswer(questionId: string, questionIndex: number, userAnswer: string | number, correctAnswer: string | number, timeSpent?: number): void {
    const session = this.getCurrentSession();
    if (!session) return;
    
    const answer: UserAnswer = {
      questionId,
      questionIndex,
      userAnswer,
      correctAnswer,
      isCorrect: userAnswer === correctAnswer,
      timeSpent,
      answeredAt: new Date().toISOString()
    };
    
    // Update or add answer
    const existingIndex = session.answers.findIndex(a => a.questionId === questionId);
    if (existingIndex >= 0) {
      session.answers[existingIndex] = answer;
    } else {
      session.answers.push(answer);
    }
    
    this.setItem(STORAGE_KEYS.CURRENT_SESSION, session);
  }

  completeSession(): PracticeSession | null {
    const session = this.getCurrentSession();
    if (!session) return null;
    
    // Calculate final score
    const correctAnswers = session.answers.filter(a => a.isCorrect).length;
    session.score = correctAnswers;
    session.completedAt = new Date().toISOString();
    
    // Calculate time spent
    if (session.startedAt) {
      const startTime = new Date(session.startedAt).getTime();
      const endTime = new Date(session.completedAt).getTime();
      session.timeSpent = Math.floor((endTime - startTime) / 1000);
    }
    
    // Save to history
    this.addToHistory(session);
    
    // Update progress
    this.updateProgress(session);
    
    // Clear current session
    this.removeItem(STORAGE_KEYS.CURRENT_SESSION);
    
    return session;
  }

  /**
   * Practice History Management
   */
  getHistory(level?: string, type?: string, limit?: number): PracticeSession[] {
    const history = this.getItem<{ sessions: PracticeSession[] }>(STORAGE_KEYS.PRACTICE_HISTORY);
    if (!history || !history.sessions) return [];
    
    let sessions = history.sessions;
    
    // Filter by level and type if provided
    if (level) {
      sessions = sessions.filter(s => s.level === level);
    }
    if (type) {
      sessions = sessions.filter(s => s.type === type);
    }
    
    // Sort by date (newest first)
    sessions.sort((a, b) => {
      const dateA = new Date(b.completedAt || b.startedAt).getTime();
      const dateB = new Date(a.completedAt || a.startedAt).getTime();
      return dateA - dateB;
    });
    
    // Apply limit
    if (limit && limit > 0) {
      sessions = sessions.slice(0, limit);
    }
    
    return sessions;
  }

  private addToHistory(session: PracticeSession): void {
    const history = this.getItem<{ sessions: PracticeSession[] }>(STORAGE_KEYS.PRACTICE_HISTORY) || { sessions: [] };
    
    // Add new session
    history.sessions.push(session);
    
    // Keep only last 100 sessions to prevent storage overflow
    if (history.sessions.length > 100) {
      history.sessions = history.sessions.slice(-100);
    }
    
    this.setItem(STORAGE_KEYS.PRACTICE_HISTORY, history);
  }

  clearHistory(): boolean {
    return this.removeItem(STORAGE_KEYS.PRACTICE_HISTORY);
  }

  /**
   * Delete a specific session from history
   */
  deleteSession(sessionId: string): boolean {
    const history = this.getItem<{ sessions: PracticeSession[] }>(STORAGE_KEYS.PRACTICE_HISTORY);
    if (!history || !history.sessions) return false;

    const originalLength = history.sessions.length;
    history.sessions = history.sessions.filter(session => session.id !== sessionId);

    if (history.sessions.length < originalLength) {
      this.setItem(STORAGE_KEYS.PRACTICE_HISTORY, history);
      return true;
    }

    return false;
  }

  /**
   * Get a specific session by ID
   */
  getSessionById(sessionId: string): PracticeSession | null {
    const history = this.getItem<{ sessions: PracticeSession[] }>(STORAGE_KEYS.PRACTICE_HISTORY);
    if (!history || !history.sessions) return null;

    return history.sessions.find(session => session.id === sessionId) || null;
  }

  /**
   * Load a session for retry (restore questions and reset answers)
   */
  loadSessionForRetry(sessionId: string): PracticeSession | null {
    const originalSession = this.getSessionById(sessionId);
    if (!originalSession) return null;

    // Create a new session based on the original but with reset answers
    const retrySession: PracticeSession = {
      id: `retry_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      exerciseSetId: originalSession.exerciseSetId,
      level: originalSession.level,
      type: originalSession.type,
      startedAt: new Date().toISOString(),
      questions: originalSession.questions, // Keep the same questions
      answers: [], // Reset answers
      totalQuestions: originalSession.totalQuestions
    };

    // Set as current session
    this.setItem(STORAGE_KEYS.CURRENT_SESSION, retrySession);
    return retrySession;
  }

  /**
   * Progress Management
   */
  getProgress(): UserProgress {
    return this.getItem<UserProgress>(STORAGE_KEYS.PROGRESS) || {};
  }

  updateProgress(session: PracticeSession): void {
    const progress = this.getProgress();
    
    // Initialize level/type if not exists
    if (!progress[session.level]) {
      progress[session.level] = {};
    }
    if (!progress[session.level][session.type]) {
      progress[session.level][session.type] = {
        completed: 0,
        total: 0,
        accuracy: 0
      };
    }
    
    const typeProgress = progress[session.level][session.type];
    
    // Update statistics
    typeProgress.completed += session.totalQuestions;
    typeProgress.total += session.totalQuestions;
    
    // Calculate new accuracy
    const correctInSession = session.answers.filter(a => a.isCorrect).length;
    const totalAnswered = session.answers.length;
    
    if (totalAnswered > 0) {
      const sessionAccuracy = correctInSession / totalAnswered;
      
      // Weighted average with previous accuracy
      if (typeProgress.completed > session.totalQuestions) {
        const previousWeight = (typeProgress.completed - session.totalQuestions) / typeProgress.completed;
        const currentWeight = session.totalQuestions / typeProgress.completed;
        typeProgress.accuracy = (typeProgress.accuracy * previousWeight) + (sessionAccuracy * currentWeight);
      } else {
        typeProgress.accuracy = sessionAccuracy;
      }
    }
    
    typeProgress.lastPracticed = new Date().toISOString();
    
    // Update streak
    const lastPracticed = typeProgress.lastPracticed ? new Date(typeProgress.lastPracticed) : null;
    const today = new Date();
    if (lastPracticed) {
      const daysSinceLastPractice = Math.floor((today.getTime() - lastPracticed.getTime()) / (1000 * 60 * 60 * 24));
      if (daysSinceLastPractice <= 1) {
        typeProgress.streak = (typeProgress.streak || 0) + 1;
      } else {
        typeProgress.streak = 1;
      }
    } else {
      typeProgress.streak = 1;
    }
    
    this.setItem(STORAGE_KEYS.PROGRESS, progress);
  }

  resetProgress(): boolean {
    return this.removeItem(STORAGE_KEYS.PROGRESS);
  }

  /**
   * Settings Management
   */
  getSettings(): PracticeSettings {
    return this.getItem<PracticeSettings>(STORAGE_KEYS.SETTINGS) || {
      showTimer: true,
      showExplanations: true,
      autoNext: false,
      soundEnabled: false,
      defaultQuestionCount: 10,
      defaultDifficulty: 'medium'
    };
  }

  updateSettings(settings: Partial<PracticeSettings>): void {
    const currentSettings = this.getSettings();
    const newSettings = { ...currentSettings, ...settings };
    this.setItem(STORAGE_KEYS.SETTINGS, newSettings);
  }

  /**
   * Statistics Helpers
   */
  getStatistics(level?: string, type?: string) {
    const history = this.getHistory(level, type);
    const progress = this.getProgress();
    
    // Calculate overall statistics
    let totalQuestions = 0;
    let totalCorrect = 0;
    let totalTimeSpent = 0;
    let sessionsCompleted = history.length;
    
    history.forEach(session => {
      totalQuestions += session.totalQuestions;
      totalCorrect += session.score || 0;
      totalTimeSpent += session.timeSpent || 0;
    });
    
    const overallAccuracy = totalQuestions > 0 ? totalCorrect / totalQuestions : 0;
    const averageScore = sessionsCompleted > 0 ? totalCorrect / sessionsCompleted : 0;
    const averageTime = sessionsCompleted > 0 ? totalTimeSpent / sessionsCompleted : 0;
    
    return {
      sessionsCompleted,
      totalQuestions,
      totalCorrect,
      overallAccuracy,
      averageScore,
      averageTime,
      totalTimeSpent,
      progress,
      recentSessions: history.slice(0, 5)
    };
  }

  /**
   * Export/Import for backup
   */
  exportData(): string {
    const data = {
      history: this.getItem(STORAGE_KEYS.PRACTICE_HISTORY),
      progress: this.getItem(STORAGE_KEYS.PROGRESS),
      settings: this.getItem(STORAGE_KEYS.SETTINGS),
      exportedAt: new Date().toISOString(),
      version: '1.0.0'
    };
    
    return JSON.stringify(data, null, 2);
  }

  importData(jsonString: string): boolean {
    try {
      const data = JSON.parse(jsonString);
      
      if (data.history) {
        this.setItem(STORAGE_KEYS.PRACTICE_HISTORY, data.history);
      }
      if (data.progress) {
        this.setItem(STORAGE_KEYS.PROGRESS, data.progress);
      }
      if (data.settings) {
        this.setItem(STORAGE_KEYS.SETTINGS, data.settings);
      }
      
      return true;
    } catch (error) {
      console.error('Failed to import data:', error);
      return false;
    }
  }

  /**
   * Storage size management
   */
  getStorageSize(): number {
    if (!this.isClient) return 0;
    
    let totalSize = 0;
    for (const key of Object.values(STORAGE_KEYS)) {
      const item = localStorage.getItem(key);
      if (item) {
        totalSize += item.length;
      }
    }
    
    return totalSize;
  }

  /**
   * Clear all study data
   */
  clearAll(): boolean {
    try {
      for (const key of Object.values(STORAGE_KEYS)) {
        this.removeItem(key);
      }
      return true;
    } catch (error) {
      console.error('Failed to clear all data:', error);
      return false;
    }
  }
}

// Export singleton instance
export const studyStorage = new LocalStorageService();
