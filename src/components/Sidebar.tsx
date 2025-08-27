'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { 
  Home, 
  Users, 
  FolderOpen, 
  UserPlus, 
  MessageSquare, 
  ClipboardList,
  Mail,
  BookOpen,
  Plus
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
    name: '我的專案',
    href: '/my-projects',
    icon: BookOpen,
    public: false,
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
]

interface SidebarProps {
  className?: string
}

export const Sidebar = React.memo(function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname()
  const { isAuthenticated } = useAuthStore()

  // 過濾導航項目：如果未登入，只顯示公開項目
  const filteredNavigation = navigation.filter(item => 
    item.public || isAuthenticated
  )

  return (
    <div className={cn(
      "flex h-full w-64 flex-col border-r bg-background",
      className
    )}>
      <div className="flex-1 overflow-auto py-6">
        <nav className="flex flex-col space-y-1 px-4">
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
              >
                <Link href={item.href}>
                  <Icon className="h-5 w-5" />
                  {item.name}
                </Link>
              </Button>
            )
          })}
        </nav>
        
        {/* 分隔線和額外功能 */}
        {isAuthenticated && (
          <>
            <div className="my-4 mx-4 border-t" />
            <div className="px-4">
              <p className="text-sm font-medium text-muted-foreground mb-2">
                專案管理
              </p>
              <Button
                variant={pathname === '/projects/create' ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start gap-2 h-12 px-4",
                  pathname === '/projects/create' && "bg-secondary font-medium"
                )}
                asChild
              >
                <Link href="/projects/create">
                  <Plus className="h-5 w-5" />
                  創建專案
                </Link>
              </Button>
              <Button
                variant={pathname === '/projects/manage' ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start gap-2 h-12 px-4 mt-1",
                  pathname === '/projects/manage' && "bg-secondary font-medium"
                )}
                asChild
              >
                <Link href="/projects/manage">
                  <FolderOpen className="h-5 w-5" />
                  管理專案
                </Link>
              </Button>
            </div>
          </>
        )}
      </div>
      
      {/* 底部資訊 */}
      <div className="border-t p-4">
        <div className="text-xs text-muted-foreground text-center">
          <p>Spark Links v1.0</p>
          <p>創業媒合平台</p>
        </div>
      </div>
    </div>
  )
})