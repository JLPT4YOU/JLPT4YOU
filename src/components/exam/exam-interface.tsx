"use client"

import { useEffect, useCallback, useRef } from "react";
import { cn } from "@/lib/utils";
import { AntiCheatViolation } from "@/components/anti-cheat-system";
import { SCROLL } from "@/lib/ui-constants";
import { useExamTimer } from "./hooks/useExamTimer";
import { useExamState } from "./hooks/useExamState";
import { ExamHeader } from "./components/exam-header";
import { QuestionContent } from "./components/question-content";
import { QuestionSidebar } from "./components/question-sidebar";
import { ExamModals } from "./components/exam-modals";
import { TranslationData } from "@/lib/i18n";
import { useTranslation } from "@/lib/use-translation";

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



export interface ExamInterfaceProps {
  examTitle: string;
  questions: Question[];
  timeLimit: number; // in minutes
  onSubmit: (answers: Record<number, 'A' | 'B' | 'C' | 'D'>) => void;
  onPause?: () => void;
  examMode?: 'practice' | 'challenge'; // New prop to determine exam mode
  onViolation?: (violation: AntiCheatViolation) => void; // For anti-cheat violations
  violationCount?: number; // Current violation count
  translations: TranslationData; // Add translations prop
}

export function ExamInterface({
  examTitle,
  questions,
  timeLimit,
  onSubmit,
  onPause,
  examMode = 'practice',
  onViolation: _onViolation, // eslint-disable-line @typescript-eslint/no-unused-vars
  violationCount = 0,
  translations
}: ExamInterfaceProps) {
  // Initialize translation function (used by child components)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { t } = useTranslation(translations);
  // Initialize exam state (without timer-related fields)
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

  // State management is now handled by useExamState hook
  const {
    examState,
    sidebarOpen,
    showSubmissionModal,
    setSidebarOpen,
    setShowSubmissionModal,
    handleAnswerSelect,
    handleFlagToggle,
    goToQuestion,
    goToPrevious,
    goToNext,
    showFlaggedQuestions,
    getSubmissionStats,
    clearSavedState
  } = useExamState({
    examTitle,
    examMode,
    questions,
    timer
  });


  const questionGridRef = useRef<HTMLDivElement>(null);

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

      setTimeout(() => scrollToQuestion(examState.currentQuestion), SCROLL.RESTORATION_DELAY);
    }
  }, [examState.currentQuestion]);



  // formatTime is now provided by useExamTimer hook

  // State management functions are now provided by useExamState hook

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
  }, [setShowSubmissionModal]);

  // Handle actual submit after confirmation
  const handleConfirmSubmit = useCallback(() => {
    // Clear saved state when submitting (practice mode only)
    clearSavedState();

    setShowSubmissionModal(false);
    onSubmit(examState.answers);
  }, [examState.answers, onSubmit, clearSavedState, setShowSubmissionModal]);

  // Set timer callback after handleConfirmSubmit is defined
  useEffect(() => {
    timer.setOnTimeUp(handleConfirmSubmit);
  }, [timer, handleConfirmSubmit]);

  // Handle cancel submission
  const handleCancelSubmit = useCallback(() => {
    setShowSubmissionModal(false);
  }, [setShowSubmissionModal]);

  // Statistics and navigation functions are now provided by useExamState hook

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
        onShowFlaggedQuestions={showFlaggedQuestions}
        onPause={handlePause}
        onSubmit={handleSubmitClick}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        translations={translations}
      />

      <div className="flex app-container app-gap-lg transition-all duration-300">
        {/* Main Content */}
        <div className={cn(
          "flex-1 app-py-md md:app-section transition-all duration-300",
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
                translations={translations}
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
          translations={translations}
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
        translations={translations}
      />
    </div>
  );
}
