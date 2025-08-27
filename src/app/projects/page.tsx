'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/stores/auth'
import { createClient } from '@/lib/supabase/browser'
import { Project, ProjectFilters } from '@/types'
import { ProjectCard } from '@/components/projects/ProjectCard'
import { ProjectFiltersComponent } from '@/components/projects/ProjectFilters'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PageLoading } from '@/components/ui/loading'
import { Plus, Search } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

export default function ProjectsPage() {
  const { isAuthenticated } = useAuthStore()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [searchKeyword, setSearchKeyword] = useState('')
  const [filters, setFilters] = useState<ProjectFilters>({})

  const loadProjects = async () => {
    try {
      const supabase = createClient()
      let query = supabase
        .from('projects')
        .select(`
          *,
          creator:users!creator_id(
            id,
            name,
            avatar_url
          )
        `)
        .eq('is_public', true)
        .eq('is_recruiting', true)
        .order('created_at', { ascending: false })

      // 應用關鍵字篩選
      if (searchKeyword.trim()) {
        query = query.or(`title.ilike.%${searchKeyword}%,description.ilike.%${searchKeyword}%`)
      }

      // 應用技能篩選
      if (filters.skills && filters.skills.length > 0) {
        query = query.overlaps('required_skills', filters.skills)
      }

      // 應用職位篩選
      if (filters.required_roles && filters.required_roles.length > 0) {
        query = query.overlaps('required_roles', filters.required_roles)
      }

      // 應用階段篩選
      if (filters.project_stage && filters.project_stage.length > 0) {
        query = query.in('project_stage', filters.project_stage)
      }

      const { data, error } = await query

      if (error) {
        console.error('載入專案失敗:', error)
        toast.error('載入專案失敗', {
          description: '請檢查網路連線或稍後再試',
        })
        return
      }

      setProjects(data || [])
    } catch (error) {
      console.error('載入專案時發生錯誤:', error)
      toast.error('系統錯誤', {
        description: '發生未預期的錯誤，請稍後再試',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProjects()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchKeyword, filters])

  const handleSearch = (keyword: string) => {
    setSearchKeyword(keyword)
  }

  const handleFiltersChange = (newFilters: ProjectFilters) => {
    setFilters(newFilters)
  }

  if (loading) {
    return <PageLoading />
  }

  return (
    <div className="space-y-6">
      {/* 頁面標題和操作 */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">創業專案</h1>
          <p className="text-muted-foreground">瀏覽所有公開的創業專案，找到適合的創業機會</p>
        </div>
        {isAuthenticated && (
          <Button asChild>
            <Link href="/projects/create">
              <Plus className="h-4 w-4 mr-2" />
              創建專案
            </Link>
          </Button>
        )}
      </div>

      {/* 搜尋和篩選 */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="搜尋專案名稱或描述..."
              value={searchKeyword}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
        <ProjectFiltersComponent
          filters={filters}
          onFiltersChange={handleFiltersChange}
        />
      </div>

      {/* 專案列表 */}
      <div className="space-y-4">
        {projects.length === 0 ? (
          <div className="bg-muted/50 p-8 rounded-lg text-center">
            <p className="text-muted-foreground">
              {searchKeyword || Object.keys(filters).length > 0
                ? '沒有符合條件的專案，試試調整搜尋條件'
                : '目前還沒有公開的創業專案'}
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}