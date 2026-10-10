import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { ArrowLeft, UserPlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useLedgerActions } from "@/hooks/use-ledger"
import { toast } from "sonner"

export function NewCustomerPage() {
  const navigate = useNavigate()
  const { addCustomer } = useLedgerActions()

  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [address, setAddress] = useState("")
  const [openingBalance, setOpeningBalance] = useState("")
  const [notes, setNotes] = useState("")

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) {
      toast.error("Customer name is required")
      return
    }

    const openBalNum = parseFloat(openingBalance) || 0
    if (openBalNum < 0) {
      toast.error("Opening balance cannot be negative")
      return
    }

    const res = addCustomer({
      name: name.trim(),
      phone: phone.trim(),
      address: address.trim(),
      openingBalance: openBalNum,
      notes: notes.trim(),
    })

    if (!res.ok) {
      toast.error(res.error)
      return
    }

    toast.success(`Customer "${res.value.name}" added successfully!`)
    navigate(`/customers/${res.value.id}`)
  }

  return (
    <div className="mx-auto max-w-xl space-y-6 p-4 md:p-6 lg:p-8">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon">
          <Link to="/customers" aria-label="Back to customers">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Add New Customer</h1>
          <p className="text-xs text-muted-foreground">
            Create a customer account to track saree sales and khata dues.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Customer Information</CardTitle>
            <CardDescription>Contact details and past book balance.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Customer Name *</Label>
              <Input
                id="name"
                placeholder="e.g. Radhika Devi, Sravanthi"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone / WhatsApp Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="e.g. 9876543210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
              <p className="text-[11px] text-muted-foreground">
                Used to send bills and payment receipts via WhatsApp.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="address">Address / Area (Optional)</Label>
              <Input
                id="address"
                placeholder="e.g. Street no 2, Near temple, Chennai"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="openingBalance">Old Book Balance / Previous Due (₹)</Label>
              <Input
                id="openingBalance"
                type="number"
                min="0"
                step="any"
                placeholder="0 (if no previous dues)"
                value={openingBalance}
                onChange={(e) => setOpeningBalance(e.target.value)}
              />
              <p className="text-[11px] text-muted-foreground">
                If they already owe money from your old physical notebook, enter it here.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="e.g. Regular festive buyer, likes Kanchi silk sarees"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-3">
          <Button type="button" variant="outline" asChild>
            <Link to="/customers">Cancel</Link>
          </Button>
          <Button type="submit" size="lg" className="gap-2">
            <UserPlus className="h-4 w-4" /> Save Customer
          </Button>
        </div>
      </form>
    </div>
  )
}
