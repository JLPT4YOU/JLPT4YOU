"use client"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { ResponsiveText } from "@/components/ui/responsive-container"

export default function FontTestPage() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl heading-primary text-foreground">
            JLPT4YOU Font Test - Noto Sans Japanese
          </h1>
          <p className="text-lg text-muted body-text">
            Testing font display across Vietnamese, Japanese, and English content
          </p>
        </div>

        {/* Font Weight Demonstration */}
        <div className="space-y-6">
          <h2 className="text-2xl heading-secondary">Font Weight System</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg heading-secondary">Vietnamese Content</h3>
              <div className="space-y-2">
                <p className="heading-primary">Tiêu đề chính (Bold 700)</p>
                <p className="heading-secondary">Tiêu đề phụ (Semibold 600)</p>
                <p className="interactive-text">Navigation/Button (Medium 500)</p>
                <p className="body-text">Nội dung chính (Normal 400)</p>
                <p className="text-muted">Text phụ (Light 300)</p>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg heading-secondary">Japanese Content</h3>
              <div className="space-y-2">
                <p className="heading-primary">主要見出し (Bold 700)</p>
                <p className="heading-secondary">副見出し (Semibold 600)</p>
                <p className="interactive-text">ナビゲーション (Medium 500)</p>
                <p className="body-text">本文テキスト (Normal 400)</p>
                <p className="text-muted">補助テキスト (Light 300)</p>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg heading-secondary">English Content</h3>
              <div className="space-y-2">
                <p className="heading-primary">Main Heading (Bold 700)</p>
                <p className="heading-secondary">Sub Heading (Semibold 600)</p>
                <p className="interactive-text">Navigation/Button (Medium 500)</p>
                <p className="body-text">Body Text (Normal 400)</p>
                <p className="text-muted">Muted Text (Light 300)</p>
              </div>
            </div>
          </div>
        </div>

        {/* UI Components Test */}
        <div className="space-y-6">
          <h2 className="text-2xl heading-secondary">UI Components</h2>
          
          <div className="space-y-4">
            <div className="flex flex-wrap gap-4">
              <Button variant="default">Default Button</Button>
              <Button variant="outline">Outline Button</Button>
              <Button variant="destructive">Destructive Button</Button>
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge>Default Badge</Badge>
              <Badge variant="secondary">Secondary Badge</Badge>
              <Badge variant="outline">Outline Badge</Badge>
            </div>

            <div className="space-y-2">
              <Label htmlFor="test-input">Form Label</Label>
              <input 
                id="test-input"
                className="w-full px-3 py-2 border border-input rounded-md body-text"
                placeholder="Input with body text font weight"
              />
            </div>
          </div>
        </div>

        {/* Responsive Text Test */}
        <div className="space-y-6">
          <h2 className="text-2xl heading-secondary">Responsive Text</h2>
          
          <div className="space-y-4">
            <ResponsiveText size="3xl" weight="bold">
              Large Responsive Heading
            </ResponsiveText>
            <ResponsiveText size="xl" weight="semibold">
              Medium Responsive Heading
            </ResponsiveText>
            <ResponsiveText size="base" weight="normal">
              Regular responsive body text that adapts to screen size
            </ResponsiveText>
            <ResponsiveText size="sm" weight="normal" color="muted">
              Small muted responsive text
            </ResponsiveText>
          </div>
        </div>

        {/* Mixed Language Content */}
        <div className="space-y-6">
          <h2 className="text-2xl heading-secondary">Mixed Language Content</h2>
          
          <div className="space-y-4">
            <p className="body-text">
              This is a mixed content example: 
              <span className="interactive-text"> English text, </span>
              <span className="interactive-text">日本語テキスト, </span>
              <span className="interactive-text">và tiếng Việt</span>
              all in one paragraph using Noto Sans Japanese font.
            </p>
            
            <div className="bg-card p-4 rounded-lg">
              <h3 className="heading-secondary mb-2">JLPT Example</h3>
              <p className="body-text">
                <strong className="heading-secondary">N5 Level:</strong> 
                私は学生です。(Watashi wa gakusei desu.) - Tôi là học sinh.
              </p>
              <p className="body-text">
                <strong className="heading-secondary">N3 Level:</strong> 
                日本語を勉強するのは楽しいです。- Học tiếng Nhật rất thú vị.
              </p>
            </div>
          </div>
        </div>

        {/* Font Information */}
        <div className="bg-muted p-6 rounded-lg">
          <h3 className="heading-secondary mb-4">Font Configuration</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm body-text">
            <div>
              <p><strong>Primary Font:</strong> Noto Sans Japanese</p>
              <p><strong>Weights:</strong> 300, 400, 500, 600, 700</p>
              <p><strong>Subsets:</strong> latin, latin-ext</p>
            </div>
            <div>
              <p><strong>Fallback:</strong> system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Arial, sans-serif</p>
              <p><strong>Display:</strong> swap (optimized loading)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
