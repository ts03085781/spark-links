'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { useAuthStore } from '@/stores/auth'
import { Loader2, Eye, EyeOff, CheckCircle } from 'lucide-react'

const registerSchema = z.object({
  name: z
    .string()
    .min(2, { message: '姓名至少需要 2 個字元' })
    .max(50, { message: '姓名不能超過 50 個字元' }),
  email: z
    .string()
    .min(1, { message: '請輸入電子信箱' })
    .email({ message: '請輸入有效的電子信箱' }),
  password: z
    .string()
    .min(6, { message: '密碼至少需要 6 個字元' })
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
      message: '密碼需包含大小寫字母和數字',
    }),
  confirmPassword: z
    .string()
    .min(6, { message: '請確認您的密碼' }),
}).refine((data) => data.password === data.confirmPassword, {
  message: '密碼確認不相符',
  path: ['confirmPassword'],
})

type RegisterFormValues = z.infer<typeof registerSchema>

export default function RegisterPage() {
  const router = useRouter()
  const { register } = useAuthStore()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  })

  const onSubmit = async (values: RegisterFormValues) => {
    setIsLoading(true)
    setError('')
    setSuccess(false)

    try {
      const result = await register(values.email, values.password, values.name)
      
      if (result.error) {
        setError(result.error)
        return
      }

      // 註冊成功
      setSuccess(true)
      setTimeout(() => {
        router.push('/auth/login')
      }, 2000)
    } catch (error) {
      setError('註冊失敗，請稍後再試')
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <Card className="w-full max-w-md">
          <CardContent className="pt-8 pb-8">
            <div className="text-center space-y-4">
              <CheckCircle className="mx-auto h-16 w-16 text-green-600" />
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-green-600">註冊成功！</h2>
                <p className="text-muted-foreground">
                  歡迎加入 Spark Links！請檢查您的信箱並確認註冊。
                </p>
                <p className="text-sm text-muted-foreground">
                  正在重新導向至登入頁面...
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-[600px]">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            建立帳號
          </CardTitle>
          <CardDescription className="text-center">
            開始你的創業媒合旅程
          </CardDescription>
        </CardHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              {error && (
                <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                  {error}
                </div>
              )}

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>姓名</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="請輸入您的姓名"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>電子信箱</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="請輸入您的電子信箱"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>密碼</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="請輸入密碼（包含大小寫字母和數字）"
                          {...field}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>確認密碼</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showConfirmPassword ? 'text' : 'password'}
                          placeholder="請再次輸入密碼"
                          {...field}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>

            <CardFooter className="flex flex-col space-y-4">
              <Button
                type="submit"
                className="w-full mt-10"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    註冊中...
                  </>
                ) : (
                  '建立帳號'
                )}
              </Button>

              <div className="text-center text-sm text-muted-foreground">
                已經有帳號了？{' '}
                <Link
                  href="/auth/login"
                  className="font-medium text-primary hover:underline"
                >
                  立即登入
                </Link>
              </div>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  )
}