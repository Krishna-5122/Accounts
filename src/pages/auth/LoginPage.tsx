import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { Sparkles, Lock, Mail, Eye, EyeOff } from "lucide-react"
import { loginSchema, type LoginInput } from "@/schemas"

export function LoginPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState<LoginInput>({ email: "", password: "" })
  const [errors, setErrors] = useState<Partial<Record<keyof LoginInput, string>>>({})
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)

  function update<K extends keyof LoginInput>(key: K, value: LoginInput[K]) {
    setForm((f) => ({ ...f, [key]: value }))
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const parsed = loginSchema.safeParse(form)
    if (!parsed.success) {
      const fieldErrors: Partial<Record<keyof LoginInput, string>> = {}
      for (const issue of parsed.error.issues) {
        const k = issue.path[0] as keyof LoginInput | undefined
        if (k) fieldErrors[k] = issue.message
      }
      setErrors(fieldErrors)
      return
    }
    setLoading(true)
    toast.info("Phase 3: Auth", {
      description: "Login flow will connect to Supabase Auth in Phase 3.",
    })
    await new Promise((r) => setTimeout(r, 300))
    setLoading(false)
    navigate("/dashboard", { replace: true })
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100 p-4">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md space-y-6">
        <div className="flex items-center justify-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow">
            <Sparkles className="h-5 w-5" />
          </div>
          <span className="text-lg font-semibold tracking-tight">Saree Ledger</span>
        </div>

        <Card className="shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Sign in</CardTitle>
            <CardDescription>
              Access your customer ledger, sales, and outstanding balances.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="flex items-center gap-1 text-xs">
                  <Mail className="h-3 w-3" /> Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@business.in"
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                  aria-invalid={Boolean(errors.email)}
                />
                {errors.email && (
                  <p className="text-xs text-destructive">{errors.email}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="flex items-center gap-1 text-xs">
                    <Lock className="h-3 w-3" /> Password
                  </Label>
                  <Link to="/forgot" className="text-[11px] text-muted-foreground hover:text-foreground">
                    Forgot?
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPwd ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={form.password}
                    onChange={(e) => update("password", e.target.value)}
                    aria-invalid={Boolean(errors.password)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd((s) => !s)}
                    className="absolute inset-y-0 right-2 flex items-center text-muted-foreground hover:text-foreground"
                    aria-label={showPwd ? "Hide password" : "Show password"}
                  >
                    {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-destructive">{errors.password}</p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Signing in…" : "Sign in"}
              </Button>
            </form>

            <Separator className="my-6" />

            <div className="rounded-md border border-dashed bg-muted/20 p-3 text-center text-[11px] text-muted-foreground">
              <Badge variant="outline" className="mb-1.5">Phase 3 preview</Badge>
              <div>Email/Password auth via Supabase Auth + Protected routes.</div>
              <div>Demo sign-in bypasses credentials and opens the dashboard.</div>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-[11px] text-muted-foreground">
          © {new Date().getFullYear()} Saree Ledger · Build #0.1.0 · Phase 1
        </p>
      </div>
    </div>
  )
}
