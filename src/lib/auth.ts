const AUTH_STORAGE_KEY = "saree-ledger:auth"

const VALID_USERNAME = "teja"
const VALID_PASSWORD = "teja"

export interface AuthSession {
  username: string
  loggedInAt: string
}

export function getAuthSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as AuthSession
    if (!parsed || !parsed.username || !parsed.loggedInAt) return null
    return parsed
  } catch {
    return null
  }
}

export function isAuthenticated(): boolean {
  return getAuthSession() !== null
}

export interface LoginResult {
  ok: boolean
  error?: string
}

export function login(username: string, password: string): LoginResult {
  if (username !== VALID_USERNAME) {
    return { ok: false, error: "Invalid username" }
  }
  if (password !== VALID_PASSWORD) {
    return { ok: false, error: "Invalid password" }
  }
  const session: AuthSession = {
    username,
    loggedInAt: new Date().toISOString(),
  }
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session))
  return { ok: true }
}

export function logout(): void {
  localStorage.removeItem(AUTH_STORAGE_KEY)
}
