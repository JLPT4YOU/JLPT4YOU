/**
 * Driving License Test - Honmen (Practical Test)
 * Advanced traffic rules and practical driving questions
 */

import { Question } from '@/components/exam'

export const honmenQuestions: Question[] = [
  {
    id: 1,
    question: "Khi thực hiện thao tác đỗ xe song song, bước đầu tiên là gì?",
    options: {
      A: "Bật đèn xi nhan",
      B: "Kiểm tra gương chiếu hậu",
      C: "Tìm vị trí đỗ xe phù hợp",
      D: "Giảm tốc độ"
    },
    correctAnswer: 'C'
  },
  {
    id: 2,
    question: "Khi lái xe trên đường cao tốc, khoảng cách tối thiểu với xe phía trước ở tốc độ 80km/h là:",
    options: {
      A: "40m",
      B: "50m",
      C: "60m",
      D: "80m"
    },
    correctAnswer: 'D'
  },
  {
    id: 3,
    question: "Trong tình huống khẩn cấp cần phanh gấp, người lái xe nên:",
    options: {
      A: "Đạp phanh mạnh và giữ nguyên",
      B: "Đạp phanh từ từ nhiều lần",
      C: "Đạp phanh và đánh lái tránh",
      D: "Đạp phanh và bấm còi cảnh báo"
    },
    correctAnswer: 'A'
  },
  {
    id: 4,
    question: "Khi chuyển làn đường, thứ tự thao tác đúng là:",
    options: {
      A: "Xi nhan → Kiểm tra gương → Chuyển làn",
      B: "Kiểm tra gương → Xi nhan → Chuyển làn",
      C: "Chuyển làn → Xi nhan → Kiểm tra gương",
      D: "Xi nhan → Chuyển làn → Kiểm tra gương"
    },
    correctAnswer: 'B'
  },
  {
    id: 5,
    question: "Khi lái xe trong điều kiện sương mù dày đặc, người lái xe nên:",
    options: {
      A: "Bật đèn pha",
      B: "Bật đèn sương mù",
      C: "Tăng tốc độ để qua nhanh",
      D: "Đi sát xe phía trước"
    },
    correctAnswer: 'B'
  }
]

export const honmenMetadata = {
  level: 'honmen',
  type: 'driving',
  difficulty: 'advanced' as const,
  totalQuestions: honmenQuestions.length,
  timeLimit: 50, // minutes
  passingScore: 0.85,
  sections: ['practical-skills', 'advanced-rules', 'emergency-handling'],
  description: 'Advanced practical driving test for license acquisition'
}