'use client'

import React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { User, LogOut, FolderOpen } from 'lucide-react'
import { useAuthStore } from '@/stores/auth'

export const Header = React.memo(function Header() {
  const router = useRouter()
  const { user, isAuthenticated, logout } = useAuthStore()

  // 調試信息
  console.log('Header render - isAuthenticated:', isAuthenticated, 'user:', user?.name)

  const handleLogout = async () => {
    await logout()
    router.push('/')
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        {/* 左側：專案名稱 */}
        <Link 
          href="/" 
          className="flex items-center space-x-2 font-bold text-xl text-primary hover:text-primary/80 transition-colors"
        >
          Spark Links
        </Link>

        {/* 右側：按鈕區域 */}
        <div className="flex items-center space-x-4">
          {isAuthenticated && user ? (
            <>
              {/* 已登入狀態 */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user.avatar_url || undefined} alt={user.name} />
                      <AvatarFallback>
                        {user.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      <p className="font-medium">{user.name}</p>
                      <p className="w-[200px] truncate text-sm text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="flex items-center">
                      <User className="mr-2 h-4 w-4" />
                      個人資料設定
                    </Link>
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem asChild>
                    <Link href="/projects/manage" className="flex items-center">
                      <FolderOpen className="mr-2 h-4 w-4" />
                      創業專案設定
                    </Link>
                  </DropdownMenuItem>
                  
                  <DropdownMenuSeparator />
                  
                  <DropdownMenuItem
                    className="text-red-600 focus:text-red-600 cursor-pointer"
                    onClick={handleLogout}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    登出
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              {/* 未登入狀態 */}
              <Button variant="ghost" asChild>
                <Link href="/auth/login">登入</Link>
              </Button>
              <Button asChild>
                <Link href="/auth/register">註冊</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  )
})