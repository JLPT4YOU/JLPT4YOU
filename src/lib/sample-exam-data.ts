// Sample exam data for testing the ExamInterface component
// This file now imports from the centralized data structure
import { Question } from "@/components/exam";
import { 
  generateSampleQuestions,
  generateJLPTQuestions,
  generateDrivingQuestions,
  getQuestions
} from "@/data";
import { EXAM_TYPES } from "@/lib/exam-constants";

// Re-export for backward compatibility
export const sampleJLPTQuestions: Question[] = getQuestions(EXAM_TYPES.JLPT, 'N3').slice(0, 20).map((q, index) => ({
  ...q,
  id: index + 1
}))

// Legacy questions for backward compatibility
const legacyQuestions: Question[] = [
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
  },
  {
    id: 6,
    question: "次の文の（　）に入れるのに最もよいものを、1・2・3・4から一つ選びなさい。\n\n電車が来る（　）、ホームで待っています。",
    options: {
      A: "まで",
      B: "までに",
      C: "間",
      D: "間に"
    },
    correctAnswer: 'A'
  },
  {
    id: 7,
    question: "次の文の（　）に入れるのに最もよいものを、1・2・3・4から一つ選びなさい。\n\n今度の旅行は（　）楽しみです。",
    options: {
      A: "とても",
      B: "すごく",
      C: "本当に",
      D: "全部"
    },
    correctAnswer: 'C'
  },
  {
    id: 8,
    question: "次の文の（　）に入れるのに最もよいものを、1・2・3・4から一つ選びなさい。\n\n宿題を（　）から、遊びに行きます。",
    options: {
      A: "してから",
      B: "したから",
      C: "してので",
      D: "したので"
    },
    correctAnswer: 'A'
  },
  {
    id: 9,
    question: "次の文の（　）に入れるのに最もよいものを、1・2・3・4から一つ選びなさい。\n\n彼女は歌が（　）上手です。",
    options: {
      A: "とても",
      B: "すごく",
      C: "本当に",
      D: "全部"
    },
    correctAnswer: 'A'
  },
  {
    id: 10,
    question: "次の文の（　）に入れるのに最もよいものを、1・2・3・4から一つ選びなさい。\n\n友達（　）一緒に映画を見ました。",
    options: {
      A: "と",
      B: "に",
      C: "で",
      D: "を"
    },
    correctAnswer: 'A'
  },
  {
    id: 11,
    question: "次の文の（　）に入れるのに最もよいものを、1・2・3・4から一つ選びなさい。\n\n毎朝7時（　）起きます。",
    options: {
      A: "で",
      B: "に",
      C: "を",
      D: "が"
    },
    correctAnswer: 'B'
  },
  {
    id: 12,
    question: "次の文の（　）に入れるのに最もよいものを、1・2・3・4から一つ選びなさい。\n\n日本語の勉強は（　）難しいです。",
    options: {
      A: "とても",
      B: "すごく",
      C: "本当に",
      D: "全部正しい"
    },
    correctAnswer: 'D'
  },
  {
    id: 13,
    question: "次の文の（　）に入れるのに最もよいものを、1・2・3・4から一つ選びなさい。\n\n駅（　）学校まで歩いて10分です。",
    options: {
      A: "から",
      B: "まで",
      C: "で",
      D: "に"
    },
    correctAnswer: 'A'
  },
  {
    id: 14,
    question: "次の文の（　）に入れるのに最もよいものを、1・2・3・4から一つ選びなさい。\n\n今度の休みに（　）をしますか。",
    options: {
      A: "何",
      B: "どこ",
      C: "いつ",
      D: "だれ"
    },
    correctAnswer: 'A'
  },
  {
    id: 15,
    question: "次の文の（　）に入れるのに最もよいものを、1・2・3・4から一つ選びなさい。\n\n先生は学生（　）質問に答えました。",
    options: {
      A: "の",
      B: "を",
      C: "に",
      D: "で"
    },
    correctAnswer: 'A'
  },
  {
    id: 16,
    question: "次の文の（　）に入れるのに最もよいものを、1・2・3・4から一つ選びなさい。\n\n雨が降って（　）、試合は中止になりました。",
    options: {
      A: "いるので",
      B: "いるから",
      C: "いたので",
      D: "いたから"
    },
    correctAnswer: 'C'
  },
  {
    id: 17,
    question: "次の文の（　）に入れるのに最もよいものを、1・2・3・4から一つ選びなさい。\n\n彼は英語（　）日本語（　）話せます。",
    options: {
      A: "も、も",
      B: "と、と",
      C: "も、を",
      D: "を、も"
    },
    correctAnswer: 'A'
  },
  {
    id: 18,
    question: "次の文の（　）に入れるのに最もよいものを、1・2・3・4から一つ選びなさい。\n\n今日は忙しくて、昼ご飯を食べる時間が（　）。",
    options: {
      A: "ありません",
      B: "いません",
      C: "できません",
      D: "わかりません"
    },
    correctAnswer: 'A'
  },
  {
    id: 19,
    question: "次の文の（　）に入れるのに最もよいものを、1・2・3・4から一つ選びなさい。\n\n新しいコンピューターは（　）便利です。",
    options: {
      A: "とても",
      B: "すごく",
      C: "本当に",
      D: "全部正しい"
    },
    correctAnswer: 'D'
  },
  {
    id: 20,
    question: "次の文の（　）に入れるのに最もよいものを、1・2・3・4から一つ選びなさい。\n\n明日の会議（　）資料を準備してください。",
    options: {
      A: "の",
      B: "を",
      C: "に",
      D: "で"
    },
    correctAnswer: 'A'
  }
];

// Generate more questions for testing (up to any number)
export { generateSampleQuestions } from '@/data'

// Generate 100 questions specifically for comprehensive testing
export const generate100Questions = (): Question[] => {
  return generateSampleQuestions(100);
};

// Generate questions for JLPT tests based on level and sections
export { generateJLPTQuestions } from '@/data'

// Generate questions for driving tests
export { generateDrivingQuestions } from '@/data'

export const sampleDrivingQuestions: Question[] = [
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
  }
];
