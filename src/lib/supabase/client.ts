import { createBrowserClient } from "@supabase/ssr"
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./constants"

let singletonClient: ReturnType<typeof createBrowserClient> | undefined

export function createClient() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY environment variables.")
  }

  if (!singletonClient) {
    singletonClient = createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
      global: {
        headers: {
          "X-Client-Info": "saree-ledger@0.1.0",
        },
      },
    })
  }
  return singletonClient
}

export const supabase = createClient()
