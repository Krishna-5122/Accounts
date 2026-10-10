import { useState } from "react"
import { Link } from "react-router-dom"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/utils"
import {
  Plus,
  Search,
  UserPlus,
  Phone,
  ChevronRight,
  MapPin,
  CreditCard,
  Trash2,
  Users,
} from "lucide-react"
import { useLedgerState, useLedgerActions } from "@/hooks/use-ledger"
import { computeCustomerAggregate } from "@/lib/ledger/selectors"
import { toast } from "sonner"
import type { UUID } from "@/types"

export function CustomersPage() {
  const state = useLedgerState()
  const { deleteCustomer } = useLedgerActions()
  const [search, setSearch] = useState("")

  const customersWithAgg = state.customers.map((c) => ({
    customer: c,
    agg: computeCustomerAggregate(state, c.id),
  }))

  const filtered = customersWithAgg.filter(({ customer }) => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      customer.name.toLowerCase().includes(q) ||
      customer.phone.includes(q) ||
      customer.address.toLowerCase().includes(q)
    )
  })

  function handleDeleteCustomer(id: UUID, name: string) {
    if (
      window.confirm(
        `Are you sure you want to delete customer "${name}"? All their saree sales and payment records will also be removed.`,
      )
    ) {
      const res = deleteCustomer(id)
      if (res.ok) {
        toast.success(`Customer "${name}" deleted.`)
      } else {
        toast.error(res.error)
      }
    }
  }

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Customer Directory & Khata</h1>
          <p className="text-sm text-muted-foreground">
            Manage your saree customers, track outstanding balances, and view transaction history.
          </p>
        </div>
        <Button asChild className="gap-2">
          <Link to="/customers/new">
            <UserPlus className="h-4 w-4" /> Add New Customer
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <div className="relative w-full max-w-sm">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, phone, or area…"
                className="pl-9"
              />
            </div>
            <div className="text-xs text-muted-foreground">
              Total Customers: <strong className="text-foreground">{state.customers.length}</strong>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {filtered.length === 0 ? (
              <div className="px-6 py-16 text-center text-sm text-muted-foreground">
                <Users className="mx-auto mb-3 h-8 w-8 opacity-40" />
                <p className="font-semibold text-foreground">
                  {state.customers.length === 0
                    ? "No customers yet."
                    : "No customers matching your search."}
                </p>
                <p className="mt-1 text-xs">
                  Add your saree customers to start tracking their bills and balances.
                </p>
                {state.customers.length === 0 && (
                  <Button asChild size="sm" className="mt-4 gap-1.5">
                    <Link to="/customers/new">
                      <UserPlus className="h-4 w-4" /> Add First Customer
                    </Link>
                  </Button>
                )}
              </div>
            ) : (
              filtered.map(({ customer, agg }) => {
                const outstanding = agg?.outstanding ?? 0
                const hasDues = outstanding > 0.0001

                return (
                  <div
                    key={customer.id}
                    className="flex flex-col justify-between gap-4 p-4 transition-colors hover:bg-muted/30 sm:flex-row sm:items-center"
                  >
                    <div className="flex items-start gap-3.5">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-base font-bold text-primary">
                        {customer.name.slice(0, 1).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <Link
                            to={`/customers/${customer.id}`}
                            className="text-base font-bold text-foreground hover:underline"
                          >
                            {customer.name}
                          </Link>
                          {hasDues ? (
                            <Badge
                              variant="outline"
                              className="border-amber-300 bg-amber-500/10 text-[11px] text-amber-700"
                            >
                              Due: {formatCurrency(outstanding)}
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="border-emerald-300 bg-emerald-500/10 text-[11px] text-emerald-700"
                            >
                              All Clear
                            </Badge>
                          )}
                        </div>

                        <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                          {customer.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" /> {customer.phone}
                            </span>
                          )}
                          {customer.address && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" /> {customer.address}
                            </span>
                          )}
                          <span>
                            {agg?.purchaseCount ?? 0}{" "}
                            {agg?.purchaseCount === 1 ? "Saree" : "Sarees"} bought
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center justify-between gap-3 sm:justify-end">
                      <div className="text-left sm:text-right">
                        <div className="text-xs text-muted-foreground">Outstanding Balance</div>
                        <div
                          className={`text-base font-bold ${hasDues ? "text-amber-600" : "text-emerald-600"}`}
                        >
                          {formatCurrency(outstanding)}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Button asChild size="sm" variant="outline" className="h-8 gap-1 text-xs">
                          <Link to={`/sales/new?customerId=${customer.id}`}>
                            <Plus className="h-3.5 w-3.5" /> Saree Sale
                          </Link>
                        </Button>
                        {hasDues && (
                          <Button
                            asChild
                            size="sm"
                            variant="secondary"
                            className="h-8 gap-1 text-xs"
                          >
                            <Link to={`/payments/new?customerId=${customer.id}`}>
                              <CreditCard className="h-3.5 w-3.5" /> Pay
                            </Link>
                          </Button>
                        )}
                        <Button asChild size="sm" variant="ghost" className="h-8 w-8 p-0">
                          <Link to={`/customers/${customer.id}`}>
                            <ChevronRight className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive/70 hover:text-destructive"
                          onClick={() => handleDeleteCustomer(customer.id, customer.name)}
                          title="Delete Customer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
