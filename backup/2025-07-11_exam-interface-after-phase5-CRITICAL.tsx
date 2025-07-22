"use client"

import { useState, useEffect, useCallback, useRef } from "react";
import { cn } from "@/lib/utils";
import { AntiCheatViolation } from "@/components/anti-cheat-system";
import { useExamTimer } from "@/hooks/useExamTimer";
import { ExamHeader } from "@/components/exam-header";
import { QuestionContent } from "@/components/question-content";
import { QuestionSidebar } from "@/components/question-sidebar";
import { ExamModals } from "@/components/exam-modals";

// Types
export interface Question {
  id: number;
  question: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correctAnswer?: 'A' | 'B' | 'C' | 'D';
}

interface ExamState {
  currentQuestion: number;
  answers: Record<number, 'A' | 'B' | 'C' | 'D'>;
  flagged: Set<number>;
}

interface ExamInterfaceProps {
  examTitle: string;
  questions: Question[];
  timeLimit: number; // in minutes
  onSubmit: (answers: Record<number, 'A' | 'B' | 'C' | 'D'>) => void;
  onPause?: () => void;
  examMode?: 'practice' | 'challenge'; // New prop to determine exam mode
  onViolation?: (violation: AntiCheatViolation) => void; // For anti-cheat violations
  violationCount?: number; // Current violation count
}

export function ExamInterface({
  examTitle,
  questions,
  timeLimit,
  onSubmit,
  onPause,
  examMode = 'practice',
  onViolation: _onViolation, // eslint-disable-line @typescript-eslint/no-unused-vars
  violationCount = 0
}: ExamInterfaceProps) {
  // Initialize exam state (without timer-related fields)
  const [examState, setExamState] = useState<ExamState>(() => {
    // For challenge mode, never restore from localStorage - always start fresh
    if (examMode === 'challenge') {
      return {
        currentQuestion: 1,
        answers: {},
        flagged: new Set()
      };
    }

    // Try to restore state from localStorage on component mount (practice mode only)
    if (typeof window !== 'undefined') {
      const savedState = localStorage.getItem(`exam-state-${examTitle}`);
      if (savedState) {
        try {
          const parsed = JSON.parse(savedState);
          return {
            currentQuestion: parsed.currentQuestion || 1,
            answers: parsed.answers || {},
            flagged: new Set(parsed.flagged || [])
          };
        } catch (error) {
          console.warn('Failed to restore exam state:', error);
        }
      }
    }

    return {
      currentQuestion: 1,
      answers: {},
      flagged: new Set()
    };
  });

  // Get initial time remaining from localStorage for practice mode
  const getInitialTimeRemaining = (): number | undefined => {
    if (examMode === 'challenge') return undefined;

    if (typeof window !== 'undefined') {
      const savedState = localStorage.getItem(`exam-state-${examTitle}`);
      if (savedState) {
        try {
          const parsed = JSON.parse(savedState);
          return parsed.timeRemaining;
        } catch (error) {
          console.warn('Failed to restore timer state:', error);
        }
      }
    }
    return undefined;
  };

  // Use timer hook (onTimeUp will be set later)
  const timer = useExamTimer({
    timeLimit,
    examMode,
    onTimeUp: () => {}, // Will be updated later when handleConfirmSubmit is defined
    initialTimeRemaining: getInitialTimeRemaining()
  });

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);
  const questionGridRef = useRef<HTMLDivElement>(null);
  const saveStateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Debounced save function to prevent performance issues
  const debouncedSaveState = useCallback((state: ExamState, timeRemaining: number) => {
    // Clear existing timeout
    if (saveStateTimeoutRef.current) {
      clearTimeout(saveStateTimeoutRef.current);
    }

    // Set new timeout - only save after 1 second of no changes
    saveStateTimeoutRef.current = setTimeout(() => {
      if (typeof window !== 'undefined' && examMode === 'practice') {
        const stateToSave = {
          ...state,
          flagged: Array.from(state.flagged),
          timeRemaining // Include timer state
        };
        localStorage.setItem(`exam-state-${examTitle}`, JSON.stringify(stateToSave));
      }
      saveStateTimeoutRef.current = null;
    }, 1000);
  }, [examTitle, examMode]);

  // Timer is now handled by useExamTimer hook



  // Clean up localStorage for challenge mode on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && examMode === 'challenge') {
      // Remove any existing saved state to ensure fresh start
      localStorage.removeItem(`exam-state-${examTitle}`);
    }
  }, [examTitle, examMode]);

  // Save exam state to localStorage with debouncing (practice mode only)
  useEffect(() => {
    if (examMode === 'practice') {
      debouncedSaveState(examState, timer.timeRemaining);
    }
  }, [examState, examMode, debouncedSaveState, timer.timeRemaining]);

  // Cleanup timeout on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (saveStateTimeoutRef.current) {
        clearTimeout(saveStateTimeoutRef.current);
        saveStateTimeoutRef.current = null;
      }
    };
  }, []);

  // Auto scroll to current question when it changes
  useEffect(() => {
    if (examState.currentQuestion) {
      const scrollToQuestion = (questionNumber: number) => {
        if (!questionGridRef.current) return;

        const questionButton = questionGridRef.current.querySelector(
          `[data-question="${questionNumber}"]`
        ) as HTMLElement;

        if (questionButton) {
          const containerRect = questionGridRef.current.getBoundingClientRect();
          const buttonRect = questionButton.getBoundingClientRect();

          // Check if button is not fully visible
          if (buttonRect.top < containerRect.top || buttonRect.bottom > containerRect.bottom) {
            questionButton.scrollIntoView({
              behavior: 'smooth',
              block: 'center'
            });
          }
        }
      };

      setTimeout(() => scrollToQuestion(examState.currentQuestion), 100);
    }
  }, [examState.currentQuestion]);



  // formatTime is now provided by useExamTimer hook

  // Handle answer selection
  const handleAnswerSelect = useCallback((questionId: number, answer: 'A' | 'B' | 'C' | 'D') => {
    setExamState(prev => ({
      ...prev,
      answers: { ...prev.answers, [questionId]: answer }
    }));
  }, []);

  // Handle flag toggle
  const handleFlagToggle = useCallback((questionId: number) => {
    setExamState(prev => {
      const newFlagged = new Set(prev.flagged);
      if (newFlagged.has(questionId)) {
        newFlagged.delete(questionId);
      } else {
        newFlagged.add(questionId);
      }
      return { ...prev, flagged: newFlagged };
    });
  }, []);



  // Navigation functions
  const goToQuestion = useCallback((questionNumber: number) => {
    if (questionNumber >= 1 && questionNumber <= questions.length) {
      setExamState(prev => ({ ...prev, currentQuestion: questionNumber }));
      setSidebarOpen(false); // Close sidebar on mobile after selection
    }
  }, [questions.length]);

  const goToPrevious = useCallback(() => {
    goToQuestion(examState.currentQuestion - 1);
  }, [examState.currentQuestion, goToQuestion]);

  const goToNext = useCallback(() => {
    goToQuestion(examState.currentQuestion + 1);
  }, [examState.currentQuestion, goToQuestion]);

  // Handle pause (only allowed in practice mode)
  const handlePause = useCallback(() => {
    // Challenge mode should never be paused
    if (examMode === 'challenge') return;

    if (timer.isPaused) {
      timer.resume();
    } else {
      timer.pause();
    }
    onPause?.();
  }, [onPause, examMode, timer]);



  // Handle submit button click - show confirmation modal
  const handleSubmitClick = useCallback(() => {
    setShowSubmissionModal(true);
  }, []);

  // Handle actual submit after confirmation
  const handleConfirmSubmit = useCallback(() => {
    // Clear any pending save timeout
    if (saveStateTimeoutRef.current) {
      clearTimeout(saveStateTimeoutRef.current);
      saveStateTimeoutRef.current = null;
    }

    // Clear saved state when submitting (practice mode only)
    if (typeof window !== 'undefined' && examMode === 'practice') {
      localStorage.removeItem(`exam-state-${examTitle}`);
    }

    setShowSubmissionModal(false);
    onSubmit(examState.answers);
  }, [examState.answers, onSubmit, examTitle, examMode]);

  // Set timer callback after handleConfirmSubmit is defined
  useEffect(() => {
    timer.setOnTimeUp(handleConfirmSubmit);
  }, [timer, handleConfirmSubmit]);

  // Handle cancel submission
  const handleCancelSubmit = useCallback(() => {
    setShowSubmissionModal(false);
  }, []);

  // Calculate submission stats
  const getSubmissionStats = useCallback(() => {
    const totalQuestions = questions.length;
    const answeredQuestions = Object.keys(examState.answers).length;
    const unansweredQuestions = totalQuestions - answeredQuestions;
    const flaggedQuestions = examState.flagged.size;

    return {
      totalQuestions,
      answeredQuestions,
      unansweredQuestions,
      flaggedQuestions,
      timeRemaining: timer.timeRemaining
    };
  }, [questions.length, examState.answers, examState.flagged.size, timer.timeRemaining]);

  // Auto submit is now handled by useExamTimer hook

  // Show flagged questions
  const showFlaggedQuestions = useCallback(() => {
    const flaggedArray = Array.from(examState.flagged);
    if (flaggedArray.length > 0) {
      goToQuestion(flaggedArray[0]);
    }
  }, [examState.flagged, goToQuestion]);

  // Get current question
  const currentQuestion = questions[examState.currentQuestion - 1];
  const currentAnswer = examState.answers[examState.currentQuestion];

  // Calculate statistics for header
  const flaggedCount = examState.flagged.size;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <ExamHeader
        examTitle={examTitle}
        timer={timer}
        examMode={examMode}
        violationCount={violationCount}
        flaggedCount={flaggedCount}
        sidebarOpen={sidebarOpen}
        onShowFlaggedQuestions={showFlaggedQuestions}
        onPause={handlePause}
        onSubmit={handleSubmitClick}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
      />

      <div className="flex transition-all duration-300">
        {/* Main Content */}
        <div className={cn(
          "flex-1 app-container py-4 md:app-section transition-all duration-300",
          examMode === 'practice' && timer.isPaused && "blur-sm pointer-events-none select-none"
        )}>
          <div className="app-content max-w-4xl mx-auto">
            {currentQuestion && (
              <QuestionContent
                question={currentQuestion}
                questionNumber={examState.currentQuestion}
                totalQuestions={questions.length}
                selectedAnswer={currentAnswer}
                isFlagged={examState.flagged.has(examState.currentQuestion)}
                canGoPrevious={examState.currentQuestion > 1}
                canGoNext={examState.currentQuestion < questions.length}
                onAnswerSelect={handleAnswerSelect}
                onFlagToggle={handleFlagToggle}
                onPrevious={goToPrevious}
                onNext={goToNext}
              />
            )}
          </div>
        </div>

        {/* Sidebar - Question Grid */}
        <QuestionSidebar
          ref={questionGridRef}
          questions={questions}
          currentQuestion={examState.currentQuestion}
          answers={examState.answers}
          flagged={examState.flagged}
          isOpen={sidebarOpen}
          examMode={examMode}
          isPaused={timer.isPaused}
          onQuestionSelect={goToQuestion}
          onClose={() => setSidebarOpen(false)}
        />
      </div>

      {/* Modals */}
      <ExamModals
        examMode={examMode}
        isPaused={timer.isPaused}
        timer={timer}
        showSubmissionModal={showSubmissionModal}
        submissionStats={getSubmissionStats()}
        onPause={handlePause}
        onConfirmSubmit={handleConfirmSubmit}
        onCancelSubmit={handleCancelSubmit}
      />
    </div>
  );
}
