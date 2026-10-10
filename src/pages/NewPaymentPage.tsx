import { useState } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { ArrowLeft, CheckCircle2, MessageCircle, Printer, Wallet } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useLedgerState, useLedgerActions } from "@/hooks/use-ledger"
import { computeCustomerAggregate, computeSaleAggregate } from "@/lib/ledger/selectors"
import { formatCurrency, formatDate } from "@/lib/utils"
import { toast } from "sonner"
import type { UUID, PaymentMethod } from "@/types"

export function NewPaymentPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const state = useLedgerState()
  const { addPayment } = useLedgerActions()

  const preselectedCustomerId = searchParams.get("customerId") || ""
  const preselectedSaleId = searchParams.get("saleId") || ""

  const [customerId, setCustomerId] = useState<string>(
    preselectedCustomerId || (state.customers[0]?.id ?? ""),
  )
  const [saleId, setSaleId] = useState<string>(preselectedSaleId || "auto")
  const [paymentDate, setPaymentDate] = useState<string>(
    new Date().toISOString().split("T")[0] || "",
  )
  const [amount, setAmount] = useState("")
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("Cash")
  const [notes, setNotes] = useState("")

  // Receipt popup state
  const [receiptOpen, setReceiptOpen] = useState(false)

  const selectedCustomer = state.customers.find((c) => c.id === customerId)
  const customerAgg = selectedCustomer ? computeCustomerAggregate(state, selectedCustomer.id) : null

  // Get unpaid sales for this customer
  const customerSales = state.sales.filter((s) => s.customerId === customerId)
  const unpaidSales = customerSales
    .map((s) => ({
      sale: s,
      agg: computeSaleAggregate(state, s.id),
    }))
    .filter((item) => item.agg && item.agg.outstanding > 0.0001)

  const currentOutstanding = customerAgg?.outstanding ?? 0
  const paymentAmountNum = parseFloat(amount) || 0
  const remainingAfterPayment = Math.max(0, currentOutstanding - paymentAmountNum)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!customerId) {
      toast.error("Please select a customer")
      return
    }
    if (paymentAmountNum <= 0) {
      toast.error("Please enter a payment amount greater than ₹0")
      return
    }
    if (paymentAmountNum > currentOutstanding + 0.0001) {
      toast.error(
        `Payment (₹${paymentAmountNum}) cannot exceed total outstanding dues (₹${currentOutstanding.toFixed(2)})`,
      )
      return
    }

    const payDateObj = new Date(paymentDate + "T12:00:00")
    const targetSaleId = saleId === "auto" ? undefined : (saleId as UUID)

    const res = addPayment({
      customerId: customerId as UUID,
      saleId: targetSaleId,
      paymentDate: payDateObj,
      amount: paymentAmountNum,
      paymentMethod,
      notes: notes.trim() || undefined,
    })

    if (!res.ok) {
      toast.error(res.error)
      return
    }

    setReceiptOpen(true)
    toast.success("Payment recorded and customer balance reduced!")
  }

  // Clean phone number for WhatsApp message
  const cleanPhone = selectedCustomer?.phone.replace(/[^0-9]/g, "") ?? ""
  const whatsappPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone
  const whatsappText = selectedCustomer
    ? `*PAYMENT RECEIVED CONFIRMATION*
--------------------------------
Customer: ${selectedCustomer.name}
Date: ${formatDate(paymentDate)}
Amount Received: ${formatCurrency(paymentAmountNum)} (${paymentMethod})
--------------------------------
Previous Balance: ${formatCurrency(currentOutstanding)}
*REMAINING BALANCE DUE:* ${formatCurrency(remainingAfterPayment)}
--------------------------------
Thank you for your payment!`
    : ""

  const whatsappUrl = whatsappPhone
    ? `https://wa.me/${whatsappPhone}?text=${encodeURI(whatsappText)}`
    : `https://wa.me/?text=${encodeURI(whatsappText)}`

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4 md:p-6 lg:p-8">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon">
          <Link to="/payments" aria-label="Back to payments">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Record Cash / Payment</h1>
          <p className="text-xs text-muted-foreground">
            Deduct amount paid by customer and update remaining balance.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Customer & Due Amount</CardTitle>
            <CardDescription>Select the customer making the payment.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="customer">Customer *</Label>
              <Select value={customerId} onValueChange={setCustomerId}>
                <SelectTrigger id="customer">
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent>
                  {state.customers.map((c) => {
                    const agg = computeCustomerAggregate(state, c.id)
                    return (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name} — Due: {formatCurrency(agg?.outstanding ?? 0)}
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Current customer dues badge card */}
            {selectedCustomer && (
              <div className="flex items-center justify-between rounded-lg border border-amber-500/20 bg-amber-500/10 p-3.5">
                <div>
                  <div className="text-xs font-semibold text-amber-900 dark:text-amber-300">
                    Current Outstanding Due
                  </div>
                  <div className="text-xs text-muted-foreground">{selectedCustomer.name} owes</div>
                </div>
                <div className="text-xl font-bold text-amber-700 dark:text-amber-400">
                  {formatCurrency(currentOutstanding)}
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="saleSelect">Apply To Bill (Optional)</Label>
              <Select value={saleId} onValueChange={setSaleId}>
                <SelectTrigger id="saleSelect">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Automatic (Apply to oldest unpaid bills)</SelectItem>
                  {unpaidSales.map((item) => (
                    <SelectItem key={item.sale.id} value={item.sale.id}>
                      {item.sale.billNumber} — {item.sale.sareeName} (Due:{" "}
                      {formatCurrency(item.agg?.outstanding ?? 0)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Payment Details</CardTitle>
            <CardDescription>Enter cash or digital amount received.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="amount">Amount Given / Paid (₹) *</Label>
                <Input
                  id="amount"
                  type="number"
                  min="1"
                  max={currentOutstanding > 0 ? currentOutstanding : undefined}
                  step="any"
                  placeholder="e.g. 1000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="paymentMethod">Payment Mode</Label>
                <Select
                  value={paymentMethod}
                  onValueChange={(val) => setPaymentMethod(val as PaymentMethod)}
                >
                  <SelectTrigger id="paymentMethod">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Cash">Cash (In Hand)</SelectItem>
                    <SelectItem value="UPI">UPI (GPay / PhonePe / Paytm)</SelectItem>
                    <SelectItem value="Other">Bank Transfer / Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="paymentDate">Payment Date *</Label>
              <Input
                id="paymentDate"
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="notes">Notes / Reference (Optional)</Label>
              <Input
                id="notes"
                placeholder="e.g. Paid by aunt in morning, GPay UTR 1234"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            {/* Remaining amount preview */}
            {paymentAmountNum > 0 && (
              <div className="flex items-center justify-between rounded-lg border bg-muted/60 p-3">
                <div>
                  <span className="block text-xs text-muted-foreground">
                    Remaining Balance After This Payment:
                  </span>
                  <span className="text-xs font-medium text-emerald-600">
                    Reduces by {formatCurrency(paymentAmountNum)}
                  </span>
                </div>
                <div className="text-lg font-bold text-slate-800 dark:text-slate-200">
                  {formatCurrency(remainingAfterPayment)}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-3">
          <Button type="button" variant="outline" asChild>
            <Link to="/payments">Cancel</Link>
          </Button>
          <Button type="submit" size="lg" className="gap-2">
            <Wallet className="h-4 w-4" /> Save Payment & Deduct Balance
          </Button>
        </div>
      </form>

      {/* Payment Proof Modal */}
      <Dialog
        open={receiptOpen}
        onOpenChange={(open) => {
          setReceiptOpen(open)
          if (!open) navigate("/payments")
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" /> Payment Recorded
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2 text-sm">
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-center dark:border-emerald-900 dark:bg-emerald-950/20">
              <span className="block text-xs font-semibold uppercase text-emerald-700 dark:text-emerald-400">
                Amount Received
              </span>
              <span className="text-3xl font-extrabold text-emerald-800 dark:text-emerald-300">
                {formatCurrency(paymentAmountNum)}
              </span>
              <span className="mt-1 block text-xs text-muted-foreground">
                Via {paymentMethod} on {formatDate(paymentDate)}
              </span>
            </div>

            <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
              <div className="flex justify-between">
                <span>Customer:</span>
                <span className="font-semibold text-foreground">{selectedCustomer?.name}</span>
              </div>
              <div className="flex justify-between">
                <span>Updated Remaining Due:</span>
                <span className="font-bold text-amber-600">
                  {formatCurrency(remainingAfterPayment)}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <Button
                asChild
                className="w-full gap-2 bg-emerald-600 text-white hover:bg-emerald-700"
              >
                <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="h-4 w-4" /> Send WhatsApp Acknowledgment
                </a>
              </Button>
              <Button variant="outline" className="w-full gap-2" onClick={() => window.print()}>
                <Printer className="h-4 w-4" /> Print Payment Slip
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
