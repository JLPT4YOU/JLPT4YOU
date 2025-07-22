/**
 * Driving License Test - Karimen (Written Test)
 * Basic traffic rules and road signs questions
 */

import { Question } from '@/components/exam'

export const karimenQuestions: Question[] = [
  {
    id: 1,
    question: "Tốc độ tối đa cho phép trong khu vực dân cư là bao nhiêu?",
    options: {
      A: "30 km/h",
      B: "40 km/h", 
      C: "50 km/h",
      D: "60 km/h"
    },
    correctAnswer: 'D'
  },
  {
    id: 2,
    question: "Khi gặp đèn vàng, người lái xe nên làm gì?",
    options: {
      A: "Tăng tốc để qua nhanh",
      B: "Dừng lại nếu có thể dừng an toàn",
      C: "Tiếp tục đi với tốc độ bình thường",
      D: "Bấm còi để cảnh báo"
    },
    correctAnswer: 'B'
  },
  {
    id: 3,
    question: "Khoảng cách an toàn tối thiểu giữa hai xe ô tô khi đi với tốc độ 50km/h là:",
    options: {
      A: "20m",
      B: "25m",
      C: "30m", 
      D: "35m"
    },
    correctAnswer: 'B'
  },
  {
    id: 4,
    question: "Biển báo hình tam giác màu đỏ viền trắng có ý nghĩa gì?",
    options: {
      A: "Biển báo cấm",
      B: "Biển báo nguy hiểm",
      C: "Biển báo hiệu lệnh",
      D: "Biển báo chỉ dẫn"
    },
    correctAnswer: 'B'
  },
  {
    id: 5,
    question: "Khi xe bị hỏng trên đường cao tốc, người lái xe phải làm gì đầu tiên?",
    options: {
      A: "Gọi điện thoại báo cảnh sát",
      B: "Đặt biển báo hiệu phía sau xe",
      C: "Tìm cách sửa chữa ngay",
      D: "Đưa xe ra khỏi làn đường và bật đèn cảnh báo"
    },
    correctAnswer: 'D'
  },
  {
    id: 6,
    question: "Người lái xe được phép sử dụng điện thoại di động khi nào?",
    options: {
      A: "Khi đang lái xe với tốc độ chậm",
      B: "Khi sử dụng tai nghe bluetooth",
      C: "Khi dừng xe và tắt máy",
      D: "Khi đang chờ đèn đỏ"
    },
    correctAnswer: 'C'
  },
  {
    id: 7,
    question: "Thời gian hiệu lực của bằng lái xe ô tô hạng B1 là:",
    options: {
      A: "5 năm",
      B: "10 năm",
      C: "15 năm",
      D: "Vô thời hạn"
    },
    correctAnswer: 'B'
  }
]

export const karimenMetadata = {
  level: 'karimen',
  type: 'driving',
  difficulty: 'basic' as const,
  totalQuestions: karimenQuestions.length,
  timeLimit: 45, // minutes
  passingScore: 0.8,
  sections: ['traffic-rules', 'road-signs', 'safety'],
  description: 'Basic written driving test for license acquisition'
}