import { Link } from "react-router-dom"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatCurrency, formatDate } from "@/lib/utils"
import { IndianRupee, Users, Wallet, AlertTriangle, Plus, CreditCard, UserPlus } from "lucide-react"
import { useLedgerState } from "@/hooks/use-ledger"
import { getDashboardMetrics, getOutstandingRows } from "@/lib/ledger/selectors"
import type { ReactNode } from "react"

export function DashboardPage() {
  const state = useLedgerState()
  const metrics = getDashboardMetrics(state)
  const topDebtors = getOutstandingRows(state).slice(0, 5)
  const recentSales = [...state.sales]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 5)
  const recentPayments = [...state.payments]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 5)

  const todayStr = new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeZone: "Asia/Kolkata",
  }).format(new Date())

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      {/* Top Welcome & Quick Actions */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Saree Business Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Home Saree Sales & Digital Khata Overview — {todayStr}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild size="sm" className="gap-1.5 shadow-sm">
            <Link to="/sales/new">
              <Plus className="h-4 w-4" /> New Saree Sale
            </Link>
          </Button>
          <Button asChild size="sm" variant="secondary" className="gap-1.5 shadow-sm">
            <Link to="/payments/new">
              <CreditCard className="h-4 w-4" /> Record Payment
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline" className="gap-1.5 shadow-sm">
            <Link to="/customers/new">
              <UserPlus className="h-4 w-4" /> Add Customer
            </Link>
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          icon={<IndianRupee className="h-4 w-4 text-primary" />}
          label="Today's Saree Sales"
          value={formatCurrency(metrics.todaySales)}
          subtext="Total saree bills sold today"
        />
        <MetricCard
          icon={<Wallet className="h-4 w-4 text-emerald-600" />}
          label="Today's Collections"
          value={formatCurrency(metrics.todayCollections)}
          subtext="Cash & UPI received today"
          tone="good"
        />
        <MetricCard
          icon={<AlertTriangle className="h-4 w-4 text-amber-600" />}
          label="Total Money Due (Khata)"
          value={formatCurrency(metrics.totalOutstanding)}
          subtext="Remaining dues across all customers"
          tone={metrics.totalOutstanding > 0 ? "destructive" : "default"}
        />
        <MetricCard
          icon={<Users className="h-4 w-4 text-blue-600" />}
          label="Total Customers"
          value={metrics.totalCustomers.toString()}
          subtext="Registered saree customers"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Top Outstanding Customers */}
        <Card className="lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base font-semibold">Customers with Dues</CardTitle>
              <CardDescription>Highest pending balances</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm" className="text-xs">
              <Link to="/outstanding">View All</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {topDebtors.length === 0 ? (
              <EmptyState message="All caught up! No pending customer dues." />
            ) : (
              topDebtors.map(({ customer, outstanding }) => (
                <div
                  key={customer.id}
                  className="flex items-center justify-between rounded-lg border bg-card p-2.5 transition-colors hover:bg-muted/30"
                >
                  <div>
                    <Link
                      to={`/customers/${customer.id}`}
                      className="block text-sm font-semibold hover:underline"
                    >
                      {customer.name}
                    </Link>
                    <span className="text-xs text-muted-foreground">
                      {customer.phone || "No phone"}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="block text-sm font-bold text-amber-600">
                      {formatCurrency(outstanding)}
                    </span>
                    <Link
                      to={`/payments/new?customerId=${customer.id}`}
                      className="text-[11px] text-primary hover:underline"
                    >
                      Record Pay
                    </Link>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Recent Sales List */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base font-semibold">Recent Saree Sales</CardTitle>
              <CardDescription>Latest sarees sold and billed</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm" className="text-xs">
              <Link to="/sales">View All Sales</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentSales.length === 0 ? (
              <EmptyState message="No saree sales recorded yet. Click 'New Saree Sale' above." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-muted/40 uppercase text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2 text-left">Bill No</th>
                      <th className="px-3 py-2 text-left">Customer</th>
                      <th className="px-3 py-2 text-left">Saree Details</th>
                      <th className="px-3 py-2 text-right">Amount</th>
                      <th className="px-3 py-2 text-right">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {recentSales.map((sale) => {
                      const cust = state.customers.find((c) => c.id === sale.customerId)
                      return (
                        <tr key={sale.id} className="hover:bg-muted/30">
                          <td className="px-3 py-2.5 font-semibold text-primary">
                            {sale.billNumber}
                          </td>
                          <td className="px-3 py-2.5 font-medium">{cust?.name || "Customer"}</td>
                          <td className="px-3 py-2.5">{sale.sareeName}</td>
                          <td className="px-3 py-2.5 text-right font-bold">
                            {formatCurrency(sale.saleAmount)}
                          </td>
                          <td className="px-3 py-2.5 text-right text-muted-foreground">
                            {formatDate(sale.saleDateISO)}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Payments */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-base font-semibold">Recent Payments Received</CardTitle>
            <CardDescription>Cash & UPI collections</CardDescription>
          </div>
          <Button asChild variant="ghost" size="sm" className="text-xs">
            <Link to="/payments">View All Payments</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {recentPayments.length === 0 ? (
            <EmptyState message="No payments received yet." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-muted/40 uppercase text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 text-left">Date</th>
                    <th className="px-3 py-2 text-left">Customer</th>
                    <th className="px-3 py-2 text-left">Mode</th>
                    <th className="px-3 py-2 text-right">Amount Received</th>
                    <th className="px-3 py-2 text-left">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {recentPayments.map((p) => {
                    const cust = state.customers.find((c) => c.id === p.customerId)
                    return (
                      <tr key={p.id} className="hover:bg-muted/30">
                        <td className="whitespace-nowrap px-3 py-2.5 text-muted-foreground">
                          {formatDate(p.paymentDateISO)}
                        </td>
                        <td className="px-3 py-2.5 font-medium">{cust?.name || "Customer"}</td>
                        <td className="px-3 py-2.5">
                          <Badge variant="outline" className="py-0 text-[10px]">
                            {p.paymentMethod}
                          </Badge>
                        </td>
                        <td className="px-3 py-2.5 text-right font-bold text-emerald-600">
                          + {formatCurrency(p.amount)}
                        </td>
                        <td className="px-3 py-2.5 text-muted-foreground">{p.notes || "—"}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function MetricCard({
  icon,
  label,
  value,
  subtext,
  tone = "default",
}: {
  icon: ReactNode
  label: string
  value: string
  subtext: string
  tone?: "default" | "destructive" | "good"
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardDescription className="text-xs font-medium uppercase tracking-wider">
          {label}
        </CardDescription>
        <div
          className={
            tone === "destructive"
              ? "flex h-8 w-8 items-center justify-center rounded-md bg-amber-500/10 text-amber-600"
              : tone === "good"
                ? "flex h-8 w-8 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-600"
                : "flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary"
          }
        >
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div
          className={`text-2xl font-bold tracking-tight ${
            tone === "destructive"
              ? "text-amber-600"
              : tone === "good"
                ? "text-emerald-600"
                : "text-foreground"
          }`}
        >
          {value}
        </div>
        <p className="mt-1 text-[11px] text-muted-foreground">{subtext}</p>
      </CardContent>
    </Card>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center rounded-md border border-dashed px-3 py-8 text-center text-xs text-muted-foreground">
      {message}
    </div>
  )
}
