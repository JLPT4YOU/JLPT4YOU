/**
 * JLPT N3 Level Questions
 * Intermediate level Japanese proficiency test questions
 */

import { Question } from '@/components/exam'

export const jlptN3Questions: Question[] = [
  {
    id: 1,
    question: "次の文の（　）に入れるのに最もよいものを、1・2・3・4から一つ選びなさい。\n\n昨日は雨が（　）、今日はいい天気です。",
    options: {
      A: "降ったのに",
      B: "降ったから",
      C: "降ったので",
      D: "降ったけれど"
    },
    correctAnswer: 'A'
  },
  {
    id: 2,
    question: "次の文の（　）に入れるのに最もよいものを、1・2・3・4から一つ選びなさい。\n\n彼は日本語が（　）上手になりました。",
    options: {
      A: "とても",
      B: "だんだん",
      C: "すぐに",
      D: "やっと"
    },
    correctAnswer: 'B'
  },
  {
    id: 3,
    question: "次の文の（　）に入れるのに最もよいものを、1・2・3・4から一つ選びなさい。\n\n会議は10時（　）始まります。",
    options: {
      A: "に",
      B: "で",
      C: "を",
      D: "が"
    },
    correctAnswer: 'A'
  },
  {
    id: 4,
    question: "次の文の（　）に入れるのに最もよいものを、1・2・3・4から一つ選びなさい。\n\n図書館で本を（　）はいけません。",
    options: {
      A: "読んで",
      B: "読むと",
      C: "読んだら",
      D: "読んでは"
    },
    correctAnswer: 'D'
  },
  {
    id: 5,
    question: "次の文の（　）に入れるのに最もよいものを、1・2・3・4から一つ選びなさい。\n\n田中さんは毎日（　）勉強しています。",
    options: {
      A: "一生懸命",
      B: "一生懸命に",
      C: "一生懸命で",
      D: "一生懸命な"
    },
    correctAnswer: 'A'
  }
]

export const jlptN3Metadata = {
  level: 'N3',
  difficulty: 'intermediate' as const,
  totalQuestions: jlptN3Questions.length,
  timeLimit: 50, // minutes
  passingScore: 0.6,
  sections: ['vocabulary', 'grammar', 'reading', 'listening'],
  description: 'Intermediate level JLPT questions for N3 certification'
}