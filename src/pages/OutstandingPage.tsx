import { useState } from "react"
import { Link } from "react-router-dom"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/utils"
import { Phone, Search, CreditCard, MessageCircle, ChevronRight, CheckCircle2 } from "lucide-react"
import { useLedgerState } from "@/hooks/use-ledger"
import { getOutstandingRows } from "@/lib/ledger/selectors"

export function OutstandingPage() {
  const state = useLedgerState()
  const [search, setSearch] = useState("")

  const outstandingRows = getOutstandingRows(state)
  const totalOutstanding = outstandingRows.reduce((sum, r) => sum + r.outstanding, 0)

  const filtered = outstandingRows.filter(({ customer }) => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return customer.name.toLowerCase().includes(q) || customer.phone.includes(q)
  })

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Outstanding Customer Dues</h1>
          <p className="text-sm text-muted-foreground">
            Customers with pending balances for saree purchases, sorted by highest amount owed.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="border-amber-300 bg-amber-500/10 px-3 py-1 text-sm font-bold text-amber-700"
          >
            Total Dues Owed: {formatCurrency(totalOutstanding)}
          </Badge>
        </div>
      </div>

      <Card>
        <CardHeader className="border-b">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="relative w-full md:max-w-sm">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by customer name or phone…"
                className="pl-9"
              />
            </div>
            <div className="text-xs text-muted-foreground">
              Customers with balance:{" "}
              <strong className="text-foreground">{outstandingRows.length}</strong>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-left">Customer</th>
                  <th className="px-4 py-3 text-left">Phone</th>
                  <th className="px-4 py-3 text-right">Total Saree Purchases</th>
                  <th className="px-4 py-3 text-right">Total Paid</th>
                  <th className="px-4 py-3 text-right font-bold text-amber-700">
                    Remaining Balance
                  </th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-16 text-center text-xs text-muted-foreground"
                    >
                      <CheckCircle2 className="mx-auto mb-2 h-7 w-7 text-emerald-500 opacity-60" />
                      {outstandingRows.length === 0
                        ? "All caught up! No customers currently owe any balance."
                        : "No outstanding customers match your search."}
                    </td>
                  </tr>
                ) : (
                  filtered.map(({ customer, totalSales, totalPaid, outstanding }) => {
                    const cleanPhone = customer.phone.replace(/[^0-9]/g, "")
                    const whatsappPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone
                    const reminderMsg = `*PAYMENT REMINDER - SAREE BUSINESS*
Hello ${customer.name},
This is a gentle reminder regarding your pending balance.
Total Purchases: ${formatCurrency(totalSales)}
Total Paid: ${formatCurrency(totalPaid)}
*Pending Balance Due: ${formatCurrency(outstanding)}*
Please let us know when it is convenient to pay. Thank you!`
                    const waUrl = whatsappPhone
                      ? `https://wa.me/${whatsappPhone}?text=${encodeURI(reminderMsg)}`
                      : `https://wa.me/?text=${encodeURI(reminderMsg)}`

                    return (
                      <tr key={customer.id} className="transition-colors hover:bg-muted/30">
                        <td className="px-4 py-3">
                          <Link
                            to={`/customers/${customer.id}`}
                            className="font-bold text-foreground hover:underline"
                          >
                            {customer.name}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {customer.phone ? (
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" /> {customer.phone}
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="px-4 py-3 text-right font-medium">
                          {formatCurrency(totalSales)}
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-emerald-600">
                          {formatCurrency(totalPaid)}
                        </td>
                        <td className="px-4 py-3 text-right text-base font-extrabold text-amber-700">
                          {formatCurrency(outstanding)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              asChild
                              size="sm"
                              variant="default"
                              className="h-8 gap-1 text-xs"
                            >
                              <Link to={`/payments/new?customerId=${customer.id}`}>
                                <CreditCard className="h-3.5 w-3.5" /> Record Payment
                              </Link>
                            </Button>
                            <Button
                              asChild
                              size="sm"
                              variant="outline"
                              className="h-8 gap-1 border-emerald-300 text-xs text-emerald-700 hover:bg-emerald-50"
                            >
                              <a href={waUrl} target="_blank" rel="noopener noreferrer">
                                <MessageCircle className="h-3.5 w-3.5" /> WhatsApp Reminder
                              </a>
                            </Button>
                            <Button asChild size="sm" variant="ghost" className="h-8 w-8 p-0">
                              <Link to={`/customers/${customer.id}`}>
                                <ChevronRight className="h-4 w-4" />
                              </Link>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
