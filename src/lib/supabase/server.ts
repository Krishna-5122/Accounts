import { createServerClient as sbCreateServerClient, type CookieMethodsServer } from "@supabase/ssr"
import { SUPABASE_URL, SUPABASE_JWKS_URL } from "./constants"

const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SECRET_KEY

export function createServerClient(cookies: CookieMethodsServer) {
  if (!SUPABASE_URL) {
    throw new Error("Missing SUPABASE_URL environment variable.")
  }

  if (!SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      "Missing SUPABASE_SECRET_KEY — server client requires a service role key. Never expose this to the browser.",
    )
  }

  return sbCreateServerClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    cookies,
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

export { SUPABASE_JWKS_URL }
