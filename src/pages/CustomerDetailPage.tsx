import { Link, useParams } from "react-router-dom"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { formatCurrency, formatDate } from "@/lib/utils"
import {
  ArrowLeft,
  IndianRupee,
  Receipt,
  Wallet,
  PlusCircle,
  CreditCard,
  Edit,
  FileText,
  Printer,
  Phone,
  MapPin,
} from "lucide-react"

export function CustomerDetailPage() {
  const { customerId } = useParams()

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon">
          <Link to="/customers" aria-label="Back to customers">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Customer Overview</h1>
          <p className="text-xs text-muted-foreground">ID: {customerId ?? "—"}</p>
        </div>
      </div>

      <Card>
        <CardHeader className="flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-xl font-semibold text-primary">
              L
            </div>
            <div>
              <CardTitle className="text-xl">Lakshmi Devi</CardTitle>
              <CardDescription className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                <span className="inline-flex items-center gap-1">
                  <Phone className="h-3 w-3" /> 98765 43210
                </span>
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> Chennai, Tamil Nadu
                </span>
                <span>Customer since {formatDate(new Date())}</span>
              </CardDescription>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild size="sm">
              <Link to={`/sales/new?customerId=${customerId ?? ""}`}>
                <PlusCircle className="h-4 w-4" /> New Sale
              </Link>
            </Button>
            <Button asChild size="sm" variant="secondary">
              <Link to={`/payments/new?customerId=${customerId ?? ""}`}>
                <CreditCard className="h-4 w-4" /> Add Payment
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link to={`/customers/${customerId ?? ""}/edit`}>
                <Edit className="h-4 w-4" /> Edit
              </Link>
            </Button>
            <Button asChild size="sm" variant="ghost">
              <Link to={`/customers/${customerId ?? ""}/statement`}>
                <FileText className="h-4 w-4" /> Statement
              </Link>
            </Button>
          </div>
        </CardHeader>
        <Separator />
        <CardContent className="grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-4">
          <Stat icon={<IndianRupee className="h-4 w-4" />} label="Total Sales" value={formatCurrency(0)} />
          <Stat icon={<Wallet className="h-4 w-4" />} label="Total Paid" value={formatCurrency(0)} />
          <Stat
            icon={<Receipt className="h-4 w-4" />}
            label="Outstanding Balance"
            value={formatCurrency(0)}
            tone="warn"
          />
          <Stat label="Number of Purchases" value="0" />
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Customer Ledger</CardTitle>
            <CardDescription>Every transaction, chronologically.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-md border">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 text-left">Date</th>
                    <th className="px-3 py-2 text-left">Type</th>
                    <th className="px-3 py-2 text-left">Description</th>
                    <th className="px-3 py-2 text-right">Debit (₹)</th>
                    <th className="px-3 py-2 text-right">Credit (₹)</th>
                    <th className="px-3 py-2 text-right">Balance (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td colSpan={6} className="px-3 py-10 text-center text-xs text-muted-foreground">
                      Ledger will populate after first sale or payment.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Print</CardTitle>
              <CardDescription>Share with your customer.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <Button variant="outline" className="justify-start">
                <Printer className="mr-2 h-4 w-4" /> Print / Download Statement
              </Button>
              <Button variant="ghost" className="justify-start">
                <FileText className="mr-2 h-4 w-4" /> View Last Bill
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Notes</CardTitle>
              <CardDescription>Visible to staff only.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Notes can be added in Phase 4.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function Stat({
  icon,
  label,
  value,
  tone = "default",
}: {
  icon?: React.ReactNode
  label: string
  value: string
  tone?: "default" | "warn"
}) {
  return (
    <div
      className={
        tone === "warn"
          ? "rounded-lg border border-amber-200 bg-amber-50/60 p-4"
          : "rounded-lg border bg-card p-4"
      }
    >
      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="mt-2 text-xl font-semibold tracking-tight">{value}</div>
    </div>
  )
}
