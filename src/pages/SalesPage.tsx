import { useState } from "react"
import { Link } from "react-router-dom"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatCurrency, formatDate } from "@/lib/utils"
import {
  Plus,
  Receipt,
  Search,
  Printer,
  CreditCard,
  Trash2,
  CheckCircle2,
  Clock,
  AlertCircle,
} from "lucide-react"
import { useLedgerState, useLedgerActions } from "@/hooks/use-ledger"
import { computeSaleAggregate } from "@/lib/ledger/selectors"
import type { Sale } from "@/lib/ledger/types"
import { BillProofModal } from "@/components/BillProofModal"
import { toast } from "sonner"

export function SalesPage() {
  const state = useLedgerState()
  const { deleteSale } = useLedgerActions()

  const [activeTab, setActiveTab] = useState<string>("all")
  const [search, setSearch] = useState("")

  // Bill proof preview modal
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null)
  const [proofOpen, setProofOpen] = useState(false)

  // Compute sale aggregates
  const salesWithAgg = state.sales.map((sale) => {
    const agg = computeSaleAggregate(state, sale.id)
    const customer = state.customers.find((c) => c.id === sale.customerId)
    return {
      sale,
      customer,
      agg,
      paid: agg?.paid ?? 0,
      outstanding: agg?.outstanding ?? sale.saleAmount,
      status: agg?.status ?? "Unpaid",
    }
  })

  // Metric sums
  const totalSalesAmount = salesWithAgg.reduce((sum, item) => sum + item.sale.saleAmount, 0)
  const totalCollectedAmount = salesWithAgg.reduce((sum, item) => sum + item.paid, 0)
  const totalUnpaidAmount = salesWithAgg.reduce((sum, item) => sum + item.outstanding, 0)

  // Filtering
  const filteredSales = salesWithAgg.filter(({ sale, customer, status }) => {
    // Tab filter
    if (activeTab === "unpaid" && status !== "Unpaid") return false
    if (activeTab === "partial" && status !== "Partially Paid") return false
    if (activeTab === "paid" && status !== "Paid") return false

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase()
      const matchBill = sale.billNumber.toLowerCase().includes(q)
      const matchSaree = sale.sareeName.toLowerCase().includes(q)
      const matchCust = customer?.name.toLowerCase().includes(q) ?? false
      const matchPhone = customer?.phone.includes(q) ?? false
      if (!matchBill && !matchSaree && !matchCust && !matchPhone) return false
    }
    return true
  })

  function handleDeleteSale(saleId: Sale["id"], billNumber: string) {
    if (
      window.confirm(
        `Are you sure you want to delete bill ${billNumber}? This will also remove any payments made towards it.`,
      )
    ) {
      const res = deleteSale(saleId)
      if (res.ok) {
        toast.success(`Bill ${billNumber} deleted.`)
      } else {
        toast.error(res.error)
      }
    }
  }

  function handleViewBill(sale: Sale) {
    setSelectedSale(sale)
    setProofOpen(true)
  }

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Saree Sales & Bills</h1>
          <p className="text-sm text-muted-foreground">
            View all recorded saree bills, amounts received, and remaining customer dues.
          </p>
        </div>
        <Button asChild size="default" className="gap-2">
          <Link to="/sales/new">
            <Plus className="h-4 w-4" /> Record New Saree Sale
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <MiniSummary label="Total Sales" value={formatCurrency(totalSalesAmount)} />
        <MiniSummary
          label="Total Collected"
          value={formatCurrency(totalCollectedAmount)}
          tone="good"
        />
        <MiniSummary
          label="Pending / Unpaid Dues"
          value={formatCurrency(totalUnpaidAmount)}
          tone="warn"
        />
      </div>

      <Card>
        <CardHeader className="border-b">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full md:w-auto">
              <TabsList>
                <TabsTrigger value="all">All ({salesWithAgg.length})</TabsTrigger>
                <TabsTrigger value="unpaid">
                  Unpaid ({salesWithAgg.filter((s) => s.status === "Unpaid").length})
                </TabsTrigger>
                <TabsTrigger value="partial">
                  Partially Paid ({salesWithAgg.filter((s) => s.status === "Partially Paid").length}
                  )
                </TabsTrigger>
                <TabsTrigger value="paid">
                  Fully Paid ({salesWithAgg.filter((s) => s.status === "Paid").length})
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="flex w-full items-center gap-2 md:w-auto">
              <div className="relative flex-1 md:w-72">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 pl-9 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  placeholder="Search bill, saree, customer…"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-left">Bill No</th>
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-left">Customer</th>
                  <th className="px-4 py-3 text-left">Saree Details</th>
                  <th className="px-4 py-3 text-right">Bill Total</th>
                  <th className="px-4 py-3 text-right">Paid</th>
                  <th className="px-4 py-3 text-right">Remaining Due</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredSales.length === 0 ? (
                  <tr>
                    <td
                      colSpan={9}
                      className="px-4 py-16 text-center text-xs text-muted-foreground"
                    >
                      <Receipt className="mx-auto mb-2 h-7 w-7 opacity-40" />
                      {salesWithAgg.length === 0
                        ? "No saree sales recorded yet. Click 'Record New Saree Sale' above."
                        : "No sales match your current search/filter."}
                    </td>
                  </tr>
                ) : (
                  filteredSales.map(({ sale, customer, paid, outstanding, status }) => (
                    <tr key={sale.id} className="transition-colors hover:bg-muted/30">
                      <td className="px-4 py-3 font-semibold text-primary">
                        <button
                          type="button"
                          onClick={() => handleViewBill(sale)}
                          className="text-left hover:underline"
                        >
                          {sale.billNumber}
                        </button>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                        {formatDate(sale.saleDateISO)}
                      </td>
                      <td className="px-4 py-3 font-medium">
                        {customer ? (
                          <Link
                            to={`/customers/${customer.id}`}
                            className="text-foreground hover:underline"
                          >
                            {customer.name}
                          </Link>
                        ) : (
                          "Unknown Customer"
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-foreground">{sale.sareeName}</div>
                        {sale.sareeCode && (
                          <div className="text-xs text-muted-foreground">
                            Code: {sale.sareeCode}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-medium">
                        {formatCurrency(sale.saleAmount)}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-emerald-600">
                        {formatCurrency(paid)}
                      </td>
                      <td className="px-4 py-3 text-right font-bold">
                        <span className={outstanding > 0 ? "text-amber-600" : "text-emerald-600"}>
                          {formatCurrency(outstanding)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <StatusBadge status={status} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 gap-1 text-xs"
                            onClick={() => handleViewBill(sale)}
                            title="View & Print Bill Proof"
                          >
                            <Printer className="h-3.5 w-3.5" /> Bill
                          </Button>
                          {outstanding > 0 && customer && (
                            <Button
                              asChild
                              variant="outline"
                              size="sm"
                              className="h-8 gap-1 text-xs"
                            >
                              <Link
                                to={`/payments/new?customerId=${customer.id}&saleId=${sale.id}`}
                              >
                                <CreditCard className="h-3.5 w-3.5" /> Pay
                              </Link>
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive/70 hover:text-destructive"
                            onClick={() => handleDeleteSale(sale.id, sale.billNumber)}
                            title="Delete Bill"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Bill & Proof Preview Modal */}
      {selectedSale && (
        <BillProofModal
          open={proofOpen}
          onOpenChange={setProofOpen}
          sale={selectedSale}
          customer={state.customers.find((c) => c.id === selectedSale.customerId) || null}
          payments={state.payments}
        />
      )}
    </div>
  )
}

function MiniSummary({
  label,
  value,
  tone = "default",
}: {
  label: string
  value: string
  tone?: "default" | "good" | "warn"
}) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div
        className={`mt-2 text-2xl font-bold tracking-tight ${
          tone === "warn"
            ? "text-amber-600"
            : tone === "good"
              ? "text-emerald-600"
              : "text-foreground"
        }`}
      >
        {value}
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: "Paid" | "Partially Paid" | "Unpaid" }) {
  if (status === "Paid") {
    return (
      <Badge className="gap-1 border-emerald-300 bg-emerald-500/15 text-xs font-medium text-emerald-700 hover:bg-emerald-500/20 dark:border-emerald-800">
        <CheckCircle2 className="h-3 w-3" /> Paid
      </Badge>
    )
  }
  if (status === "Partially Paid") {
    return (
      <Badge className="gap-1 border-amber-300 bg-amber-500/15 text-xs font-medium text-amber-700 hover:bg-amber-500/20 dark:border-amber-800">
        <Clock className="h-3 w-3" /> Partial
      </Badge>
    )
  }
  return (
    <Badge
      variant="outline"
      className="gap-1 border-red-300 bg-red-500/10 text-xs font-medium text-red-700"
    >
      <AlertCircle className="h-3 w-3" /> Unpaid
    </Badge>
  )
}
