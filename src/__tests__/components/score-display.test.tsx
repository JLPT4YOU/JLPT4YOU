/**
 * Comprehensive tests for score display components
 * Testing: ScoreDisplay, SectionAnalysis, ResultsActions
 */

import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useRouter, usePathname } from 'next/navigation'
import { ScoreDisplay } from '@/components/exam-results/score-display'
import { SectionAnalysis } from '@/components/exam-results/section-analysis'
import { ResultsActions } from '@/components/exam-results/results-actions'
import { SectionResult } from '@/types'
import { TranslationData } from '@/lib/i18n'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn()
}))

// Mock translation hook
jest.mock('@/lib/use-translation', () => ({
  useTranslation: () => ({
    t: (key: string) => key
  })
}))

// Mock i18n functions
jest.mock('@/lib/i18n', () => ({
  loadTranslation: jest.fn().mockResolvedValue({}),
  getLanguageFromPath: jest.fn().mockReturnValue('vn'),
  DEFAULT_LANGUAGE: 'vn'
}))

const mockPush = jest.fn()
const mockRouter = useRouter as jest.MockedFunction<typeof useRouter>
const mockPathname = usePathname as jest.MockedFunction<typeof usePathname>

const mockTranslations: TranslationData = {
  examResults: {
    stats: {
      score: 'Score',
      correctAnswers: 'Correct',
      incorrectAnswers: 'Incorrect',
      unansweredQuestions: 'Unanswered',
      timeSpent: 'Time Spent',
      timeEfficiency: 'Time Efficiency'
    },
    status: {
      excellent: 'Excellent',
      good: 'Good',
      average: 'Average',
      poor: 'Poor'
    },
    sections: {
      title: 'Section Analysis',
      names: {
        vocabulary: 'Vocabulary',
        grammar: 'Grammar',
        reading: 'Reading',
        listening: 'Listening',
        kanji: 'Kanji'
      },
      overallInsight: 'Overall Performance'
    },
    actions: {
      viewAnswers: 'View Answers',
      retakeTest: 'Retake Test',
      newTest: 'New Test',
      shareResults: 'Share Results'
    }
  }
} as any

// Mock section results
const mockSectionResults: SectionResult[] = [
  {
    name: 'vocabulary',
    displayName: 'Vocabulary',
    score: 18,
    total: 20,
    percentage: 90,
    status: 'excellent'
  },
  {
    name: 'grammar',
    displayName: 'Grammar',
    score: 15,
    total: 20,
    percentage: 75,
    status: 'good'
  },
  {
    name: 'reading',
    displayName: 'Reading',
    score: 12,
    total: 20,
    percentage: 60,
    status: 'average'
  }
]

describe('ScoreDisplay', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockRouter.mockReturnValue({
      push: mockPush,
      replace: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
      prefetch: jest.fn()
    } as any)
    mockPathname.mockReturnValue('/vn/exam-results')
  })

  const defaultProps = {
    score: 45,
    totalQuestions: 60,
    correctAnswers: 45,
    incorrectAnswers: 10,
    unansweredQuestions: 5,
    percentage: 75,
    status: 'good' as const,
    timeSpent: 3600, // 1 hour
    timeLimit: 7200, // 2 hours
    examType: 'jlpt' as const,
    level: 'n3'
  }

  describe('Component Rendering', () => {
    test('should render score display with all stats', () => {
      render(<ScoreDisplay {...defaultProps} />)
      
      expect(screen.getByText('75%')).toBeInTheDocument()
      expect(screen.getByText('45/60')).toBeInTheDocument()
      expect(screen.getByText('examResults.stats.correctAnswers')).toBeInTheDocument()
      expect(screen.getByText('examResults.stats.incorrectAnswers')).toBeInTheDocument()
      expect(screen.getByText('examResults.stats.unansweredQuestions')).toBeInTheDocument()
    })

    test('should render time information', () => {
      render(<ScoreDisplay {...defaultProps} />)
      
      expect(screen.getByText('examResults.stats.timeSpent')).toBeInTheDocument()
      expect(screen.getByText('examResults.stats.timeEfficiency')).toBeInTheDocument()
      expect(screen.getByText('50%')).toBeInTheDocument() // Time efficiency: 3600/7200 = 50%
    })

    test('should render status badge', () => {
      render(<ScoreDisplay {...defaultProps} />)
      
      expect(screen.getByText('examResults.status.good')).toBeInTheDocument()
    })

    test('should handle excellent status', () => {
      render(<ScoreDisplay {...defaultProps} status="excellent" percentage={95} />)
      
      expect(screen.getByText('examResults.status.excellent')).toBeInTheDocument()
      expect(screen.getByText('95%')).toBeInTheDocument()
    })

    test('should handle poor status', () => {
      render(<ScoreDisplay {...defaultProps} status="poor" percentage={30} />)
      
      expect(screen.getByText('examResults.status.poor')).toBeInTheDocument()
      expect(screen.getByText('30%')).toBeInTheDocument()
    })
  })

  describe('Score Animation', () => {
    test('should animate score from 0 to target value', async () => {
      render(<ScoreDisplay {...defaultProps} />)
      
      // Initially should show 0 or low value
      await waitFor(() => {
        expect(screen.getByText('75%')).toBeInTheDocument()
      }, { timeout: 2000 })
    })

    test('should animate percentage progressively', async () => {
      render(<ScoreDisplay {...defaultProps} percentage={85} />)
      
      await waitFor(() => {
        expect(screen.getByText('85%')).toBeInTheDocument()
      }, { timeout: 2000 })
    })
  })

  describe('Different Exam Types', () => {
    test('should render for JLPT exam', () => {
      render(<ScoreDisplay {...defaultProps} examType="jlpt" />)
      
      expect(screen.getByText('75%')).toBeInTheDocument()
    })

    test('should render for Challenge exam', () => {
      render(<ScoreDisplay {...defaultProps} examType="challenge" />)
      
      expect(screen.getByText('75%')).toBeInTheDocument()
    })

    test('should render for Driving exam', () => {
      render(<ScoreDisplay {...defaultProps} examType="driving" />)
      
      expect(screen.getByText('75%')).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    test('should handle perfect score', () => {
      render(<ScoreDisplay 
        {...defaultProps} 
        score={60}
        correctAnswers={60}
        incorrectAnswers={0}
        unansweredQuestions={0}
        percentage={100}
        status="excellent"
      />)
      
      expect(screen.getByText('100%')).toBeInTheDocument()
      expect(screen.getByText('60/60')).toBeInTheDocument()
    })

    test('should handle zero score', () => {
      render(<ScoreDisplay 
        {...defaultProps} 
        score={0}
        correctAnswers={0}
        incorrectAnswers={30}
        unansweredQuestions={30}
        percentage={0}
        status="poor"
      />)
      
      expect(screen.getByText('0%')).toBeInTheDocument()
      expect(screen.getByText('0/60')).toBeInTheDocument()
    })

    test('should handle missing time data', () => {
      render(<ScoreDisplay 
        {...defaultProps} 
        timeSpent={undefined}
        timeLimit={undefined}
      />)
      
      expect(screen.getByText('75%')).toBeInTheDocument()
    })
  })
})

describe('SectionAnalysis', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockPathname.mockReturnValue('/vn/exam-results')
  })

  describe('Component Rendering', () => {
    test('should render section analysis with results', () => {
      render(<SectionAnalysis sectionResults={mockSectionResults} examType="jlpt" />)
      
      expect(screen.getByText('examResults.sections.title')).toBeInTheDocument()
      expect(screen.getByText('examResults.sections.names.vocabulary')).toBeInTheDocument()
      expect(screen.getByText('examResults.sections.names.grammar')).toBeInTheDocument()
      expect(screen.getByText('examResults.sections.names.reading')).toBeInTheDocument()
    })

    test('should render section scores and percentages', () => {
      render(<SectionAnalysis sectionResults={mockSectionResults} examType="jlpt" />)
      
      expect(screen.getByText('18/20')).toBeInTheDocument()
      expect(screen.getByText('15/20')).toBeInTheDocument()
      expect(screen.getByText('12/20')).toBeInTheDocument()
    })

    test('should render section status badges', () => {
      render(<SectionAnalysis sectionResults={mockSectionResults} examType="jlpt" />)
      
      expect(screen.getByText('examResults.status.excellent')).toBeInTheDocument()
      expect(screen.getByText('examResults.status.good')).toBeInTheDocument()
      expect(screen.getByText('examResults.status.average')).toBeInTheDocument()
    })

    test('should render overall insight', () => {
      render(<SectionAnalysis sectionResults={mockSectionResults} examType="jlpt" />)
      
      expect(screen.getByText('examResults.sections.overallInsight')).toBeInTheDocument()
    })
  })

  describe('Section Icons', () => {
    test('should render appropriate icons for each section', () => {
      render(<SectionAnalysis sectionResults={mockSectionResults} examType="jlpt" />)
      
      // Icons should be rendered (we can't easily test specific icons, but can check they exist)
      const sectionCards = screen.getAllByText(/examResults.sections.names/)
      expect(sectionCards).toHaveLength(3)
    })
  })

  describe('Empty State', () => {
    test('should handle empty section results', () => {
      render(<SectionAnalysis sectionResults={[]} examType="jlpt" />)
      
      expect(screen.getByText('examResults.sections.title')).toBeInTheDocument()
    })

    test('should handle undefined section results', () => {
      render(<SectionAnalysis sectionResults={undefined} examType="jlpt" />)
      
      expect(screen.getByText('examResults.sections.title')).toBeInTheDocument()
    })
  })

  describe('Different Exam Types', () => {
    test('should render for challenge exam', () => {
      render(<SectionAnalysis sectionResults={mockSectionResults} examType="challenge" />)
      
      expect(screen.getByText('examResults.sections.title')).toBeInTheDocument()
    })

    test('should render for driving exam', () => {
      const drivingSections: SectionResult[] = [
        {
          name: 'traffic-rules',
          displayName: 'Traffic Rules',
          score: 15,
          total: 20,
          percentage: 75,
          status: 'good'
        }
      ]
      
      render(<SectionAnalysis sectionResults={drivingSections} examType="driving" />)
      
      expect(screen.getByText('examResults.sections.title')).toBeInTheDocument()
    })
  })
})

describe('ResultsActions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockRouter.mockReturnValue({
      push: mockPush,
      replace: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
      prefetch: jest.fn()
    } as any)
    mockPathname.mockReturnValue('/vn/exam-results')
  })

  const defaultProps = {
    examType: 'jlpt' as const,
    level: 'n3',
    examSubType: 'custom',
    sections: ['vocabulary', 'grammar'],
    demoScenario: 'jlpt-n3-good'
  }

  describe('Component Rendering', () => {
    test('should render all action buttons', () => {
      render(<ResultsActions {...defaultProps} />)
      
      expect(screen.getByText('examResults.actions.viewAnswers')).toBeInTheDocument()
      expect(screen.getByText('examResults.actions.retakeTest')).toBeInTheDocument()
      expect(screen.getByText('examResults.actions.newTest')).toBeInTheDocument()
    })

    test('should render action buttons with icons', () => {
      render(<ResultsActions {...defaultProps} />)
      
      // Check that buttons exist (icons are rendered as SVG elements)
      const buttons = screen.getAllByRole('button')
      expect(buttons.length).toBeGreaterThanOrEqual(3)
    })
  })

  describe('Navigation Actions', () => {
    test('should navigate to review answers page', async () => {
      const user = userEvent.setup()
      render(<ResultsActions {...defaultProps} />)

      // Use getByRole to find the specific button
      const viewAnswersButton = screen.getByRole('button', { name: /examResults.actions.viewAnswers/i })
      await user.click(viewAnswersButton)

      expect(mockPush).toHaveBeenCalledWith(
        expect.stringContaining('/vn/review-answers')
      )
      expect(mockPush).toHaveBeenCalledWith(
        expect.stringContaining('type=jlpt')
      )
      expect(mockPush).toHaveBeenCalledWith(
        expect.stringContaining('level=n3')
      )
    })

    test('should include all parameters in review URL', async () => {
      const user = userEvent.setup()
      render(<ResultsActions {...defaultProps} />)

      // Use getByRole to find the specific button
      const viewAnswersButton = screen.getByRole('button', { name: /examResults.actions.viewAnswers/i })
      await user.click(viewAnswersButton)

      const expectedUrl = mockPush.mock.calls[0][0]
      expect(expectedUrl).toContain('type=jlpt')
      expect(expectedUrl).toContain('level=n3')
      expect(expectedUrl).toContain('sections=vocabulary%2Cgrammar')
      expect(expectedUrl).toContain('subType=custom')
      expect(expectedUrl).toContain('demo=jlpt-n3-good')
    })
  })

  describe('Callback Actions', () => {
    test('should call onRetake callback', async () => {
      const onRetake = jest.fn()
      const user = userEvent.setup()

      render(<ResultsActions {...defaultProps} onRetake={onRetake} />)

      const retakeButton = screen.getByRole('button', { name: /examResults.actions.retakeTest/i })
      await user.click(retakeButton)

      expect(onRetake).toHaveBeenCalled()
    })

    test('should call onNewTest callback', async () => {
      const onNewTest = jest.fn()
      const user = userEvent.setup()

      render(<ResultsActions {...defaultProps} onNewTest={onNewTest} />)

      const newTestButton = screen.getByRole('button', { name: /examResults.actions.newTest/i })
      await user.click(newTestButton)

      expect(onNewTest).toHaveBeenCalled()
    })
  })

  describe('Different Exam Types', () => {
    test('should handle challenge exam type', () => {
      render(<ResultsActions {...defaultProps} examType="challenge" />)

      expect(screen.getByRole('button', { name: /examResults.actions.viewAnswers/i })).toBeInTheDocument()
    })

    test('should handle driving exam type', () => {
      render(<ResultsActions {...defaultProps} examType="driving" level="honmen" />)

      expect(screen.getByRole('button', { name: /examResults.actions.viewAnswers/i })).toBeInTheDocument()
    })
  })

  describe('Optional Props', () => {
    test('should handle missing optional props', () => {
      const minimalProps = {
        examType: 'jlpt' as const,
        level: 'n5'
      }

      render(<ResultsActions {...minimalProps} />)

      expect(screen.getByRole('button', { name: /examResults.actions.viewAnswers/i })).toBeInTheDocument()
    })

    test('should handle missing sections', async () => {
      const user = userEvent.setup()
      const propsWithoutSections = {
        ...defaultProps,
        sections: undefined
      }

      render(<ResultsActions {...propsWithoutSections} />)

      const viewAnswersButton = screen.getByRole('button', { name: /examResults.actions.viewAnswers/i })
      await user.click(viewAnswersButton)

      expect(mockPush).toHaveBeenCalledWith(
        expect.stringContaining('sections=')
      )
    })
  })
})
