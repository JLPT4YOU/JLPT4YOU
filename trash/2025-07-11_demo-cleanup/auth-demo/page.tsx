"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { GraduationCap, ArrowRight, User, Mail, Lock } from "lucide-react"

export default function AuthDemoPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="app-container app-py-md border-b border-border">
        <div className="flex items-center app-gap-sm">
          <div className="flex items-center justify-center w-8 h-8 rounded-md bg-primary">
            <GraduationCap className="h-5 w-5 text-primary-foreground" />
          </div>
          <h1 className="text-xl font-bold text-foreground">JLPT4YOU Auth Demo</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="app-container app-py-xl">
        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <div className="text-center space-y-6 mb-12">
            <h1 className="text-4xl font-bold text-foreground">
              Authentication System Demo
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Test trang đăng nhập/đăng ký chuyên nghiệp với design system monochrome và các tính năng UX hiện đại cho JLPT4YOU
            </p>
          </div>

          {/* Demo Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {/* Login Demo */}
            <div className="bg-background rounded-2xl border border-border p-6 space-y-4 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10">
                <User className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Đăng nhập</h3>
                <p className="text-sm text-muted-foreground">
                  Form đăng nhập với validation real-time, show/hide password, caps lock indicator
                </p>
              </div>
              <Link href="/login">
                <Button className="w-full bg-muted/20 hover:bg-accent/50 text-foreground">
                  Test Login
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>

            {/* Register Demo */}
            <div className="bg-background rounded-2xl border border-border p-6 space-y-4 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-secondary/20">
                <User className="h-6 w-6 text-secondary-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Đăng ký</h3>
                <p className="text-sm text-muted-foreground">
                  Form đăng ký với password strength meter, social login, terms acceptance
                </p>
              </div>
              <Link href="/register">
                <Button className="w-full bg-muted/20 hover:bg-accent/50 text-foreground">
                  Test Register
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>

            {/* Forgot Password Demo */}
            <div className="bg-background rounded-2xl border border-border p-6 space-y-4 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-accent/20">
                <Mail className="h-6 w-6 text-accent-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Quên mật khẩu</h3>
                <p className="text-sm text-muted-foreground">
                  Reset password flow với email verification và success states
                </p>
              </div>
              <Link href="/forgot-password">
                <Button className="w-full bg-muted/20 hover:bg-accent/50 text-foreground">
                  Test Reset
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Features List */}
          <div className="bg-muted/10 rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-foreground mb-6">Tính năng đã implement & cải thiện</h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground flex items-center">
                  <Lock className="h-5 w-5 mr-2" />
                  Authentication Features
                </h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>✅ Real-time form validation</li>
                  <li>✅ Show/hide password toggle</li>
                  <li>✅ Caps Lock indicator</li>
                  <li>✅ Password strength meter</li>
                  <li>✅ Social login buttons (Google, Facebook, Apple)</li>
                  <li>✅ Remember me checkbox</li>
                  <li>✅ Forgot password flow</li>
                  <li>✅ Terms & conditions acceptance</li>
                </ul>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground flex items-center">
                  <GraduationCap className="h-5 w-5 mr-2" />
                  Design & UX Features
                </h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>✅ Responsive split-screen layout</li>
                  <li>✅ Monochrome professional design</li>
                  <li>✅ Dark/light mode support</li>
                  <li>✅ Smooth form transitions</li>
                  <li>✅ Loading states & feedback</li>
                  <li>✅ Error handling & messaging</li>
                  <li>✅ Mobile-optimized interface</li>
                  <li>✅ Consistent spacing system</li>
                  <li>🆕 Rich background patterns với learning icons</li>
                  <li>🆕 Dual-side patterns (brand + form sides)</li>
                  <li>🆕 Mobile header removal cho cleaner UI</li>
                  <li>🆕 Enhanced visual depth với varied icon sizes</li>
                  <li>🆕 Perfect mobile responsive design với vertical centering</li>
                  <li>🆕 Optimized spacing và typography cho mobile screens</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Latest Updates */}
          <div className="mt-8 p-6 bg-success/10 border border-success/20 rounded-2xl">
            <h3 className="text-lg font-semibold text-foreground mb-3">🆕 Latest Updates</h3>
            <div className="space-y-3 text-sm">
              <div className="space-y-2">
                <h4 className="font-medium text-foreground">Background Pattern Enhancements:</h4>
                <ul className="space-y-1 text-muted-foreground ml-4">
                  <li>• Rich learning icons: BookOpen, Brain, Lightbulb, Target, Award, Zap, Sparkles</li>
                  <li>• Increased opacity (0.10-0.15) cho better visibility</li>
                  <li>• Dual-side patterns: Brand side (dense) + Form side (subtle)</li>
                  <li>• Multiple icon sizes (3x3 to 8x8) tạo visual depth</li>
                  <li>• Mobile-specific pattern optimization avoiding form overlap</li>
                  <li>• Strategic icon placement để không interfere với content</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-foreground">Layout & Navigation:</h4>
                <ul className="space-y-1 text-muted-foreground ml-4">
                  <li>• ✅ Header completely removed từ auth pages</li>
                  <li>• ✅ Conditional header wrapper implementation</li>
                  <li>• ✅ Theme toggle chỉ hiển thị trên desktop brand side</li>
                  <li>• ✅ Full-screen auth experience achieved</li>
                  <li>• ✅ Clean navigation without header interference</li>
                  <li>• ✅ Perfect vertical centering trên mobile screens</li>
                  <li>• ✅ Professional spacing và padding cho all screen sizes</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Test Credentials */}
          <div className="mt-6 p-6 bg-info/10 border border-info/20 rounded-2xl">
            <h3 className="text-lg font-semibold text-foreground mb-3">Test Credentials</h3>
            <div className="space-y-2 text-sm">
              <p><strong>Email:</strong> demo@jlpt4you.com</p>
              <p><strong>Password:</strong> demo123</p>
              <p className="text-muted-foreground">
                Sử dụng thông tin này để test login flow. Các email khác sẽ hiển thị lỗi "Email hoặc mật khẩu không chính xác".
              </p>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex justify-center gap-4 mt-12">
            <Link href="/pattern-demo">
              <Button className="bg-muted/20 hover:bg-accent/50 text-foreground">
                View Pattern Demo
              </Button>
            </Link>
            <Link href="/">
              <Button variant="outline" className="bg-muted/10 hover:bg-accent/50">
                Quay về trang chủ
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
