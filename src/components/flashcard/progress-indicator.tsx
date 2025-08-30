"use client"

import { Clock, Target, TrendingUp, Zap } from 'lucide-react'
import { FlashcardStats } from './flashcard-types'
import { cn } from '@/lib/utils'

interface ProgressIndicatorProps {
  current: number
  total: number
  stats?: FlashcardStats
  showDetailed?: boolean
  className?: string
}

export function ProgressIndicator({
  current,
  total,
  stats,
  showDetailed = false,
  className
}: ProgressIndicatorProps) {
  const progress = total > 0 ? (current / total) * 100 : 0
  const remaining = total - current

  return (
    <div className={cn("space-y-4", className)}>
      {/* Main Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between items-center text-sm">
          <span className="text-muted-foreground">
            Tiến độ: {current}/{total}
          </span>
          <span className="font-medium text-primary">
            {Math.round(progress)}%
          </span>
        </div>
        
        <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-primary/80 transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        
        <div className="text-xs text-muted-foreground text-center">
          {remaining > 0 ? `${remaining} thẻ còn lại` : 'Hoàn thành!'}
        </div>
      </div>

      {/* Detailed Stats */}
      {showDetailed && stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Accuracy */}
          <div className="bg-card border border-border rounded-lg p-3 text-center">
            <div className="flex items-center justify-center mb-1">
              <Target className="w-4 h-4 text-green-500" />
            </div>
            <div className="text-lg font-bold text-foreground">
              {Math.round(stats.averageAccuracy)}%
            </div>
            <div className="text-xs text-muted-foreground">Độ chính xác</div>
          </div>

          {/* Study Time */}
          <div className="bg-card border border-border rounded-lg p-3 text-center">
            <div className="flex items-center justify-center mb-1">
              <Clock className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-lg font-bold text-foreground">
              {Math.round(stats.totalStudyTime)}m
            </div>
            <div className="text-xs text-muted-foreground">Thời gian học</div>
          </div>

          {/* Mastered Cards */}
          <div className="bg-card border border-border rounded-lg p-3 text-center">
            <div className="flex items-center justify-center mb-1">
              <TrendingUp className="w-4 h-4 text-purple-500" />
            </div>
            <div className="text-lg font-bold text-foreground">
              {stats.masteredCards}
            </div>
            <div className="text-xs text-muted-foreground">Đã thành thạo</div>
          </div>

          {/* Streak */}
          <div className="bg-card border border-border rounded-lg p-3 text-center">
            <div className="flex items-center justify-center mb-1">
              <Zap className="w-4 h-4 text-orange-500" />
            </div>
            <div className="text-lg font-bold text-foreground">
              {stats.streak}
            </div>
            <div className="text-xs text-muted-foreground">Chuỗi ngày</div>
          </div>
        </div>
      )}

      {/* Quick Stats */}
      {!showDetailed && stats && (
        <div className="flex justify-center space-x-6 text-sm">
          <div className="text-center">
            <div className="font-medium text-foreground">
              {Math.round(stats.averageAccuracy)}%
            </div>
            <div className="text-muted-foreground">Chính xác</div>
          </div>
          <div className="text-center">
            <div className="font-medium text-foreground">
              {stats.masteredCards}
            </div>
            <div className="text-muted-foreground">Thành thạo</div>
          </div>
          <div className="text-center">
            <div className="font-medium text-foreground">
              {stats.streak}
            </div>
            <div className="text-muted-foreground">Chuỗi ngày</div>
          </div>
        </div>
      )}
    </div>
  )
}

// Circular Progress Component for compact spaces
export function CircularProgress({
  current,
  total,
  size = 60,
  strokeWidth = 4,
  className
}: {
  current: number
  total: number
  size?: number
  strokeWidth?: number
  className?: string
}) {
  const progress = total > 0 ? (current / total) * 100 : 0
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const strokeDasharray = circumference
  const strokeDashoffset = circumference - (progress / 100) * circumference

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-muted"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          className="text-primary transition-all duration-500 ease-out"
          strokeLinecap="round"
        />
      </svg>
      {/* Center text */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-medium text-foreground">
          {Math.round(progress)}%
        </span>
      </div>
    </div>
  )
}
