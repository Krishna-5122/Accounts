import { useState, type ReactNode } from "react"
import { Link, useParams } from "react-router-dom"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { formatCurrency, formatDate } from "@/lib/utils"
import {
  ArrowLeft,
  IndianRupee,
  Receipt,
  Wallet,
  PlusCircle,
  CreditCard,
  Printer,
  Phone,
  MapPin,
  MessageCircle,
  ShoppingBag,
  FileSpreadsheet,
} from "lucide-react"
import { exportCustomerLedgerToExcel } from "@/lib/export"
import { useLedgerState } from "@/hooks/use-ledger"
import {
  getCustomerById,
  computeCustomerAggregate,
  getCustomerLedger,
} from "@/lib/ledger/selectors"
import type { UUID } from "@/types"
import type { Sale } from "@/lib/ledger/types"
import { BillProofModal } from "@/components/BillProofModal"

export function CustomerDetailPage() {
  const { customerId } = useParams()
  const state = useLedgerState()

  const [selectedSale, setSelectedSale] = useState<Sale | null>(null)
  const [proofOpen, setProofOpen] = useState(false)

  const customer = customerId ? getCustomerById(state, customerId as UUID) : null
  const agg = customerId ? computeCustomerAggregate(state, customerId as UUID) : null
  const ledgerEntries = customerId ? getCustomerLedger(state, customerId as UUID) : []

  if (!customer) {
    return (
      <div className="space-y-4 p-8 text-center">
        <p className="text-muted-foreground">Customer not found.</p>
        <Button asChild variant="outline">
          <Link to="/customers">Back to Customers</Link>
        </Button>
      </div>
    )
  }

  const outstanding = agg?.outstanding ?? 0
  const totalSales = agg?.totalSales ?? 0
  const totalPaid = agg?.totalPaid ?? 0
  const purchaseCount = agg?.purchaseCount ?? 0

  // WhatsApp statement message
  const cleanPhone = customer.phone.replace(/[^0-9]/g, "")
  const whatsappPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone
  const statementText = `*KHATA STATEMENT - ${customer.name.toUpperCase()}*
--------------------------------
Total Saree Purchases: ${formatCurrency(totalSales)}
Total Amount Paid: ${formatCurrency(totalPaid)}
*CURRENT BALANCE DUE: ${formatCurrency(outstanding)}*
--------------------------------
Total Sarees: ${purchaseCount}
Please find your account summary. Thank you!`

  const whatsappUrl = whatsappPhone
    ? `https://wa.me/${whatsappPhone}?text=${encodeURI(statementText)}`
    : `https://wa.me/?text=${encodeURI(statementText)}`

  function handlePrintStatement() {
    window.print()
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 md:p-6 lg:p-8">
      <div className="flex items-center gap-3 print:hidden">
        <Button asChild variant="ghost" size="icon">
          <Link to="/customers" aria-label="Back to customers">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Customer Khata & History</h1>
          <p className="text-xs text-muted-foreground">Detailed statement for {customer.name}</p>
        </div>
      </div>

      {/* Customer Profile Card */}
      <Card>
        <CardHeader className="flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/10 text-2xl font-bold text-primary">
              {customer.name.slice(0, 1).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-xl">{customer.name}</CardTitle>
                {outstanding > 0 ? (
                  <Badge
                    variant="outline"
                    className="border-amber-300 bg-amber-500/10 text-amber-700"
                  >
                    Owes {formatCurrency(outstanding)}
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="border-emerald-300 bg-emerald-500/10 text-emerald-700"
                  >
                    All Clear
                  </Badge>
                )}
              </div>
              <CardDescription className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                {customer.phone && (
                  <span className="inline-flex items-center gap-1">
                    <Phone className="h-3 w-3" /> {customer.phone}
                  </span>
                )}
                {customer.address && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> {customer.address}
                  </span>
                )}
                <span>Added: {formatDate(customer.createdAt)}</span>
              </CardDescription>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 print:hidden">
            <Button asChild size="sm">
              <Link to={`/sales/new?customerId=${customer.id}`}>
                <PlusCircle className="h-4 w-4" /> New Saree Sale
              </Link>
            </Button>
            {outstanding > 0 && (
              <Button asChild size="sm" variant="secondary">
                <Link to={`/payments/new?customerId=${customer.id}`}>
                  <CreditCard className="h-4 w-4" /> Record Cash / Pay
                </Link>
              </Button>
            )}
            <Button
              asChild
              size="sm"
              variant="outline"
              className="border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
            >
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="h-4 w-4" /> WhatsApp Statement
              </a>
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                exportCustomerLedgerToExcel(
                  customer,
                  ledgerEntries,
                  totalSales,
                  totalPaid,
                  outstanding,
                )
              }
              className="gap-1.5 border-emerald-300 text-emerald-800 hover:bg-emerald-50 dark:text-emerald-300"
            >
              <FileSpreadsheet className="h-4 w-4 text-emerald-600" /> Download Excel (All Transactions)
            </Button>
            <Button size="sm" variant="outline" onClick={handlePrintStatement} className="gap-1.5">
              <Printer className="h-4 w-4" /> Print / Save PDF Statement
            </Button>
          </div>
        </CardHeader>
        <Separator />
        <CardContent className="grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-4">
          <Stat
            icon={<IndianRupee className="h-4 w-4" />}
            label="Total Saree Purchases"
            value={formatCurrency(totalSales)}
          />
          <Stat
            icon={<Wallet className="h-4 w-4" />}
            label="Total Amount Paid"
            value={formatCurrency(totalPaid)}
            tone="good"
          />
          <Stat
            icon={<Receipt className="h-4 w-4" />}
            label="Current Outstanding Due"
            value={formatCurrency(outstanding)}
            tone={outstanding > 0 ? "warn" : "good"}
          />
          <Stat
            icon={<ShoppingBag className="h-4 w-4" />}
            label="Total Sarees Bought"
            value={`${purchaseCount} Sarees`}
          />
        </CardContent>
      </Card>

      {/* Customer Ledger Book Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-base">
            <span>Customer Ledger Book (Hisab Kitab)</span>
            <span className="text-xs font-normal text-muted-foreground">
              Chronological debit & credit record
            </span>
          </CardTitle>
          <CardDescription>
            Every saree sold adds to debit, every cash/UPI payment deducts from the balance.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-3 py-2.5 text-left">Date</th>
                  <th className="px-3 py-2.5 text-left">Type</th>
                  <th className="px-3 py-2.5 text-left">Particulars / Details</th>
                  <th className="px-3 py-2.5 text-right text-amber-700">Bill Debit (₹)</th>
                  <th className="px-3 py-2.5 text-right text-emerald-700">Cash Credit (₹)</th>
                  <th className="px-3 py-2.5 text-right font-bold">Balance (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {ledgerEntries.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-3 py-10 text-center text-xs text-muted-foreground"
                    >
                      No transactions recorded yet for this customer.
                    </td>
                  </tr>
                ) : (
                  ledgerEntries.map((entry, idx) => {
                    const isSale = entry.type === "Sale"
                    const isPayment = entry.type === "Payment"

                    return (
                      <tr key={idx} className="hover:bg-muted/30">
                        <td className="whitespace-nowrap px-3 py-2.5 font-medium">
                          {formatDate(entry.dateISO)}
                        </td>
                        <td className="px-3 py-2.5">
                          <Badge
                            variant="outline"
                            className={
                              isSale
                                ? "border-amber-300 bg-amber-500/10 text-amber-700"
                                : isPayment
                                  ? "border-emerald-300 bg-emerald-500/10 text-emerald-700"
                                  : "bg-slate-100 text-slate-700"
                            }
                          >
                            {entry.type}
                          </Badge>
                        </td>
                        <td className="px-3 py-2.5 text-foreground">
                          {entry.description}
                          {entry.reference && isSale && (
                            <button
                              type="button"
                              onClick={() => {
                                const found = state.sales.find(
                                  (s) => s.billNumber === entry.reference,
                                )
                                if (found) {
                                  setSelectedSale(found)
                                  setProofOpen(true)
                                }
                              }}
                              className="ml-1.5 font-mono text-xs text-primary underline hover:opacity-80"
                            >
                              ({entry.reference})
                            </button>
                          )}
                          {entry.reference && !isSale && (
                            <span className="ml-1.5 font-mono text-xs text-muted-foreground">
                              ({entry.reference})
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-right font-medium text-amber-700">
                          {entry.debit > 0 ? `+ ${formatCurrency(entry.debit)}` : "—"}
                        </td>
                        <td className="px-3 py-2.5 text-right font-medium text-emerald-700">
                          {entry.credit > 0 ? `- ${formatCurrency(entry.credit)}` : "—"}
                        </td>
                        <td className="px-3 py-2.5 text-right font-bold">
                          <span
                            className={entry.balance > 0 ? "text-amber-600" : "text-emerald-600"}
                          >
                            {formatCurrency(entry.balance)}
                          </span>
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

      {/* Bill & Proof Preview Modal */}
      {selectedSale && (
        <BillProofModal
          open={proofOpen}
          onOpenChange={setProofOpen}
          sale={selectedSale}
          customer={customer}
          payments={state.payments}
        />
      )}
    </div>
  )
}

function Stat({
  label,
  value,
  icon,
  tone = "default",
}: {
  label: string
  value: string
  icon?: ReactNode
  tone?: "default" | "warn" | "good"
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {icon}
        <span>{label}</span>
      </div>
      <div
        className={`text-xl font-bold ${
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
