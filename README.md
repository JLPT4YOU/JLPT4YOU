# JLPT4YOU - Ứng dụng học tiếng Nhật JLPT

Ứng dụng học tiếng Nhật hiệu quả với các bài tập tương tác, từ vựng phong phú và ngữ pháp chi tiết để chuẩn bị cho kỳ thi JLPT.

## 🚀 Tính năng chính

- **Luyện thi JLPT**: Các bài thi thử và câu hỏi được thiết kế theo đúng format JLPT từ N5 đến N1
- **Học từ vựng**: Hệ thống từ vựng phong phú với flashcard thông minh và phương pháp lặp lại ngắt quãng
- **Theo dõi tiến độ**: Thống kê chi tiết về quá trình học tập và điểm số
- **Giao diện thân thiện**: Thiết kế hiện đại, responsive trên mọi thiết bị
- **Hỗ trợ tiếng Việt**: Giao diện và nội dung hoàn toàn bằng tiếng Việt

## 🛠️ Công nghệ sử dụng

- **Framework**: Next.js 15.3.5 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Icons**: Lucide React
- **Font**: Geist Sans & Geist Mono
- **Package Manager**: npm

## 📦 Cài đặt và chạy dự án

### Yêu cầu hệ thống
- Node.js 18+
- npm hoặc yarn

### Cài đặt dependencies
```bash
npm install
```

### Chạy development server
```bash
npm run dev
```

Mở [http://localhost:3000](http://localhost:3000) để xem ứng dụng.

### Build cho production
```bash
npm run build
npm start
```

## 📁 Cấu trúc dự án

```
src/
├── app/                    # App Router (Next.js 13+)
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # React components
│   └── ui/               # UI components
├── lib/                  # Utility functions
│   ├── constants.ts      # App constants
│   └── utils.ts          # Helper functions
└── types/                # TypeScript type definitions
    └── index.ts          # Main types
```

## 🎯 Cấp độ JLPT được hỗ trợ

- **N5**: Sơ cấp - 100 kanji, 800 từ vựng
- **N4**: Sơ cấp cao - 300 kanji, 1500 từ vựng
- **N3**: Trung cấp - 650 kanji, 3750 từ vựng
- **N2**: Trung cấp cao - 1000 kanji, 6000 từ vựng
- **N1**: Cao cấp - 2000 kanji, 10000 từ vựng

## 🔧 Scripts có sẵn

- `npm run dev` - Chạy development server với Turbopack
- `npm run build` - Build ứng dụng cho production
- `npm run start` - Chạy production server
- `npm run lint` - Kiểm tra code với ESLint

## 📝 Ghi chú phát triển

- Dự án sử dụng Tailwind CSS v4 với cú pháp `@theme inline`
- TypeScript được cấu hình strict mode
- ESLint với Next.js config để đảm bảo code quality
- Import alias `@/*` được cấu hình để import dễ dàng

## 🤝 Đóng góp

Mọi đóng góp đều được chào đón! Vui lòng tạo issue hoặc pull request.

## 📄 License

MIT License
