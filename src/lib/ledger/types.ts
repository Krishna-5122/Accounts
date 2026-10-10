import type { UUID, PaymentMethod, SaleStatus } from "@/types"
import type { BILL_NUMBER_PREFIX } from "@/lib/supabase/constants"

export interface Customer {
  id: UUID
  name: string
  phone: string
  address: string
  notes: string
  openingBalance: number
  createdAt: string
  updatedAt: string
}

export interface SareeItem {
  id?: string
  sareeName: string
  sareeCode?: string
  description?: string
  quantity: number
  rate: number
  amount: number
}

export interface Sale {
  id: UUID
  customerId: UUID
  billNumber: string
  saleDateISO: string
  sareeName: string
  sareeCode: string
  description: string
  quantity: number
  rate: number
  saleAmount: number
  items?: SareeItem[]
  notes: string
  createdAt: string
  updatedAt: string
}

export interface Payment {
  id: UUID
  customerId: UUID
  saleId: UUID | null
  paymentDateISO: string
  amount: number
  paymentMethod: PaymentMethod
  notes: string
  createdAt: string
  updatedAt: string
}

export interface BillNumberCounter {
  fy: number
  seq: number
}

export interface LedgerState {
  customers: Customer[]
  sales: Sale[]
  payments: Payment[]
  billNumberCounters: Record<number, number>
  lastUpdated: string
}

export interface NewCustomerInput {
  name: string
  phone?: string
  address?: string
  notes?: string
  openingBalance?: number
}

export interface NewSaleInput {
  customerId: UUID
  saleDate: Date
  sareeName: string
  sareeCode?: string
  description?: string
  quantity: number
  rate?: number
  saleAmount: number
  items?: SareeItem[]
  initialPayment?: number
  paymentMethod?: PaymentMethod
  notes?: string
}

export interface NewPaymentInput {
  customerId: UUID
  saleId?: UUID
  paymentDate: Date
  amount: number
  paymentMethod: PaymentMethod
  notes?: string
}

export type Result<T, E = string> = { ok: true; value: T } | { ok: false; error: E }

export type BillNumber = `${typeof BILL_NUMBER_PREFIX}-${number}-${string}`

export interface CustomerAggregate {
  customer: Customer
  totalSales: number
  totalPaid: number
  outstanding: number
  purchaseCount: number
  status: SaleStatus
}

export interface SaleAggregate {
  sale: Sale
  customer: Customer | undefined
  paid: number
  outstanding: number
  status: SaleStatus
}

export interface LedgerEntry {
  dateISO: string
  type: "Opening Balance" | "Sale" | "Payment"
  description: string
  reference: string | null
  debit: number
  credit: number
  balance: number
}

export interface DashboardMetrics {
  todaySales: number
  todayCollections: number
  totalOutstanding: number
  totalCustomers: number
  todayDateLabel: string
}
