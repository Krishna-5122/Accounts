import { useState } from "react"
import { Link } from "react-router-dom"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatCurrency, formatDate } from "@/lib/utils"
import { Plus, Wallet, Search, Trash2, Smartphone, Banknote } from "lucide-react"
import { useLedgerState, useLedgerActions } from "@/hooks/use-ledger"
import { toast } from "sonner"
import type { UUID } from "@/types"

export function PaymentsPage() {
  const state = useLedgerState()
  const { deletePayment } = useLedgerActions()

  const [search, setSearch] = useState("")
  const [methodFilter, setMethodFilter] = useState<string>("all")

  // Payments with customer and sale details
  const paymentsWithDetails = state.payments
    .map((p) => {
      const customer = state.customers.find((c) => c.id === p.customerId)
      const sale = p.saleId ? state.sales.find((s) => s.id === p.saleId) : null
      return {
        payment: p,
        customer,
        sale,
      }
    })
    .sort((a, b) => b.payment.paymentDateISO.localeCompare(a.payment.paymentDateISO))

  // Metrics
  const totalCollected = state.payments.reduce((sum, p) => sum + p.amount, 0)
  const cashCollected = state.payments
    .filter((p) => p.paymentMethod === "Cash")
    .reduce((sum, p) => sum + p.amount, 0)
  const upiCollected = state.payments
    .filter((p) => p.paymentMethod === "UPI")
    .reduce((sum, p) => sum + p.amount, 0)

  // Filtered
  const filtered = paymentsWithDetails.filter(({ payment, customer, sale }) => {
    if (methodFilter !== "all" && payment.paymentMethod !== methodFilter) {
      return false
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      const matchCust = customer?.name.toLowerCase().includes(q) ?? false
      const matchPhone = customer?.phone.includes(q) ?? false
      const matchBill = sale?.billNumber.toLowerCase().includes(q) ?? false
      const matchNotes = payment.notes.toLowerCase().includes(q)
      if (!matchCust && !matchPhone && !matchBill && !matchNotes) return false
    }
    return true
  })

  function handleDeletePayment(paymentId: UUID, amount: number) {
    if (
      window.confirm(
        `Delete this payment of ₹${amount}? The customer's due balance will increase accordingly.`,
      )
    ) {
      const res = deletePayment(paymentId)
      if (res.ok) {
        toast.success("Payment deleted.")
      } else {
        toast.error(res.error)
      }
    }
  }

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Payments Received</h1>
          <p className="text-sm text-muted-foreground">
            History of cash and UPI payments received from saree customers.
          </p>
        </div>
        <Button asChild className="gap-2">
          <Link to="/payments/new">
            <Plus className="h-4 w-4" /> Record New Payment
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            <Wallet className="h-3.5 w-3.5 text-primary" /> Total Collected
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-emerald-600">
            {formatCurrency(totalCollected)}
          </div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            <Banknote className="h-3.5 w-3.5 text-emerald-500" /> Cash in Hand
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight">
            {formatCurrency(cashCollected)}
          </div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            <Smartphone className="h-3.5 w-3.5 text-blue-500" /> UPI / PhonePe / GPay
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight">
            {formatCurrency(upiCollected)}
          </div>
        </div>
      </div>

      <Card>
        <CardHeader className="border-b">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="relative w-full md:max-w-sm">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 pl-9 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                placeholder="Search customer, bill, notes…"
              />
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={methodFilter === "all" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setMethodFilter("all")}
              >
                All
              </Button>
              <Button
                variant={methodFilter === "Cash" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setMethodFilter("Cash")}
              >
                Cash
              </Button>
              <Button
                variant={methodFilter === "UPI" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setMethodFilter("UPI")}
              >
                UPI
              </Button>
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
                  <th className="px-4 py-3 text-left">Payment Mode</th>
                  <th className="px-4 py-3 text-left">Applied To Saree Bill</th>
                  <th className="px-4 py-3 text-right">Amount Received</th>
                  <th className="px-4 py-3 text-left">Notes</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-16 text-center text-xs text-muted-foreground"
                    >
                      <Wallet className="mx-auto mb-2 h-7 w-7 opacity-40" />
                      {state.payments.length === 0
                        ? "No payments recorded yet. Click 'Record New Payment' to add."
                        : "No payments match your filter."}
                    </td>
                  </tr>
                ) : (
                  filtered.map(({ payment, customer, sale }) => (
                    <tr key={payment.id} className="transition-colors hover:bg-muted/30">
                      <td className="whitespace-nowrap px-4 py-3 font-medium">
                        {formatDate(payment.paymentDateISO)}
                      </td>
                      <td className="px-4 py-3">
                        {customer ? (
                          <Link
                            to={`/customers/${customer.id}`}
                            className="font-semibold text-primary hover:underline"
                          >
                            {customer.name}
                          </Link>
                        ) : (
                          "Unknown Customer"
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant="outline"
                          className={
                            payment.paymentMethod === "UPI"
                              ? "border-blue-200 bg-blue-500/10 text-blue-700"
                              : "border-emerald-200 bg-emerald-500/10 text-emerald-700"
                          }
                        >
                          {payment.paymentMethod}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {sale ? (
                          <span>
                            {sale.billNumber} ({sale.sareeName})
                          </span>
                        ) : (
                          <span className="text-xs italic text-slate-400">General Credit</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-emerald-600">
                        + {formatCurrency(payment.amount)}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {payment.notes || "—"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive/70 hover:text-destructive"
                          onClick={() => handleDeletePayment(payment.id, payment.amount)}
                          title="Delete Payment"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
