/**
 * JLPT N2 Level Questions
 * Upper intermediate level Japanese proficiency test questions
 */

import { Question } from '@/components/exam'

export const jlptN2Questions: Question[] = [
  {
    id: 1,
    question: "次の文の（　）に入れるのに最もよいものを、1・2・3・4から一つ選びなさい。\n\n今度の旅行は（　）楽しみにしています。",
    options: {
      A: "とても",
      B: "すごく",
      C: "本当に",
      D: "心から"
    },
    correctAnswer: 'D'
  },
  {
    id: 2,
    question: "次の文の（　）に入れるのに最もよいものを、1・2・3・4から一つ選びなさい。\n\n彼は仕事に（　）取り組んでいる。",
    options: {
      A: "真剣に",
      B: "一生懸命",
      C: "熱心に",
      D: "積極的に"
    },
    correctAnswer: 'C'
  },
  {
    id: 3,
    question: "次の文の（　）に入れるのに最もよいものを、1・2・3・4から一つ選びなさい。\n\n会議の時間が（　）変更になりました。",
    options: {
      A: "急に",
      B: "突然",
      C: "いきなり",
      D: "とつぜん"
    },
    correctAnswer: 'A'
  },
  {
    id: 4,
    question: "次の文の（　）に入れるのに最もよいものを、1・2・3・4から一つ選びなさい。\n\n新しいプロジェクトについて（　）説明します。",
    options: {
      A: "詳しく",
      B: "細かく",
      C: "具体的に",
      D: "明確に"
    },
    correctAnswer: 'A'
  },
  {
    id: 5,
    question: "次の文の（　）に入れるのに最もよいものを、1・2・3・4から一つ選びなさい。\n\n彼女の提案は（　）採用された。",
    options: {
      A: "結局",
      B: "最終的に",
      C: "ついに",
      D: "やっと"
    },
    correctAnswer: 'B'
  }
]

export const jlptN2Metadata = {
  level: 'N2',
  difficulty: 'upper-intermediate' as const,
  totalQuestions: jlptN2Questions.length,
  timeLimit: 55, // minutes
  passingScore: 0.65,
  sections: ['vocabulary', 'grammar', 'reading', 'listening'],
  description: 'Upper intermediate level JLPT questions for N2 certification'
}