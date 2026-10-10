import { z } from "zod"
import { PAYMENT_METHODS } from "@/lib/supabase/constants"

export const saleSchema = z
  .object({
    customerId: z.string().uuid("Select a valid customer"),
    saleDate: z.coerce.date().default(() => new Date()),
    sareeName: z.string().min(2, "Saree name is required").max(100),
    sareeCode: z.string().max(50).optional().or(z.literal("")),
    description: z.string().max(500).optional().or(z.literal("")),
    quantity: z.coerce.number().min(1, "Quantity must be at least 1").default(1),
    rate: z.coerce.number().min(0).optional(),
    saleAmount: z.coerce
      .number()
      .min(0, "Sale amount must not be negative")
      .max(10_000_000)
      .optional()
      .or(z.literal(0)),
    initialPayment: z.coerce.number().min(0).optional().default(0),
    paymentMethod: z.enum(PAYMENT_METHODS).optional().default("Cash"),
    notes: z.string().max(500).optional().or(z.literal("")),
  })
  .superRefine((values, ctx) => {
    let amount = values.saleAmount ?? 0
    const qty = Math.round(values.quantity || 0)
    if (values.rate != null && values.rate > 0 && qty >= 1) {
      const computed = Math.round(qty * values.rate * 100) / 100
      if (amount <= 0) {
        amount = computed
      }
    }
    if (amount <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Enter rate × quantity or a total sale amount greater than ₹0",
        path: ["saleAmount"],
      })
    }
    if ((values.initialPayment ?? 0) > amount + 0.0001) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Initial payment cannot exceed sale amount",
        path: ["initialPayment"],
      })
    }
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
