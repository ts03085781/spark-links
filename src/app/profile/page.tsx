'use client'

import { useState } from 'react'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { useAuthStore } from '@/stores/auth'
import { ProfileEditForm } from '@/components/profile/ProfileEditForm'
import { createClient } from '@/lib/supabase/browser'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  User, 
  Mail, 
  MapPin, 
  Briefcase, 
  Users, 
  Settings,
  Edit3,
  Globe,
  Lock
} from 'lucide-react'
import { toast } from 'sonner'

export default function ProfilePage() {
  const { user, setUser } = useAuthStore()
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSave = async (data: {
    name: string
    contact_info?: string
    skills: string[]
    experience_description: string
    work_mode: 'fulltime' | 'parttime'
    partner_description: string
    location_preference: 'remote' | 'specific_location'
    specific_location?: string
    is_public: boolean
  }) => {
    if (!user) return

    setIsLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('users')
        .update({
          name: data.name,
          contact_info: data.contact_info || null,
          skills: data.skills,
          experience_description: data.experience_description,
          work_mode: data.work_mode,
          partner_description: data.partner_description,
          location_preference: data.location_preference,
          specific_location: data.specific_location || null,
          is_public: data.is_public,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)

      if (error) {
        console.error('更新個人資料失敗:', error)
        toast.error('更新失敗', {
          description: '請檢查網路連線或稍後再試',
        })
        return
      }

      // 重新獲取用戶資料並更新本地狀態
      const { data: updatedUser, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

      if (!fetchError && updatedUser) {
        setUser(updatedUser)
        setIsEditing(false)
        toast.success('更新成功！', {
          description: <span className="text-gray-600">您的個人資料已成功更新</span>,
        })
      } else {
        toast.error('更新後重新載入失敗', {
          description: <span className="text-gray-600">資料已更新但頁面顯示可能有延遲</span>,
        })
      }
    } catch (error) {
      console.error('更新個人資料時發生錯誤:', error)
      toast.error('系統錯誤', {
        description: <span className="text-gray-600">發生未預期的錯誤，請稍後再試</span>,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
  }

  if (!user) {
    return <ProtectedRoute>載入中...</ProtectedRoute>
  }

  if (isEditing) {
    return (
      <ProtectedRoute>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">編輯個人資料</h1>
            <p className="text-muted-foreground">更新您的個人資訊和偏好設定</p>
          </div>
          
          <ProfileEditForm
            user={user}
            onSave={handleSave}
            onCancel={handleCancel}
            isLoading={isLoading}
          />
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        {/* 頁面標題 */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">個人資料</h1>
            <p className="text-muted-foreground">管理你的個人資料和技能信息</p>
          </div>
          <div className="flex gap-2">
            {/* <Button 
              onClick={() => {
                toast.info('測試通知', {
                  description: <span className="text-gray-600">Toast 通知系統運作正常！</span>,
                })
              }}
              variant="outline"
              size="sm"
            >
              測試通知
            </Button> */}
            <Button 
              onClick={() => setIsEditing(!isEditing)}
              variant={isEditing ? "outline" : "default"}
            >
              <Edit3 className="h-4 w-4 mr-2" />
              {isEditing ? '取消編輯' : '編輯資料'}
            </Button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* 左側 - 基本資料卡 */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader className="text-center">
                <div className="mx-auto w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  {user.avatar_url ? (
                    <img 
                      src={user.avatar_url} 
                      alt={user.name}
                      className="w-24 h-24 rounded-full object-cover"
                    />
                  ) : (
                    <User className="h-12 w-12 text-primary" />
                  )}
                </div>
                <CardTitle className="text-xl">{user.name || '尚未設定姓名'}</CardTitle>
                <CardDescription className="flex items-center justify-center gap-1">
                  <Mail className="h-4 w-4" />
                  {user.email}
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <div className="flex items-center justify-center gap-2">
                  {user.is_public ? (
                    <>
                      <Globe className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-green-600">公開資料</span>
                    </>
                  ) : (
                    <>
                      <Lock className="h-4 w-4 text-orange-600" />
                      <span className="text-sm text-orange-600">私人資料</span>
                    </>
                  )}
                </div>
                
                <Separator />
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                    <span>{user.work_mode === 'fulltime' ? '全職' : '兼職'}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {user.location_preference === 'remote' 
                        ? '遠端工作' 
                        : user.specific_location || '特定地點'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 右側 - 詳細資料 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 技能標籤 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  技能專長
                </CardTitle>
                <CardDescription>
                  展示你的技能和專業領域
                </CardDescription>
              </CardHeader>
              <CardContent>
                {user.skills && user.skills.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {user.skills.map((skill, index) => (
                      <Badge key={index} variant="secondary">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">尚未設定技能標籤</p>
                )}
              </CardContent>
            </Card>

            {/* 經驗描述 */}
            <Card>
              <CardHeader>
                <CardTitle>工作經驗</CardTitle>
                <CardDescription>
                  描述你的專業背景和工作經驗
                </CardDescription>
              </CardHeader>
              <CardContent>
                {user.experience_description ? (
                  <p className="text-sm leading-relaxed">{user.experience_description}</p>
                ) : (
                  <p className="text-muted-foreground">尚未填寫工作經驗</p>
                )}
              </CardContent>
            </Card>

            {/* 尋找夥伴 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  理想夥伴
                </CardTitle>
                <CardDescription>
                  描述你想找的創業夥伴類型
                </CardDescription>
              </CardHeader>
              <CardContent>
                {user.partner_description ? (
                  <p className="text-sm leading-relaxed">{user.partner_description}</p>
                ) : (
                  <p className="text-muted-foreground">尚未描述理想夥伴</p>
                )}
              </CardContent>
            </Card>

            {/* 聯絡資訊 */}
            <Card>
              <CardHeader>
                <CardTitle>聯絡資訊</CardTitle>
                <CardDescription>
                  其他聯絡方式（選填）
                </CardDescription>
              </CardHeader>
              <CardContent>
                {user.contact_info ? (
                  <p className="text-sm">{user.contact_info}</p>
                ) : (
                  <p className="text-muted-foreground">尚未提供額外聯絡資訊</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}