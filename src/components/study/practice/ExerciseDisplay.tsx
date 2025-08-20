'use client';

import React from 'react';
// Card components removed - using div + bg-background rounded-2xl instead
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Clock, CheckCircle, XCircle, ChevronRight, SkipForward } from 'lucide-react';
import { Question } from '@/hooks/usePracticeExercise';
import { UserAnswer } from '@/lib/study/localStorage-service';
import { DetailedExplanation } from '@/types';
import { cn } from '@/lib/utils';
import { useTranslations } from '@/hooks/use-translations';

interface ExerciseDisplayProps {
  question: Question | null;
  currentIndex: number;
  totalQuestions: number;
  userAnswer?: UserAnswer;
  showExplanation: boolean;
  elapsedTime: number;
  onAnswer: (answerIndex: number) => void;
  onNext: () => void;
  onSkip: () => void;
  onToggleExplanation?: () => void;
  isLastQuestion: boolean;
}

export function ExerciseDisplay({
  question,
  currentIndex,
  totalQuestions,
  userAnswer,
  showExplanation,
  elapsedTime,
  onAnswer,
  onNext,
  onSkip,
  onToggleExplanation,
  isLastQuestion
}: ExerciseDisplayProps) {
  const [selectedAnswer, setSelectedAnswer] = React.useState<string>('')
  const { t } = useTranslations();
  
  // Format time display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Handle answer selection
  const handleAnswerSelect = (value: string) => {
    if (userAnswer) return; // Already answered
    setSelectedAnswer(value);
  };
  
  // Handle submit
  const handleSubmit = () => {
    if (selectedAnswer !== '') {
      onAnswer(parseInt(selectedAnswer));
    }
  };
  
  React.useEffect(() => {
    // Reset selection when question changes
    if (!userAnswer) {
      setSelectedAnswer('');
    } else {
      setSelectedAnswer(userAnswer.userAnswer.toString());
    }
  }, [question, userAnswer]);
  
  if (!question) {
    return (
      <div className="bg-background rounded-2xl py-12 text-center">
        <p className="text-muted-foreground">{t('study.practice.exercise.noQuestion')}</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {/* Progress and Timer */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">
              {t('study.practice.exercise.questionProgress').replace('{current}', (currentIndex + 1).toString()).replace('{total}', totalQuestions.toString())}
            </span>
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatTime(elapsedTime)}
            </span>
          </div>
          <Progress value={(currentIndex + 1) / totalQuestions * 100} className="h-2" />
        </div>
      </div>
      
      {/* Question Section */}
      <div className="bg-background rounded-2xl p-6 space-y-6">
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex-1 space-x-2">
              {question.type === 'multiple_choice' && (
                <span className="inline-block px-3 py-1 text-xs font-medium bg-muted text-foreground rounded-full">
                  {t('study.practice.exercise.multipleChoice')}
                </span>
              )}
              {question.difficulty && (
                <span className={cn(
                  "inline-block px-3 py-1 text-xs font-medium rounded-full",
                  question.difficulty.includes('easy') && "bg-muted text-foreground",
                  question.difficulty.includes('medium') && "bg-muted text-foreground",
                  question.difficulty.includes('hard') && "bg-muted text-foreground"
                )}>
                  {(() => {
                    // Handle reading format: "medium_short" -> "Medium"
                    if (question.difficulty.includes('_')) {
                      const [baseDifficulty] = question.difficulty.split('_');
                      return t(`study.practice.generator.difficulty.${baseDifficulty}`);
                    }
                    return t(`study.practice.generator.difficulty.${question.difficulty}`);
                  })()}
                </span>
              )}
            </div>
          </div>
          {/* Reading Passage (if reading comprehension) */}
          {question.type === 'reading_comprehension' && question.passage && (
            <div className="space-y-4">
              <div className="bg-muted/20 rounded-lg p-4 border border-border/20">
                <h3 className="text-sm font-medium text-muted-foreground mb-3">
                  {t('study.practice.reading.passage')}
                </h3>
                <div className="text-base leading-relaxed whitespace-pre-wrap">
                  {question.passage}
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                {t('study.practice.reading.instructions')}
              </div>
            </div>
          )}

          {/* Question Text */}
          <div className="text-lg font-medium">
            {question.question}
          </div>

          {/* Answer Options */}
          <RadioGroup
            value={selectedAnswer}
            onValueChange={handleAnswerSelect}
            disabled={!!userAnswer}
            className="space-y-3"
            aria-label={t('study.practice.exercise.multipleChoice')}
          >
            {question.options.map((option, index) => {
              const isCorrect = index === question.correct;
              const isSelected = userAnswer && userAnswer.userAnswer === index;
              const showResult = userAnswer && showExplanation;
              
              return (
                <div
                  key={index}
                  className={cn(
                    "flex items-start space-x-3 rounded-lg border p-4 transition-colors cursor-pointer",
                    !userAnswer && "hover:bg-muted/50",
                    showResult && isCorrect && "border-green-500 bg-green-50 dark:bg-green-950/20 dark:border-green-400",
                    showResult && isSelected && !isCorrect && "border-red-500 bg-red-50 dark:bg-red-950/20 dark:border-red-400",
                    userAnswer && "cursor-default"
                  )}
                  onClick={() => {
                    if (!userAnswer) {
                      handleAnswerSelect(index.toString());
                    }
                  }}
                >
                  <RadioGroupItem
                    value={index.toString()}
                    id={`option-${index}`}
                    className="mt-1 pointer-events-none"
                  />
                  <Label
                    htmlFor={`option-${index}`}
                    className="flex-1 font-normal text-base pointer-events-none"
                  >
                    {option}
                  </Label>
                  {showResult && (
                    <div className="ml-auto">
                      {isCorrect && <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />}
                      {isSelected && !isCorrect && <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />}
                    </div>
                  )}
                </div>
              );
            })}
          </RadioGroup>
          
          {/* Toggle Explanation Button */}
          {userAnswer && onToggleExplanation && (
            <div className="flex justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={onToggleExplanation}
                className="text-sm"
                aria-label={`${t('study.practice.exercise.explanation.toggle')} - ${showExplanation ? t('study.practice.exercise.explanation.correctAnswer') : t('study.practice.exercise.explanation.correctAnswer')}`}
                aria-expanded={showExplanation}
              >
                {showExplanation ? '🙈' : '👁️'} {t('study.practice.exercise.explanation.toggle')}
              </Button>
            </div>
          )}

          {/* Explanation */}
          {showExplanation && userAnswer && question && (
            <div
              className={cn(
                "rounded-lg border p-4 space-y-4 bg-muted/30",
                userAnswer.isCorrect ? "border-green-500/20" : "border-orange-500/20"
              )}
              role="region"
              aria-label={t('study.practice.exercise.explanation.correctAnswer')}
            >
              <div
                className="font-semibold text-lg"
                aria-live="polite"
                role="status"
              >
                {userAnswer.isCorrect ? `✅ Bạn đã trả lời đúng` : `❌ Bạn đã trả lời sai`}
              </div>

              {/* Render detailed explanation if available */}
              {typeof question.explanation === 'object' && question.explanation ? (
                <div className="space-y-4">
                  {/* Correct Answer Explanation */}
                  <div>
                    <h4 className="font-bold text-green-600 dark:text-green-400 mb-2">✓ Đáp án đúng:</h4>
                    <p className="text-base text-foreground">{question.explanation.correct_answer}</p>
                  </div>

                  {/* Translation */}
                  {question.explanation.translation && (
                    <div>
                      <h4 className="font-bold text-cyan-600 dark:text-cyan-400 mb-2">🌐 Dịch nghĩa:</h4>
                      <p className="text-base text-foreground font-medium">{question.explanation.translation}</p>
                    </div>
                  )}

                  {/* Why Correct */}
                  <div>
                    <h4 className="font-bold text-blue-600 dark:text-blue-400 mb-2">📚 Tại sao đúng:</h4>
                    <p className="text-base text-foreground">{question.explanation.why_correct}</p>
                  </div>

                  {/* Wrong Answers Explanation */}
                  {question.explanation.wrong_answers && Object.keys(question.explanation.wrong_answers).length > 0 && (
                    <div>
                      <h4 className="font-bold text-red-600 dark:text-red-400 mb-2">❌ Tại sao các lựa chọn khác sai:</h4>
                      <div className="space-y-2">
                        {Object.entries(question.explanation.wrong_answers).map(([optionKey, explanation]) => {
                          const optionIndex = parseInt(optionKey.split('_')[1]);
                          if (explanation && optionIndex !== question.correct) {
                            return (
                              <div key={optionKey} className="text-base">
                                <span className="font-bold text-foreground">
                                  {String.fromCharCode(65 + optionIndex)}. <span className="font-bold">{question.options[optionIndex]}</span>:
                                </span>
                                <span className="text-foreground ml-2">{explanation}</span>
                              </div>
                            );
                          }
                          return null;
                        })}
                      </div>
                    </div>
                  )}

                  {/* Additional Notes */}
                  {question.explanation.additional_notes && (
                    <div>
                      <h4 className="font-bold text-purple-600 dark:text-purple-400 mb-2">💡 Ghi chú thêm:</h4>
                      <p className="text-base text-foreground">{question.explanation.additional_notes}</p>
                    </div>
                  )}

                  {/* Example Usage */}
                  {question.explanation.example_usage && (
                    <div>
                      <h4 className="font-bold text-orange-600 dark:text-orange-400 mb-2">📝 Ví dụ sử dụng:</h4>
                      <p className="text-base text-foreground italic">{question.explanation.example_usage}</p>
                    </div>
                  )}
                </div>
              ) : (
                /* Fallback for simple string explanation */
                <div className="text-base text-foreground space-y-4">
                  {typeof question.explanation === 'string' && question.explanation.split('\n').map((line, index) => {
                    const trimmedLine = line.trim();
                    if (!trimmedLine) return null;

                    // Check if line starts with bullet points for additional notes or examples
                    if (trimmedLine.startsWith('•:') || trimmedLine.startsWith('・:')) {
                      const content = trimmedLine.substring(2).trim();
                      if (content.includes('引き出す') || content.includes('銀行') || content.includes('お金')) {
                        return (
                          <div key={index}>
                            <h4 className="font-bold text-purple-600 dark:text-purple-400 mb-2">💡 Ghi chú thêm:</h4>
                            <p className="text-base text-foreground">{content}</p>
                          </div>
                        );
                      } else {
                        return (
                          <div key={index}>
                            <h4 className="font-bold text-orange-600 dark:text-orange-400 mb-2">📝 Ví dụ sử dụng:</h4>
                            <p className="text-base text-foreground italic">{content}</p>
                          </div>
                        );
                      }
                    }

                    return <p key={index} className="text-base text-foreground">{trimmedLine}</p>;
                  })}
                </div>
              )}
            </div>
          )}
          
          {/* Action Buttons */}
          <div className="flex justify-end items-center pt-4">
            <div className="flex gap-2">
              {!userAnswer ? (
                <>
                  <Button
                    variant="outline"
                    onClick={onSkip}
                    size="sm"
                    aria-label={`${t('study.practice.exercise.skip')} - ${t('study.practice.exercise.questionProgress').replace('{current}', (currentIndex + 1).toString()).replace('{total}', totalQuestions.toString())}`}
                  >
                    <SkipForward className="h-4 w-4 mr-1" />
                    {t('study.practice.exercise.skip')}
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={selectedAnswer === ''}
                    size="sm"
                    aria-label={selectedAnswer === '' ? `${t('study.practice.exercise.submitAnswer')} - ${t('study.practice.exercise.multipleChoice')}` : `${t('study.practice.exercise.submitAnswer')} - ${t('study.practice.exercise.questionProgress').replace('{current}', (currentIndex + 1).toString()).replace('{total}', totalQuestions.toString())}`}
                  >
                    {t('study.practice.exercise.submitAnswer')}
                  </Button>
                </>
              ) : (
                <Button
                  onClick={onNext}
                  size="sm"
                  aria-label={isLastQuestion ? `${t('study.practice.exercise.complete')} - ${t('study.practice.exercise.questionProgress').replace('{current}', (currentIndex + 1).toString()).replace('{total}', totalQuestions.toString())}` : `${t('study.practice.exercise.next')} - ${t('study.practice.exercise.questionProgress').replace('{current}', (currentIndex + 2).toString()).replace('{total}', totalQuestions.toString())}`}
                >
                  {isLastQuestion ? t('study.practice.exercise.complete') : t('study.practice.exercise.next')}
                  {!isLastQuestion && <ChevronRight className="h-4 w-4 ml-1" />}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
