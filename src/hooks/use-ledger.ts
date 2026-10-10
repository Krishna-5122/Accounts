import { useSyncExternalStore, useMemo } from "react"
import { ledgerStore } from "@/lib/ledger/store"
import type { LedgerState } from "@/lib/ledger/types"

function getSnapshot(): LedgerState {
  return ledgerStore.getState()
}

function subscribe(callback: () => void): () => void {
  return ledgerStore.subscribe(() => callback())
}

export function useLedgerState(): LedgerState {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}

export function useLedger<T>(selector: (state: LedgerState) => T): T {
  const state = useLedgerState()
  return useMemo(() => selector(state), [state, selector])
}

export function useLedgerActions() {
  return {
    addCustomer: ledgerStore.addCustomer.bind(ledgerStore),
    addSale: ledgerStore.addSale.bind(ledgerStore),
    addPayment: ledgerStore.addPayment.bind(ledgerStore),
    deleteSale: ledgerStore.deleteSale.bind(ledgerStore),
    deletePayment: ledgerStore.deletePayment.bind(ledgerStore),
    deleteCustomer: ledgerStore.deleteCustomer.bind(ledgerStore),
    syncFromSupabase: ledgerStore.syncFromSupabase.bind(ledgerStore),
    reset: ledgerStore.reset.bind(ledgerStore),
  }
}
