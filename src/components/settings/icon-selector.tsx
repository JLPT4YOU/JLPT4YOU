/**
 * Icon Selector Component
 * Allows users to select icons from lucide-react to use as avatar
 */

"use client"

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Search, X } from 'lucide-react'
import { useTranslations } from '@/hooks/use-translations'

// Import popular icons from lucide-react
import {
  User, UserCircle, UserCheck, UserX, Users,
  Heart, Star, Crown, Trophy, Award,
  Smile, Laugh, Frown, Meh, Angry,
  Cat, Dog, Bird, Fish, Rabbit,
  Sun, Moon, Cloud, Zap,
  Book, Bookmark, BookOpen, GraduationCap, Brain,
  Music, Headphones, Mic, Guitar, Piano,
  Camera, Image, Palette, Brush, Pen,
  Coffee, Pizza, Apple, Cherry, Cake,
  Car, Plane, Ship, Bike, Train,
  Home, Building, Castle, Tent, TreePine,
  Gamepad2, Dice1, Dice2, Dice3, Target,
  Shield, Sword, Gem, Key, Lock
} from "lucide-react"

// Icon mapping with names and components
export const AVAILABLE_ICONS = {
  // User icons
  User, UserCircle, UserCheck, UserX, Users,
  // Emotions & achievements
  Heart, Star, Crown, Trophy, Award,
  // Faces
  Smile, Laugh, Frown, Meh, Angry,
  // Animals
  Cat, Dog, Bird, Fish, Rabbit,
  // Nature
  Sun, Moon, Cloud, Zap,
  // Education
  Book, Bookmark, BookOpen, GraduationCap, Brain,
  // Music
  Music, Headphones, Mic, Guitar, Piano,
  // Art
  Camera, Image, Palette, Brush, Pen,
  // Food
  Coffee, Pizza, Apple, Cherry, Cake,
  // Transport
  Car, Plane, Ship, Bike, Train,
  // Places
  Home, Building, Castle, Tent, TreePine,
  // Games
  Gamepad2, Dice1, Dice2, Dice3, Target,
  // Fantasy
  Shield, Sword, Gem, Key, Lock
} as const

export type IconName = keyof typeof AVAILABLE_ICONS

interface IconSelectorProps {
  selectedIcon?: string
  onIconSelect: (iconName: string) => void
  className?: string
}

export function IconSelector({ selectedIcon, onIconSelect, className }: IconSelectorProps) {
  const { t } = useTranslations()
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  // Filter icons based on search term
  const filteredIcons = Object.keys(AVAILABLE_ICONS).filter(iconName =>
    iconName.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Get current selected icon component
  const SelectedIconComponent = selectedIcon && selectedIcon in AVAILABLE_ICONS
    ? AVAILABLE_ICONS[selectedIcon as IconName]
    : User

  const handleIconSelect = (iconName: string) => {
    onIconSelect(iconName)
    setIsOpen(false)
    setSearchTerm('')
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-16 h-16 rounded-full p-0 border-2 border-dashed border-muted-foreground/30 hover:border-primary/50 transition-colors",
            className
          )}
        >
          <SelectedIconComponent className="w-8 h-8 text-muted-foreground" />
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>
            {t ? t('pages.settings.iconSelector.title') : 'Chọn Icon Avatar'}
          </DialogTitle>
          <DialogDescription>
            {t ? t('pages.settings.iconSelector.description') : 'Chọn một icon để làm avatar cho tài khoản của bạn'}
          </DialogDescription>
        </DialogHeader>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={t ? t('pages.settings.iconSelector.search') : 'Tìm kiếm icon...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-10"
          />
          {searchTerm && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8"
              onClick={() => setSearchTerm('')}
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Icon Grid */}
        <ScrollArea className="h-96">
          <div className="grid grid-cols-8 gap-2 p-2">
            {filteredIcons.map((iconName) => {
              const IconComponent = AVAILABLE_ICONS[iconName as IconName]
              const isSelected = selectedIcon === iconName
              
              return (
                <Button
                  key={iconName}
                  variant={isSelected ? "default" : "ghost"}
                  className={cn(
                    "w-12 h-12 p-0 rounded-lg transition-all duration-200",
                    isSelected && "ring-2 ring-primary ring-offset-2"
                  )}
                  onClick={() => handleIconSelect(iconName)}
                  title={iconName}
                >
                  <IconComponent className="w-6 h-6" />
                </Button>
              )
            })}
          </div>

          {filteredIcons.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              {t ? t('pages.settings.iconSelector.noResults') : 'Không tìm thấy icon nào phù hợp'}
            </div>
          )}
        </ScrollArea>

        {/* Selected icon info */}
        {selectedIcon && (
          <div className="flex items-center gap-2 p-3 bg-muted/20 rounded-lg">
            <SelectedIconComponent className="w-5 h-5" />
            <span className="text-sm font-medium">
              {t ? t('pages.settings.iconSelector.selected') : 'Đã chọn'}: {selectedIcon}
            </span>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

// Helper function to get icon component by name
export function getIconComponent(iconName?: string) {
  if (!iconName || !(iconName in AVAILABLE_ICONS)) {
    return User
  }
  return AVAILABLE_ICONS[iconName as IconName]
}
