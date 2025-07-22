"use client"

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useRouter } from 'next/navigation'
import { Trophy, Target, BookOpen, Car } from 'lucide-react'

export default function ResultsDemoPage() {
  const router = useRouter()

  const demoScenarios = [
    {
      id: 'jlpt-n5-excellent',
      title: 'JLPT N5 - Xuất sắc',
      description: 'Kết quả rất tốt với 95% điểm số',
      type: 'jlpt',
      level: 'n5',
      sections: 'vocabulary,grammar,reading,listening',
      badge: 'Xuất sắc',
      badgeClass: 'bg-primary text-primary-foreground',
      icon: <Trophy className="h-4 w-4" />
    },
    {
      id: 'jlpt-n3-good',
      title: 'JLPT N3 - Tốt',
      description: 'Kết quả khá tốt với 78% điểm số',
      type: 'jlpt',
      level: 'n3',
      sections: 'vocabulary,grammar,reading,listening',
      badge: 'Tốt',
      badgeClass: 'bg-muted text-foreground',
      icon: <Target className="h-4 w-4" />
    },
    {
      id: 'jlpt-n1-average',
      title: 'JLPT N1 - Trung bình',
      description: 'Cần cải thiện với 65% điểm số',
      type: 'jlpt',
      level: 'n1',
      sections: 'vocabulary,grammar,reading,listening',
      badge: 'Trung bình',
      badgeClass: 'bg-muted/50 text-muted-foreground',
      icon: <BookOpen className="h-4 w-4" />
    },
    {
      id: 'jlpt-n2-poor',
      title: 'JLPT N2 - Yếu',
      description: 'Cần học thêm với 45% điểm số',
      type: 'jlpt',
      level: 'n2',
      sections: 'vocabulary,grammar,reading',
      badge: 'Yếu',
      badgeClass: 'bg-muted/30 text-muted-foreground',
      icon: <BookOpen className="h-4 w-4" />
    },
    {
      id: 'driving-karimen-excellent',
      title: 'Karimen - Xuất sắc',
      description: 'Đậu với điểm số cao 92%',
      type: 'driving',
      level: 'karimen',
      sections: '',
      badge: 'Xuất sắc',
      badgeClass: 'bg-primary text-primary-foreground',
      icon: <Car className="h-4 w-4" />
    },
    {
      id: 'driving-honmen-failed',
      title: 'Honmen - Rớt',
      description: 'Chưa đậu với 48% điểm số',
      type: 'driving',
      level: 'honmen',
      sections: '',
      badge: 'Rớt',
      badgeClass: 'bg-muted/30 text-muted-foreground',
      icon: <Car className="h-4 w-4" />
    }
  ]

  const handleViewDemo = (scenario: typeof demoScenarios[0]) => {
    const params = new URLSearchParams({
      type: scenario.type,
      level: scenario.level,
      sections: scenario.sections,
      demo: scenario.id
    })
    
    router.push(`/exam-results?${params.toString()}`)
  }

  return (
    <div className="min-h-screen bg-background">


      <div className="relative">
        {/* Header */}
        <div className="app-container py-6 border-b border-border/50">
          <div className="app-content max-w-4xl mx-auto text-center">
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Demo Trang Kết Quả Bài Thi
            </h1>
            <p className="text-muted-foreground">
              Xem trước các kịch bản kết quả khác nhau cho JLPT và bài thi lái xe
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
                        {scenario.icon}
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
                  <div className="space-y-3">
                    <div className="text-xs text-muted-foreground">
                      <div>Loại: {scenario.type === 'jlpt' ? 'JLPT' : 'Lái xe'}</div>
                      <div>Cấp độ: {scenario.level.toUpperCase()}</div>
                      {scenario.sections && (
                        <div>Phần thi: {scenario.sections.split(',').length} phần</div>
                      )}
                    </div>

                    <Button
                      className="w-full rounded-xl bg-primary/90 hover:bg-primary"
                      onClick={() => handleViewDemo(scenario)}
                    >
                      Xem demo
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Instructions */}
            <div className="mt-8 bg-muted/20 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-foreground mb-3">
                Hướng dẫn sử dụng
              </h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>• Chọn một kịch bản demo để xem trang kết quả tương ứng</p>
                <p>• Mỗi demo sẽ tạo dữ liệu mẫu với điểm số và phân tích khác nhau</p>
                <p>• Kiểm tra responsive design bằng cách thay đổi kích thước cửa sổ</p>
                <p>• Tất cả animations và interactions đều hoạt động như thực tế</p>
              </div>
            </div>

            {/* Navigation */}
            <div className="mt-6 text-center">
              <Button 
                variant="outline" 
                onClick={() => router.push('/')}
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
