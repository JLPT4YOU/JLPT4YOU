/**
 * JLPT N1 Level Questions
 * Advanced level Japanese proficiency test questions
 */

import { Question } from '@/components/exam'

export const jlptN1Questions: Question[] = [
  {
    id: 1,
    question: "次の文の（　）に入れるのに最もよいものを、1・2・3・4から一つ選びなさい。\n\n彼の発言は会議の流れを（　）変えてしまった。",
    options: {
      A: "根本的に",
      B: "基本的に", 
      C: "本質的に",
      D: "原則的に"
    },
    correctAnswer: 'A'
  },
  {
    id: 2,
    question: "次の文の（　）に入れるのに最もよいものを、1・2・3・4から一つ選びなさい。\n\n新しい技術の導入により、作業効率が（　）向上した。",
    options: {
      A: "著しく",
      B: "明らかに",
      C: "確実に", 
      D: "顕著に"
    },
    correctAnswer: 'D'
  },
  {
    id: 3,
    question: "次の文の（　）に入れるのに最もよいものを、1・2・3・4から一つ選びなさい。\n\n彼女の意見は（　）説得力があった。",
    options: {
      A: "非常に",
      B: "極めて",
      C: "相当に",
      D: "かなり"
    },
    correctAnswer: 'B'
  },
  {
    id: 4,
    question: "次の文の（　）に入れるのに最もよいものを、1・2・3・4から一つ選びなさい。\n\n経済状況の悪化により、多くの企業が（　）を余儀なくされた。",
    options: {
      A: "縮小",
      B: "削減",
      C: "短縮",
      D: "圧縮"
    },
    correctAnswer: 'A'
  },
  {
    id: 5,
    question: "次の文の（　）に入れるのに最もよいものを、1・2・3・4から一つ選びなさい。\n\nこの問題については、（　）検討する必要がある。",
    options: {
      A: "慎重に",
      B: "丁寧に",
      C: "詳細に",
      D: "綿密に"
    },
    correctAnswer: 'D'
  }
]

export const jlptN1Metadata = {
  level: 'N1',
  difficulty: 'advanced' as const,
  totalQuestions: jlptN1Questions.length,
  timeLimit: 60, // minutes
  passingScore: 0.7,
  sections: ['vocabulary', 'grammar', 'reading', 'listening'],
  description: 'Advanced level JLPT questions for N1 certification'
}