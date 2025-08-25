export default function MyProjectsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">我的專案</h1>
        <p className="text-muted-foreground">查看你參與的所有創業專案</p>
      </div>
      
      <div className="bg-muted/50 p-8 rounded-lg">
        <p className="text-center text-muted-foreground">
          我的專案功能開發中...
        </p>
      </div>
    </div>
  )
}