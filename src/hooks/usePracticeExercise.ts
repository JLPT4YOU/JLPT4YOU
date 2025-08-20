/**
 * React Hook for Practice Exercise Management
 * Handles exercise generation, answer tracking, and progress
 */

import { useState, useCallback, useEffect } from 'react';
import { studyStorage, PracticeSession, UserAnswer } from '@/lib/study/localStorage-service';
import { createClient } from '@/utils/supabase/client';
import { DetailedExplanation } from '@/types';
import { devConsole } from '@/lib/console-override';

export interface Question {
  id: string;
  type: string;
  question: string;
  options: string[];
  correct: number;
  explanation: string | DetailedExplanation;
  tags?: string[];
  difficulty?: string;
  // Reading comprehension specific fields
  passage?: string;
  questions?: ReadingQuestion[];
  vocabulary_used?: string[];
  grammar_used?: string[];
}

export interface ReadingQuestion {
  id: string;
  question: string;
  options: string[];
  correct: number;
  explanation: DetailedExplanation;
}

export interface ExerciseState {
  // Exercise data
  exerciseSetId: string | null;
  questions: Question[];
  currentQuestionIndex: number;
  
  // User answers
  answers: Map<string, UserAnswer>;
  
  // Session info
  session: PracticeSession | null;
  
  // UI state
  isLoading: boolean;
  isGenerating: boolean;
  error: string | null;
  showExplanation: boolean;
  
  // Results
  isCompleted: boolean;
  score: number;
  accuracy: number;
}

export interface UsePracticeExerciseOptions {
  level: string;
  type: string;
  onComplete?: (session: PracticeSession) => void;
  onError?: (error: Error) => void;
}

export function usePracticeExercise(options: UsePracticeExerciseOptions) {
  const { level, type, onComplete, onError } = options;
  
  const [state, setState] = useState<ExerciseState>({
    exerciseSetId: null,
    questions: [],
    currentQuestionIndex: 0,
    answers: new Map(),
    session: null,
    isLoading: false,
    isGenerating: false,
    error: null,
    showExplanation: false,
    isCompleted: false,
    score: 0,
    accuracy: 0
  });
  
  // Timer state
  const [startTime, setStartTime] = useState<number>(0);
  const [elapsedTime, setElapsedTime] = useState<number>(0);

  // Check for existing session on mount (for retry functionality)
  useEffect(() => {
    const existingSession = studyStorage.getCurrentSession();
    if (existingSession && existingSession.level === level && existingSession.type === type) {
      // Load existing session
      setState(prev => ({
        ...prev,
        exerciseSetId: existingSession.exerciseSetId,
        questions: existingSession.questions,
        session: existingSession,
        currentQuestionIndex: 0,
        answers: new Map(),
        isCompleted: false,
        score: 0,
        accuracy: 0,
        error: null
      }));

      setStartTime(Date.now());
      setElapsedTime(0);
    }
  }, [level, type]);

  // Update timer
  useEffect(() => {
    if (startTime > 0 && !state.isCompleted) {
      const interval = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [startTime, state.isCompleted]);
  
  // Generate new exercise
  const generateExercise = useCallback(async (count: number = 10, difficulty?: string, selectionMode: 'random' | 'sequential' = 'random', offset?: number, model?: string, enableThinking?: boolean, materialLimit?: number) => {
    setState(prev => ({ ...prev, isGenerating: true, error: null }));

    try {
      // Save current session to history before starting new one (if exists and completed)
      const currentSession = studyStorage.getCurrentSession();
      if (currentSession && currentSession.completedAt) {
        // Session is already completed, it will be saved to history automatically
        // We can safely start a new session
      }

      // Get authentication headers
      const supabase = createClient();
      const { data: { session: authSession } } = await supabase.auth.getSession();

      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      };

      // Add authorization header if user is authenticated
      if (authSession?.access_token) {
        headers['Authorization'] = `Bearer ${authSession.access_token}`;
      }

      const response = await fetch('/api/study/generate', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          level,
          type,
          count,
          difficulty,
          selectionMode,
          offset,
          materialLimit,
          model,
          enableThinking,
          reuseRecent: false
        })
      });

      const clone = response.clone();
      if (!response.ok) {
        let serverMsg: string | undefined;
        try {
          const j = await clone.json();
          serverMsg = (j as any)?.error || (j as any)?.message;
        } catch {
          try { serverMsg = await clone.text(); } catch {}
        }
        throw new Error(serverMsg || `Failed to generate exercise (HTTP ${response.status})`);
      }

      const data = await response.json();

      if (!data?.success || !data?.data?.questions) {
        throw new Error(data?.error || 'Invalid response from server');
      }

      // Start new session (this will overwrite current session in localStorage)
      const session = studyStorage.startSession(
        data.data.setId,
        level,
        type,
        data.data.questions
      );

      setState(prev => ({
        ...prev,
        exerciseSetId: data.data.setId,
        questions: data.data.questions,
        session,
        currentQuestionIndex: 0,
        answers: new Map(),
        isGenerating: false,
        isCompleted: false,
        score: 0,
        accuracy: 0,
        showExplanation: false
      }));
      
      setStartTime(Date.now());
      setElapsedTime(0);
      
    } catch (error) {
      console.error('Error generating exercise:', error);
      setState(prev => ({
        ...prev,
        isGenerating: false,
        error: error instanceof Error ? error.message : 'Failed to generate exercise'
      }));
      
      if (onError) {
        onError(error instanceof Error ? error : new Error('Failed to generate exercise'));
      }
    }
  }, [level, type, onError]);
  

  // Submit answer for current question
  const submitAnswer = useCallback((answerIndex: number) => {
    const currentQuestion = state.questions[state.currentQuestionIndex];
    if (!currentQuestion) {
      console.error('❌ [submitAnswer] No current question found');
      return;
    }

    const questionTime = elapsedTime;
    const isCorrect = answerIndex === currentQuestion.correct;

    devConsole.log('📝 [submitAnswer] Submitting answer:', {
      questionId: currentQuestion.id,
      questionIndex: state.currentQuestionIndex,
      userAnswer: answerIndex,
      correctAnswer: currentQuestion.correct,
      isCorrect,
      questionTime
    });

    // Save answer to localStorage
    studyStorage.saveAnswer(
      currentQuestion.id,
      state.currentQuestionIndex,
      answerIndex,
      currentQuestion.correct,
      questionTime
    );

    // Update local state
    const userAnswer: UserAnswer = {
      questionId: currentQuestion.id,
      questionIndex: state.currentQuestionIndex,
      userAnswer: answerIndex,
      correctAnswer: currentQuestion.correct,
      isCorrect,
      timeSpent: questionTime,
      answeredAt: new Date().toISOString()
    };

    setState(prev => {
      const newAnswers = new Map(prev.answers);
      newAnswers.set(currentQuestion.id, userAnswer);

      devConsole.log('💾 [submitAnswer] Updated answers map:', {
        newAnswersSize: newAnswers.size,
        currentAnswer: userAnswer
      });

      return {
        ...prev,
        answers: newAnswers,
        showExplanation: true
      };
    });
  }, [state.questions, state.currentQuestionIndex, elapsedTime]);
  
  // Move to next question
  const nextQuestion = useCallback(() => {
    if (state.currentQuestionIndex < state.questions.length - 1) {
      setState(prev => ({
        ...prev,
        currentQuestionIndex: prev.currentQuestionIndex + 1,
        showExplanation: false
      }));
    } else {
      // Mark as completed, will be handled by useEffect
      setState(prev => ({
        ...prev,
        isCompleted: true
      }));
    }
  }, [state.currentQuestionIndex, state.questions.length]);
  
  // Move to previous question
  const previousQuestion = useCallback(() => {
    if (state.currentQuestionIndex > 0) {
      setState(prev => ({
        ...prev,
        currentQuestionIndex: prev.currentQuestionIndex - 1,
        showExplanation: false
      }));
    }
  }, [state.currentQuestionIndex]);
  
  // Skip current question
  const skipQuestion = useCallback(() => {
    nextQuestion();
  }, [nextQuestion]);
  
  // Complete exercise and save results
  const completeExercise = useCallback(() => {
    devConsole.log('🏁 [completeExercise] Starting completion process');
    devConsole.log('📊 [completeExercise] Current answers:', {
      answersSize: state.answers.size,
      answersArray: Array.from(state.answers.values()),
      questionsLength: state.questions.length
    });

    const completedSession = studyStorage.completeSession();

    if (!completedSession) {
      console.error('❌ [completeExercise] Failed to complete session');
      return;
    }

    const correctAnswers = Array.from(state.answers.values()).filter(a => a.isCorrect).length;
    const totalAnswered = state.answers.size;
    const accuracy = totalAnswered > 0 ? correctAnswers / totalAnswered : 0;

    devConsole.log('📈 [completeExercise] Final calculations:', {
      correctAnswers,
      totalAnswered,
      accuracy,
      completedSession
    });

    setState(prev => ({
      ...prev,
      isCompleted: true,
      score: correctAnswers,
      accuracy,
      session: completedSession
    }));

    if (onComplete) {
      onComplete(completedSession);
    }
  }, [state.answers, state.questions.length, onComplete]);

  // Auto-complete when marked as completed
  useEffect(() => {
    if (state.isCompleted && state.answers.size > 0 && !state.session?.completedAt) {
      devConsole.log('🔄 [useEffect] Auto-completing exercise');
      completeExercise();
    }
  }, [state.isCompleted, state.answers.size, state.session?.completedAt, completeExercise]);
  
  // Reset exercise (clears localStorage - use for exit/cancel)
  const resetExercise = useCallback(() => {
    // Clear current session from localStorage
    studyStorage.clearCurrentSession();

    setState({
      exerciseSetId: null,
      questions: [],
      currentQuestionIndex: 0,
      answers: new Map(),
      session: null,
      isLoading: false,
      isGenerating: false,
      error: null,
      showExplanation: false,
      isCompleted: false,
      score: 0,
      accuracy: 0
    });

    setStartTime(0);
    setElapsedTime(0);
  }, []);

  // Reset UI state only (keeps localStorage - use for new exercise)
  const resetUIState = useCallback(() => {
    setState({
      exerciseSetId: null,
      questions: [],
      currentQuestionIndex: 0,
      answers: new Map(),
      session: null,
      isLoading: false,
      isGenerating: false,
      isCompleted: false,
      score: 0,
      accuracy: 0,
      showExplanation: false,
      error: null
    });

    setStartTime(0);
    setElapsedTime(0);
  }, []);

  // Retry exercise with same questions
  const retryExercise = useCallback(() => {
    if (state.session && state.session.questions && state.session.questions.length > 0) {
      // Save current session data
      const savedQuestions = state.session.questions;
      const savedLevel = state.session.level;
      const savedType = state.session.type;
      const savedExerciseSetId = state.session.exerciseSetId;

      // Create new session with same questions
      const newSession = studyStorage.startSession(
        savedExerciseSetId,
        savedLevel,
        savedType,
        savedQuestions
      );

      // Reset state with same questions
      setState({
        exerciseSetId: savedExerciseSetId,
        questions: savedQuestions,
        currentQuestionIndex: 0,
        answers: new Map(),
        session: newSession,
        isLoading: false,
        isGenerating: false,
        error: null,
        showExplanation: false,
        isCompleted: false,
        score: 0,
        accuracy: 0
      });

      setStartTime(Date.now());
      setElapsedTime(0);
    }
  }, [state.session]);
  
  // Get current question
  const getCurrentQuestion = useCallback((): Question | null => {
    return state.questions[state.currentQuestionIndex] || null;
  }, [state.questions, state.currentQuestionIndex]);
  
  // Get answer for specific question
  const getAnswer = useCallback((questionId: string): UserAnswer | undefined => {
    return state.answers.get(questionId);
  }, [state.answers]);
  
  // Check if current question is answered
  const isCurrentQuestionAnswered = useCallback((): boolean => {
    const currentQuestion = getCurrentQuestion();
    return currentQuestion ? state.answers.has(currentQuestion.id) : false;
  }, [getCurrentQuestion, state.answers]);
  
  // Get progress info
  const getProgress = useCallback(() => {
    return {
      current: state.currentQuestionIndex + 1,
      total: state.questions.length,
      answered: state.answers.size,
      correct: Array.from(state.answers.values()).filter(a => a.isCorrect).length,
      percentage: state.questions.length > 0 
        ? Math.round((state.answers.size / state.questions.length) * 100)
        : 0
    };
  }, [state.currentQuestionIndex, state.questions.length, state.answers]);
  
  return {
    // State
    ...state,
    elapsedTime,
    
    // Actions
    generateExercise,
    submitAnswer,
    nextQuestion,
    previousQuestion,
    skipQuestion,
    completeExercise,
    resetExercise,
    resetUIState,
    retryExercise,
    
    // Getters
    getCurrentQuestion,
    getAnswer,
    isCurrentQuestionAnswered,
    getProgress,
    
    // Settings
    toggleExplanation: () => setState(prev => ({ ...prev, showExplanation: !prev.showExplanation }))
  };
}
