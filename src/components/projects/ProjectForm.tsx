'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { ProjectForm as ProjectFormData } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { X, Plus } from 'lucide-react'
import { toast } from 'sonner'

const projectFormSchema = z.object({
  title: z.string().min(1, '專案名稱不能為空').max(100, '專案名稱過長'),
  description: z.string().min(10, '專案描述至少需要 10 個字符').max(2000, '專案描述過長'),
  target_team_size: z.number().min(2, '團隊目標人數至少為 2 人').max(20, '團隊目標人數不能超過 20 人'),
  required_roles: z.array(z.string()).min(1, '請至少添加一個所需職位'),
  required_skills: z.array(z.string()).default([]),
  project_stage: z.enum(['idea', 'prototype', 'beta', 'launched']),
  is_public: z.boolean().default(true),
})

interface ProjectFormProps {
  onSubmit: (data: ProjectFormData) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
  initialData?: Partial<ProjectFormData>
  submitButtonText?: string
}

export function ProjectForm({ onSubmit, onCancel, isLoading, initialData, submitButtonText }: ProjectFormProps) {
  const [newRole, setNewRole] = useState('')
  const [newSkill, setNewSkill] = useState('')
  
  const form = useForm<ProjectFormData>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      title: initialData?.title || '',
      description: initialData?.description || '',
      target_team_size: initialData?.target_team_size || 3,
      required_roles: initialData?.required_roles || [],
      required_skills: initialData?.required_skills || [],
      project_stage: initialData?.project_stage || 'idea',
      is_public: initialData?.is_public ?? true,
    },
  })

  const requiredRoles = form.watch('required_roles')
  const requiredSkills = form.watch('required_skills')

  const addRole = () => {
    const trimmedRole = newRole.trim()
    if (!trimmedRole) {
      toast.error('請輸入職位名稱')
      return
    }
    
    if (requiredRoles.includes(trimmedRole)) {
      toast.warning('此職位已存在')
      return
    }
    
    if (requiredRoles.length >= 10) {
      toast.warning('最多只能添加 10 個職位')
      return
    }
    
    form.setValue('required_roles', [...requiredRoles, trimmedRole])
    setNewRole('')
    toast.success(`已添加職位：${trimmedRole}`)
  }

  const removeRole = (roleToRemove: string) => {
    form.setValue('required_roles', requiredRoles.filter(role => role !== roleToRemove))
    toast.success(`已移除職位：${roleToRemove}`)
  }

  const addSkill = () => {
    const trimmedSkill = newSkill.trim()
    if (!trimmedSkill) {
      toast.error('請輸入技能名稱')
      return
    }
    
    if (requiredSkills.includes(trimmedSkill)) {
      toast.warning('此技能已存在')
      return
    }
    
    if (requiredSkills.length >= 20) {
      toast.warning('最多只能添加 20 個技能')
      return
    }
    
    form.setValue('required_skills', [...requiredSkills, trimmedSkill])
    setNewSkill('')
    toast.success(`已添加技能：${trimmedSkill}`)
  }

  const removeSkill = (skillToRemove: string) => {
    form.setValue('required_skills', requiredSkills.filter(skill => skill !== skillToRemove))
    toast.success(`已移除技能：${skillToRemove}`)
  }

  // const handleSubmit = async (data: ProjectFormData) => {
  //   await onSubmit(data)
  // }

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* 基本資料 */}
            <Card>
              <CardHeader>
                <CardTitle>專案基本資料</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>專案名稱 *</FormLabel>
                      <FormControl>
                        <Input placeholder="輸入您的專案名稱" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="project_stage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>專案階段</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="選擇專案階段" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="idea">構想階段</SelectItem>
                          <SelectItem value="prototype">原型開發</SelectItem>
                          <SelectItem value="beta">測試階段</SelectItem>
                          <SelectItem value="launched">已上線</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="target_team_size"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>目標團隊人數</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={2}
                          max={20}
                          placeholder="3"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormDescription>
                        包含您在內的總團隊人數
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="is_public"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          公開專案
                        </FormLabel>
                        <FormDescription>
                          允許其他用戶查看和申請加入此專案
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* 專案描述 */}
            <Card>
              <CardHeader>
                <CardTitle>專案描述</CardTitle>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea
                          placeholder="詳細描述您的專案內容、目標、商業模式等..."
                          className="min-h-[200px]"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        詳細的專案描述有助於吸引合適的夥伴
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </div>

          {/* 所需職位 */}
          <Card>
            <CardHeader>
              <CardTitle>所需職位</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="新增所需職位（如：前端工程師、產品經理等）"
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addRole()
                    }
                  }}
                />
                <Button type="button" onClick={addRole} variant="outline" size="icon">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {requiredRoles.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {requiredRoles.map((role, index) => (
                    <Badge key={index} variant="default" className="px-3 py-1">
                      {role}
                      <button
                        type="button"
                        onClick={() => removeRole(role)}
                        className="ml-2 text-primary-foreground hover:text-primary-foreground/80"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
              <FormMessage />
            </CardContent>
          </Card>

          {/* 所需技能 */}
          <Card>
            <CardHeader>
              <CardTitle>所需技能</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="新增所需技能（如：React、UI/UX 設計等）"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addSkill()
                    }
                  }}
                />
                <Button type="button" onClick={addSkill} variant="outline" size="icon">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {requiredSkills.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {requiredSkills.map((skill, index) => (
                    <Badge key={index} variant="secondary" className="px-3 py-1">
                      {skill}
                      <button
                        type="button"
                        onClick={() => removeSkill(skill)}
                        className="ml-2 text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* 操作按鈕 */}
          <div className="flex gap-4 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
            >
              取消
            </Button>
            <Button type="submit" disabled={isLoading}>
              {submitButtonText || '送出'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}