'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Clock, CheckCircle, XCircle, ChevronLeft, ChevronRight, SkipForward } from 'lucide-react';
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
  onPrevious: () => void;
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
  onPrevious,
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
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">{t('study.practice.exercise.noQuestion')}</p>
        </CardContent>
      </Card>
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
      
      {/* Question Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                {question.type === 'multiple_choice' && (
                  <span className="inline-block px-2 py-1 text-xs font-normal bg-blue-100 text-blue-700 rounded mr-2">
                    {t('study.practice.exercise.multipleChoice')}
                  </span>
                )}
                {question.difficulty && (
                  <span className={cn(
                    "inline-block px-2 py-1 text-xs font-normal rounded",
                    question.difficulty === 'easy' && "bg-green-100 text-green-700",
                    question.difficulty === 'medium' && "bg-yellow-100 text-yellow-700",
                    question.difficulty === 'hard' && "bg-red-100 text-red-700"
                  )}>
                    {t(`study.practice.generator.difficulty.${question.difficulty}`)}
                  </span>
                )}
              </div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
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
                    "flex items-start space-x-3 rounded-lg border p-4 transition-colors",
                    !userAnswer && "hover:bg-muted/50",
                    showResult && isCorrect && "border-green-500 bg-green-50",
                    showResult && isSelected && !isCorrect && "border-red-500 bg-red-50"
                  )}
                >
                  <RadioGroupItem
                    value={index.toString()}
                    id={`option-${index}`}
                    className="mt-1"
                  />
                  <Label
                    htmlFor={`option-${index}`}
                    className="flex-1 cursor-pointer font-normal"
                  >
                    {option}
                  </Label>
                  {showResult && (
                    <div className="ml-auto">
                      {isCorrect && <CheckCircle className="h-5 w-5 text-green-600" />}
                      {isSelected && !isCorrect && <XCircle className="h-5 w-5 text-red-600" />}
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
                "rounded-lg border p-4 space-y-4",
                userAnswer.isCorrect ? "border-green-200 bg-green-50" : "border-yellow-200 bg-yellow-50"
              )}
              role="region"
              aria-label={t('study.practice.exercise.explanation.correctAnswer')}
            >
              <div
                className="font-medium"
                aria-live="polite"
                role="status"
              >
                {userAnswer.isCorrect ? `✅ ${t('study.practice.exercise.correct')}` : `❌ ${t('study.practice.exercise.incorrect')}`}
              </div>

              {/* Render detailed explanation if available */}
              {typeof question.explanation === 'object' && question.explanation ? (
                <div className="space-y-3">
                  {/* Correct Answer Explanation */}
                  <div>
                    <h4 className="font-medium text-green-700 mb-1">✓ {t('study.practice.exercise.explanation.correctAnswer')}</h4>
                    <p className="text-sm text-gray-700">{question.explanation.correct_answer}</p>
                  </div>

                  {/* Why Correct */}
                  <div>
                    <h4 className="font-medium text-blue-700 mb-1">📚 {t('study.practice.exercise.explanation.whyCorrect')}</h4>
                    <p className="text-sm text-gray-700">{question.explanation.why_correct}</p>
                  </div>

                  {/* Wrong Answers Explanation */}
                  {question.explanation.wrong_answers && Object.keys(question.explanation.wrong_answers).length > 0 && (
                    <div>
                      <h4 className="font-medium text-red-700 mb-2">❌ {t('study.practice.exercise.explanation.wrongAnswers')}</h4>
                      <div className="space-y-2">
                        {Object.entries(question.explanation.wrong_answers).map(([optionKey, explanation]) => {
                          const optionIndex = parseInt(optionKey.split('_')[1]);
                          if (explanation && optionIndex !== question.correct) {
                            return (
                              <div key={optionKey} className="text-sm">
                                <span className="font-medium text-gray-600">
                                  {String.fromCharCode(65 + optionIndex)}. {question.options[optionIndex]}:
                                </span>
                                <span className="text-gray-700 ml-2">{explanation}</span>
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
                      <h4 className="font-medium text-purple-700 mb-1">💡 {t('study.practice.exercise.explanation.additionalNotes')}</h4>
                      <p className="text-sm text-gray-700">{question.explanation.additional_notes}</p>
                    </div>
                  )}

                  {/* Example Usage */}
                  {question.explanation.example_usage && (
                    <div>
                      <h4 className="font-medium text-orange-700 mb-1">📝 {t('study.practice.exercise.explanation.exampleUsage')}</h4>
                      <p className="text-sm text-gray-700 italic">{question.explanation.example_usage}</p>
                    </div>
                  )}
                </div>
              ) : (
                /* Fallback for simple string explanation */
                <div className="text-sm text-muted-foreground">
                  {question.explanation}
                </div>
              )}
            </div>
          )}
          
          {/* Action Buttons */}
          <div className="flex justify-between items-center pt-4">
            <Button
              variant="outline"
              onClick={onPrevious}
              disabled={currentIndex === 0}
              size="sm"
              aria-label={`${t('study.practice.exercise.previous')} - ${t('study.practice.exercise.questionProgress').replace('{current}', currentIndex.toString()).replace('{total}', totalQuestions.toString())}`}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              {t('study.practice.exercise.previous')}
            </Button>

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
        </CardContent>
      </Card>
      
      {/* Tags */}
      {question.tags && question.tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {question.tags.map((tag, index) => (
            <span
              key={index}
              className="inline-block px-2 py-1 text-xs bg-muted rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
