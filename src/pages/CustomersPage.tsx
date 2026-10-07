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
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/utils"
import { Plus, Search, UserPlus, Filter, ChevronRight, Phone } from "lucide-react"

export function CustomersPage() {
  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Customers</h1>
          <p className="text-sm text-muted-foreground">
            Manage customers, opening balances, and outstanding accounts.
          </p>
        </div>
        <Button asChild>
          <Link to="/customers/new">
            <UserPlus className="h-4 w-4" /> Add Customer
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader className="border-b">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="relative w-full md:max-w-sm">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search by name, phone, or customer ID…" className="pl-9" />
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="gap-1">
                <Filter className="h-3 w-3" /> All
              </Badge>
              <Button variant="ghost" size="sm">
                Filters
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            <div className="px-6 py-10 text-center text-sm text-muted-foreground">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <Plus className="h-5 w-5" />
              </div>
              <p>No customers yet.</p>
              <p className="mt-1 text-xs">
                Phase 4: Create your first customer to start tracking sales & payments.
              </p>
              <Button asChild size="sm" className="mt-4">
                <Link to="/customers/new">
                  <UserPlus className="h-4 w-4" /> Add your first customer
                </Link>
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between border-t px-6 py-3 text-xs text-muted-foreground">
            <span>Showing 0 of 0 customers</span>
            <div className="flex gap-1">
              <ChevronRight className="h-4 w-4 opacity-50" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quick reference</CardTitle>
          <CardDescription>
            Outstanding Balance = Opening Balance + Total Sales − Total Payments
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 text-sm sm:grid-cols-3">
          <Reference title="Opening balance" body="Captured as an explicit ledger entry — ₹0 by default." />
          <Reference title="Search" body="Server-side search supports customer name, phone, and ID." />
          <Reference title="Archive" body="Archive old customers instead of deleting to preserve ledger history." />
        </CardContent>
      </Card>
    </div>
  )
}

function Reference({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-md border bg-card p-3">
      <div className="font-medium">{title}</div>
      <div className="mt-1 text-xs text-muted-foreground">{body}</div>
    </div>
  )
}

export function CustomerRowSkeleton() {
  return (
    <div className="flex items-center justify-between px-6 py-4">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-muted" />
        <div className="space-y-1">
          <div className="h-4 w-32 rounded bg-muted" />
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Phone className="h-3 w-3" />
            <div className="h-3 w-20 rounded bg-muted" />
          </div>
        </div>
      </div>
      <div className="h-5 w-24 rounded bg-muted" />
    </div>
  )
}

export const sampleFormat = formatCurrency
