"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Home, GraduationCap } from "lucide-react"
import { useEffect } from "react"

export default function NotFound() {
  useEffect(() => {
    // Ensure fullscreen by removing any body/html margins
    document.body.style.margin = '0'
    document.body.style.padding = '0'
    document.documentElement.style.margin = '0'
    document.documentElement.style.padding = '0'

    // Hide header by adding a class to body
    document.body.classList.add('hide-header')

    return () => {
      // Clean up when component unmounts
      document.body.style.margin = ''
      document.body.style.padding = ''
      document.documentElement.style.margin = ''
      document.documentElement.style.padding = ''
      document.body.classList.remove('hide-header')
    }
  }, [])

  return (
    <div className="fixed inset-0 bg-background flex items-center justify-center px-4 py-4">
      {/* Logo in top-left corner */}
      <div className="absolute top-2 left-2 sm:top-4 sm:left-4 flex items-center space-x-2 sm:space-x-3 z-10">
        <div className="p-1.5 sm:p-2 rounded-lg bg-primary">
          <GraduationCap className="h-4 w-4 sm:h-6 sm:w-6 text-primary-foreground" />
        </div>
        <h1 className="text-lg sm:text-2xl font-bold text-foreground">
          JLPT4YOU
        </h1>
      </div>

      {/* Sparkling Stars Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Large stars */}
        <div className="absolute top-[10%] left-[15%] text-2xl opacity-60 animate-pulse">⭐</div>
        <div className="absolute top-[20%] right-[20%] text-xl opacity-40 animate-bounce delay-300">✨</div>
        <div className="absolute top-[35%] left-[8%] text-lg opacity-50 animate-pulse delay-700">💫</div>
        <div className="absolute top-[45%] right-[12%] text-2xl opacity-30 animate-bounce delay-1000">⭐</div>
        <div className="absolute top-[60%] left-[25%] text-xl opacity-45 animate-pulse delay-500">✨</div>
        <div className="absolute top-[75%] right-[30%] text-lg opacity-35 animate-bounce delay-1200">💫</div>
        <div className="absolute bottom-[20%] left-[10%] text-2xl opacity-50 animate-pulse delay-200">⭐</div>
        <div className="absolute bottom-[30%] right-[15%] text-xl opacity-40 animate-bounce delay-800">✨</div>

        {/* Medium stars */}
        <div className="absolute top-[25%] left-[40%] text-base opacity-30 animate-pulse delay-400">⭐</div>
        <div className="absolute top-[50%] right-[40%] text-sm opacity-25 animate-bounce delay-600">✨</div>
        <div className="absolute top-[70%] left-[45%] text-base opacity-35 animate-pulse delay-900">💫</div>
        <div className="absolute bottom-[40%] right-[45%] text-sm opacity-20 animate-bounce delay-1100">⭐</div>

        {/* Small stars */}
        <div className="absolute top-[15%] left-[60%] text-xs opacity-20 animate-pulse delay-100">✨</div>
        <div className="absolute top-[40%] right-[60%] text-xs opacity-15 animate-bounce delay-1300">💫</div>
        <div className="absolute top-[65%] left-[70%] text-xs opacity-25 animate-pulse delay-600">⭐</div>
        <div className="absolute bottom-[25%] right-[65%] text-xs opacity-20 animate-bounce delay-400">✨</div>
        <div className="absolute bottom-[50%] left-[80%] text-xs opacity-15 animate-pulse delay-800">💫</div>

        {/* Extra sparkles for mobile */}
        <div className="absolute top-[30%] left-[5%] text-xs opacity-25 animate-bounce delay-200 sm:hidden">✨</div>
        <div className="absolute top-[55%] right-[5%] text-xs opacity-20 animate-pulse delay-1000 sm:hidden">⭐</div>
        <div className="absolute bottom-[35%] left-[3%] text-xs opacity-15 animate-bounce delay-700 sm:hidden">💫</div>
      </div>

      <div className="relative text-center max-w-2xl mx-auto w-full">
        {/* Large 404 */}
        <div className="mb-4 sm:mb-8">
          <h1 className="text-[6rem] xs:text-[8rem] sm:text-[12rem] md:text-[16rem] lg:text-[20rem] font-black text-[#212121]/10 dark:text-[#E0E0E0]/10 leading-none select-none">
            404
          </h1>
        </div>

        {/* Content */}
        <div className="relative -mt-16 xs:-mt-20 sm:-mt-32 md:-mt-40 lg:-mt-48">
          {/* Title */}
          <h2 className="text-xl xs:text-2xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-[#212121] dark:text-[#E0E0E0] mb-3 sm:mb-4 px-2">
            Có vẻ bạn đi nhấm hương thì phải! 🍃
          </h2>

          {/* Description */}
          <p className="text-base xs:text-lg sm:text-lg md:text-xl text-[#666666] dark:text-white/60 mb-6 sm:mb-8 leading-relaxed px-2">
            Quay lại và cùng JLPT4YOU chinh phục N1 thôi nào! 📚✨
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center px-2">
            <Link href="/home">
              <Button
                size="lg"
                className="bg-primary text-primary-foreground hover-primary px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold"
              >
                <Home className="mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5" />
                Về trang chủ
              </Button>
            </Link>
          </div>
        </div>
      </div>

    </div>
  )
}
