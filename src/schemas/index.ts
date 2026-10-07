import { z } from "zod"
import { PAYMENT_METHODS } from "@/lib/supabase/constants"

export const saleSchema = z.object({
  customerId: z.string().uuid("Select a valid customer"),
  saleDate: z.coerce.date().default(() => new Date()),
  sareeName: z.string().min(2, "Saree name is required").max(100),
  sareeCode: z.string().max(50).optional().or(z.literal("")),
  description: z.string().max(500).optional().or(z.literal("")),
  saleAmount: z.coerce.number().min(1, "Sale amount must be greater than ₹0").max(10_000_000),
  initialPayment: z.coerce.number().min(0).optional().default(0),
  paymentMethod: z.enum(PAYMENT_METHODS).optional().default("Cash"),
  notes: z.string().max(500).optional().or(z.literal("")),
})

export const paymentSchema = z.object({
  customerId: z.string().uuid("Select a valid customer"),
  saleId: z.string().uuid().optional(),
  paymentDate: z.coerce.date().default(() => new Date()),
  amount: z.coerce.number().min(1, "Payment amount must be greater than ₹0"),
  paymentMethod: z.enum(PAYMENT_METHODS),
  notes: z.string().max(500).optional().or(z.literal("")),
})

export const loginSchema = z.object({
  username: z.string().min(2, "Username must be at least 2 characters"),
  password: z.string().min(4, "Password must be at least 4 characters"),
})

export type SaleInput = z.infer<typeof saleSchema>
export type PaymentInput = z.infer<typeof paymentSchema>
export type LoginInput = z.infer<typeof loginSchema>
