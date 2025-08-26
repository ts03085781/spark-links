'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { User } from '@/types'
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

const profileFormSchema = z.object({
  name: z.string().min(1, '姓名不能為空'),
  contact_info: z.string().optional(),
  skills: z.array(z.string()).default([]),
  experience_description: z.string().default(''),
  work_mode: z.enum(['fulltime', 'parttime']),
  partner_description: z.string().default(''),
  location_preference: z.enum(['remote', 'specific_location']),
  specific_location: z.string().optional(),
  is_public: z.boolean().default(false),
})

type ProfileFormData = z.infer<typeof profileFormSchema>

interface ProfileEditFormProps {
  user: User
  onSave: (data: ProfileFormData) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

export function ProfileEditForm({ user, onSave, onCancel, isLoading }: ProfileEditFormProps) {
  const [newSkill, setNewSkill] = useState('')
  
  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: user.name || '',
      contact_info: user.contact_info || '',
      skills: user.skills || [],
      experience_description: user.experience_description || '',
      work_mode: user.work_mode || 'fulltime',
      partner_description: user.partner_description || '',
      location_preference: user.location_preference || 'remote',
      specific_location: user.specific_location || '',
      is_public: user.is_public || false,
    },
  })

  const skills = form.watch('skills')
  const locationPreference = form.watch('location_preference')

  const addSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      form.setValue('skills', [...skills, newSkill.trim()])
      setNewSkill('')
    }
  }

  const removeSkill = (skillToRemove: string) => {
    form.setValue('skills', skills.filter(skill => skill !== skillToRemove))
  }

  const onSubmit = async (data: ProfileFormData) => {
    await onSave(data)
  }

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* 基本資料 */}
            <Card>
              <CardHeader>
                <CardTitle>基本資料</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>姓名 *</FormLabel>
                      <FormControl>
                        <Input placeholder="請輸入您的姓名" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="contact_info"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>聯絡資訊</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="例如：Line ID, 電話號碼等" 
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        其他創業夥伴可以透過這些方式聯繫你
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
                          公開個人資料
                        </FormLabel>
                        <FormDescription>
                          允許其他用戶查看你的完整資料
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

            {/* 工作偏好 */}
            <Card>
              <CardHeader>
                <CardTitle>工作偏好</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="work_mode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>工作模式</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="選擇工作模式" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="fulltime">全職</SelectItem>
                          <SelectItem value="parttime">兼職</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="location_preference"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>地點偏好</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="選擇地點偏好" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="remote">遠端工作</SelectItem>
                          <SelectItem value="specific_location">特定地點</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {locationPreference === 'specific_location' && (
                  <FormField
                    control={form.control}
                    name="specific_location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>具體地點</FormLabel>
                        <FormControl>
                          <Input placeholder="例如：台北市、台中市等" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </CardContent>
            </Card>
          </div>

          {/* 技能標籤 */}
          <Card>
            <CardHeader>
              <CardTitle>技能專長</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="新增技能標籤"
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

              {skills.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill, index) => (
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

          {/* 經驗描述 */}
          <Card>
            <CardHeader>
              <CardTitle>工作經驗</CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="experience_description"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea
                        placeholder="描述您的專業背景、工作經驗、學歷等..."
                        className="min-h-[120px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      讓其他創業夥伴了解您的專業背景
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* 理想夥伴 */}
          <Card>
            <CardHeader>
              <CardTitle>理想夥伴</CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="partner_description"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea
                        placeholder="描述您想找的創業夥伴類型、技能、特質等..."
                        className="min-h-[120px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      幫助系統為您推薦合適的創業夥伴
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
              {isLoading ? '儲存中...' : '儲存變更'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}