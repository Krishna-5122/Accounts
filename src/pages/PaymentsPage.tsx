import { Link } from "react-router-dom"
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { formatCurrency, formatDate } from "@/lib/utils"
import { Plus, Wallet, Search, Calendar, IndianRupee } from "lucide-react"

export function PaymentsPage() {
  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Payments</h1>
          <p className="text-sm text-muted-foreground">
            Record customer payments (Cash / UPI / Other) and apply to bills.
          </p>
        </div>
        <Button asChild>
          <Link to="/payments/new">
            <Plus className="h-4 w-4" /> Add Payment
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" /> Today
          </div>
          <div className="mt-2 text-2xl font-semibold tracking-tight">
            {formatCurrency(0)}
          </div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            <IndianRupee className="h-3.5 w-3.5" /> This Month
          </div>
          <div className="mt-2 text-2xl font-semibold tracking-tight">
            {formatCurrency(0)}
          </div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            <Wallet className="h-3.5 w-3.5" /> Total Collected
          </div>
          <div className="mt-2 text-2xl font-semibold tracking-tight">
            {formatCurrency(0)}
          </div>
        </div>
      </div>

      <Card>
        <CardHeader className="border-b">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="relative w-full md:max-w-sm">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search by bill, customer, method…" className="pl-9" />
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">Cash: 0</Badge>
              <Badge variant="outline">UPI: 0</Badge>
              <Badge variant="outline">Other: 0</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-left">Customer</th>
                  <th className="px-4 py-3 text-left">Bill</th>
                  <th className="px-4 py-3 text-left">Method</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan={6} className="px-4 py-16 text-center text-xs text-muted-foreground">
                    No payments recorded yet — Phase 6: Payments & Ledger.
                    <div className="mt-2 text-[11px]">
                      Today is {formatDate(new Date())} · Collected payments reduce customer outstanding.
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
