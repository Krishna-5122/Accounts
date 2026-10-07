export * from "./database"

export type UUID = string & { readonly __brand: "uuid" }

export type ID = string

export type PaymentMethod = "Cash" | "UPI" | "Other"

export type SaleStatus = "Paid" | "Partially Paid" | "Unpaid"

export type AuditAction =
  | "customer.created"
  | "customer.updated"
  | "customer.archived"
  | "sale.created"
  | "sale.updated"
  | "sale.voided"
  | "payment.created"
  | "payment.updated"
  | "payment.voided"

export interface PaginationParams {
  page?: number
  perPage?: number
}

export interface SortParams<T extends string = string> {
  sortBy?: T
  sortOrder?: "asc" | "desc"
}
