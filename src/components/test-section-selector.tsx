"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  BookOpen,
  FileText,
  BookOpenCheck,
  Headphones,
  Clock,
  Timer,
  Infinity,
  Play
} from "lucide-react"
import { TranslationData } from "@/lib/i18n"
import { useTranslation } from "@/lib/use-translation"

interface TestSection {
  id: string
  name: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  defaultTime: number // minutes
}

interface TestSectionSelectorProps {
  testType: 'jlpt' | 'driving'
  onStartTest: (selectedSections: string[], timeMode: 'default' | 'custom' | 'unlimited', customTime?: number) => void
  translations: TranslationData
}

const getJlptSections = (t: (key: string) => string): TestSection[] => [
  {
    id: 'vocabulary',
    name: t('exam.sections.vocabulary'),
    description: 'Vocabulary',
    icon: BookOpen,
    defaultTime: 25
  },
  {
    id: 'grammar',
    name: t('exam.sections.grammar'),
    description: 'Grammar',
    icon: FileText,
    defaultTime: 30
  },
  {
    id: 'reading',
    name: t('exam.sections.reading'),
    description: 'Reading',
    icon: BookOpenCheck,
    defaultTime: 60
  },
  {
    id: 'listening',
    name: t('exam.sections.listening'),
    description: 'Listening',
    icon: Headphones,
    defaultTime: 40
  }
]

export function TestSectionSelector({
  testType,
  onStartTest,
  translations
}: TestSectionSelectorProps) {
  const { t } = useTranslation(translations)



  const [selectedSections, setSelectedSections] = React.useState<string[]>([])
  const [timeMode, setTimeMode] = React.useState<'default' | 'custom' | 'unlimited'>('default')
  const [customTime, setCustomTime] = React.useState<number>(60)

  const jlptSections = getJlptSections(t)

  const handleSectionToggle = (sectionId: string) => {
    setSelectedSections(prev => 
      prev.includes(sectionId) 
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    )
  }

  const handleStartTest = () => {
    if (testType === 'driving' || selectedSections.length > 0) {
      onStartTest(selectedSections, timeMode, timeMode === 'custom' ? customTime : undefined)
    }
  }

  const getTotalDefaultTime = () => {
    if (testType === 'driving') return 50 // Default driving test time
    return selectedSections.reduce((total, sectionId) => {
      const section = jlptSections.find(s => s.id === sectionId)
      return total + (section?.defaultTime || 0)
    }, 0)
  }

  const canStartTest = testType === 'driving' || selectedSections.length > 0

  return (
    <div className="min-h-screen bg-background">
      <div className="app-container app-section">
        <div className="app-content">
          <div className="max-w-4xl mx-auto app-space-lg">
            
            {/* Test Sections Selection - Only for JLPT */}
            {testType === 'jlpt' && (
              <div className="app-mb-xl">
                <h2 className="text-xl font-semibold text-foreground app-mb-md">
                  {t('exam.sectionSelector.title')}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 app-gap-md">
                  {jlptSections.map((section) => {
                    const IconComponent = section.icon
                    const isSelected = selectedSections.includes(section.id)

                    return (
                      <div
                        key={section.id}
                        className={`cursor-pointer rounded-2xl p-6 md:p-8 transition-all duration-200 ${
                          isSelected
                            ? 'bg-primary/10 border-2 border-primary/30'
                            : 'bg-muted/10 hover:bg-muted/30 border border-border/20'
                        }`}
                        onClick={() => handleSectionToggle(section.id)}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200 ${
                            isSelected
                              ? 'bg-primary text-primary-foreground scale-105'
                              : 'bg-muted text-muted-foreground'
                          }`}>
                            <IconComponent className="w-6 h-6" />
                          </div>
                          <div className="flex-1">
                            <h3 className={`font-semibold transition-colors duration-200 ${
                              isSelected ? 'text-primary' : 'text-foreground'
                            }`}>
                              {section.name}
                            </h3>
                            <p className="text-sm text-muted-foreground">{section.description}</p>
                          </div>
                          <div className="text-right">
                            <p className={`text-sm transition-colors duration-200 ${
                              isSelected ? 'text-primary font-semibold' : 'text-muted-foreground'
                            }`}>
                              {section.defaultTime} {t('exam.timeSelector.minutes')}
                            </p>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Time Selection */}
            <div className="app-mb-xl">
              <h2 className="text-xl font-semibold text-foreground app-mb-md">
                {t('exam.timeSelector.title')}
              </h2>
              
              <div className="app-space-md">
                {/* Default Time */}
                <div
                  className={`cursor-pointer rounded-2xl p-6 md:p-8 transition-all duration-200 ${
                    timeMode === 'default'
                      ? 'bg-primary/10 border-2 border-primary/30'
                      : 'bg-muted/10 hover:bg-muted/30 border border-border/20'
                  }`}
                  onClick={() => setTimeMode('default')}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      timeMode === 'default' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                    }`}>
                      <Clock className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">{t('exam.timeSelector.defaultTime')}</h3>
                      <p className="text-sm text-muted-foreground">
                        {t('exam.timeSelector.defaultTimeDescription').replace('{minutes}', getTotalDefaultTime().toString())}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Custom Time */}
                <div
                  className={`cursor-pointer rounded-2xl p-6 md:p-8 transition-all duration-200 ${
                    timeMode === 'custom'
                      ? 'bg-primary/10 border-2 border-primary/30'
                      : 'bg-muted/10 hover:bg-muted/30 border border-border/20'
                  }`}
                  onClick={() => setTimeMode('custom')}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      timeMode === 'custom' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                    }`}>
                      <Timer className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">{t('exam.timeSelector.customTime')}</h3>
                      <p className="text-sm text-muted-foreground">{t('exam.timeSelector.customTimeDescription')}</p>
                    </div>
                    {timeMode === 'custom' && (
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min="1"
                          max="300"
                          value={customTime}
                          onChange={(e) => setCustomTime(parseInt(e.target.value) || 60)}
                          className="w-20 text-center"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <Label className="text-sm text-muted-foreground">{t('exam.timeSelector.minutes')}</Label>
                      </div>
                    )}
                  </div>
                </div>

                {/* Unlimited Time */}
                <div
                  className={`cursor-pointer rounded-2xl p-6 md:p-8 transition-all duration-200 ${
                    timeMode === 'unlimited'
                      ? 'bg-primary/10 border-2 border-primary/30'
                      : 'bg-muted/10 hover:bg-muted/30 border border-border/20'
                  }`}
                  onClick={() => setTimeMode('unlimited')}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      timeMode === 'unlimited' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                    }`}>
                      <Infinity className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">{t('exam.timeSelector.unlimitedTime')}</h3>
                      <p className="text-sm text-muted-foreground">{t('exam.timeSelector.unlimitedTimeDescription')}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Start Test Button */}
            <div className="text-center">
              <Button
                size="lg"
                onClick={handleStartTest}
                disabled={!canStartTest}
                className="app-px-xl app-py-md text-base font-semibold"
              >
                <Play className="w-5 h-5 mr-2" />
                {t('exam.sectionSelector.startTest')}
              </Button>

              {testType === 'jlpt' && selectedSections.length === 0 && (
                <p className="text-sm text-muted-foreground mt-2">
                  {t('exam.sectionSelector.selectAtLeastOne')}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
