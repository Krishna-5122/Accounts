export const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL ?? "https://nrydnvatsnviqankorfc.supabase.co"

export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY ?? ""

export const SUPABASE_JWKS_URL =
  process.env.SUPABASE_JWKS_URL ??
  "https://nrydnvatsnviqankorfc.supabase.co/auth/v1/.well-known/jwks.json"

export const BUSINESS_TIMEZONE = "Asia/Kolkata" as const

export const PAYMENT_METHODS = ["Cash", "UPI", "Other"] as const

export const BILL_NUMBER_PREFIX = "SR" as const
