'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { 
  Home, 
  Users, 
  FolderOpen, 
  UserPlus, 
  MessageSquare, 
  ClipboardList,
  BookOpen,
  User,
  Menu
} from 'lucide-react'
import { useAuthStore } from '@/stores/auth'

const navigation = [
  {
    name: '首頁',
    href: '/',
    icon: Home,
    public: true,
  },
  {
    name: '創業專案',
    href: '/projects',
    icon: FolderOpen,
    public: true,
  },
  {
    name: '創業夥伴',
    href: '/talents',
    icon: Users,
    public: true,
  },
  {
    name: '申請狀態',
    href: '/applications',
    icon: ClipboardList,
    public: false,
  },
  {
    name: '邀請狀態',
    href: '/invitations',
    icon: UserPlus,
    public: false,
  },
  {
    name: '私訊',
    href: '/messages',
    icon: MessageSquare,
    public: false,
  },
  {
    name: '個人資料',
    href: '/profile',
    icon: User,
    public: false,
  },
  {
    name: '我參與的專案',
    href: '/my-projects',
    icon: BookOpen,
    public: false,
  },
]

interface MobileSidebarProps {
  className?: string
}

export const MobileSidebar = React.memo(function MobileSidebar({ className }: MobileSidebarProps) {
  const pathname = usePathname()
  const { isAuthenticated } = useAuthStore()
  const [open, setOpen] = React.useState(false)

  // 過濾導航項目：如果未登入，只顯示公開項目
  const filteredNavigation = navigation.filter(item => 
    item.public || isAuthenticated
  )

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          className={cn(
            "mr-2 px-0 text-base hover:bg-transparent focus-visible:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 md:hidden",
            className
          )}
        >
          <Menu className="h-6 w-6" />
          <span className="sr-only">切換選單</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[300px] p-0">
        <SheetHeader className="p-6 text-left">
          <SheetTitle>選單導航</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col h-full">
          <div className="flex-1 overflow-auto px-4">
            <nav className="flex flex-col space-y-1">
              {filteredNavigation.map((item) => {
                const isActive = pathname === item.href
                const Icon = item.icon
                
                return (
                  <Button
                    key={item.href}
                    variant={isActive ? "secondary" : "ghost"}
                    className={cn(
                      "w-full justify-start gap-2 h-12 px-4",
                      isActive && "bg-secondary font-medium"
                    )}
                    asChild
                    onClick={() => setOpen(false)}
                  >
                    <Link href={item.href}>
                      <Icon className="h-5 w-5" />
                      {item.name}
                    </Link>
                  </Button>
                )
              })}
            </nav>
          </div>
          
          {/* 底部資訊 */}
          <div className="border-t p-4 mt-auto">
            <div className="text-xs text-muted-foreground text-center">
              <p>Spark Links v1.0</p>
              <p>創業媒合平台</p>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
})