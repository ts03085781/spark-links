'use client'

import { User } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { 
  MapPin, 
  Briefcase, 
  Mail,
  Settings,
  MessageSquare,
  Globe,
  Lock
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface TalentCardProps {
  talent: User
}

export function TalentCard({ talent }: TalentCardProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="text-center pb-3">
        <div className="mx-auto w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-3">
          {talent.avatar_url ? (
            <img 
              src={talent.avatar_url} 
              alt={talent.name}
              className="w-20 h-20 rounded-full object-cover"
            />
          ) : (
            <Mail className="h-10 w-10 text-primary" />
          )}
        </div>
        <CardTitle className="text-lg">{talent.name || '匿名用戶'}</CardTitle>
        <div className="flex items-center justify-center gap-1">
          {talent.is_public ? (
            <>
              <Globe className="h-3 w-3 text-green-600" />
              <span className="text-xs text-green-600">公開資料</span>
            </>
          ) : (
            <>
              <Lock className="h-3 w-3 text-orange-600" />
              <span className="text-xs text-orange-600">私人資料</span>
            </>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="pt-0 space-y-4">
        {/* 基本資訊 */}
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span>{talent.work_mode === 'fulltime' ? '全職' : '兼職'}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span className="truncate">
              {talent.location_preference === 'remote' 
                ? '遠端合作' 
                : talent.specific_location || '特定地點'}
            </span>
          </div>
        </div>

        <Separator />

        {/* 技能標籤 */}
        {talent.skills && talent.skills.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
              <Settings className="h-3 w-3" />
              <span>技能專長</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {talent.skills.slice(0, 6).map((skill, index) => (
                <Badge key={index} variant="secondary" className="text-xs px-2 py-0">
                  {skill}
                </Badge>
              ))}
              {talent.skills.length > 6 && (
                <Badge variant="secondary" className="text-xs px-2 py-0">
                  +{talent.skills.length - 6}
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* 經驗描述 */}
        {talent.experience_description && (
          <div className="space-y-2">
            <div className="text-xs font-medium text-muted-foreground">工作經驗</div>
            <p className="text-sm text-muted-foreground line-clamp-3">
              {talent.experience_description}
            </p>
          </div>
        )}

        {/* 尋找夥伴 */}
        {talent.partner_description && (
          <div className="space-y-2">
            <div className="text-xs font-medium text-muted-foreground">理想夥伴</div>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {talent.partner_description}
            </p>
          </div>
        )}

        {/* 聯絡資訊（如果有的話） */}
        {talent.contact_info && (
          <div className="space-y-2">
            <div className="text-xs font-medium text-muted-foreground">聯絡方式</div>
            <p className="text-sm text-muted-foreground break-all">
              {talent.contact_info}
            </p>
          </div>
        )}

        {/* 操作按鈕 */}
        <div className="pt-2 border-t">
          <Button variant="outline" size="sm" className="w-full gap-2">
            <MessageSquare className="h-4 w-4" />
            聯絡合作
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}