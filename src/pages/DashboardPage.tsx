import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { formatCurrency } from "@/lib/utils"
import {
  IndianRupee,
  Users,
  Receipt,
  Wallet,
  TrendingUp,
  AlertTriangle,
  ArrowUpRight,
} from "lucide-react"

export function DashboardPage() {
  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Business overview for today — 07 Oct 2026
          </p>
        </div>
        <Badge variant="outline" className="w-fit">Asia/Kolkata</Badge>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          icon={<IndianRupee className="h-4 w-4" />}
          label="Today's Sales"
          value={formatCurrency(0)}
          trend="+0%"
          tone="default"
        />
        <MetricCard
          icon={<Wallet className="h-4 w-4" />}
          label="Today's Collections"
          value={formatCurrency(0)}
          trend="+0%"
          tone="default"
        />
        <MetricCard
          icon={<AlertTriangle className="h-4 w-4" />}
          label="Total Outstanding"
          value={formatCurrency(0)}
          trend="—"
          tone="destructive"
        />
        <MetricCard
          icon={<Users className="h-4 w-4" />}
          label="Total Customers"
          value="0"
          trend="+0"
          tone="default"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Monthly Sales & Collections</CardTitle>
            <CardDescription>Last 6 months — INR (₹)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex h-64 items-center justify-center rounded-md border border-dashed bg-muted/20 text-sm text-muted-foreground">
              <div className="space-y-2 text-center">
                <TrendingUp className="mx-auto h-8 w-8 opacity-50" />
                <p>Charts will render once database data is available.</p>
                <p className="text-xs">Phase 7: Dashboard & Reports</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top Outstanding Customers</CardTitle>
            <CardDescription>Sorted by balance owed</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <EmptyState message="No customer data yet — add your first customer." />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Recent Sales</CardTitle>
              <CardDescription>Latest saree sales</CardDescription>
            </div>
            <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-2">
            <EmptyState message="No sales recorded yet." />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Recent Payments</CardTitle>
              <CardDescription>Latest collections</CardDescription>
            </div>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-2">
            <EmptyState message="No payments recorded yet." />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function MetricCard({
  icon,
  label,
  value,
  trend,
  tone,
}: {
  icon: React.ReactNode
  label: string
  value: string
  trend: string
  tone: "default" | "destructive"
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardDescription className="text-sm font-medium">{label}</CardDescription>
        <div
          className={
            tone === "destructive"
              ? "flex h-8 w-8 items-center justify-center rounded-md bg-destructive/10 text-destructive"
              : "flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary"
          }
        >
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold tracking-tight">{value}</div>
        <p className="mt-1 text-xs text-muted-foreground">{trend} vs. previous period</p>
      </CardContent>
    </Card>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center rounded-md border border-dashed px-2 py-10 text-xs text-muted-foreground">
      {message}
    </div>
  )
}

export function DashboardPageSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <Skeleton className="h-8 w-1/4" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-lg" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <Skeleton className="h-72 lg:col-span-2" />
        <Skeleton className="h-72" />
      </div>
    </div>
  )
}
