import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/utils"
import { AlertTriangle, Phone, Search, SortDesc } from "lucide-react"

export function OutstandingPage() {
  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Outstanding Customers</h1>
          <p className="text-sm text-muted-foreground">
            Customers with unpaid balances — sorted by highest amount owed.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="destructive" className="text-sm">
            Total Owed {formatCurrency(0)}
          </Badge>
        </div>
      </div>

      <Card>
        <CardHeader className="border-b">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="relative w-full md:max-w-sm">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search by name or phone…" className="pl-9" />
            </div>
            <Button variant="ghost" size="sm">
              <SortDesc className="h-4 w-4" /> Sort: Highest Outstanding
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-left">Customer</th>
                  <th className="px-4 py-3 text-left">Phone</th>
                  <th className="px-4 py-3 text-right">Total Sales</th>
                  <th className="px-4 py-3 text-right">Total Paid</th>
                  <th className="px-4 py-3 text-right">Outstanding</th>
                  <th className="px-4 py-3 text-left">Last Payment</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan={6} className="px-4 py-16 text-center text-xs text-muted-foreground">
                    <AlertTriangle className="mx-auto mb-2 h-6 w-6 opacity-50" />
                    All caught up — no outstanding balances.
                    <div className="mt-2 text-[11px]">
                      Phase 7: Dashboard & Reports will populate this list.
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="rounded-lg border-destructive/40 bg-destructive/5 p-4 text-xs text-destructive/90">
        <div className="mb-1 flex items-center gap-2 font-medium">
          <AlertTriangle className="h-3.5 w-3.5" /> Reminder
        </div>
        Never accept a payment larger than the customer outstanding unless advance credit is
        explicitly enabled for that customer.
      </div>

      <div className="hidden h-4 w-4">
        <Phone />
      </div>
    </div>
  )
}
