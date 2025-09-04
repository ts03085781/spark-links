'use client'

import { useState } from 'react'
import { ProjectFilters, Project } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from '@/components/ui/select'
import { Filter, X, Plus } from 'lucide-react'

interface ProjectFiltersComponentProps {
  filters: ProjectFilters
  onFiltersChange: (filters: ProjectFilters) => void
}

const stageOptions = [
  { value: 'idea', label: '構想階段' },
  { value: 'prototype', label: '原型開發' },
  { value: 'beta', label: '測試階段' },
  { value: 'launched', label: '已上線' },
]

export function ProjectFiltersComponent({ 
  filters, 
  onFiltersChange 
}: ProjectFiltersComponentProps) {
  const [newSkill, setNewSkill] = useState('')
  const [newRole, setNewRole] = useState('')

  const addSkill = () => {
    const trimmedSkill = newSkill.trim()
    if (!trimmedSkill) return
    
    const currentSkills = filters.skills || []
    if (!currentSkills.includes(trimmedSkill)) {
      onFiltersChange({
        ...filters,
        skills: [...currentSkills, trimmedSkill]
      })
    }
    setNewSkill('')
  }

  const removeSkill = (skillToRemove: string) => {
    const currentSkills = filters.skills || []
    onFiltersChange({
      ...filters,
      skills: currentSkills.filter(skill => skill !== skillToRemove)
    })
  }

  const addRole = () => {
    const trimmedRole = newRole.trim()
    if (!trimmedRole) return
    
    const currentRoles = filters.required_roles || []
    if (!currentRoles.includes(trimmedRole)) {
      onFiltersChange({
        ...filters,
        required_roles: [...currentRoles, trimmedRole]
      })
    }
    setNewRole('')
  }

  const removeRole = (roleToRemove: string) => {
    const currentRoles = filters.required_roles || []
    onFiltersChange({
      ...filters,
      required_roles: currentRoles.filter(role => role !== roleToRemove)
    })
  }

  const toggleStage = (stage: string) => {
    const currentStages = filters.project_stage || []
    const isSelected = currentStages.includes(stage as Project['project_stage'])
    
    if (isSelected) {
      onFiltersChange({
        ...filters,
        project_stage: currentStages.filter(s => s !== stage)
      })
    } else {
      onFiltersChange({
        ...filters,
        project_stage: [...currentStages, stage as Project['project_stage']]
      })
    }
  }

  const clearAllFilters = () => {
    onFiltersChange({})
  }

  const hasActiveFilters = Object.keys(filters).some(key => {
    const value = filters[key as keyof ProjectFilters]
    return Array.isArray(value) ? value.length > 0 : !!value
  })

  return (
    <div className="flex items-center gap-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="h-4 w-4" />
            篩選
            {hasActiveFilters && (
              <Badge variant="secondary" className="ml-1 px-1 min-w-[20px] h-5">
                {(filters.skills?.length || 0) + 
                 (filters.required_roles?.length || 0) + 
                 (filters.project_stage?.length || 0)}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80" align="end">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">篩選條件</h4>
              {hasActiveFilters && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={clearAllFilters}
                  className="h-6 px-2 text-xs"
                >
                  清除全部
                </Button>
              )}
            </div>

            {/* 專案階段篩選 */}
            <div className="space-y-2">
              <label className="text-sm font-medium">專案階段</label>
              <div className="flex flex-wrap gap-2">
                {stageOptions.map((option) => {
                  const isSelected = filters.project_stage?.includes(option.value as Project['project_stage']) || false
                  return (
                    <Badge
                      key={option.value}
                      variant={isSelected ? "default" : "outline"}
                      className="cursor-pointer hover:bg-primary/80"
                      onClick={() => toggleStage(option.value)}
                    >
                      {option.label}
                    </Badge>
                  )
                })}
              </div>
            </div>

            {/* 技能篩選 */}
            <div className="space-y-2">
              <label className="text-sm font-medium">所需技能</label>
              <div className="flex gap-2">
                <Input
                  placeholder="添加技能"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addSkill()
                    }
                  }}
                  className="h-8"
                />
                <Button
                  type="button"
                  onClick={addSkill}
                  variant="outline"
                  size="sm"
                  className="h-8 px-2"
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
              {filters.skills && filters.skills.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {filters.skills.map((skill, index) => (
                    <Badge key={index} variant="secondary" className="gap-1">
                      {skill}
                      <button
                        type="button"
                        onClick={() => removeSkill(skill)}
                        className="hover:bg-muted-foreground/20 rounded-full"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* 職位篩選 */}
            <div className="space-y-2">
              <label className="text-sm font-medium">所需職位</label>
              <div className="flex gap-2">
                <Input
                  placeholder="添加職位"
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addRole()
                    }
                  }}
                  className="h-8"
                />
                <Button
                  type="button"
                  onClick={addRole}
                  variant="outline"
                  size="sm"
                  className="h-8 px-2"
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
              {filters.required_roles && filters.required_roles.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {filters.required_roles.map((role, index) => (
                    <Badge key={index} variant="default" className="gap-1">
                      {role}
                      <button
                        type="button"
                        onClick={() => removeRole(role)}
                        className="hover:bg-primary-foreground/20 rounded-full"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}