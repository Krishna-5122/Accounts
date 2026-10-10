import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { formatCurrency, formatDate } from "@/lib/utils"
import { Printer, MessageCircle } from "lucide-react"
import type { Sale, Customer, Payment } from "@/lib/ledger/types"

interface BillProofModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sale: Sale | null
  customer: Customer | null
  payments?: Payment[]
  businessName?: string
  businessPhone?: string
}

export function BillProofModal({
  open,
  onOpenChange,
  sale,
  customer,
  payments = [],
  businessName = "Saree Collections",
  businessPhone = "",
}: BillProofModalProps) {
  if (!sale || !customer) return null

  const salePayments = payments.filter((p) => p.saleId === sale.id)
  const totalPaid = salePayments.reduce((sum, p) => sum + p.amount, 0)
  const remainingDue = Math.max(0, sale.saleAmount - totalPaid)
  const isFullyPaid = remainingDue <= 0.0001

  // Clean phone number for WhatsApp URL (e.g. 919876543210)
  const cleanPhone = customer.phone.replace(/[^0-9]/g, "")
  const whatsappPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone

  const itemsText =
    sale.items && sale.items.length > 0
      ? sale.items
          .map(
            (it, i) =>
              `${i + 1}. ${it.sareeName}${it.sareeCode ? ` (${it.sareeCode})` : ""} - ${it.quantity} pcs @ ${formatCurrency(it.rate)} = ${formatCurrency(it.amount)}`,
          )
          .join("\n")
      : `*Saree:* ${sale.sareeName}${sale.sareeCode ? ` (${sale.sareeCode})` : ""}\n*Quantity:* ${sale.quantity}`

  const shareText = `*${businessName.toUpperCase()} - BILL RECEIPT*
--------------------------------
*Bill No:* ${sale.billNumber}
*Date:* ${formatDate(sale.saleDateISO)}
*Customer:* ${customer.name}
--------------------------------
${itemsText}
--------------------------------
*Total Bill Amount:* ${formatCurrency(sale.saleAmount)}
*Paid Amount:* ${formatCurrency(totalPaid)}
*REMAINING BALANCE:* ${formatCurrency(remainingDue)}
--------------------------------
*Status:* ${isFullyPaid ? "FULLY PAID" : "BALANCE PENDING"}
Thank you for shopping with us!`

  const whatsappUrl = whatsappPhone
    ? `https://wa.me/${whatsappPhone}?text=${encodeURI(shareText)}`
    : `https://wa.me/?text=${encodeURI(shareText)}`

  function handlePrint() {
    window.print()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg overflow-hidden p-0 print:m-0 print:border-none print:p-0 print:shadow-none">
        <DialogHeader className="border-b bg-muted/40 p-4 print:hidden">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-base font-semibold">Bill & Proof Receipt</DialogTitle>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={handlePrint} className="h-8 gap-1">
                <Printer className="h-3.5 w-3.5" /> Print
              </Button>
              <Button
                asChild
                size="sm"
                className="h-8 gap-1 bg-emerald-600 text-white hover:bg-emerald-700"
              >
                <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
                </a>
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Printable Receipt Paper Body */}
        <div className="bg-white p-6 font-sans text-slate-900 print:p-2" id="printable-bill">
          {/* Header */}
          <div className="border-b border-dashed border-slate-300 pb-4 text-center">
            <h2 className="text-xl font-bold tracking-tight text-slate-900">{businessName}</h2>
            <p className="mt-0.5 text-xs text-slate-500">Saree Business & Khata Proof</p>
            {businessPhone && <p className="text-xs text-slate-600">Ph: {businessPhone}</p>}
          </div>

          {/* Meta Info */}
          <div className="grid grid-cols-2 gap-2 border-b border-dashed border-slate-300 py-3 text-xs">
            <div>
              <span className="block text-slate-500">Bill Number:</span>
              <span className="font-semibold text-slate-800">{sale.billNumber}</span>
            </div>
            <div className="text-right">
              <span className="block text-slate-500">Date:</span>
              <span className="font-semibold text-slate-800">{formatDate(sale.saleDateISO)}</span>
            </div>
            <div>
              <span className="block text-slate-500">Customer Name:</span>
              <span className="font-bold text-slate-900">{customer.name}</span>
            </div>
            <div className="text-right">
              <span className="block text-slate-500">Phone:</span>
              <span className="font-medium text-slate-800">{customer.phone || "—"}</span>
            </div>
          </div>

          {/* Saree Details */}
          <div className="border-b border-slate-200 py-4">
            <div className="mb-2 text-xs font-semibold uppercase text-slate-500">
              Purchased Saree Items ({sale.items && sale.items.length > 0 ? sale.items.length : 1})
            </div>
            {sale.items && sale.items.length > 0 ? (
              <div className="divide-y border rounded text-xs">
                <div className="grid grid-cols-12 bg-slate-100 p-2 font-semibold text-slate-700">
                  <span className="col-span-6">Saree Description</span>
                  <span className="col-span-2 text-center">Qty</span>
                  <span className="col-span-2 text-right">Rate</span>
                  <span className="col-span-2 text-right">Total</span>
                </div>
                {sale.items.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-12 p-2 items-center text-slate-800">
                    <div className="col-span-6">
                      <div className="font-semibold text-slate-900">{item.sareeName}</div>
                      {item.sareeCode && (
                        <div className="text-[11px] text-slate-500">Code: {item.sareeCode}</div>
                      )}
                    </div>
                    <span className="col-span-2 text-center font-medium">{item.quantity}</span>
                    <span className="col-span-2 text-right">{formatCurrency(item.rate)}</span>
                    <span className="col-span-2 text-right font-bold text-slate-900">
                      {formatCurrency(item.amount)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-start justify-between text-sm">
                <div>
                  <div className="font-semibold text-slate-900">{sale.sareeName}</div>
                  {sale.sareeCode && (
                    <div className="text-xs text-slate-500">Design Code: {sale.sareeCode}</div>
                  )}
                  {sale.description && (
                    <div className="text-xs text-slate-500">{sale.description}</div>
                  )}
                  <div className="mt-0.5 text-xs text-slate-600">
                    Qty: {sale.quantity} × {formatCurrency(sale.rate)}
                  </div>
                </div>
                <div className="text-right font-bold text-slate-900">
                  {formatCurrency(sale.saleAmount)}
                </div>
              </div>
            )}
          </div>

          {/* Payment History breakdown */}
          <div className="space-y-1.5 border-b border-dashed border-slate-300 py-3 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Total Bill Amount:</span>
              <span className="font-semibold text-slate-800">
                {formatCurrency(sale.saleAmount)}
              </span>
            </div>
            {salePayments.map((p, idx) => (
              <div key={p.id || idx} className="flex justify-between text-emerald-700">
                <span>
                  Paid ({p.paymentMethod}) on {formatDate(p.paymentDateISO)}:
                </span>
                <span className="font-semibold">- {formatCurrency(p.amount)}</span>
              </div>
            ))}
            {salePayments.length === 0 && (
              <div className="flex justify-between text-amber-700">
                <span>Initial Payment:</span>
                <span>₹0.00</span>
              </div>
            )}
          </div>

          {/* Remaining Outstanding Balance */}
          <div className="mt-3 flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-3">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Remaining Balance
              </div>
              <div className="text-xs text-slate-500">
                {isFullyPaid ? "Fully Paid" : "Balance Due"}
              </div>
            </div>
            <div
              className={`text-xl font-bold ${isFullyPaid ? "text-emerald-700" : "text-amber-700"}`}
            >
              {formatCurrency(remainingDue)}
            </div>
          </div>

          {/* Footer note */}
          <div className="mt-5 text-center text-[11px] text-slate-400">
            <p>Authorized Digital Bill & Proof Record</p>
            <p className="mt-0.5">Thank you for your business!</p>
          </div>
        </div>

        {/* Modal Bottom Actions */}
        <div className="flex items-center justify-between gap-2 border-t bg-muted/30 p-3 print:hidden">
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handlePrint} className="gap-1.5">
              <Printer className="h-3.5 w-3.5" /> Print Bill
            </Button>
            <Button
              asChild
              size="sm"
              className="gap-1.5 bg-emerald-600 text-white hover:bg-emerald-700"
            >
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="h-3.5 w-3.5" /> Share on WhatsApp
              </a>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
