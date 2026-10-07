import { useState } from "react"
import { Outlet, useLocation, useNavigate } from "react-router-dom"
import { Sidebar } from "./Sidebar"
import { Navbar } from "./Navbar"
import { Button } from "@/components/ui/button"
import { Menu } from "lucide-react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { logout as authLogout, getAuthSession } from "@/lib/auth"
import { toast } from "sonner"

export function AppShell() {
  const location = useLocation()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)
  const session = getAuthSession()

  function handleLogout() {
    authLogout()
    toast.info("Signed out", { description: "You have been signed out successfully." })
    navigate("/login", { replace: true })
    setMobileOpen(false)
  }

  return (
    <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
      <div className="flex min-h-screen bg-background text-foreground">
        <aside className="hidden border-r md:block md:w-64 lg:w-72">
          <Sidebar currentPath={location.pathname} onNavigate={() => {}} onLogout={handleLogout} />
        </aside>

        <SheetContent side="left" className="w-72 p-0">
          <Sidebar
            currentPath={location.pathname}
            onNavigate={() => setMobileOpen(false)}
            onLogout={handleLogout}
          />
        </SheetContent>

        <div className="flex min-h-screen flex-1 flex-col">
          <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
            <Navbar
              left={
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
              }
              username={session?.username}
              onLogout={handleLogout}
            />
          </header>

          <main className="flex-1">
            <Outlet />
          </main>

          <footer className="border-t bg-muted/20 py-4 text-center text-xs text-muted-foreground">
            Saree Ledger · Built for small Indian businesses · v0.1.0
          </footer>
        </div>
      </div>
    </Sheet>
  )
}
