"use client"

import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Clock,
  Flag,
  Pause,
  Send,
  ChevronLeft,
  ChevronRight,
  Eye,
  Menu,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AntiCheatWarningBadge, AntiCheatViolation } from "@/components/anti-cheat-system";
import { SubmissionConfirmationModal } from "@/components/submission-confirmation-modal";

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
  timeRemaining: number; // in seconds
  isPaused: boolean;
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
  const [examState, setExamState] = useState<ExamState>(() => {
    // For challenge mode, never restore from localStorage - always start fresh
    if (examMode === 'challenge') {
      return {
        currentQuestion: 1,
        answers: {},
        flagged: new Set(),
        timeRemaining: timeLimit * 60,
        isPaused: false
      };
    }

    // Try to restore state from localStorage on component mount (practice mode only)
    if (typeof window !== 'undefined') {
      const savedState = localStorage.getItem(`exam-state-${examTitle}`);
      if (savedState) {
        try {
          const parsed = JSON.parse(savedState);
          return {
            ...parsed,
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
      flagged: new Set(),
      timeRemaining: timeLimit * 60,
      isPaused: false
    };
  });

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);
  const questionGridRef = useRef<HTMLDivElement>(null);
  const saveStateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Debounced save function to prevent performance issues
  const debouncedSaveState = useCallback((state: ExamState) => {
    // Clear existing timeout
    if (saveStateTimeoutRef.current) {
      clearTimeout(saveStateTimeoutRef.current);
    }

    // Set new timeout - only save after 1 second of no changes
    saveStateTimeoutRef.current = setTimeout(() => {
      if (typeof window !== 'undefined' && examMode === 'practice') {
        const stateToSave = {
          ...state,
          flagged: Array.from(state.flagged)
        };
        localStorage.setItem(`exam-state-${examTitle}`, JSON.stringify(stateToSave));
      }
      saveStateTimeoutRef.current = null;
    }, 1000);
  }, [examTitle, examMode]);

  // Timer effect - clearer logic for different exam modes
  useEffect(() => {
    // Don't start timer if time is already up
    if (examState.timeRemaining <= 0) return;

    // For practice mode: respect pause state
    // For challenge mode: never pause (isPaused should always be false anyway)
    const shouldPauseTimer = examMode === 'practice' && examState.isPaused;
    if (shouldPauseTimer) return;

    const timer = setInterval(() => {
      setExamState(prev => ({
        ...prev,
        timeRemaining: Math.max(0, prev.timeRemaining - 1)
      }));
    }, 1000);

    return () => clearInterval(timer);
  }, [examState.isPaused, examState.timeRemaining, examMode]);



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
      debouncedSaveState(examState);
    }
  }, [examState, examMode, debouncedSaveState]);

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



  // Format time display
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

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

    setExamState(prev => ({ ...prev, isPaused: !prev.isPaused }));
    onPause?.();
  }, [onPause, examMode]);



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
      timeRemaining: examState.timeRemaining
    };
  }, [questions.length, examState.answers, examState.flagged.size, examState.timeRemaining]);

  // Auto submit when time runs out - bypass confirmation modal
  useEffect(() => {
    if (examState.timeRemaining === 0) {
      handleConfirmSubmit();
    }
  }, [examState.timeRemaining, handleConfirmSubmit]);

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

  // Calculate statistics
  const answeredCount = Object.keys(examState.answers).length;
  const flaggedCount = examState.flagged.size;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="app-container app-py-sm">
          <div className="flex items-center justify-between gap-1 md:app-gap-md">
            {/* Left: Exam Title */}
            <div className="flex items-center min-w-0 flex-1 md:flex-none">
              <h1 className="text-sm font-semibold text-foreground truncate md:text-lg">
                {examTitle}
              </h1>
            </div>

            {/* Center: Timer */}
            <div className="flex items-center gap-1 md:app-gap-sm">
              <Clock className="w-4 h-4 text-muted-foreground md:w-5 md:h-5" />
              <span className={cn(
                "font-mono text-sm font-semibold md:text-lg",
                examState.timeRemaining < 300 ? "text-destructive" : "text-foreground"
              )}>
                {formatTime(examState.timeRemaining)}
              </span>
            </div>

            {/* Right: Action Buttons */}
            <div className="flex items-center gap-1 md:app-gap-sm">
              {/* Anti-Cheat Warning Badge for Challenge Mode */}
              <AntiCheatWarningBadge
                violationCount={violationCount}
                maxViolations={3}
                isVisible={examMode === 'challenge'}
              />

              {/* Mobile: Icon-only flagged questions button */}
              <Button
                variant="outline"
                size="sm"
                onClick={showFlaggedQuestions}
                disabled={flaggedCount === 0}
                className="md:hidden"
                title={`Xem lại câu đánh dấu (${flaggedCount})`}
              >
                <Eye className="w-4 h-4" />
              </Button>

              {/* Desktop: Full flagged questions button */}
              <Button
                variant="outline"
                size="sm"
                onClick={showFlaggedQuestions}
                disabled={flaggedCount === 0}
                className="hidden md:flex"
              >
                <Eye className="w-4 h-4 mr-1" />
                Đánh dấu ({flaggedCount})
              </Button>

              {/* Pause buttons - Only for practice mode */}
              {examMode === 'practice' && (
                <>
                  {/* Mobile: Icon-only pause button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePause}
                    className="md:hidden"
                    title={examState.isPaused ? 'Tiếp tục' : 'Tạm dừng'}
                  >
                    <Pause className="w-4 h-4" />
                  </Button>

                  {/* Desktop: Full pause button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePause}
                    className="hidden md:flex"
                  >
                    <Pause className="w-4 h-4 mr-1" />
                    {examState.isPaused ? 'Tiếp tục' : 'Tạm dừng'}
                  </Button>
                </>
              )}

              {/* Mobile: Icon-only submit button */}
              <Button
                variant="default"
                size="sm"
                onClick={handleSubmitClick}
                className="md:hidden"
                title="Nộp bài"
              >
                <Send className="w-4 h-4" />
              </Button>

              {/* Desktop: Full submit button */}
              <Button
                variant="default"
                size="sm"
                onClick={handleSubmitClick}
                className="hidden md:flex"
              >
                <Send className="w-4 h-4 mr-1" />
                Nộp bài
              </Button>

              {/* Mobile sidebar toggle */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="md:hidden"
                title="Danh sách câu hỏi"
              >
                <Menu className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex transition-all duration-300">
        {/* Main Content */}
        <div className={cn(
          "flex-1 app-container py-4 md:app-section transition-all duration-300",
          examMode === 'practice' && examState.isPaused && "blur-sm pointer-events-none select-none"
        )}>
          <div className="app-content max-w-4xl mx-auto">
            {currentQuestion && (
              <Card className="bg-card border shadow-sm">
                <CardContent className="p-4 md:app-p-lg">
                  {/* Question Header with Flag */}
                  <div className="flex items-start justify-between mb-4 md:app-mb-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-3 md:app-gap-sm md:app-mb-md">
                        <span className="text-sm font-medium text-muted-foreground">
                          Câu {examState.currentQuestion}/{questions.length}
                        </span>
                      </div>
                      <h2 className="text-lg font-medium text-foreground leading-relaxed">
                        {currentQuestion.question}
                      </h2>
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleFlagToggle(examState.currentQuestion)}
                      className={cn(
                        "ml-4 shrink-0",
                        examState.flagged.has(examState.currentQuestion)
                          ? "text-yellow-600 dark:text-yellow-400"
                          : "text-muted-foreground"
                      )}
                    >
                      <Flag className="w-5 h-5" />
                    </Button>
                  </div>

                  {/* Answer Options */}
                  <div className="space-y-2 mb-4 md:space-y-3 md:app-mb-lg">
                    {Object.entries(currentQuestion.options).map(([key, value]) => (
                      <button
                        key={key}
                        onClick={() => handleAnswerSelect(examState.currentQuestion, key as 'A' | 'B' | 'C' | 'D')}
                        className={cn(
                          "w-full text-left p-3 rounded-lg border-2 transition-all duration-200 md:app-p-md",
                          "hover:bg-accent/50 hover:border-accent-foreground/30",
                          "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                          currentAnswer === key
                            ? "border-primary bg-primary/5 shadow-sm"
                            : "border-border bg-card"
                        )}
                      >
                        <div className="flex items-start gap-3 md:app-gap-sm">
                          <span className={cn(
                            "w-6 h-6 rounded-full border-2 flex items-center justify-center text-sm font-semibold shrink-0 mt-0.5 text-foreground",
                            currentAnswer === key
                              ? "bg-primary/10 border-primary"
                              : "border-muted-foreground bg-muted/20"
                          )}>
                            {key}
                          </span>
                          <span className="text-sm leading-relaxed text-foreground">{value}</span>
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Navigation Buttons */}
                  <div className="flex items-center justify-between">
                    <Button
                      variant="outline"
                      onClick={goToPrevious}
                      disabled={examState.currentQuestion === 1}
                    >
                      <ChevronLeft className="w-4 h-4 mr-1" />
                      Câu trước
                    </Button>
                    
                    <Button
                      variant="outline"
                      onClick={goToNext}
                      disabled={examState.currentQuestion === questions.length}
                    >
                      Câu sau
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Sidebar - Question Grid */}
        <div className={cn(
          "fixed inset-y-0 right-0 z-50 w-80 bg-card border-l shadow-lg transform transition-all duration-300 ease-in-out md:relative md:translate-x-0 md:shadow-none md:w-72",
          sidebarOpen ? "translate-x-0" : "translate-x-full",
          examMode === 'practice' && examState.isPaused && "blur-sm pointer-events-none select-none"
        )}>
          <div className="h-full flex flex-col">
            {/* Sidebar Header */}
            <div className="flex items-center justify-between p-3 border-b bg-muted/30 md:app-p-sm">
              <h3 className="text-sm font-semibold text-foreground">Danh sách câu hỏi</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(false)}
                className="md:hidden h-8 w-8"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Question Grid Container */}
            <div className="flex-1 relative">
              <div
                ref={questionGridRef}
                className="h-full overflow-y-auto px-2 py-2 scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent md:max-h-[360px] md:px-3"
                style={{
                  scrollbarWidth: 'thin'
                }}
              >
                <div className="grid grid-cols-5 gap-2">
                  {questions.map((_, index) => {
                    const questionNumber = index + 1;
                    const isAnswered = examState.answers[questionNumber];
                    const isFlagged = examState.flagged.has(questionNumber);
                    const isCurrent = examState.currentQuestion === questionNumber;

                    return (
                      <button
                        key={questionNumber}
                        data-question={questionNumber}
                        onClick={() => goToQuestion(questionNumber)}
                        className={cn(
                          "w-9 h-9 rounded-md text-xs font-medium transition-all duration-200 border-2",
                          "hover:scale-105 focus:outline-none focus:ring-1 focus:ring-ring focus:ring-offset-1",
                          isCurrent && "ring-2 ring-primary ring-offset-1 scale-105",
                          isAnswered
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                          isFlagged
                            ? "relative border-yellow-600 dark:border-yellow-400"
                            : "border-transparent"
                        )}
                      >
                        {questionNumber}
                        {isFlagged && (
                          <Flag className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 text-yellow-600 dark:text-yellow-400 fill-current" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Statistics */}
            <div className="border-t bg-muted/20 p-2 md:p-3">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <div className="text-lg font-bold text-primary">{answeredCount}</div>
                  <div className="text-xs text-muted-foreground">Đã trả lời</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-muted-foreground">{questions.length - answeredCount}</div>
                  <div className="text-xs text-muted-foreground">Chưa trả lời</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-accent-foreground">{flaggedCount}</div>
                  <div className="text-xs text-muted-foreground">Đánh dấu</div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-2 md:mt-3">
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>Tiến độ</span>
                  <span>{Math.round((answeredCount / questions.length) * 100)}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(answeredCount / questions.length) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </div>

      {/* Pause Overlay - Only for practice mode */}
      {examMode === 'practice' && examState.isPaused && (
        <div className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-300">
          {/* Blur overlay for question content */}
          <div className="absolute inset-0 bg-background/60" />

          {/* Pause message card */}
          <div className="relative max-w-md w-full mx-4 md:max-w-lg">
            <Card className="bg-card border shadow-lg">
              <CardContent className="p-6 text-center md:p-8">
                {/* Pause Icon */}
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4 md:w-20 md:h-20 md:mb-6">
                  <Pause className="w-8 h-8 text-muted-foreground md:w-10 md:h-10" />
                </div>

                {/* Pause Message */}
                <h2 className="text-xl font-semibold text-foreground mb-2 md:text-2xl md:mb-3">
                  Bài thi đã tạm dừng
                </h2>
                <p className="text-muted-foreground mb-6 text-sm md:text-base md:mb-8">
                  Thời gian đếm ngược đã được dừng lại. Nhấn &ldquo;Tiếp tục&rdquo; để quay lại làm bài.
                </p>

                {/* Timer Display */}
                <div className="bg-muted/50 rounded-lg p-4 mb-6 md:p-6 md:mb-8">
                  <div className="flex items-center justify-center gap-2">
                    <Clock className="w-5 h-5 text-muted-foreground md:w-6 md:h-6" />
                    <span className={cn(
                      "font-mono text-xl font-semibold md:text-2xl",
                      examState.timeRemaining < 300 ? "text-destructive" : "text-foreground"
                    )}>
                      {formatTime(examState.timeRemaining)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 md:text-sm">
                    Thời gian còn lại
                  </p>
                </div>

                {/* Resume Button */}
                <Button
                  onClick={handlePause}
                  size="lg"
                  className="w-full text-base h-11 md:h-12 md:text-lg"
                >
                  Tiếp tục
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Submission Confirmation Modal */}
      <SubmissionConfirmationModal
        isOpen={showSubmissionModal}
        stats={getSubmissionStats()}
        onConfirm={handleConfirmSubmit}
        onCancel={handleCancelSubmit}
        examMode={examMode}
      />
    </div>
  );
}
