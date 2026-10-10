import { useState } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { ArrowLeft, Receipt, Sparkles, UserPlus, Plus, Trash2, ShoppingBag } from "lucide-react"
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
import { useLedgerState, useLedgerActions } from "@/hooks/use-ledger"
import { formatCurrency } from "@/lib/utils"
import { toast } from "sonner"
import type { UUID, PaymentMethod } from "@/types"
import type { Sale, Payment, SareeItem } from "@/lib/ledger/types"
import { BillProofModal } from "@/components/BillProofModal"

interface FormSareeItem {
  id: string
  sareeName: string
  sareeCode: string
  quantity: string
  rate: string
  amount: string
}

export function NewSalePage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const state = useLedgerState()
  const { addSale, addCustomer } = useLedgerActions()

  const preselectedCustomerId = searchParams.get("customerId") || ""

  // Customer & Date
  const [customerId, setCustomerId] = useState<string>(
    preselectedCustomerId || (state.customers[0]?.id ?? ""),
  )
  const [saleDate, setSaleDate] = useState<string>(new Date().toISOString().split("T")[0] || "")

  // Multiple Saree Items in this bill!
  const [items, setItems] = useState<FormSareeItem[]>([
    {
      id: "1",
      sareeName: "",
      sareeCode: "",
      quantity: "1",
      rate: "",
      amount: "",
    },
  ])

  // Payment states
  const [initialPayment, setInitialPayment] = useState("")
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("Cash")
  const [billNotes, setBillNotes] = useState("")

  // Quick Add Customer inline
  const [showQuickCustomer, setShowQuickCustomer] = useState(false)
  const [quickCustName, setQuickCustName] = useState("")
  const [quickCustPhone, setQuickCustPhone] = useState("")

  // Saved bill proof modal
  const [savedSale, setSavedSale] = useState<Sale | null>(null)
  const [savedInitialPayment, setSavedInitialPayment] = useState<Payment | null>(null)
  const [proofModalOpen, setProofModalOpen] = useState(false)

  // Handlers for dynamic items
  function addItem() {
    setItems((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        sareeName: "",
        sareeCode: "",
        quantity: "1",
        rate: "",
        amount: "",
      },
    ])
  }

  function removeItem(id: string) {
    if (items.length <= 1) return
    setItems((prev) => prev.filter((it) => it.id !== id))
  }

  function updateItem(id: string, field: keyof FormSareeItem, val: string) {
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== id) return it
        const updated = { ...it, [field]: val }
        // Auto compute amount when quantity or rate changes
        if (field === "quantity" || field === "rate") {
          const q = parseInt(field === "quantity" ? val : it.quantity, 10) || 0
          const r = parseFloat(field === "rate" ? val : it.rate) || 0
          if (q > 0 && r > 0) {
            updated.amount = (q * r).toString()
          }
        }
        return updated
      }),
    )
  }

  // Calculate totals across all sarees in this bill
  const totalQuantity = items.reduce((sum, it) => sum + (parseInt(it.quantity, 10) || 0), 0)
  const totalBillAmount = items.reduce((sum, it) => {
    const itemAmt = parseFloat(it.amount) || 0
    if (itemAmt > 0) return sum + itemAmt
    const q = parseInt(it.quantity, 10) || 0
    const r = parseFloat(it.rate) || 0
    return sum + q * r
  }, 0)

  const initialPayNum = parseFloat(initialPayment) || 0
  const remainingDue = Math.max(0, totalBillAmount - initialPayNum)

  function handleQuickAddCustomer(e: React.FormEvent) {
    e.preventDefault()
    if (!quickCustName.trim()) {
      toast.error("Customer name is required")
      return
    }
    const res = addCustomer({
      name: quickCustName.trim(),
      phone: quickCustPhone.trim(),
      openingBalance: 0,
    })
    if (!res.ok) {
      toast.error(res.error)
      return
    }
    setCustomerId(res.value.id)
    setShowQuickCustomer(false)
    setQuickCustName("")
    setQuickCustPhone("")
    toast.success(`Customer "${res.value.name}" added!`)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!customerId) {
      toast.error("Please select a customer (or add a new one)")
      return
    }

    // Validate all items
    for (let i = 0; i < items.length; i++) {
      const it = items[i]
      if (!it || !it.sareeName.trim()) {
        toast.error(`Please enter the Saree Name for item #${i + 1}`)
        return
      }
      const q = parseInt(it.quantity, 10) || 0
      const r = parseFloat(it.rate) || 0
      const amt = parseFloat(it.amount) || q * r
      if (amt <= 0) {
        toast.error(`Please enter a valid rate/amount for item #${i + 1} (${it.sareeName})`)
        return
      }
    }

    if (totalBillAmount <= 0) {
      toast.error("Total bill amount must be greater than ₹0")
      return
    }
    if (initialPayNum > totalBillAmount) {
      toast.error("Paid amount cannot be more than the total bill amount")
      return
    }

    const saleDateObj = new Date(saleDate + "T12:00:00")

    // Construct itemized list
    const parsedItems: SareeItem[] = items.map((it) => {
      const q = parseInt(it.quantity, 10) || 1
      const r = parseFloat(it.rate) || 0
      const amt = parseFloat(it.amount) || q * r
      return {
        id: it.id,
        sareeName: it.sareeName.trim(),
        sareeCode: it.sareeCode.trim() || undefined,
        quantity: q,
        rate: r > 0 ? r : Math.round((amt / q) * 100) / 100,
        amount: amt,
      }
    })

    const firstItem = parsedItems[0]
    if (!firstItem) {
      toast.error("Please add at least one saree item")
      return
    }

    // Summary saree name for quick display
    const summaryName =
      parsedItems.length === 1
        ? firstItem.sareeName
        : `${firstItem.sareeName} (+${parsedItems.length - 1} more)`

    const res = addSale({
      customerId: customerId as UUID,
      saleDate: saleDateObj,
      sareeName: summaryName,
      sareeCode: firstItem.sareeCode,
      description: billNotes.trim() || undefined,
      quantity: totalQuantity,
      rate: totalQuantity > 0 ? Math.round((totalBillAmount / totalQuantity) * 100) / 100 : 0,
      saleAmount: totalBillAmount,
      items: parsedItems,
      initialPayment: initialPayNum > 0 ? initialPayNum : undefined,
      paymentMethod: initialPayNum > 0 ? paymentMethod : undefined,
      notes: billNotes.trim() || undefined,
    })

    if (!res.ok) {
      toast.error(res.error)
      return
    }

    toast.success("Saree Bill generated successfully!", {
      description: `Bill Number: ${res.value.sale.billNumber} (${parsedItems.length} items)`,
    })

    setSavedSale(res.value.sale)
    setSavedInitialPayment(res.value.initialPayment)
    setProofModalOpen(true)
  }

  const selectedCustomer = state.customers.find((c) => c.id === customerId) || null

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 md:p-6 lg:p-8">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon">
          <Link to="/sales" aria-label="Back to sales">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Record Saree Sale (Bill)</h1>
          <p className="text-xs text-muted-foreground">
            Add one or more sarees to this bill, calculate totals, and generate customer proof.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Customer & Date */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-base">
              <span>1. Customer & Sale Date</span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowQuickCustomer(!showQuickCustomer)}
                className="h-8 gap-1 text-xs"
              >
                <UserPlus className="h-3.5 w-3.5" />
                {showQuickCustomer ? "Cancel" : "+ Quick Add Customer"}
              </Button>
            </CardTitle>
            <CardDescription>Select the customer and transaction date.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {showQuickCustomer && (
              <div className="space-y-3 rounded-lg border border-primary/20 bg-primary/5 p-4">
                <div className="text-sm font-semibold text-primary">Quick New Customer</div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="qname">Customer Name *</Label>
                    <Input
                      id="qname"
                      placeholder="e.g. Meena Kumari"
                      value={quickCustName}
                      onChange={(e) => setQuickCustName(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="qphone">Phone / WhatsApp Number</Label>
                    <Input
                      id="qphone"
                      placeholder="e.g. 9876543210"
                      value={quickCustPhone}
                      onChange={(e) => setQuickCustPhone(e.target.value)}
                    />
                  </div>
                </div>
                <Button type="button" size="sm" onClick={handleQuickAddCustomer} className="gap-1">
                  Save & Select Customer
                </Button>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="customer">Select Customer *</Label>
                {state.customers.length === 0 ? (
                  <div className="rounded border border-amber-200 bg-amber-50 p-2.5 text-xs text-amber-600">
                    No customers found yet. Click <strong>+ Quick Add Customer</strong> above.
                  </div>
                ) : (
                  <Select value={customerId} onValueChange={setCustomerId}>
                    <SelectTrigger id="customer">
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
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="saleDate">Saree Sold Date *</Label>
                <Input
                  id="saleDate"
                  type="date"
                  value={saleDate}
                  onChange={(e) => setSaleDate(e.target.value)}
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Multi-Saree Items Section */}
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <ShoppingBag className="h-4 w-4 text-primary" />
                  2. Saree Items in this Bill
                </CardTitle>
                <CardDescription>
                  Add multiple sarees if customer purchased more than one item.
                </CardDescription>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addItem}
                className="h-8 gap-1 text-xs"
              >
                <Plus className="h-3.5 w-3.5" /> + Add Another Saree
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {items.map((item, index) => {
                const itemQty = parseInt(item.quantity, 10) || 1
                const itemRate = parseFloat(item.rate) || 0

                return (
                  <div
                    key={item.id}
                    className="relative rounded-lg border bg-card p-4 transition-all hover:border-primary/40 space-y-3"
                  >
                    <div className="flex items-center justify-between pb-1 border-b text-xs text-muted-foreground">
                      <span className="font-semibold text-foreground">
                        Item #{index + 1}
                      </span>
                      {items.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItem(item.id)}
                          className="h-6 gap-1 text-xs text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-3 w-3" /> Remove Item
                        </Button>
                      )}
                    </div>

                    <div className="grid gap-3 sm:grid-cols-12">
                      <div className="space-y-1 sm:col-span-4">
                        <Label className="text-xs">Saree Name / Type *</Label>
                        <Input
                          placeholder="e.g. Kanchi Pattu, Banarasi Silk, Cotton"
                          value={item.sareeName}
                          onChange={(e) => updateItem(item.id, "sareeName", e.target.value)}
                          required
                        />
                      </div>

                      <div className="space-y-1 sm:col-span-3">
                        <Label className="text-xs">Design / Color Code</Label>
                        <Input
                          placeholder="e.g. Red & Gold, CODE-101"
                          value={item.sareeCode}
                          onChange={(e) => updateItem(item.id, "sareeCode", e.target.value)}
                        />
                      </div>

                      <div className="space-y-1 sm:col-span-1">
                        <Label className="text-xs">Qty</Label>
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateItem(item.id, "quantity", e.target.value)}
                          required
                        />
                      </div>

                      <div className="space-y-1 sm:col-span-2">
                        <Label className="text-xs">Rate (₹)</Label>
                        <Input
                          type="number"
                          min="0"
                          step="any"
                          placeholder="Rate"
                          value={item.rate}
                          onChange={(e) => updateItem(item.id, "rate", e.target.value)}
                          required
                        />
                      </div>

                      <div className="space-y-1 sm:col-span-2">
                        <Label className="text-xs">Total (₹)</Label>
                        <Input
                          type="number"
                          min="0"
                          step="any"
                          placeholder="Amount"
                          value={item.amount || (itemRate > 0 ? (itemQty * itemRate).toString() : "")}
                          onChange={(e) => updateItem(item.id, "amount", e.target.value)}
                          required
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={addItem}
              className="w-full gap-1.5 border-dashed py-5 text-xs text-muted-foreground hover:text-foreground"
            >
              <Plus className="h-4 w-4" /> + Add Another Saree to this Bill
            </Button>
          </CardContent>
        </Card>

        {/* Down payment, live math & Bill Notes */}
        <Card className="border-primary/30">
          <CardHeader className="bg-primary/5 pb-4">
            <CardTitle className="flex items-center justify-between text-base">
              <span>3. Cash / Payment Received & Balance</span>
              <Receipt className="h-5 w-5 text-primary" />
            </CardTitle>
            <CardDescription>
              Enter down payment or advance cash given by the customer today.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="initialPayment">Cash / Amount Paid Today (₹)</Label>
                <Input
                  id="initialPayment"
                  type="number"
                  min="0"
                  max={totalBillAmount || undefined}
                  step="any"
                  placeholder="0 (if fully on credit/unpaid)"
                  value={initialPayment}
                  onChange={(e) => setInitialPayment(e.target.value)}
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
              <Label htmlFor="billNotes">Notes / Particulars (Optional)</Label>
              <Input
                id="billNotes"
                placeholder="e.g. Festival purchase, gift packing requested"
                value={billNotes}
                onChange={(e) => setBillNotes(e.target.value)}
              />
            </div>

            {/* Live calculation summary */}
            <div className="grid gap-3 rounded-lg border bg-muted/60 p-4 sm:grid-cols-4">
              <div>
                <span className="block text-xs text-muted-foreground">Total Sarees:</span>
                <span className="text-base font-bold text-foreground">
                  {totalQuantity} {totalQuantity === 1 ? "Saree" : "Sarees"} ({items.length} items)
                </span>
              </div>
              <div>
                <span className="block text-xs text-muted-foreground">Total Bill Amount:</span>
                <span className="text-xl font-extrabold text-foreground">
                  {formatCurrency(totalBillAmount)}
                </span>
              </div>
              <div>
                <span className="block text-xs text-muted-foreground">Paid Today:</span>
                <span className="text-lg font-semibold text-emerald-600">
                  {formatCurrency(initialPayNum)}
                </span>
              </div>
              <div>
                <span className="block text-xs text-muted-foreground">Remaining Balance Due:</span>
                <span
                  className={`text-xl font-extrabold ${remainingDue > 0 ? "text-amber-600" : "text-emerald-600"}`}
                >
                  {formatCurrency(remainingDue)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button type="button" variant="outline" asChild>
            <Link to="/sales">Cancel</Link>
          </Button>
          <Button type="submit" size="lg" className="gap-2">
            <Sparkles className="h-4 w-4" /> Save Saree Bill & Generate Proof
          </Button>
        </div>
      </form>

      {/* Bill & Proof Receipt Dialog */}
      <BillProofModal
        open={proofModalOpen}
        onOpenChange={(open) => {
          setProofModalOpen(open)
          if (!open) {
            navigate("/sales")
          }
        }}
        sale={savedSale}
        customer={selectedCustomer}
        payments={savedInitialPayment ? [savedInitialPayment] : []}
      />
    </div>
  )
}
