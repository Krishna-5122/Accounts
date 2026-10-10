import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { BUSINESS_TIMEZONE } from "@/lib/supabase/constants"
import { Building2, PhoneCall, Mail, ShieldCheck, Clock } from "lucide-react"

export function SettingsPage() {
  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Configure your business profile, billing preferences, and security.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Building2 className="h-4 w-4" /> Business Profile
          </CardTitle>
          <CardDescription>Printed on customer bills, receipts, and statements.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="biz-name">Business name</Label>
            <Input id="biz-name" placeholder="e.g. Lakshmi Silks" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="biz-phone" className="flex items-center gap-1">
              <PhoneCall className="h-3 w-3" /> Contact phone
            </Label>
            <Input id="biz-phone" placeholder="e.g. 98765 43210" />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="biz-address">Address (optional)</Label>
            <Input id="biz-address" placeholder="Shop no, street, city" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="biz-email" className="flex items-center gap-1">
              <Mail className="h-3 w-3" /> Email (optional)
            </Label>
            <Input id="biz-email" placeholder="hello@business.in" type="email" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="biz-gst" className="flex items-center gap-1">
              <ShieldCheck className="h-3 w-3" /> GSTIN (optional)
            </Label>
            <Input id="biz-gst" placeholder="22AAAAA0000A1Z5" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Clock className="h-4 w-4" /> Localization
          </CardTitle>
          <CardDescription>Currency, timezone, and date display.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-md border bg-muted/20 p-3 text-xs">
              <div className="font-medium text-foreground">Currency</div>
              <div className="mt-0.5 text-muted-foreground">₹ Indian Rupee (INR)</div>
            </div>
            <div className="rounded-md border bg-muted/20 p-3 text-xs">
              <div className="font-medium text-foreground">Timezone</div>
              <div className="mt-0.5 text-muted-foreground">{BUSINESS_TIMEZONE}</div>
            </div>
          </div>
          <Separator />
          <div className="flex items-center justify-between rounded-md border p-3">
            <div>
              <div className="text-sm font-medium">Realtime updates</div>
              <div className="text-xs text-muted-foreground">
                Push live balance changes across devices (Phase 9).
              </div>
            </div>
            <Switch checked disabled aria-readonly />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Account</CardTitle>
          <CardDescription>Phase 3: Supabase Auth</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button variant="secondary" disabled>
            Change password
          </Button>
          <div className="rounded-md border bg-muted/20 p-3 text-xs text-muted-foreground">
            Authentication will be enabled in Phase 3 (Email/Password + Protected routes).
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
