import { useState } from "react"
import { Link } from "react-router-dom"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatCurrency, formatDate } from "@/lib/utils"
import {
  CalendarDays,
  BarChart3,
  IndianRupee,
  FileSpreadsheet,
  Printer,
  Wallet,
  Users,
  MessageCircle,
} from "lucide-react"
import { useLedgerState } from "@/hooks/use-ledger"
import {
  getCustomerById,
  computeCustomerAggregate,
  getCustomerLedger,
} from "@/lib/ledger/selectors"
import { exportCustomerLedgerToExcel, exportPeriodReportToCSV } from "@/lib/export"
import type { UUID } from "@/types"

export function ReportsPage() {
  const state = useLedgerState()

  const today = new Date()
  const todayISO = today.toISOString().split("T")[0] || ""
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    .toISOString()
    .split("T")[0] || ""

  // State for Period Report
  const [fromDate, setFromDate] = useState<string>(firstDayOfMonth)
  const [toDate, setToDate] = useState<string>(todayISO)

  // State for Customer Statement Report
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(
    state.customers[0]?.id || "",
  )

  // 1. Live Overall Metrics
  const currentMonthPrefix = todayISO.slice(0, 7) // "YYYY-MM"

  const todaySales = state.sales
    .filter((s) => s.saleDateISO === todayISO)
    .reduce((sum, s) => sum + s.saleAmount, 0)

  const monthSales = state.sales
    .filter((s) => s.saleDateISO.startsWith(currentMonthPrefix))
    .reduce((sum, s) => sum + s.saleAmount, 0)

  const todayCollections = state.payments
    .filter((p) => p.paymentDateISO === todayISO)
    .reduce((sum, p) => sum + p.amount, 0)

  const monthCollections = state.payments
    .filter((p) => p.paymentDateISO.startsWith(currentMonthPrefix))
    .reduce((sum, p) => sum + p.amount, 0)

  // 2. Period Filtered Data
  const periodSales = state.sales.filter(
    (s) => s.saleDateISO >= fromDate && s.saleDateISO <= toDate,
  )
  const periodPayments = state.payments.filter(
    (p) => p.paymentDateISO >= fromDate && p.paymentDateISO <= toDate,
  )

  const periodSalesTotal = periodSales.reduce((sum, s) => sum + s.saleAmount, 0)
  const periodCollectionsTotal = periodPayments.reduce((sum, p) => sum + p.amount, 0)
  const periodCash = periodPayments
    .filter((p) => p.paymentMethod === "Cash")
    .reduce((sum, p) => sum + p.amount, 0)
  const periodUPI = periodPayments
    .filter((p) => p.paymentMethod === "UPI")
    .reduce((sum, p) => sum + p.amount, 0)

  // 3. Customer Statement Data
  const selectedCustomer = selectedCustomerId
    ? getCustomerById(state, selectedCustomerId as UUID)
    : null
  const customerAgg = selectedCustomer
    ? computeCustomerAggregate(state, selectedCustomer.id)
    : null
  const customerLedgerEntries = selectedCustomer
    ? getCustomerLedger(state, selectedCustomer.id)
    : []

  function handleExportPeriodCSV() {
    const salesExport = periodSales.map((s) => {
      const cust = state.customers.find((c) => c.id === s.customerId)
      return {
        billNumber: s.billNumber,
        date: s.saleDateISO,
        customerName: cust?.name || "Customer",
        sareeName: s.sareeName,
        amount: s.saleAmount,
      }
    })

    const paymentsExport = periodPayments.map((p) => {
      const cust = state.customers.find((c) => c.id === p.customerId)
      return {
        date: p.paymentDateISO,
        customerName: cust?.name || "Customer",
        method: p.paymentMethod,
        amount: p.amount,
        notes: p.notes,
      }
    })

    exportPeriodReportToCSV(
      fromDate,
      toDate,
      salesExport,
      paymentsExport,
      periodSalesTotal,
      periodCollectionsTotal,
    )
  }

  // Customer Statement WhatsApp Message
  const cleanPhone = selectedCustomer?.phone.replace(/[^0-9]/g, "") || ""
  const whatsappPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone
  const statementMsg = selectedCustomer
    ? `*ACCOUNT STATEMENT - ${selectedCustomer.name.toUpperCase()}*
--------------------------------
Total Saree Purchases: ${formatCurrency(customerAgg?.totalSales ?? 0)}
Total Amount Paid: ${formatCurrency(customerAgg?.totalPaid ?? 0)}
*CURRENT BALANCE DUE: ${formatCurrency(customerAgg?.outstanding ?? 0)}*
--------------------------------
Thank you for shopping with us!`
    : ""
  const whatsappUrl = whatsappPhone
    ? `https://wa.me/${whatsappPhone}?text=${encodeURI(statementMsg)}`
    : `https://wa.me/?text=${encodeURI(statementMsg)}`

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Business Reports & Statements</h1>
        <p className="text-sm text-muted-foreground">
          View daily collections, generate custom date range period reports, and export customer statements.
        </p>
      </div>

      {/* Top Real-time Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <ReportCard
          icon={<BarChart3 className="h-4 w-4" />}
          title="Today's Sales"
          subtitle={formatDate(today)}
          value={formatCurrency(todaySales)}
          badge="Today"
        />
        <ReportCard
          icon={<BarChart3 className="h-4 w-4 text-emerald-600" />}
          title="Monthly Sales"
          subtitle={new Intl.DateTimeFormat("en-IN", { month: "short", year: "numeric" }).format(today)}
          value={formatCurrency(monthSales)}
          badge="This Month"
          tone="good"
        />
        <ReportCard
          icon={<IndianRupee className="h-4 w-4" />}
          title="Today's Collections"
          subtitle={formatDate(today)}
          value={formatCurrency(todayCollections)}
          badge="Today"
        />
        <ReportCard
          icon={<Wallet className="h-4 w-4 text-emerald-600" />}
          title="Monthly Collections"
          subtitle={new Intl.DateTimeFormat("en-IN", { month: "short", year: "numeric" }).format(today)}
          value={formatCurrency(monthCollections)}
          badge="This Month"
          tone="good"
        />
      </div>

      {/* Main Reports Section */}
      <Tabs defaultValue="period" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="period" className="gap-2">
            <CalendarDays className="h-4 w-4" /> Period Report
          </TabsTrigger>
          <TabsTrigger value="customer" className="gap-2">
            <Users className="h-4 w-4" /> Customer Statement
          </TabsTrigger>
        </TabsList>

        {/* 1. Date Range / Period Report */}
        <TabsContent value="period" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-primary" />
                    Date Range Report Generator
                  </CardTitle>
                  <CardDescription>
                    Select any start and end date to calculate total sales, collections, and view transactions.
                  </CardDescription>
                </div>
                <div className="flex flex-wrap items-center gap-2 print:hidden">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleExportPeriodCSV}
                    className="gap-1.5 border-emerald-300 text-emerald-800 hover:bg-emerald-50 dark:text-emerald-300"
                  >
                    <FileSpreadsheet className="h-4 w-4 text-emerald-600" /> Export Excel / CSV
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.print()}
                    className="gap-1.5"
                  >
                    <Printer className="h-4 w-4" /> Print Report
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Date Pickers */}
              <div className="grid gap-4 sm:grid-cols-2 max-w-md">
                <div className="space-y-1.5">
                  <Label htmlFor="from">From Date</Label>
                  <Input
                    id="from"
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="to">To Date</Label>
                  <Input
                    id="to"
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                  />
                </div>
              </div>

              {/* Period Summary KPI Box */}
              <div className="grid gap-3 sm:grid-cols-4 rounded-lg border bg-muted/40 p-4">
                <div>
                  <span className="text-xs text-muted-foreground block">Period Total Sales:</span>
                  <span className="text-xl font-bold text-foreground">
                    {formatCurrency(periodSalesTotal)}
                  </span>
                  <span className="text-xs text-muted-foreground block mt-0.5">
                    {periodSales.length} Saree Bills
                  </span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">Period Collections:</span>
                  <span className="text-xl font-bold text-emerald-600">
                    {formatCurrency(periodCollectionsTotal)}
                  </span>
                  <span className="text-xs text-muted-foreground block mt-0.5">
                    {periodPayments.length} Payments
                  </span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">Cash vs UPI:</span>
                  <div className="text-xs font-semibold text-foreground space-y-0.5 mt-1">
                    <div>Cash: {formatCurrency(periodCash)}</div>
                    <div>UPI: {formatCurrency(periodUPI)}</div>
                  </div>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">Pending Uncollected:</span>
                  <span
                    className={`text-xl font-bold ${
                      periodSalesTotal - periodCollectionsTotal > 0
                        ? "text-amber-600"
                        : "text-emerald-600"
                    }`}
                  >
                    {formatCurrency(Math.max(0, periodSalesTotal - periodCollectionsTotal))}
                  </span>
                </div>
              </div>

              {/* Tables of Sales and Payments in this period */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold flex items-center justify-between">
                  <span>Sales in Selected Period ({periodSales.length})</span>
                </h3>
                <div className="overflow-x-auto rounded-md border">
                  <table className="w-full text-xs">
                    <thead className="bg-muted/40 uppercase text-muted-foreground">
                      <tr>
                        <th className="px-3 py-2 text-left">Bill No</th>
                        <th className="px-3 py-2 text-left">Date</th>
                        <th className="px-3 py-2 text-left">Customer</th>
                        <th className="px-3 py-2 text-left">Saree Particulars</th>
                        <th className="px-3 py-2 text-right">Bill Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {periodSales.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-3 py-8 text-center text-muted-foreground">
                            No sales recorded in this date range.
                          </td>
                        </tr>
                      ) : (
                        periodSales.map((s) => {
                          const cust = state.customers.find((c) => c.id === s.customerId)
                          return (
                            <tr key={s.id} className="hover:bg-muted/30">
                              <td className="px-3 py-2.5 font-semibold text-primary">
                                <Link to="/sales" className="hover:underline">
                                  {s.billNumber}
                                </Link>
                              </td>
                              <td className="px-3 py-2.5 whitespace-nowrap">
                                {formatDate(s.saleDateISO)}
                              </td>
                              <td className="px-3 py-2.5 font-medium">{cust?.name || "Customer"}</td>
                              <td className="px-3 py-2.5">{s.sareeName}</td>
                              <td className="px-3 py-2.5 text-right font-bold">
                                {formatCurrency(s.saleAmount)}
                              </td>
                            </tr>
                          )
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                <h3 className="text-sm font-semibold pt-2">
                  Collections in Selected Period ({periodPayments.length})
                </h3>
                <div className="overflow-x-auto rounded-md border">
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
                      {periodPayments.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-3 py-8 text-center text-muted-foreground">
                            No payments received in this date range.
                          </td>
                        </tr>
                      ) : (
                        periodPayments.map((p) => {
                          const cust = state.customers.find((c) => c.id === p.customerId)
                          return (
                            <tr key={p.id} className="hover:bg-muted/30">
                              <td className="px-3 py-2.5 whitespace-nowrap">
                                {formatDate(p.paymentDateISO)}
                              </td>
                              <td className="px-3 py-2.5 font-medium">{cust?.name || "Customer"}</td>
                              <td className="px-3 py-2.5">
                                <Badge variant="outline" className="text-[10px] py-0">
                                  {p.paymentMethod}
                                </Badge>
                              </td>
                              <td className="px-3 py-2.5 text-right font-bold text-emerald-600">
                                + {formatCurrency(p.amount)}
                              </td>
                              <td className="px-3 py-2.5 text-muted-foreground">{p.notes || "—"}</td>
                            </tr>
                          )
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 2. Customer Statement Tab */}
        <TabsContent value="customer" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" />
                    Customer Khata Statement Generator
                  </CardTitle>
                  <CardDescription>
                    Select any customer to generate, print, or download their complete transaction statement.
                  </CardDescription>
                </div>
                {selectedCustomer && (
                  <div className="flex flex-wrap items-center gap-2 print:hidden">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        exportCustomerLedgerToExcel(
                          selectedCustomer,
                          customerLedgerEntries,
                          customerAgg?.totalSales ?? 0,
                          customerAgg?.totalPaid ?? 0,
                          customerAgg?.outstanding ?? 0,
                        )
                      }
                      className="gap-1.5 border-emerald-300 text-emerald-800 hover:bg-emerald-50 dark:text-emerald-300"
                    >
                      <FileSpreadsheet className="h-4 w-4 text-emerald-600" /> Download Excel
                    </Button>
                    <Button
                      asChild
                      size="sm"
                      variant="outline"
                      className="gap-1.5 border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                    >
                      <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                        <MessageCircle className="h-4 w-4" /> WhatsApp Statement
                      </a>
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => window.print()} className="gap-1.5">
                      <Printer className="h-4 w-4" /> Print / Save PDF
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Customer Selector */}
              <div className="max-w-md space-y-1.5">
                <Label htmlFor="custSelect">Choose Customer</Label>
                <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                  <SelectTrigger id="custSelect">
                    <SelectValue placeholder="Select customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {state.customers.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name} {c.phone ? `(${c.phone})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedCustomer && customerAgg ? (
                <div className="space-y-6">
                  {/* Account Summary Cards */}
                  <div className="grid gap-3 sm:grid-cols-4 rounded-lg border bg-muted/40 p-4">
                    <div>
                      <span className="text-xs text-muted-foreground block">Customer:</span>
                      <span className="text-base font-bold text-foreground">
                        {selectedCustomer.name}
                      </span>
                      <span className="text-xs text-muted-foreground block">
                        {selectedCustomer.phone || "No phone"}
                      </span>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground block">Total Purchases:</span>
                      <span className="text-lg font-bold text-foreground">
                        {formatCurrency(customerAgg.totalSales)}
                      </span>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground block">Total Paid:</span>
                      <span className="text-lg font-bold text-emerald-600">
                        {formatCurrency(customerAgg.totalPaid)}
                      </span>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground block">Balance Due:</span>
                      <span
                        className={`text-xl font-extrabold ${
                          customerAgg.outstanding > 0 ? "text-amber-600" : "text-emerald-600"
                        }`}
                      >
                        {formatCurrency(customerAgg.outstanding)}
                      </span>
                    </div>
                  </div>

                  {/* Transactions Table */}
                  <div className="overflow-x-auto rounded-md border">
                    <table className="w-full text-xs">
                      <thead className="bg-muted/40 uppercase text-muted-foreground">
                        <tr>
                          <th className="px-3 py-2.5 text-left">Date</th>
                          <th className="px-3 py-2.5 text-left">Type</th>
                          <th className="px-3 py-2.5 text-left">Particulars / Details</th>
                          <th className="px-3 py-2.5 text-right text-amber-700">Debit (+₹)</th>
                          <th className="px-3 py-2.5 text-right text-emerald-700">Credit (-₹)</th>
                          <th className="px-3 py-2.5 text-right font-bold">Balance Due</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {customerLedgerEntries.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="px-3 py-8 text-center text-muted-foreground">
                              No transactions recorded for this customer yet.
                            </td>
                          </tr>
                        ) : (
                          customerLedgerEntries.map((entry, idx) => (
                            <tr key={idx} className="hover:bg-muted/30">
                              <td className="px-3 py-2.5 whitespace-nowrap font-medium">
                                {formatDate(entry.dateISO)}
                              </td>
                              <td className="px-3 py-2.5">
                                <Badge
                                  variant="outline"
                                  className={
                                    entry.type === "Sale"
                                      ? "bg-amber-500/10 text-amber-700 border-amber-300"
                                      : entry.type === "Payment"
                                      ? "bg-emerald-500/10 text-emerald-700 border-emerald-300"
                                      : "bg-slate-100 text-slate-700"
                                  }
                                >
                                  {entry.type}
                                </Badge>
                              </td>
                              <td className="px-3 py-2.5 text-foreground">
                                {entry.description}
                                {entry.reference && (
                                  <span className="text-[11px] text-muted-foreground ml-1.5 font-mono">
                                    ({entry.reference})
                                  </span>
                                )}
                              </td>
                              <td className="px-3 py-2.5 text-right text-amber-700 font-semibold">
                                {entry.debit > 0 ? `+ ${formatCurrency(entry.debit)}` : "—"}
                              </td>
                              <td className="px-3 py-2.5 text-right text-emerald-700 font-semibold">
                                {entry.credit > 0 ? `- ${formatCurrency(entry.credit)}` : "—"}
                              </td>
                              <td className="px-3 py-2.5 text-right font-bold">
                                <span
                                  className={
                                    entry.balance > 0 ? "text-amber-600" : "text-emerald-600"
                                  }
                                >
                                  {formatCurrency(entry.balance)}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="text-center py-10 text-sm text-muted-foreground">
                  Please select a customer to view their statement.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function ReportCard({
  icon,
  title,
  subtitle,
  value,
  badge,
  tone = "default",
}: {
  icon: React.ReactNode
  title: string
  subtitle: string
  value: string
  badge: string
  tone?: "default" | "good"
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardDescription className="text-xs">{title}</CardDescription>
            <div
              className={`mt-1 text-lg font-bold tracking-tight ${
                tone === "good" ? "text-emerald-600" : "text-foreground"
              }`}
            >
              {value}
            </div>
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
