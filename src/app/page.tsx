import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, Users, FolderOpen, MessageSquare } from 'lucide-react'

export default function Home() {
  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="text-center space-y-6">
        <div className="space-y-4">
          <h1 className="text-4xl font-bold tracking-tight lg:text-6xl">
            找到你的
            <span className="text-primary"> 創業夥伴</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Spark Links 是創業專屬的媒合平台，幫助創業者、技術人員、設計師、投資人找到志同道合的創業夥伴，快速組成創業初始團隊。
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button size="lg" asChild>
            <Link href="/projects">
              探索創業專案 <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <Link href="/talents">尋找創業夥伴</Link>
          </Button>
        </div>
      </section>

      {/* Features Section */}
      <section className="grid md:grid-cols-3 gap-8">
        <div className="text-center space-y-4 p-6 rounded-lg border">
          <div className="mx-auto w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
            <FolderOpen className="h-6 w-6 text-primary" />
          </div>
          <h3 className="text-xl font-semibold">發佈創業專案</h3>
          <p className="text-muted-foreground">
            輕鬆發佈你的創業構想，說明需要的技能和角色，吸引合適的夥伴加入
          </p>
        </div>

        <div className="text-center space-y-4 p-6 rounded-lg border">
          <div className="mx-auto w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
            <Users className="h-6 w-6 text-primary" />
          </div>
          <h3 className="text-xl font-semibold">瀏覽人才庫</h3>
          <p className="text-muted-foreground">
            發現有才華的創業夥伴，了解他們的技能、經驗和合作模式
          </p>
        </div>

        <div className="text-center space-y-4 p-6 rounded-lg border">
          <div className="mx-auto w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
            <MessageSquare className="h-6 w-6 text-primary" />
          </div>
          <h3 className="text-xl font-semibold">智能媒合</h3>
          <p className="text-muted-foreground">
            透過申請和邀請機制，找到最合適的創業夥伴，開始你的創業之路
          </p>
        </div>
      </section>

      {/* CTA Section */}
      <section className="text-center space-y-6 bg-muted/50 rounded-lg p-8">
        <div className="space-y-2">
          <h2 className="text-3xl font-bold">準備開始你的創業旅程嗎？</h2>
          <p className="text-muted-foreground">
            加入 Spark Links，與志同道合的夥伴一起實現創業夢想
          </p>
        </div>
        
        <Button size="lg" asChild>
          <Link href="/auth/register">
            立即註冊 <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </section>

      {/* Statistics Section */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
        <div className="space-y-2">
          <div className="text-3xl font-bold text-primary">100+</div>
          <div className="text-sm text-muted-foreground">創業專案</div>
        </div>
        <div className="space-y-2">
          <div className="text-3xl font-bold text-primary">500+</div>
          <div className="text-sm text-muted-foreground">創業夥伴</div>
        </div>
        <div className="space-y-2">
          <div className="text-3xl font-bold text-primary">50+</div>
          <div className="text-sm text-muted-foreground">成功媒合</div>
        </div>
        <div className="space-y-2">
          <div className="text-3xl font-bold text-primary">20+</div>
          <div className="text-sm text-muted-foreground">成功創業</div>
        </div>
      </section>
    </div>
  )
}
