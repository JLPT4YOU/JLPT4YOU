"use client"

import { 
  GraduationCap, 
  CheckCircle, 
  Users, 
  Trophy, 
  BookOpen,
  Brain,
  Lightbulb,
  Target,
  Award,
  Zap,
  Sparkles
} from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function PatternDemoPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="app-container app-py-md border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center app-gap-sm">
            <div className="flex items-center justify-center w-8 h-8 rounded-md bg-primary">
              <GraduationCap className="h-5 w-5 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-bold text-foreground">Background Pattern Demo</h1>
          </div>
          <Link href="/auth-demo">
            <Button variant="outline">Back to Auth Demo</Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="app-container app-py-xl">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Title */}
          <div className="text-center space-y-4">
            <h1 className="text-3xl font-bold text-foreground">
              Background Pattern Showcase
            </h1>
            <p className="text-muted-foreground">
              Demonstrating the rich background patterns used in authentication pages
            </p>
          </div>

          {/* Pattern Demos */}
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Brand Side Pattern */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground">Brand Side Pattern</h2>
              <div className="relative h-96 bg-muted/20 rounded-2xl overflow-hidden border border-border">
                {/* Brand Side Pattern */}
                <div className="absolute inset-0 opacity-15">
                  {/* Top Row */}
                  <div className="absolute top-8 left-8">
                    <BookOpen className="h-6 w-6 text-foreground" />
                  </div>
                  <div className="absolute top-12 right-16">
                    <Brain className="h-5 w-5 text-foreground" />
                  </div>
                  <div className="absolute top-20 left-1/3">
                    <Lightbulb className="h-4 w-4 text-foreground" />
                  </div>
                  <div className="absolute top-6 right-1/4">
                    <Target className="h-8 w-8 text-foreground" />
                  </div>

                  {/* Middle Section */}
                  <div className="absolute top-1/3 left-12">
                    <Award className="h-7 w-7 text-foreground" />
                  </div>
                  <div className="absolute top-1/3 right-20">
                    <Zap className="h-5 w-5 text-foreground" />
                  </div>
                  <div className="absolute top-1/2 left-1/4">
                    <Sparkles className="h-6 w-6 text-foreground" />
                  </div>
                  <div className="absolute top-1/2 right-1/3">
                    <GraduationCap className="h-8 w-8 text-foreground" />
                  </div>
                  <div className="absolute top-2/5 left-2/3">
                    <Users className="h-5 w-5 text-foreground" />
                  </div>

                  {/* Bottom Section */}
                  <div className="absolute bottom-32 left-16">
                    <Trophy className="h-7 w-7 text-foreground" />
                  </div>
                  <div className="absolute bottom-24 right-12">
                    <CheckCircle className="h-4 w-4 text-foreground" />
                  </div>
                  <div className="absolute bottom-16 left-1/3">
                    <BookOpen className="h-5 w-5 text-foreground" />
                  </div>
                  <div className="absolute bottom-40 right-1/4">
                    <Brain className="h-6 w-6 text-foreground" />
                  </div>
                  <div className="absolute bottom-8 left-1/2">
                    <Lightbulb className="h-8 w-8 text-foreground" />
                  </div>

                  {/* Additional scattered icons */}
                  <div className="absolute top-1/4 right-8">
                    <Target className="h-4 w-4 text-foreground" />
                  </div>
                  <div className="absolute top-3/4 left-8">
                    <Award className="h-5 w-5 text-foreground" />
                  </div>
                  <div className="absolute bottom-1/3 right-1/2">
                    <Zap className="h-6 w-6 text-foreground" />
                  </div>
                </div>
                
                {/* Center Content */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center space-y-2 bg-background/80 backdrop-blur-sm p-6 rounded-xl border border-border/50">
                    <h3 className="font-semibold text-foreground">Brand Side</h3>
                    <p className="text-sm text-muted-foreground">Opacity: 15%</p>
                    <p className="text-sm text-muted-foreground">Dense pattern</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Form Side Pattern */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground">Form Side Pattern</h2>
              <div className="relative h-96 bg-background rounded-2xl overflow-hidden border border-border">
                {/* Form Side Pattern */}
                <div className="absolute inset-0 opacity-12">
                  <div className="absolute top-16 right-8">
                    <Sparkles className="h-4 w-4 text-foreground" />
                  </div>
                  <div className="absolute top-1/4 left-8">
                    <Brain className="h-5 w-5 text-foreground" />
                  </div>
                  <div className="absolute top-1/3 right-12">
                    <Lightbulb className="h-6 w-6 text-foreground" />
                  </div>
                  <div className="absolute top-1/2 left-12">
                    <Target className="h-4 w-4 text-foreground" />
                  </div>
                  <div className="absolute top-2/3 right-16">
                    <Award className="h-5 w-5 text-foreground" />
                  </div>
                  <div className="absolute bottom-1/4 left-16">
                    <Zap className="h-6 w-6 text-foreground" />
                  </div>
                  <div className="absolute bottom-16 right-8">
                    <BookOpen className="h-4 w-4 text-foreground" />
                  </div>
                  <div className="absolute top-3/4 left-1/3">
                    <Users className="h-5 w-5 text-foreground" />
                  </div>
                  <div className="absolute bottom-1/3 right-1/3">
                    <Trophy className="h-4 w-4 text-foreground" />
                  </div>
                  <div className="absolute top-1/6 left-1/2">
                    <CheckCircle className="h-6 w-6 text-foreground" />
                  </div>
                </div>
                
                {/* Center Content */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center space-y-2 bg-muted/20 backdrop-blur-sm p-6 rounded-xl border border-border/50">
                    <h3 className="font-semibold text-foreground">Form Side</h3>
                    <p className="text-sm text-muted-foreground">Opacity: 12%</p>
                    <p className="text-sm text-muted-foreground">Subtle pattern</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Pattern */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">Mobile Pattern</h2>
            <div className="relative h-64 bg-background rounded-2xl overflow-hidden border border-border max-w-sm mx-auto">
              {/* Mobile Pattern */}
              <div className="absolute inset-0 opacity-12">
                <div className="absolute top-8 left-4">
                  <BookOpen className="h-4 w-4 text-foreground" />
                </div>
                <div className="absolute top-16 right-6">
                  <Brain className="h-5 w-5 text-foreground" />
                </div>
                <div className="absolute top-1/4 left-1/3">
                  <Lightbulb className="h-4 w-4 text-foreground" />
                </div>
                <div className="absolute top-1/3 right-8">
                  <Target className="h-6 w-6 text-foreground" />
                </div>
                <div className="absolute top-1/2 left-6">
                  <Award className="h-5 w-5 text-foreground" />
                </div>
                <div className="absolute top-2/3 right-1/4">
                  <Zap className="h-4 w-4 text-foreground" />
                </div>
                <div className="absolute bottom-1/4 left-1/2">
                  <Sparkles className="h-5 w-5 text-foreground" />
                </div>
                <div className="absolute bottom-16 right-4">
                  <Users className="h-4 w-4 text-foreground" />
                </div>
                <div className="absolute bottom-8 left-8">
                  <Trophy className="h-6 w-6 text-foreground" />
                </div>
              </div>
              
              {/* Center Content */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center space-y-2 bg-muted/30 backdrop-blur-sm p-4 rounded-xl border border-border/50">
                  <h3 className="font-semibold text-foreground">Mobile</h3>
                  <p className="text-xs text-muted-foreground">Opacity: 12%</p>
                  <p className="text-xs text-muted-foreground">Optimized</p>
                </div>
              </div>
            </div>
          </div>

          {/* Icon Legend */}
          <div className="bg-muted/10 rounded-2xl p-6">
            <h2 className="text-xl font-semibold text-foreground mb-4">Icons Used</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="flex items-center app-gap-sm">
                <BookOpen className="h-5 w-5 text-foreground" />
                <span className="text-sm text-muted-foreground">BookOpen</span>
              </div>
              <div className="flex items-center app-gap-sm">
                <Brain className="h-5 w-5 text-foreground" />
                <span className="text-sm text-muted-foreground">Brain</span>
              </div>
              <div className="flex items-center app-gap-sm">
                <Lightbulb className="h-5 w-5 text-foreground" />
                <span className="text-sm text-muted-foreground">Lightbulb</span>
              </div>
              <div className="flex items-center app-gap-sm">
                <Target className="h-5 w-5 text-foreground" />
                <span className="text-sm text-muted-foreground">Target</span>
              </div>
              <div className="flex items-center app-gap-sm">
                <Award className="h-5 w-5 text-foreground" />
                <span className="text-sm text-muted-foreground">Award</span>
              </div>
              <div className="flex items-center app-gap-sm">
                <Zap className="h-5 w-5 text-foreground" />
                <span className="text-sm text-muted-foreground">Zap</span>
              </div>
              <div className="flex items-center app-gap-sm">
                <Sparkles className="h-5 w-5 text-foreground" />
                <span className="text-sm text-muted-foreground">Sparkles</span>
              </div>
              <div className="flex items-center app-gap-sm">
                <GraduationCap className="h-5 w-5 text-foreground" />
                <span className="text-sm text-muted-foreground">GraduationCap</span>
              </div>
              <div className="flex items-center app-gap-sm">
                <Users className="h-5 w-5 text-foreground" />
                <span className="text-sm text-muted-foreground">Users</span>
              </div>
              <div className="flex items-center app-gap-sm">
                <Trophy className="h-5 w-5 text-foreground" />
                <span className="text-sm text-muted-foreground">Trophy</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
