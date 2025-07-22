"use client"

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useRouter } from 'next/navigation'
import { Eye, BookOpen, Car, CheckCircle, XCircle, HelpCircle } from 'lucide-react'

export default function ReviewDemoPage() {
  const router = useRouter()

  const demoScenarios = [
    {
      id: 'jlpt-n5-excellent',
      title: 'JLPT N5 - Xuất sắc (95%)',
      description: 'Xem đáp án chi tiết cho kết quả xuất sắc',
      type: 'jlpt',
      level: 'n5',
      sections: 'vocabulary,grammar,reading,listening',
      badge: 'Xuất sắc',
      badgeClass: 'bg-primary text-primary-foreground',
      icon: <CheckCircle className="h-4 w-4" />,
      stats: { correct: 38, incorrect: 2, unanswered: 0, total: 40 }
    },
    {
      id: 'jlpt-n3-good',
      title: 'JLPT N3 - Tốt (78%)',
      description: 'Xem đáp án với một số câu sai để cải thiện',
      type: 'jlpt',
      level: 'n3',
      sections: 'vocabulary,grammar,reading,listening',
      badge: 'Tốt',
      badgeClass: 'bg-muted text-foreground',
      icon: <CheckCircle className="h-4 w-4" />,
      stats: { correct: 39, incorrect: 8, unanswered: 3, total: 50 }
    },
    {
      id: 'jlpt-n1-average',
      title: 'JLPT N1 - Trung bình (65%)',
      description: 'Nhiều câu cần xem lại và học thêm',
      type: 'jlpt',
      level: 'n1',
      sections: 'vocabulary,grammar,reading,listening',
      badge: 'Trung bình',
      badgeClass: 'bg-muted/50 text-muted-foreground',
      icon: <XCircle className="h-4 w-4" />,
      stats: { correct: 39, incorrect: 15, unanswered: 6, total: 60 }
    },
    {
      id: 'jlpt-n2-poor',
      title: 'JLPT N2 - Yếu (45%)',
      description: 'Cần ôn tập kỹ lưỡng các phần kiến thức',
      type: 'jlpt',
      level: 'n2',
      sections: 'vocabulary,grammar,reading',
      badge: 'Yếu',
      badgeClass: 'bg-muted/30 text-muted-foreground',
      icon: <XCircle className="h-4 w-4" />,
      stats: { correct: 25, incorrect: 22, unanswered: 8, total: 55 }
    },
    {
      id: 'driving-karimen-excellent',
      title: 'Karimen - Xuất sắc (92%)',
      description: 'Đậu với điểm số cao, ít câu sai',
      type: 'driving',
      level: 'karimen',
      sections: '',
      badge: 'Xuất sắc',
      badgeClass: 'bg-primary text-primary-foreground',
      icon: <CheckCircle className="h-4 w-4" />,
      stats: { correct: 46, incorrect: 3, unanswered: 1, total: 50 }
    },
    {
      id: 'driving-honmen-failed',
      title: 'Honmen - Rớt (48%)',
      description: 'Nhiều câu sai, cần ôn tập thêm',
      type: 'driving',
      level: 'honmen',
      sections: '',
      badge: 'Rớt',
      badgeClass: 'bg-muted/30 text-muted-foreground',
      icon: <XCircle className="h-4 w-4" />,
      stats: { correct: 46, incorrect: 35, unanswered: 14, total: 95 }
    }
  ]

  const handleViewReview = (scenario: typeof demoScenarios[0]) => {
    const params = new URLSearchParams({
      type: scenario.type,
      level: scenario.level,
      sections: scenario.sections,
      demo: scenario.id
    })
    
    router.push(`/review-answers?${params.toString()}`)
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="relative">
        {/* Header */}
        <div className="app-container py-6 border-b border-border/50">
          <div className="app-content max-w-4xl mx-auto text-center">
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Demo Trang Xem Đáp Án Chi Tiết
            </h1>
            <p className="text-muted-foreground">
              Xem trước tính năng review đáp án với các kịch bản kết quả khác nhau
            </p>
          </div>
        </div>

        {/* Demo Scenarios */}
        <div className="app-container app-section">
          <div className="app-content max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {demoScenarios.map((scenario) => (
                <div key={scenario.id} className="bg-background rounded-2xl p-6 hover:bg-muted/20 transition-colors">
                  <div className="pb-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {scenario.type === 'jlpt' ? (
                          <BookOpen className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Car className="h-4 w-4 text-muted-foreground" />
                        )}
                        <h3 className="text-base font-semibold">
                          {scenario.title}
                        </h3>
                      </div>
                      <Badge className={scenario.badgeClass}>
                        {scenario.badge}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {scenario.description}
                    </p>
                  </div>
                  <div>
                    <div className="space-y-4">
                      {/* Stats Preview */}
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="flex items-center gap-1">
                          <CheckCircle className="h-3 w-3 text-foreground" />
                          <span>{scenario.stats.correct} đúng</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <XCircle className="h-3 w-3 text-muted-foreground" />
                          <span>{scenario.stats.incorrect} sai</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <HelpCircle className="h-3 w-3 text-yellow-600" />
                          <span>{scenario.stats.unanswered} đánh dấu</span>
                        </div>
                        <div className="text-muted-foreground">
                          Tổng: {scenario.stats.total}
                        </div>
                      </div>
                      
                      <Button
                        className="w-full bg-primary/90 hover:bg-primary"
                        onClick={() => handleViewReview(scenario)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Xem đáp án
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Features Overview */}
            <div className="mt-8 bg-muted/20 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">
                Tính năng Xem Đáp Án Chi Tiết
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
                <div className="space-y-2">
                  <p>• <strong>Hiển thị từng câu hỏi</strong> với nút &ldquo;Chi tiết&rdquo;</p>
                  <p>• <strong>Lọc theo trạng thái</strong>: Tất cả/Đúng/Sai/Đánh dấu</p>
                  <p>• <strong>Expand/Collapse</strong> - chỉ 1 câu mở tại 1 thời điểm</p>
                  <p>• <strong>Color coding</strong> - xanh (đúng), đỏ (sai), vàng (đánh dấu)</p>
                </div>
                <div className="space-y-2">
                  <p>• <strong>Giải thích chi tiết</strong> cho từng câu hỏi</p>
                  <p>• <strong>Bookmark</strong> câu hỏi khó để ôn lại</p>
                  <p>• <strong>Pagination</strong> để duyệt qua nhiều câu</p>
                  <p>• <strong>Responsive design</strong> cho mobile/desktop</p>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <div className="mt-6 text-center space-x-4">
              <Button
                variant="outline"
                onClick={() => router.push('/results-demo')}
                className="bg-muted/30 hover:bg-accent/50"
              >
                Demo Kết Quả
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push('/')}
                className="bg-muted/30 hover:bg-accent/50"
              >
                Về trang chủ
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
