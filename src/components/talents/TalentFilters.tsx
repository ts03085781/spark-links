'use client'

import { useState } from 'react'
import { UserFilters, User } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Filter, X, Plus } from 'lucide-react'

interface TalentFiltersProps {
  filters: UserFilters
  onFiltersChange: (filters: UserFilters) => void
}

const workModeOptions = [
  { value: 'fulltime', label: '全職' },
  { value: 'parttime', label: '兼職' },
]

const locationOptions = [
  { value: 'remote', label: '遠端合作' },
  { value: 'specific_location', label: '特定地點' },
]

export function TalentFilters({ 
  filters, 
  onFiltersChange 
}: TalentFiltersProps) {
  const [newSkill, setNewSkill] = useState('')

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

  const toggleWorkMode = (mode: string) => {
    const currentModes = filters.work_mode || []
    const isSelected = currentModes.includes(mode as User['work_mode'])
    
    if (isSelected) {
      onFiltersChange({
        ...filters,
        work_mode: currentModes.filter(m => m !== mode)
      })
    } else {
      onFiltersChange({
        ...filters,
        work_mode: [...currentModes, mode as User['work_mode']]
      })
    }
  }

  const toggleLocation = (location: string) => {
    const currentLocations = filters.location_preference || []
    const isSelected = currentLocations.includes(location as User['location_preference'])
    
    if (isSelected) {
      onFiltersChange({
        ...filters,
        location_preference: currentLocations.filter(l => l !== location)
      })
    } else {
      onFiltersChange({
        ...filters,
        location_preference: [...currentLocations, location as User['location_preference']]
      })
    }
  }

  const clearAllFilters = () => {
    onFiltersChange({})
  }

  const hasActiveFilters = Object.keys(filters).some(key => {
    const value = filters[key as keyof UserFilters]
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
                 (filters.work_mode?.length || 0) + 
                 (filters.location_preference?.length || 0)}
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

            {/* 工作模式篩選 */}
            <div className="space-y-2">
              <label className="text-sm font-medium">工作模式</label>
              <div className="flex flex-wrap gap-2">
                {workModeOptions.map((option) => {
                  const isSelected = filters.work_mode?.includes(option.value as User['work_mode']) || false
                  return (
                    <Badge
                      key={option.value}
                      variant={isSelected ? "default" : "outline"}
                      className="cursor-pointer hover:bg-primary/80"
                      onClick={() => toggleWorkMode(option.value)}
                    >
                      {option.label}
                    </Badge>
                  )
                })}
              </div>
            </div>

            {/* 地點偏好篩選 */}
            <div className="space-y-2">
              <label className="text-sm font-medium">地點偏好</label>
              <div className="flex flex-wrap gap-2">
                {locationOptions.map((option) => {
                  const isSelected = filters.location_preference?.includes(option.value as User['location_preference']) || false
                  return (
                    <Badge
                      key={option.value}
                      variant={isSelected ? "default" : "outline"}
                      className="cursor-pointer hover:bg-primary/80"
                      onClick={() => toggleLocation(option.value)}
                    >
                      {option.label}
                    </Badge>
                  )
                })}
              </div>
            </div>

            {/* 技能篩選 */}
            <div className="space-y-2">
              <label className="text-sm font-medium">技能專長</label>
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
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}