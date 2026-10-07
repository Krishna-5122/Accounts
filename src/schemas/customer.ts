import { z } from "zod"

export const envSchema = z.object({
  VITE_SUPABASE_URL: z.string().url("VITE_SUPABASE_URL must be a valid URL"),
  VITE_SUPABASE_ANON_KEY: z
    .string()
    .min(1, "VITE_SUPABASE_ANON_KEY must be set in .env.local"),
})

export const customerSchema = z.object({
  name: z
    .string()
    .min(2, "Customer name is required")
    .max(100, "Name cannot exceed 100 characters"),
  phone: z
    .string()
    .regex(/^[0-9+\-\s()]{6,20}$/, "Enter a valid phone number")
    .optional()
    .or(z.literal("")),
  address: z.string().max(255, "Address is too long").optional().or(z.literal("")),
  notes: z.string().max(500, "Notes are too long").optional().or(z.literal("")),
  openingBalance: z
    .number()
    .min(0, "Opening balance cannot be negative")
    .max(10_000_000, "Opening balance is too large")
    .optional()
    .default(0),
})

export type CustomerInput = z.infer<typeof customerSchema>
