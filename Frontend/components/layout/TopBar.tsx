'use client'

import { User, Menu } from 'lucide-react'
import { NotificationDropdown } from '@/components/notifications/NotificationDropdown'
import { Button } from '@/components/ui/Button'

interface TopBarProps {
  onMenuClick?: () => void
}

export function TopBar({ onMenuClick }: TopBarProps) {
  return (
    <header className="flex h-14 sm:h-16 items-center justify-between border-b bg-card px-4 sm:px-6">
      <div className="flex items-center gap-2 sm:gap-4">
        <Button
          variant="ghost"
          size="sm"
          className="lg:hidden"
          onClick={onMenuClick}
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <h1 className="text-lg sm:text-xl font-semibold">PharmAnalytics</h1>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        <NotificationDropdown />

        <div className="flex items-center gap-2">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium">John Smith</p>
            <p className="text-xs text-muted-foreground">HealthCare Pharmacy</p>
          </div>
          <button className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
            <User className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
        </div>
      </div>
    </header>
  )
}
