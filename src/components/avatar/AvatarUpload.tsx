'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import imageCompression from 'browser-image-compression'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { 
  Upload, 
  X, 
  Camera,
  Loader2,
  User as UserIcon
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/browser'
import { useAuthStore } from '@/stores/auth'
import { toast } from 'sonner'

interface AvatarUploadProps {
  currentAvatar?: string | null
  userName?: string
  onAvatarChange?: (avatarUrl: string | null) => void
  className?: string
}

export function AvatarUpload({ 
  currentAvatar, 
  userName = '', 
  onAvatarChange,
  className 
}: AvatarUploadProps) {
  const { user } = useAuthStore()
  const [isUploading, setIsUploading] = useState(false)
  const [showRemoveDialog, setShowRemoveDialog] = useState(false)
  const [dragActive, setDragActive] = useState(false)

  const compressImage = async (file: File): Promise<File> => {
    const options = {
      maxSizeMB: 1,
      maxWidthOrHeight: 400,
      useWebWorker: true,
      fileType: 'image/webp',
    }

    try {
      return await imageCompression(file, options)
    } catch (error) {
      console.error('圖片壓縮失敗:', error)
      return file
    }
  }

  const uploadAvatar = async (file: File) => {
    if (!user) {
      toast.error('請先登入')
      return
    }

    setIsUploading(true)
    
    try {
      // 1. 壓縮圖片
      const compressedFile = await compressImage(file)
      
      // 2. 生成檔案名稱
      const fileExt = 'webp' // 統一使用 webp 格式
      const fileName = `${user.id}/avatar.${fileExt}`
      
      // 3. 上傳到 Supabase Storage
      const supabase = createClient()
      
      
      // 上傳新頭像
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, compressedFile, {
          upsert: true,
        })

      if (uploadError) {
        console.error('上傳頭像失敗:', uploadError)
        toast.error('上傳失敗', {
          description: '請檢查網路連線或稍後再試',
        })
        return
      }

      // 4. 獲取公開 URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName)

      // 5. 更新數據庫中的 avatar_url
      const { error: updateError } = await supabase
        .from('users')
        .update({ avatar_url: publicUrl } as any)
        .eq('id', user.id)

      if (updateError) {
        console.error('更新數據庫失敗:', updateError)
        toast.error('更新失敗', {
          description: '頭像上傳成功但更新個人資料失敗',
        })
        return
      }

      // 6. 通知父組件更新
      onAvatarChange?.(publicUrl)
      
      toast.success('頭像更新成功！')
    } catch (error) {
      console.error('上傳頭像時發生錯誤:', error)
      toast.error('系統錯誤', {
        description: '發生未預期的錯誤，請稍後再試',
      })
    } finally {
      setIsUploading(false)
    }
  }

  const removeAvatar = async () => {
    if (!user) return

    setIsUploading(true)
    
    try {
      const supabase = createClient()
      
      // 1. 從 Storage 刪除檔案
      const fileName = `${user.id}/avatar.webp`
      await supabase.storage
        .from('avatars')
        .remove([fileName])
      
      // 2. 清除數據庫中的 avatar_url
      const { error } = await supabase
        .from('users')
        .update({ avatar_url: null } as any)
        .eq('id', user.id)

      if (error) {
        console.error('移除頭像失敗:', error)
        toast.error('移除失敗', {
          description: '請稍後再試',
        })
        return
      }

      onAvatarChange?.(null)
      setShowRemoveDialog(false)
      toast.success('頭像已移除')
    } catch (error) {
      console.error('移除頭像時發生錯誤:', error)
      toast.error('系統錯誤')
    } finally {
      setIsUploading(false)
    }
  }

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (file) {
      uploadAvatar(file)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024, // 5MB
    onDragEnter: () => setDragActive(true),
    onDragLeave: () => setDragActive(false),
    onError: (error) => {
      toast.error('檔案錯誤', {
        description: error.message,
      })
    }
  })

  return (
    <>
      <Card className={cn("relative", className)}>
        <CardContent className="p-6 text-center space-y-4">
          {/* 頭像顯示區域 */}
          <div className="relative inline-block">
            <Avatar className="w-24 h-24 mx-auto">
              <AvatarImage src={currentAvatar || undefined} alt={userName} />
              <AvatarFallback className="text-2xl">
                {userName.charAt(0) || <UserIcon className="w-8 h-8" />}
              </AvatarFallback>
            </Avatar>
            
            {isUploading && (
              <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-white animate-spin" />
              </div>
            )}
          </div>

          {/* 上傳區域 */}
          <div
            {...getRootProps()}
            className={cn(
              "border-2 border-dashed rounded-lg p-4 cursor-pointer transition-colors",
              isDragActive || dragActive
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50",
              isUploading && "pointer-events-none opacity-50"
            )}
          >
            <input id="upload-input" {...getInputProps()} />
            <div className="space-y-2">
              <Camera className="w-8 h-8 mx-auto text-muted-foreground" />
              <div className="text-sm">
                {isDragActive ? (
                  <p className="text-primary">放開以上傳頭像</p>
                ) : (
                  <>
                    <p className="font-medium">拖放圖片到此處或點擊選擇</p>
                    <p className="text-muted-foreground">
                      支援 JPG, PNG, WebP 格式，最大 5MB
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* 操作按鈕 */}
          <div className="flex gap-2 justify-center">
            <Button 
              type="button"
              size="sm" 
              onClick={() => (document.querySelector('#upload-input') as HTMLInputElement)?.click()}
              disabled={isUploading}
            >
              <Upload className="w-4 h-4 mr-2" />
              選擇圖片
            </Button>
            
            {currentAvatar && (
              <Button 
                type="button"
                variant="outline" 
                size="sm"
                onClick={() => setShowRemoveDialog(true)}
                disabled={isUploading}
              >
                <X className="w-4 h-4 mr-2" />
                移除頭像
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 移除確認對話框 */}
      <Dialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>移除頭像</DialogTitle>
            <DialogDescription>
              你確定要移除當前的頭像嗎？這個操作無法復原。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowRemoveDialog(false)}
              disabled={isUploading}
            >
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={removeAvatar}
              disabled={isUploading}
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  移除中...
                </>
              ) : (
                '確認移除'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}