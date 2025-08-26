'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth'
import { PageLoading } from '@/components/ui/loading'

interface ProtectedRouteProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function ProtectedRoute({ children, fallback }: ProtectedRouteProps) {
  const router = useRouter()
  const { user, isLoading, isAuthenticated } = useAuthStore()

  useEffect(() => {
    // 只有在載入完成且用戶未認證時才重定向
    if (!isLoading && !isAuthenticated) {
      router.replace('/auth/login')
    }
  }, [isLoading, isAuthenticated, router])

  // 載入中顯示載入畫面
  if (isLoading) {
    return fallback || <PageLoading />
  }

  // 未認證則不渲染內容（等待重定向）
  if (!isAuthenticated || !user) {
    return fallback || null
  }

  // 已認證則渲染子組件
  return <>{children}</>
}

// 簡化版本 - 用於需要登入但不想顯示載入畫面的場合
export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore()
  
  if (!isAuthenticated) {
    return null
  }
  
  return <>{children}</>
}