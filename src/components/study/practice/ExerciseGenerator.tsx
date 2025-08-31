'use client';

import React, { useState } from 'react';
// Card components removed - using div + bg-background rounded-2xl instead
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getAvailableModels } from '@/lib/gemini-config';
import { Input } from '@/components/ui/input';
import { Sparkles, Brain } from 'lucide-react';
import { useTranslations } from '@/hooks/use-translations';

interface ExerciseGeneratorProps {
  level: string;
  type: string;
  onGenerate: (params: { count: number; difficulty?: string; selectionMode: 'random' | 'sequential'; offset?: number; materialLimit?: number; model?: string; enableThinking?: boolean }) => void;
  isGenerating: boolean;
}

export function ExerciseGenerator({
  level,
  type,
  onGenerate,
  isGenerating
}: ExerciseGeneratorProps) {
  const { t } = useTranslations()
  const [questionCount, setQuestionCount] = useState(10); // 5,10,15,20,30
  const [difficulty, setDifficulty] = useState('medium');
  const [model, setModel] = useState<string>('gemini-2.5-flash');
  const availableModels = React.useMemo(() => getAvailableModels(), []);
  const [enableThinking, setEnableThinking] = useState<boolean>(false);
  const thinkingSupported = React.useMemo(() => {
    const m = availableModels.find(x => x.id === model);
    return m?.supportsThinking ?? false;
  }, [availableModels, model]);

  // Gemini 2.5 Pro có thinking mode mặc định, không cần toggle
  const isProModel = model === 'gemini-2.5-pro';

  const [selectionMode, setSelectionMode] = useState<'random' | 'sequential'>('random');
  const [lesson, setLesson] = useState(1);
  const [materialLimit, setMaterialLimit] = useState<number>(type === 'grammar' ? 5 : 10);

  // Reading-specific states
  const [passageLength, setPassageLength] = useState<'short' | 'medium' | 'long'>('medium');
  const [numberOfPassages, setNumberOfPassages] = useState(3);

  // Tự động tính offset từ lesson
  const startOffset = lesson - 1;

  // Get exercise type label from i18n
  const getExerciseLabel = (type: string) => {
    return t(`study.practice.types.${type}`) || type
  }

  const handleGenerate = () => {
    let materialLimitVal = selectionMode === 'random'
      ? (type === 'grammar' ? 5 : 50)
      : materialLimit;

    let finalQuestionCount = questionCount;

    // Special handling for Reading
    if (type === 'reading') {
      finalQuestionCount = numberOfPassages; // Each passage = 1 "question" with 3 sub-questions
      materialLimitVal = 30; // Need more materials for reading passages
    }

    onGenerate({
      count: finalQuestionCount,
      difficulty: type === 'reading' ? `${difficulty}_${passageLength}` : difficulty, // Pass passage length in difficulty
      selectionMode,
      offset: selectionMode === 'sequential' ? startOffset : undefined,
      materialLimit: materialLimitVal,
      model,
      enableThinking
    });
  };

  return (
    <div className="space-y-6">
      {/* Configuration Section */}
      <div className="bg-background rounded-2xl p-6 space-y-6">
        <div className="space-y-2">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-muted-foreground" />
            {t('study.practice.generator.title')}
          </h2>
          <p className="text-muted-foreground">
            {t('study.practice.generator.description')}
          </p>
        </div>
        <div className="space-y-4">
          {/* Compact Grid Layout */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Selection Mode */}
            <div className="space-y-2">
              <Label>{t('study.practice.generator.questionSelectionMode')}</Label>
              <Select value={selectionMode} onValueChange={(v: 'random'|'sequential') => setSelectionMode(v)}>
                <SelectTrigger>
                  <SelectValue placeholder={t('study.practice.generator.questionSelectionMode')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="random">{t('study.practice.generator.modes.random')}</SelectItem>
                  <SelectItem value="sequential">{t('study.practice.generator.modes.sequential')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Number of Questions / Passages */}
            {type === 'reading' ? (
              <div className="space-y-2">
                <Label>{t('study.practice.reading.numberOfPassages')}</Label>
                <Select value={String(numberOfPassages)} onValueChange={(v) => setNumberOfPassages(Number(v))}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('study.practice.reading.numberOfPassages')} />
                  </SelectTrigger>
                  <SelectContent>
                    {[1,2,3,4,5].map(v => (
                      <SelectItem key={v} value={String(v)}>
                        {v} {v === 1 ? 'bài đọc' : 'bài đọc'} ({v * 3} câu hỏi)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">{t('study.practice.reading.questionsPerPassage')}</p>
              </div>
            ) : (
              <div className="space-y-2">
                <Label>{t('study.practice.generator.numberOfQuestions')}</Label>
                <Select value={String(questionCount)} onValueChange={(v) => setQuestionCount(Number(v))}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('study.practice.generator.numberOfQuestions')} />
                  </SelectTrigger>
                  <SelectContent>
                    {[5,10,15,20].map(v => (
                      <SelectItem key={v} value={String(v)}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Difficulty Level */}
            <div className="space-y-2">
              <Label>{t('study.practice.generator.difficultyLevel')}</Label>
              <Select value={difficulty} onValueChange={setDifficulty}>
                <SelectTrigger>
                  <SelectValue placeholder={t('study.practice.generator.difficultyLevel')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">{t('study.practice.generator.difficulty.easy')}</SelectItem>
                  <SelectItem value="medium">{t('study.practice.generator.difficulty.medium')}</SelectItem>
                  <SelectItem value="hard">{t('study.practice.generator.difficulty.hard')}</SelectItem>
                  <SelectItem value="extremely_hard">
                    <div className="flex items-center gap-2">
                      <span className="text-red-600">🔥</span>
                      <span>{t('study.practice.generator.difficulty.extremely_hard')}</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* AI Model */}
            <div className="space-y-2">
              <Label>{t('study.practice.generator.aiModel')}</Label>
              <Select value={model} onValueChange={(val) => { setModel(val); setEnableThinking(false); }}>
                <SelectTrigger>
                  <SelectValue placeholder={t('study.practice.generator.aiModel')} />
                </SelectTrigger>
                <SelectContent>
                  {availableModels.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      <span className="text-sm">{m.name}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Passage Length (Reading only) */}
            {type === 'reading' && (
              <div className="space-y-2">
                <Label>{t('study.practice.reading.passageLength')}</Label>
                <Select value={passageLength} onValueChange={(v: 'short' | 'medium' | 'long') => setPassageLength(v)}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('study.practice.reading.passageLength')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="short">{t('study.practice.reading.passageLengths.short')}</SelectItem>
                    <SelectItem value="medium">{t('study.practice.reading.passageLengths.medium')}</SelectItem>
                    <SelectItem value="long">{t('study.practice.reading.passageLengths.long')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Sequential Mode Options */}
          {selectionMode === 'sequential' && (
            <div className="space-y-3 p-3 bg-muted/30 rounded-lg border border-border">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="lesson">{t('study.practice.generator.lesson')}</Label>
                  <Input id="lesson" type="number" min={1} value={lesson} onChange={(e) => setLesson(Math.max(1, Number(e.target.value)||1))} />
                  <p className="text-xs text-muted-foreground mt-1">{t('study.practice.generator.lesson')} {lesson} (offset: {startOffset})</p>
                </div>
                <div>
                  <Label htmlFor="material-limit">{type === 'grammar' ? t('study.practice.generator.grammarCount') : t('study.practice.generator.vocabularyCount')} (limit)</Label>
                  <Input id="material-limit" type="number" min={1} max={100} value={materialLimit}
                    onChange={(e) => setMaterialLimit(Math.max(1, Math.min(100, Number(e.target.value)||0)))} />
                  <p className="text-xs text-muted-foreground mt-1">{type === 'grammar' ? t('study.practice.generator.sequentialOptions.defaultGrammar') : t('study.practice.generator.sequentialOptions.defaultVocabulary')}</p>
                </div>
              </div>
            </div>
          )}

          {/* Thinking Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Label className="whitespace-nowrap">{t('study.practice.generator.thinkingMode')}</Label>
              <Select
                value={enableThinking ? 'on' : 'off'}
                onValueChange={(v) => setEnableThinking(v==='on')}
                disabled={isProModel}
              >
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="off">{t('study.practice.generator.thinking.off')}</SelectItem>
                  <SelectItem value="on" disabled={!thinkingSupported || isProModel}>{t('study.practice.generator.thinking.on')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <p className="text-xs text-black dark:text-white">
              {isProModel
                ? `🔒 ${t('study.practice.generator.thinking.proDefault')}`
                : `💡 ${t('study.practice.generator.thinking.description')}`
              }
            </p>
          </div>

          {/* Compact Summary */}
          <div className="rounded-lg bg-muted p-3">
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-sm">
              <div className="text-center">
                <div className="text-muted-foreground text-xs">{t('study.practice.generator.summary.type')}</div>
                <div className="font-medium">{getExerciseLabel(type)}</div>
              </div>
              <div className="text-center">
                <div className="text-muted-foreground text-xs">{t('study.practice.generator.summary.level')}</div>
                <div className="font-medium">{level.toUpperCase()}</div>
              </div>
              <div className="text-center">
                <div className="text-muted-foreground text-xs">
                  {type === 'reading' ? 'Bài đọc' : t('study.practice.generator.summary.questions')}
                </div>
                <div className="font-medium">
                  {type === 'reading' ? `${numberOfPassages} (${numberOfPassages * 3} câu hỏi)` : questionCount}
                </div>
              </div>
              <div className="text-center">
                <div className="text-muted-foreground text-xs">{t('study.practice.generator.summary.difficulty')}</div>
                <div className="font-medium capitalize">
                  {type === 'reading' ? (
                    <>
                      {t(`study.practice.generator.difficulty.${difficulty}`)} - {t(`study.practice.reading.passageLengths.${passageLength}`)}
                    </>
                  ) : (
                    t(`study.practice.generator.difficulty.${difficulty}`)
                  )}
                </div>
              </div>
              <div className="text-center">
                <div className="text-muted-foreground text-xs">{t('study.practice.generator.summary.estimatedTime')}</div>
                <div className="font-medium">
                  {type === 'reading'
                    ? `${Math.ceil(numberOfPassages * 4)}m` // Reading takes longer
                    : `${Math.ceil(questionCount * 1.5)}m`
                  }
                </div>
              </div>
            </div>
          </div>

          {/* Generate Button */}
          <Button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full"
            size="lg"
          >
            {isGenerating ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                {t('study.practice.generator.generating')}
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                {t('study.practice.generator.generateButton')}
              </>
            )}
          </Button>

          {/* Enhanced Loading Animation */}
          {isGenerating && (
            <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 via-purple-50 to-green-50 rounded-lg border border-blue-200 shadow-sm">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <div className="w-10 h-10 border-3 border-blue-200 rounded-full animate-spin">
                    <div className="absolute top-0 left-0 w-10 h-10 border-3 border-transparent border-t-blue-600 rounded-full animate-spin"></div>
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Brain className="w-5 h-5 text-blue-600 animate-pulse" />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-gray-900 text-sm">🤖 {t('study.practice.generator.generating')}</h3>
                    {enableThinking && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">{t('study.practice.generator.thinkingMode')}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-600">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                      <span>{t('study.practice.generator.loadingMessages.analyzing').replace('{count}', questionCount.toString())}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      <span>{enableThinking ? t('study.practice.generator.loadingMessages.thinking') : t('study.practice.generator.loadingMessages.generating')}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                      <span>{t('study.practice.generator.loadingMessages.timeEstimate').replace('{time}', enableThinking ? '20-30s' : '10-15s')}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tips Section */}
      <div className="bg-background rounded-2xl p-4">
        <h4 className="font-medium mb-3 text-sm flex items-center gap-2">
          💡 {t('study.practice.generator.tips.title')}
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-muted-foreground">
          <div>• {t('study.practice.generator.tips.tip1')}</div>
          <div>• {t('study.practice.generator.tips.tip2')}</div>
          <div>• {t('study.practice.generator.tips.tip3')}</div>
          <div>• {t('study.practice.generator.tips.tip4')}</div>
        </div>
      </div>
    </div>
  );
}
