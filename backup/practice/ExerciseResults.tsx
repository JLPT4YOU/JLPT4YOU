'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Trophy, Target, Clock, TrendingUp, RefreshCw, Home, Download } from 'lucide-react';
import { PracticeSession } from '@/lib/study/localStorage-service';
import Link from 'next/link';
import { useTranslations } from '@/hooks/use-translations';

interface ExerciseResultsProps {
  session: PracticeSession | null;
  score: number;
  accuracy: number;
  onRetry: () => void;
  onNewExercise: () => void;
  level: string;
  type: string;
}

export function ExerciseResults({
  session,
  score,
  accuracy,
  onRetry,
  onNewExercise,
  level,
  type
}: ExerciseResultsProps) {
  const { t } = useTranslations()

  if (!session) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">{t('study.practice.results.title')}</p>
        </CardContent>
      </Card>
    );
  }

  const totalQuestions = session.totalQuestions;
  const percentageScore = Math.round((score / totalQuestions) * 100);
  const timePerQuestion = session.timeSpent ? Math.round(session.timeSpent / totalQuestions) : 0;

  // Determine performance level
  const getPerformanceLevel = () => {
    if (percentageScore >= 90) return { label: t('study.practice.results.performance.excellent'), color: 'text-green-600', emoji: '🏆' };
    if (percentageScore >= 70) return { label: t('study.practice.results.performance.good'), color: 'text-blue-600', emoji: '👍' };
    if (percentageScore >= 50) return { label: t('study.practice.results.performance.keepPracticing'), color: 'text-yellow-600', emoji: '💪' };
    return { label: t('study.practice.results.performance.needMorePractice'), color: 'text-red-600', emoji: '📚' };
  };

  const performance = getPerformanceLevel();

  // Format time
  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  // Export results as JSON
  const exportResults = () => {
    const exportData = {
      session,
      metadata: {
        exportedAt: new Date().toISOString(),
        level,
        type,
        score,
        accuracy,
        percentageScore
      }
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `jlpt-practice-results-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Main Results Card */}
      <Card>
        <CardHeader className="text-center">
          <div className="text-6xl mb-4">{performance.emoji}</div>
          <CardTitle className={`text-2xl ${performance.color}`}>
            {performance.label}
          </CardTitle>
          <CardDescription>
            {`${t('study.practice.types.' + type)} ${t('study.practice.breadcrumbs.practice')} JLPT ${level.toUpperCase()}`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Score Display */}
          <div className="text-center">
            <div className="text-5xl font-bold mb-2">
              {score}/{totalQuestions}
            </div>
            <p className="text-muted-foreground">{t('study.practice.results.questionsCorrect')}</p>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>{t('study.practice.results.accuracy')}</span>
              <span className="font-medium">{percentageScore}%</span>
            </div>
            <Progress value={percentageScore} className="h-3" />
          </div>

          {/* Statistics Grid */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{t('study.practice.results.accuracy')}</span>
                </div>
                <div className="text-2xl font-bold mt-1">
                  {Math.round(accuracy * 100)}%
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{t('study.practice.results.time')}</span>
                </div>
                <div className="text-2xl font-bold mt-1">
                  {formatTime(session.timeSpent || 0)}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Breakdown */}
          <div className="border rounded-lg p-4 space-y-3">
            <h3 className="font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              {t('study.practice.results.breakdown.title')}
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('study.practice.results.breakdown.correctAnswers')}</span>
                <span className="font-medium text-green-600">{score}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('study.practice.results.breakdown.incorrectAnswers')}</span>
                <span className="font-medium text-red-600">{totalQuestions - score}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('study.practice.results.breakdown.timePerQuestion')}</span>
                <span className="font-medium">{formatTime(timePerQuestion)}</span>
              </div>
              {session.exerciseSetId && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('study.practice.results.breakdown.exerciseSetId')}</span>
                  <span className="font-mono text-xs">{session.exerciseSetId.slice(0, 8)}...</span>
                </div>
              )}
            </div>
          </div>

          {/* Review Answers */}
          <div className="space-y-3">
            <h3 className="font-medium">{t('study.practice.results.answerReview')}</h3>
            <div className="grid grid-cols-10 gap-1">
              {session.answers.map((answer, index) => (
                <div
                  key={answer.questionId}
                  className={`
                    aspect-square rounded flex items-center justify-center text-xs font-medium
                    ${answer.isCorrect
                      ? 'bg-green-100 text-green-700 border border-green-200'
                      : 'bg-red-100 text-red-700 border border-red-200'
                    }
                  `}
                  title={`${t('study.practice.results.questionNumber').replace('{number}', (index + 1).toString())}: ${answer.isCorrect ? t('study.practice.exercise.correct') : t('study.practice.exercise.incorrect')}`}
                >
                  {index + 1}
                </div>
              ))}
            </div>
          </div>
          {/* Full Q&A Review */}
          <div className="space-y-4">
            <h3 className="font-medium">{t('study.practice.results.fullReview')}</h3>
            <div className="space-y-3">
              {session.questions.map((q: any, idx: number) => {
                const ans = session.answers.find(a => a.questionId === q.id)
                const isCorrect = ans?.isCorrect
                const hasDetailed = q && q.explanation && typeof q.explanation === 'object'
                return (
                  <Card key={q.id} className="border-muted">
                    <CardContent className="p-4 space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="text-sm text-muted-foreground">Question {idx + 1}</div>
                        <div className={`text-xs px-2 py-0.5 rounded ${isCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {isCorrect ? 'Correct' : 'Incorrect'}
                        </div>
                      </div>
                      <div className="font-medium">{q.question}</div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {q.options?.map((opt: string, i: number) => {
                          const isUser = ans?.userAnswer === i
                          const isAns = q.correct === i
                          return (
                            <div key={i} className={`text-sm p-2 rounded border ${isAns ? 'border-green-300 bg-green-50' : isUser ? 'border-yellow-300 bg-yellow-50' : 'border-muted'}`}>
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-xs">{String.fromCharCode(65 + i)}.</span>
                                <span>{opt}</span>
                              </div>
                              {isAns && <div className="text-xs text-green-700 mt-1">Correct answer</div>}
                              {isUser && !isAns && <div className="text-xs text-yellow-700 mt-1">Your answer</div>}
                            </div>
                          )
                        })}
                      </div>
                      {/* Explanation */}
                      <div className="mt-2 text-sm">
                        <div className="font-medium mb-1">Explanation</div>
                        {hasDetailed ? (
                          <div className="space-y-1">
                            {/* @ts-expect-error - optional fields vary by AI */}
                            <div><span className="text-muted-foreground">Why correct:</span> {(q.explanation as any)?.why_correct}</div>
                            {/* @ts-expect-error - optional fields vary by AI */}
                            {Boolean((q.explanation as any)?.wrong_answers) && (
                              <div className="text-muted-foreground">Why others are wrong:</div>
                            )}
                            {/* @ts-expect-error - optional fields vary by AI */}
                            {q.explanation?.wrong_answers && (
                              <ul className="list-disc pl-5">
                                {/* @ts-expect-error */}
                                {Object.entries((q.explanation as any).wrong_answers).map(([k, v]: any) => (
                                  v ? <li key={k}><span className="font-mono mr-1">{k.replace('option_', '').toUpperCase()}:</span> {v}</li> : null
                                ))}
                              </ul>
                            )}
                            {/* @ts-expect-error - optional extra */}
                            {Boolean((q.explanation as any)?.notes) && (
                              <div><span className="text-muted-foreground">Notes:</span> {q.explanation.notes}</div>
                            )}
                          </div>
                        ) : (
                          <div className="text-muted-foreground">{q.explanation || 'No explanation provided'}</div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>

        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          onClick={onRetry}
          variant="outline"
          className="flex-1"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          {t('study.practice.results.actions.retry')}
        </Button>
        <Button
          onClick={onNewExercise}
          className="flex-1"
        >
          <Trophy className="h-4 w-4 mr-2" />
          {t('study.practice.results.actions.newExercise')}
        </Button>
      </div>

      {/* Secondary Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={exportResults}
          className="flex-1"
        >
          <Download className="h-4 w-4 mr-2" />
          {t('study.practice.results.actions.exportResults')}
        </Button>
        <Link href={`/study/n${level}`} className="flex-1">
          <Button variant="outline" size="sm" className="w-full">
            <Home className="h-4 w-4 mr-2" />
            {t('study.practice.results.actions.backToStudy')}
          </Button>
        </Link>
      </div>

      {/* Encouragement Message */}
      {percentageScore < 70 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <p className="text-sm text-yellow-800">
              💡 {t('study.practice.results.encouragement.lowScore')}
            </p>
          </CardContent>
        </Card>
      )}

      {percentageScore >= 90 && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <p className="text-sm text-green-800">
              🌟 {t('study.practice.results.encouragement.highScore')}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
