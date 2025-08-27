'use client'

import Link from 'next/link'
import { Project } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  Users, 
  Calendar, 
  Target,
  MapPin,
  ChevronRight
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface ProjectCardProps {
  project: Project
  showActions?: boolean
}

const stageLabels = {
  idea: '構想階段',
  prototype: '原型開發', 
  beta: '測試階段',
  launched: '已上線'
}

const stageColors = {
  idea: 'bg-blue-100 text-blue-800',
  prototype: 'bg-orange-100 text-orange-800',
  beta: 'bg-purple-100 text-purple-800', 
  launched: 'bg-green-100 text-green-800'
}

export function ProjectCard({ project, showActions = true }: ProjectCardProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg line-clamp-2 mb-2">
              {project.title}
            </CardTitle>
            <div className="flex items-center gap-2 mb-3">
              <Badge 
                variant="secondary" 
                className={cn('text-xs', stageColors[project.project_stage])}
              >
                {stageLabels[project.project_stage]}
              </Badge>
              {project.is_recruiting && (
                <Badge variant="default" className="text-xs bg-green-600">
                  招募中
                </Badge>
              )}
            </div>
          </div>
        </div>
        
        {/* 創建者信息 */}
        <div className="flex items-center gap-2">
          <Avatar className="h-6 w-6">
            <AvatarImage src={project.creator?.avatar_url} />
            <AvatarFallback className="text-xs">
              {project.creator?.name?.charAt(0) || 'U'}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm text-muted-foreground">
            {project.creator?.name || '匿名用戶'}
          </span>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0 space-y-4">
        {/* 項目描述 */}
        <p className="text-sm text-muted-foreground line-clamp-3">
          {project.description}
        </p>
        
        {/* 團隊信息 */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            <span>{project.current_team_size}/{project.target_team_size} 人</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>{new Date(project.created_at).toLocaleDateString('zh-TW')}</span>
          </div>
        </div>
        
        {/* 所需職位 */}
        {project.required_roles && project.required_roles.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
              <Target className="h-3 w-3" />
              <span>所需職位</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {project.required_roles.slice(0, 3).map((role, index) => (
                <Badge key={index} variant="outline" className="text-xs px-2 py-0">
                  {role}
                </Badge>
              ))}
              {project.required_roles.length > 3 && (
                <Badge variant="outline" className="text-xs px-2 py-0">
                  +{project.required_roles.length - 3}
                </Badge>
              )}
            </div>
          </div>
        )}
        
        {/* 所需技能 */}
        {project.required_skills && project.required_skills.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs font-medium text-muted-foreground">
              所需技能
            </div>
            <div className="flex flex-wrap gap-1">
              {project.required_skills.slice(0, 4).map((skill, index) => (
                <Badge key={index} variant="secondary" className="text-xs px-2 py-0">
                  {skill}
                </Badge>
              ))}
              {project.required_skills.length > 4 && (
                <Badge variant="secondary" className="text-xs px-2 py-0">
                  +{project.required_skills.length - 4}
                </Badge>
              )}
            </div>
          </div>
        )}
        
        {/* 操作按鈕 */}
        {showActions && (
          <div className="pt-2 border-t">
            <Button asChild variant="ghost" className="w-full justify-between p-0 h-8">
              <Link href={`/projects/${project.id}`}>
                <span className="text-sm">查看詳情</span>
                <ChevronRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}