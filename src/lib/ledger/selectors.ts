import type {
  LedgerState,
  CustomerAggregate,
  SaleAggregate,
  LedgerEntry,
  DashboardMetrics,
  Customer,
  Sale,
} from "./types"
import type { UUID, SaleStatus, PaymentMethod } from "@/types"
import { toAsiaKolkataDateISO } from "./store"
import { formatDate } from "@/lib/utils"

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

export function saleStatusFromAmounts(saleAmount: number, paid: number): SaleStatus {
  if (paid >= saleAmount - 0.0001) return "Paid"
  if (paid <= 0.0001) return "Unpaid"
  return "Partially Paid"
}

export function computeCustomerAggregate(
  state: LedgerState,
  customerId: UUID,
): CustomerAggregate | null {
  const customer = state.customers.find((c) => c.id === customerId)
  if (!customer) return null
  const customerSales = state.sales.filter((s) => s.customerId === customerId)
  const totalSales = round2(customerSales.reduce((sum, s) => sum + s.saleAmount, 0))
  const customerPayments = state.payments.filter((p) => p.customerId === customerId)
  const totalPaid = round2(customerPayments.reduce((sum, p) => sum + p.amount, 0))
  const outstanding = round2(customer.openingBalance + totalSales - totalPaid)
  let status: SaleStatus = "Paid"
  if (outstanding > 0.0001) {
    const hasAnyPaid = customerPayments.some((p) => p.amount > 0) || customer.openingBalance <= 0
    status =
      hasAnyPaid &&
      (totalPaid > 0 ||
        customerSales.some((s) => {
          const paidForSale = state.payments
            .filter((p) => p.saleId === s.id)
            .reduce((sum, p) => sum + p.amount, 0)
          return paidForSale > 0.0001 && paidForSale < s.saleAmount - 0.0001
        }))
        ? "Partially Paid"
        : "Unpaid"
  }
  return {
    customer,
    totalSales,
    totalPaid,
    outstanding,
    purchaseCount: customerSales.length,
    status,
  }
}

export function computeAllCustomerAggregates(state: LedgerState): CustomerAggregate[] {
  return state.customers
    .map((c) => computeCustomerAggregate(state, c.id))
    .filter((a): a is CustomerAggregate => a !== null)
}

export function computeSaleAggregate(state: LedgerState, saleId: UUID): SaleAggregate | null {
  const sale = state.sales.find((s) => s.id === saleId)
  if (!sale) return null
  const customer = state.customers.find((c) => c.id === sale.customerId)
  const paid = round2(
    state.payments.filter((p) => p.saleId === saleId).reduce((sum, p) => sum + p.amount, 0),
  )
  const outstanding = round2(sale.saleAmount - paid)
  const status = saleStatusFromAmounts(sale.saleAmount, paid)
  return { sale, customer, paid, outstanding, status }
}

export function computeAllSaleAggregates(state: LedgerState): SaleAggregate[] {
  return state.sales
    .map((s) => computeSaleAggregate(state, s.id))
    .filter((a): a is SaleAggregate => a !== null)
    .sort((a, b) => {
      if (a.sale.saleDateISO !== b.sale.saleDateISO) {
        return b.sale.saleDateISO.localeCompare(a.sale.saleDateISO)
      }
      return b.sale.createdAt.localeCompare(a.sale.createdAt)
    })
}

export function getCustomerById(state: LedgerState, customerId: UUID): Customer | undefined {
  return state.customers.find((c) => c.id === customerId)
}

export function getSaleById(state: LedgerState, saleId: UUID): Sale | undefined {
  return state.sales.find((s) => s.id === saleId)
}

export function getCustomerRows(state: LedgerState): CustomerAggregate[] {
  const all = computeAllCustomerAggregates(state)
  return all.sort((a, b) => {
    const nameCmp = a.customer.name.localeCompare(b.customer.name)
    if (nameCmp !== 0) return nameCmp
    return a.customer.createdAt.localeCompare(b.customer.createdAt)
  })
}

export function getOutstandingRows(state: LedgerState): CustomerAggregate[] {
  return computeAllCustomerAggregates(state)
    .filter((a) => a.outstanding > 0.0001)
    .sort((a, b) => b.outstanding - a.outstanding)
}

export function getCustomerLedger(state: LedgerState, customerId: UUID): LedgerEntry[] {
  const agg = computeCustomerAggregate(state, customerId)
  if (!agg) return []
  const entries: LedgerEntry[] = []
  if (agg.customer.openingBalance > 0.0001) {
    entries.push({
      dateISO: toAsiaKolkataDateISO(new Date(agg.customer.createdAt)),
      type: "Opening Balance",
      description: "Opening balance brought forward",
      reference: null,
      debit: agg.customer.openingBalance,
      credit: 0,
      balance: 0,
    })
  }
  const customerSales = state.sales
    .filter((s) => s.customerId === customerId)
    .sort((a, b) => {
      if (a.saleDateISO !== b.saleDateISO) {
        return a.saleDateISO.localeCompare(b.saleDateISO)
      }
      return a.createdAt.localeCompare(b.createdAt)
    })
  for (const sale of customerSales) {
    entries.push({
      dateISO: sale.saleDateISO,
      type: "Sale",
      description:
        sale.items && sale.items.length > 1
          ? `${sale.items.map((it) => `${it.sareeName} (×${it.quantity})`).join(", ")} [${sale.quantity} Sarees]`
          : `${sale.sareeName}${sale.sareeCode ? ` (${sale.sareeCode})` : ""} × ${sale.quantity}`,
      reference: sale.billNumber,
      debit: sale.saleAmount,
      credit: 0,
      balance: 0,
    })
  }
  const customerPayments = state.payments
    .filter((p) => p.customerId === customerId)
    .sort((a, b) => {
      if (a.paymentDateISO !== b.paymentDateISO) {
        return a.paymentDateISO.localeCompare(b.paymentDateISO)
      }
      return a.createdAt.localeCompare(b.createdAt)
    })
  for (const payment of customerPayments) {
    const sale = payment.saleId ? state.sales.find((s) => s.id === payment.saleId) : undefined
    entries.push({
      dateISO: payment.paymentDateISO,
      type: "Payment",
      description: sale ? `Applied to ${sale.billNumber}` : "Payment on account (oldest bill)",
      reference: sale?.billNumber ?? null,
      debit: 0,
      credit: payment.amount,
      balance: 0,
    })
  }
  entries.sort((a, b) => {
    if (a.dateISO !== b.dateISO) return a.dateISO.localeCompare(b.dateISO)
    const priority: Record<LedgerEntry["type"], number> = {
      "Opening Balance": 0,
      Sale: 1,
      Payment: 2,
    }
    return priority[a.type] - priority[b.type]
  })
  let running = 0
  for (const entry of entries) {
    running = round2(running + entry.debit - entry.credit)
    entry.balance = running
  }
  return entries
}

export function getDashboardMetrics(state: LedgerState): DashboardMetrics {
  const todayISO = toAsiaKolkataDateISO(new Date())
  const todaySales = round2(
    state.sales.filter((s) => s.saleDateISO === todayISO).reduce((sum, s) => sum + s.saleAmount, 0),
  )
  const todayCollections = round2(
    state.payments
      .filter((p) => p.paymentDateISO === todayISO)
      .reduce((sum, p) => sum + p.amount, 0),
  )
  const totalOutstanding = round2(
    computeAllCustomerAggregates(state).reduce((sum, a) => sum + a.outstanding, 0),
  )
  return {
    todaySales,
    todayCollections,
    totalOutstanding,
    totalCustomers: state.customers.length,
    todayDateLabel: formatDate(new Date()),
  }
}

export function getTopOutstandingCustomers(state: LedgerState, limit = 5): CustomerAggregate[] {
  return getOutstandingRows(state).slice(0, limit)
}

export function getRecentSales(state: LedgerState, limit = 5): SaleAggregate[] {
  return computeAllSaleAggregates(state).slice(0, limit)
}

export function getRecentPayments(
  state: LedgerState,
  limit = 5,
): Array<{
  id: UUID
  customerName: string
  billNumber: string | null
  paymentDateISO: string
  amount: number
  paymentMethod: PaymentMethod
}> {
  const payments = [...state.payments]
    .sort((a, b) => {
      if (a.paymentDateISO !== b.paymentDateISO) {
        return b.paymentDateISO.localeCompare(a.paymentDateISO)
      }
      return b.createdAt.localeCompare(a.createdAt)
    })
    .slice(0, limit)
  return payments.map((p) => {
    const customer = state.customers.find((c) => c.id === p.customerId)
    const sale = p.saleId ? state.sales.find((s) => s.id === p.saleId) : undefined
    return {
      id: p.id,
      customerName: customer?.name ?? "Unknown",
      billNumber: sale?.billNumber ?? null,
      paymentDateISO: p.paymentDateISO,
      amount: p.amount,
      paymentMethod: p.paymentMethod,
    }
  })
}

export function getSalesTotals(state: LedgerState): {
  totalSales: number
  collected: number
  unpaid: number
} {
  const sales = computeAllSaleAggregates(state)
  const totalSales = round2(sales.reduce((sum, s) => sum + s.sale.saleAmount, 0))
  const collected = round2(sales.reduce((sum, s) => sum + s.paid, 0))
  const unpaid = round2(totalSales - collected)
  return { totalSales, collected, unpaid }
}

export function getPaymentsSummary(state: LedgerState): {
  today: number
  thisMonth: number
  total: number
  byMethod: Record<PaymentMethod, number>
} {
  const todayISO = toAsiaKolkataDateISO(new Date())
  const todayMonth = todayISO.slice(0, 7)
  let today = 0
  let thisMonth = 0
  let total = 0
  const byMethod: Record<PaymentMethod, number> = { Cash: 0, UPI: 0, Other: 0 }
  for (const p of state.payments) {
    total += p.amount
    byMethod[p.paymentMethod] = round2(byMethod[p.paymentMethod] + p.amount)
    if (p.paymentDateISO === todayISO) today += p.amount
    if (p.paymentDateISO.startsWith(todayMonth)) thisMonth += p.amount
  }
  return {
    today: round2(today),
    thisMonth: round2(thisMonth),
    total: round2(total),
    byMethod,
  }
}

export function getTotalOutstanding(state: LedgerState): number {
  return round2(computeAllCustomerAggregates(state).reduce((sum, a) => sum + a.outstanding, 0))
}

export function getUnpaidSalesForCustomer(state: LedgerState, customerId: UUID): SaleAggregate[] {
  return state.sales
    .filter((s) => s.customerId === customerId)
    .map((s) => computeSaleAggregate(state, s.id))
    .filter((sa): sa is SaleAggregate => !!sa && sa.outstanding > 0.0001)
    .sort((a, b) => {
      if (a.sale.saleDateISO !== b.sale.saleDateISO) {
        return a.sale.saleDateISO.localeCompare(b.sale.saleDateISO)
      }
      return a.sale.createdAt.localeCompare(b.sale.createdAt)
    })
}
