import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatCurrency, formatDate } from "@/lib/utils"
import { FileBarChart, CalendarDays, BarChart3, IndianRupee } from "lucide-react"

export function ReportsPage() {
  const today = new Date()

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Reports</h1>
        <p className="text-sm text-muted-foreground">
          Daily, monthly, and period-based reports. Phase 7 introduces live data charts.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <ReportCard
          icon={<BarChart3 className="h-4 w-4" />}
          title="Daily Sales"
          subtitle={`${formatDate(today)}`}
          value={formatCurrency(0)}
          badge="Today"
        />
        <ReportCard
          icon={<BarChart3 className="h-4 w-4" />}
          title="Monthly Sales"
          subtitle="Oct 2026"
          value={formatCurrency(0)}
          badge="Month"
        />
        <ReportCard
          icon={<IndianRupee className="h-4 w-4" />}
          title="Daily Collections"
          subtitle={`${formatDate(today)}`}
          value={formatCurrency(0)}
          badge="Today"
        />
        <ReportCard
          icon={<IndianRupee className="h-4 w-4" />}
          title="Monthly Collections"
          subtitle="Oct 2026"
          value={formatCurrency(0)}
          badge="Month"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarDays className="h-4 w-4" /> Period Report
            </CardTitle>
            <CardDescription>
              Choose a date range to generate a detailed sales & collections summary.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="rounded-md border bg-muted/20 p-3 text-xs text-muted-foreground">
                From: <span className="font-medium text-foreground">01 Oct 2026</span>
              </div>
              <div className="rounded-md border bg-muted/20 p-3 text-xs text-muted-foreground">
                To: <span className="font-medium text-foreground">31 Oct 2026</span>
              </div>
            </div>
            <Badge variant="outline" className="w-full justify-center py-2">
              Phase 7: Generate report
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileBarChart className="h-4 w-4" /> Customer Transaction History
            </CardTitle>
            <CardDescription>
              Full customer statement by date range. Printable / PDF export in Phase 8.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="rounded-md border bg-muted/20 p-3 text-xs text-muted-foreground">
              Select customer → Choose date range →{" "}
              <span className="font-medium text-foreground">Generate Statement</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-md border p-3">
                <div className="text-muted-foreground">Opening Balance</div>
                <div className="mt-1 text-sm font-semibold">{formatCurrency(0)}</div>
              </div>
              <div className="rounded-md border p-3">
                <div className="text-muted-foreground">Closing Balance</div>
                <div className="mt-1 text-sm font-semibold">{formatCurrency(0)}</div>
              </div>
              <div className="rounded-md border p-3">
                <div className="text-muted-foreground">Sales (period)</div>
                <div className="mt-1 text-sm font-semibold">{formatCurrency(0)}</div>
              </div>
              <div className="rounded-md border p-3">
                <div className="text-muted-foreground">Payments (period)</div>
                <div className="mt-1 text-sm font-semibold">{formatCurrency(0)}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function ReportCard({
  icon,
  title,
  subtitle,
  value,
  badge,
}: {
  icon: React.ReactNode
  title: string
  subtitle: string
  value: string
  badge: string
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardDescription className="text-xs">{title}</CardDescription>
            <div className="mt-1 text-lg font-semibold tracking-tight">{value}</div>
          </div>
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
            {icon}
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex items-center justify-between pt-0">
        <div className="text-xs text-muted-foreground">{subtitle}</div>
        <Badge variant="outline" className="h-5 text-[10px]">
          {badge}
        </Badge>
      </CardContent>
    </Card>
  )
}
