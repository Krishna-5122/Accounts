import type {
  Customer,
  Sale,
  Payment,
  LedgerState,
  NewCustomerInput,
  NewSaleInput,
  NewPaymentInput,
  Result,
} from "./types"
import type { UUID, PaymentMethod } from "@/types"
import { BILL_NUMBER_PREFIX, BUSINESS_TIMEZONE } from "@/lib/supabase/constants"
import { supabase } from "@/lib/supabase/client"
import type { CustomerAggregate, SaleAggregate } from "./types"
import {
  computeCustomerAggregate,
  computeSaleAggregate,
  computeAllCustomerAggregates,
} from "./selectors"

const STORAGE_KEY = "saree-ledger:data" as const

let _counter = 0
function uuidFallback(): UUID {
  _counter += 1
  const hex = Date.now().toString(16) + _counter.toString(16).padStart(8, "0")
  const withDashes = `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(12, 15)}-a${hex.slice(15, 18)}-${hex.slice(18, 30)}`
  return withDashes as UUID
}

function newId(): UUID {
  if (typeof globalThis !== "undefined" && globalThis.crypto?.randomUUID) {
    try {
      return globalThis.crypto.randomUUID() as UUID
    } catch {
      return uuidFallback()
    }
  }
  return uuidFallback()
}

export function toAsiaKolkataDateISO(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: BUSINESS_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date)
}

export function toFinancialYear(d: Date | string): number {
  const iso = toAsiaKolkataDateISO(d)
  const [y, m] = iso.split("-").map(Number) as [number, number]
  return m >= 4 ? y : y - 1
}

function pad4(n: number): string {
  return n.toString().padStart(4, "0")
}

function createEmptyState(): LedgerState {
  return {
    customers: [],
    sales: [],
    payments: [],
    billNumberCounters: {},
    lastUpdated: new Date().toISOString(),
  }
}

interface LedgerAdapter {
  load(): LedgerState | null
  save(state: LedgerState): void
}

class LocalStorageLedgerAdapter implements LedgerAdapter {
  private readonly key: string

  constructor(key: string) {
    this.key = key
  }

  load(): LedgerState | null {
    try {
      if (typeof globalThis === "undefined" || !globalThis.localStorage) return null
      const raw = globalThis.localStorage.getItem(this.key)
      if (!raw) return null
      const parsed = JSON.parse(raw) as LedgerState
      if (!parsed || !Array.isArray(parsed.customers)) return null
      return parsed
    } catch {
      return null
    }
  }

  save(state: LedgerState): void {
    try {
      if (typeof globalThis === "undefined" || !globalThis.localStorage) return
      globalThis.localStorage.setItem(this.key, JSON.stringify(state))
    } catch {
      // ignore quota errors in non-browser envs
    }
  }
}

type Listener = (state: LedgerState) => void

class LedgerStore {
  private state: LedgerState
  private adapter: LedgerAdapter
  private listeners: Set<Listener> = new Set()
  public isSyncing = false
  public lastSyncError: string | null = null

  constructor(adapter: LedgerAdapter) {
    this.adapter = adapter
    const loaded = adapter.load()
    this.state = loaded ?? createEmptyState()
    if (typeof window !== "undefined") {
      void this.syncFromSupabase()
    }
  }

  async syncFromSupabase(): Promise<void> {
    if (this.isSyncing) return
    this.isSyncing = true
    try {
      const [cRes, sRes, pRes, cntRes] = await Promise.all([
        supabase.from("customers").select("*").order("created_at", { ascending: true }),
        supabase.from("sales").select("*").order("created_at", { ascending: true }),
        supabase.from("payments").select("*").order("created_at", { ascending: true }),
        supabase.from("bill_number_counters").select("*"),
      ])

      if (cRes.error) throw cRes.error
      if (sRes.error) throw sRes.error
      if (pRes.error) throw pRes.error

      const remoteCustomers: Customer[] = (cRes.data || []).map((c: Record<string, any>) => ({
        id: c.id as UUID,
        name: c.name,
        phone: c.phone ?? "",
        address: c.address ?? "",
        notes: c.notes ?? "",
        openingBalance: Number(c.opening_balance) || 0,
        createdAt: c.created_at,
        updatedAt: c.updated_at,
      }))

      const remoteSales: Sale[] = (sRes.data || []).map((s: Record<string, any>) => ({
        id: s.id as UUID,
        customerId: s.customer_id as UUID,
        billNumber: s.bill_number,
        saleDateISO: s.sale_date_iso,
        sareeName: s.saree_name,
        sareeCode: s.saree_code ?? "",
        description: s.description ?? "",
        quantity: Number(s.quantity) || 1,
        rate: Number(s.rate) || 0,
        saleAmount: Number(s.sale_amount) || 0,
        items: Array.isArray(s.items) ? s.items : undefined,
        notes: s.notes ?? "",
        createdAt: s.created_at,
        updatedAt: s.updated_at,
      }))

      const remotePayments: Payment[] = (pRes.data || []).map((p: Record<string, any>) => ({
        id: p.id as UUID,
        customerId: p.customer_id as UUID,
        saleId: (p.sale_id as UUID | null) ?? null,
        paymentDateISO: p.payment_date_iso,
        amount: Number(p.amount) || 0,
        paymentMethod: (p.payment_method as PaymentMethod) || "Cash",
        notes: p.notes ?? "",
        createdAt: p.created_at,
        updatedAt: p.updated_at,
      }))

      const counters: Record<number, number> = {}
      if (cntRes.data) {
        for (const cnt of cntRes.data) {
          counters[cnt.fy] = Number(cnt.seq) || 0
        }
      }

      if (remoteCustomers.length > 0 || remoteSales.length > 0 || remotePayments.length > 0) {
        this.state = {
          customers: remoteCustomers,
          sales: remoteSales,
          payments: remotePayments,
          billNumberCounters: counters,
          lastUpdated: new Date().toISOString(),
        }
        this.adapter.save(this.state)
        this.notify()
      } else if (this.state.customers.length > 0 || this.state.sales.length > 0) {
        // If remote is empty but local has data, seed remote
        await this.pushAllToSupabase()
      }
      this.lastSyncError = null
    } catch (err: unknown) {
      console.warn("Supabase sync warning:", err)
      this.lastSyncError = err instanceof Error ? err.message : "Sync error"
    } finally {
      this.isSyncing = false
    }
  }

  async pushAllToSupabase(): Promise<void> {
    try {
      if (this.state.customers.length > 0) {
        await supabase.from("customers").upsert(
          this.state.customers.map((c) => ({
            id: c.id,
            name: c.name,
            phone: c.phone,
            address: c.address,
            notes: c.notes,
            opening_balance: c.openingBalance,
            created_at: c.createdAt,
            updated_at: c.updatedAt,
          })),
        )
      }
      if (this.state.sales.length > 0) {
        await supabase.from("sales").upsert(
          this.state.sales.map((s) => ({
            id: s.id,
            customer_id: s.customerId,
            bill_number: s.billNumber,
            sale_date_iso: s.saleDateISO,
            saree_name: s.sareeName,
            saree_code: s.sareeCode,
            description: s.description,
            quantity: s.quantity,
            rate: s.rate,
            sale_amount: s.saleAmount,
            items: s.items ?? [],
            notes: s.notes,
            created_at: s.createdAt,
            updated_at: s.updatedAt,
          })),
        )
      }
      if (this.state.payments.length > 0) {
        await supabase.from("payments").upsert(
          this.state.payments.map((p) => ({
            id: p.id,
            customer_id: p.customerId,
            sale_id: p.saleId,
            payment_date_iso: p.paymentDateISO,
            amount: p.amount,
            payment_method: p.paymentMethod,
            notes: p.notes,
            created_at: p.createdAt,
            updated_at: p.updatedAt,
          })),
        )
      }
    } catch (err) {
      console.error("Failed to push all to Supabase:", err)
    }
  }

  getState(): LedgerState {
    return this.state
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  private notify(): void {
    for (const listener of this.listeners) {
      listener(this.state)
    }
  }

  private snapshot(): LedgerState {
    return JSON.parse(JSON.stringify(this.state)) as LedgerState
  }

  private commit(draft: LedgerState): void {
    draft.lastUpdated = new Date().toISOString()
    this.state = draft
    this.adapter.save(this.state)
    this.notify()
  }

  private assertInvariants(draft: LedgerState): Result<void, string> {
    const custAggs = computeAllCustomerAggregates(draft)
    for (const agg of custAggs) {
      if (agg.outstanding < -0.0001) {
        return {
          ok: false,
          error: `Invariant violation: Customer "${agg.customer.name}" has negative outstanding ₹${agg.outstanding.toFixed(2)}`,
        }
      }
      const expected = agg.customer.openingBalance + agg.totalSales - agg.totalPaid
      if (Math.abs(agg.outstanding - expected) > 0.0001) {
        return {
          ok: false,
          error: `Invariant violation: Customer "${agg.customer.name}" outstanding mismatch (expected ₹${expected.toFixed(2)}, got ₹${agg.outstanding.toFixed(2)})`,
        }
      }
    }
    for (const sale of draft.sales) {
      const saleAgg = computeSaleAggregate(draft, sale.id)
      if (!saleAgg) continue
      if (Math.abs(saleAgg.outstanding - (sale.saleAmount - saleAgg.paid)) > 0.0001) {
        return {
          ok: false,
          error: `Invariant violation: Sale ${sale.billNumber} has invalid outstanding amount`,
        }
      }
      if (saleAgg.outstanding < -0.0001) {
        return {
          ok: false,
          error: `Invariant violation: Sale ${sale.billNumber} has negative outstanding`,
        }
      }
    }
    return { ok: true, value: undefined }
  }

  transact<T>(mutator: (draft: LedgerState) => Result<T, string>): Result<T, string> {
    const snapshot = this.snapshot()
    const draft = this.snapshot()
    const result = mutator(draft)
    if (!result.ok) {
      this.state = snapshot
      return { ok: false, error: result.error }
    }
    const invariants = this.assertInvariants(draft)
    if (!invariants.ok) {
      this.state = snapshot
      return { ok: false, error: invariants.error }
    }
    this.commit(draft)
    return result
  }

  private generateBillNumber(draft: LedgerState, saleDate: Date): string {
    const fy = toFinancialYear(saleDate)
    const current = draft.billNumberCounters[fy] ?? 0
    const next = current + 1
    draft.billNumberCounters[fy] = next
    return `${BILL_NUMBER_PREFIX}-${fy}-${pad4(next)}`
  }

  addCustomer(input: NewCustomerInput): Result<Customer, string> {
    const result = this.transact((draft) => {
      if (!input.name || input.name.trim().length < 2) {
        return { ok: false, error: "Customer name is required (minimum 2 characters)" }
      }
      const now = new Date().toISOString()
      const customer: Customer = {
        id: newId(),
        name: input.name.trim(),
        phone: input.phone?.trim() ?? "",
        address: input.address?.trim() ?? "",
        notes: input.notes?.trim() ?? "",
        openingBalance: input.openingBalance ?? 0,
        createdAt: now,
        updatedAt: now,
      }
      draft.customers.push(customer)
      return { ok: true, value: customer }
    })

    if (result.ok) {
      void supabase.from("customers").upsert({
        id: result.value.id,
        name: result.value.name,
        phone: result.value.phone,
        address: result.value.address,
        notes: result.value.notes,
        opening_balance: result.value.openingBalance,
        created_at: result.value.createdAt,
        updated_at: result.value.updatedAt,
      })
    }
    return result
  }

  addSale(input: NewSaleInput): Result<{ sale: Sale; initialPayment: Payment | null }, string> {
    const result = this.transact((draft) => {
      const customer = draft.customers.find((c) => c.id === input.customerId)
      if (!customer) {
        return { ok: false, error: "Selected customer not found" }
      }
      if (!input.sareeName || input.sareeName.trim().length < 2) {
        return { ok: false, error: "Saree name is required" }
      }
      const quantity = Math.round(input.quantity || 0)
      if (quantity < 1) {
        return { ok: false, error: "Quantity must be at least 1" }
      }
      let finalAmount = input.saleAmount
      if (input.rate != null && input.rate > 0) {
        const computed = Math.round(quantity * input.rate * 100) / 100
        if (finalAmount == null || finalAmount <= 0) {
          finalAmount = computed
        }
      }
      if (finalAmount <= 0) {
        return { ok: false, error: "Sale amount must be greater than ₹0" }
      }
      const initialPay = input.initialPayment ?? 0
      if (initialPay < 0) {
        return { ok: false, error: "Initial payment cannot be negative" }
      }
      if (initialPay > finalAmount) {
        return { ok: false, error: "Initial payment cannot exceed sale amount" }
      }
      const now = new Date().toISOString()
      const billNumber = this.generateBillNumber(draft, input.saleDate)
      const saleDateISO = toAsiaKolkataDateISO(input.saleDate)
      const sale: Sale = {
        id: newId(),
        customerId: input.customerId,
        billNumber,
        saleDateISO,
        sareeName: input.sareeName.trim(),
        sareeCode: input.sareeCode?.trim() ?? "",
        description: input.description?.trim() ?? "",
        quantity,
        rate: input.rate ?? Math.round((finalAmount / quantity) * 100) / 100,
        saleAmount: finalAmount,
        items: input.items && input.items.length > 0 ? input.items : undefined,
        notes: input.notes?.trim() ?? "",
        createdAt: now,
        updatedAt: now,
      }
      draft.sales.push(sale)

      let initialPayment: Payment | null = null
      if (initialPay > 0) {
        const method: PaymentMethod = input.paymentMethod ?? "Cash"
        initialPayment = {
          id: newId(),
          customerId: customer.id,
          saleId: sale.id,
          paymentDateISO: saleDateISO,
          amount: initialPay,
          paymentMethod: method,
          notes: "Initial payment",
          createdAt: now,
          updatedAt: now,
        }
        draft.payments.push(initialPayment)
      }
      return { ok: true, value: { sale, initialPayment } }
    })

    if (result.ok) {
      const { sale, initialPayment } = result.value
      void supabase.from("sales").upsert({
        id: sale.id,
        customer_id: sale.customerId,
        bill_number: sale.billNumber,
        sale_date_iso: sale.saleDateISO,
        saree_name: sale.sareeName,
        saree_code: sale.sareeCode,
        description: sale.description,
        quantity: sale.quantity,
        rate: sale.rate,
        sale_amount: sale.saleAmount,
        items: sale.items ?? [],
        notes: sale.notes,
        created_at: sale.createdAt,
        updated_at: sale.updatedAt,
      })

      const fy = toFinancialYear(input.saleDate)
      const currentSeq = this.state.billNumberCounters[fy] ?? 1
      void supabase.from("bill_number_counters").upsert({
        fy,
        seq: currentSeq,
      })

      if (initialPayment) {
        void supabase.from("payments").upsert({
          id: initialPayment.id,
          customer_id: initialPayment.customerId,
          sale_id: initialPayment.saleId,
          payment_date_iso: initialPayment.paymentDateISO,
          amount: initialPayment.amount,
          payment_method: initialPayment.paymentMethod,
          notes: initialPayment.notes,
          created_at: initialPayment.createdAt,
          updated_at: initialPayment.updatedAt,
        })
      }
    }
    return result
  }

  addPayment(input: NewPaymentInput): Result<Payment, string> {
    const result = this.transact((draft) => {
      const customer = draft.customers.find((c) => c.id === input.customerId)
      if (!customer) {
        return { ok: false, error: "Selected customer not found" }
      }
      if (input.amount <= 0) {
        return { ok: false, error: "Payment amount must be greater than ₹0" }
      }
      const custAgg = computeCustomerAggregate(draft, customer.id)
      if (!custAgg) {
        return { ok: false, error: "Customer aggregate could not be computed" }
      }
      if (input.amount > custAgg.outstanding + 0.0001) {
        return {
          ok: false,
          error: `Payment ₹${input.amount.toFixed(2)} exceeds customer outstanding of ₹${custAgg.outstanding.toFixed(2)}`,
        }
      }
      let effectiveSaleId: UUID | null = null
      let remaining = input.amount

      if (input.saleId) {
        const saleAgg = computeSaleAggregate(draft, input.saleId)
        if (!saleAgg) {
          return { ok: false, error: "Selected bill not found" }
        }
        if (saleAgg.sale.customerId !== customer.id) {
          return { ok: false, error: "Bill does not belong to selected customer" }
        }
        if (saleAgg.outstanding < 0.0001) {
          return { ok: false, error: "Selected bill is already fully paid" }
        }
        if (input.amount > saleAgg.outstanding + 0.0001) {
          return {
            ok: false,
            error: `Payment ₹${input.amount.toFixed(2)} exceeds bill outstanding of ₹${saleAgg.outstanding.toFixed(2)}`,
          }
        }
        effectiveSaleId = input.saleId
        remaining = 0
      } else {
        const unpaidSales: SaleAggregate[] = draft.sales
          .filter((s) => s.customerId === customer.id)
          .map((s) => computeSaleAggregate(draft, s.id))
          .filter((sa): sa is SaleAggregate => !!sa && sa.outstanding > 0.0001)
          .sort((a, b) => {
            if (a.sale.saleDateISO !== b.sale.saleDateISO) {
              return a.sale.saleDateISO.localeCompare(b.sale.saleDateISO)
            }
            return a.sale.createdAt.localeCompare(b.sale.createdAt)
          })
        if (unpaidSales.length === 0) {
          return { ok: false, error: "No unpaid bills for this customer" }
        }
        let first: UUID | null = null
        for (const sa of unpaidSales) {
          if (remaining <= 0.0001) break
          const take = Math.min(remaining, sa.outstanding)
          if (take > 0) {
            if (first == null) first = sa.sale.id
            remaining -= take
          }
        }
        effectiveSaleId = first
      }
      const now = new Date().toISOString()
      const payment: Payment = {
        id: newId(),
        customerId: customer.id,
        saleId: effectiveSaleId,
        paymentDateISO: toAsiaKolkataDateISO(input.paymentDate),
        amount: input.amount,
        paymentMethod: input.paymentMethod,
        notes: input.notes?.trim() ?? "",
        createdAt: now,
        updatedAt: now,
      }
      draft.payments.push(payment)
      return { ok: true, value: payment }
    })

    if (result.ok) {
      const payment = result.value
      void supabase.from("payments").upsert({
        id: payment.id,
        customer_id: payment.customerId,
        sale_id: payment.saleId,
        payment_date_iso: payment.paymentDateISO,
        amount: payment.amount,
        payment_method: payment.paymentMethod,
        notes: payment.notes,
        created_at: payment.createdAt,
        updated_at: payment.updatedAt,
      })
    }
    return result
  }

  deleteSale(saleId: UUID): Result<void, string> {
    const result = this.transact((draft) => {
      const idx = draft.sales.findIndex((s) => s.id === saleId)
      if (idx === -1) return { ok: false, error: "Sale not found" }
      draft.sales.splice(idx, 1)
      draft.payments = draft.payments.filter((p) => p.saleId !== saleId)
      return { ok: true, value: undefined }
    })
    if (result.ok) {
      void supabase.from("sales").delete().eq("id", saleId)
    }
    return result
  }

  deletePayment(paymentId: UUID): Result<void, string> {
    const result = this.transact((draft) => {
      const idx = draft.payments.findIndex((p) => p.id === paymentId)
      if (idx === -1) return { ok: false, error: "Payment not found" }
      draft.payments.splice(idx, 1)
      return { ok: true, value: undefined }
    })
    if (result.ok) {
      void supabase.from("payments").delete().eq("id", paymentId)
    }
    return result
  }

  deleteCustomer(customerId: UUID): Result<void, string> {
    const result = this.transact((draft) => {
      const idx = draft.customers.findIndex((c) => c.id === customerId)
      if (idx === -1) return { ok: false, error: "Customer not found" }
      draft.customers.splice(idx, 1)
      draft.sales = draft.sales.filter((s) => s.customerId !== customerId)
      draft.payments = draft.payments.filter((p) => p.customerId !== customerId)
      return { ok: true, value: undefined }
    })
    if (result.ok) {
      void supabase.from("customers").delete().eq("id", customerId)
    }
    return result
  }

  reset(): void {
    this.state = createEmptyState()
    this.adapter.save(this.state)
    this.notify()
    void supabase.from("payments").delete().neq("id", "00000000-0000-0000-0000-000000000000")
    void supabase.from("sales").delete().neq("id", "00000000-0000-0000-0000-000000000000")
    void supabase.from("customers").delete().neq("id", "00000000-0000-0000-0000-000000000000")
  }
}

const adapter = new LocalStorageLedgerAdapter(STORAGE_KEY)
export const ledgerStore = new LedgerStore(adapter)

export type { CustomerAggregate, SaleAggregate }
