import { createBrowserRouter, Navigate } from "react-router-dom"
import { AppShell } from "@/components/layout/AppShell"
import { lazy, Suspense } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { isAuthenticated } from "@/lib/auth"

const DashboardPage = lazy(() =>
  import("@/pages/DashboardPage").then((m) => ({ default: m.DashboardPage })),
)
const CustomersPage = lazy(() =>
  import("@/pages/CustomersPage").then((m) => ({ default: m.CustomersPage })),
)
const NewCustomerPage = lazy(() =>
  import("@/pages/NewCustomerPage").then((m) => ({ default: m.NewCustomerPage })),
)
const CustomerDetailPage = lazy(() =>
  import("@/pages/CustomerDetailPage").then((m) => ({ default: m.CustomerDetailPage })),
)
const SalesPage = lazy(() => import("@/pages/SalesPage").then((m) => ({ default: m.SalesPage })))
const NewSalePage = lazy(() =>
  import("@/pages/NewSalePage").then((m) => ({ default: m.NewSalePage })),
)
const PaymentsPage = lazy(() =>
  import("@/pages/PaymentsPage").then((m) => ({ default: m.PaymentsPage })),
)
const NewPaymentPage = lazy(() =>
  import("@/pages/NewPaymentPage").then((m) => ({ default: m.NewPaymentPage })),
)
const OutstandingPage = lazy(() =>
  import("@/pages/OutstandingPage").then((m) => ({ default: m.OutstandingPage })),
)
const ReportsPage = lazy(() =>
  import("@/pages/ReportsPage").then((m) => ({ default: m.ReportsPage })),
)
const SettingsPage = lazy(() =>
  import("@/pages/SettingsPage").then((m) => ({ default: m.SettingsPage })),
)
const LoginPage = lazy(() =>
  import("@/pages/auth/LoginPage").then((m) => ({ default: m.LoginPage })),
)

function PageLoader() {
  return (
    <div className="space-y-4 p-6">
      <Skeleton className="h-8 w-1/4" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32 w-full rounded-lg" />
        ))}
      </div>
      <Skeleton className="h-96 w-full rounded-lg" />
    </div>
  )
}

function ProtectedElement({ children }: { children: React.ReactNode }) {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />
  }
  return <>{children}</>
}

export const router = createBrowserRouter([
  {
    path: "/login",
    element: (
      <Suspense fallback={<PageLoader />}>
        <LoginPage />
      </Suspense>
    ),
  },
  {
    path: "/",
    element: (
      <ProtectedElement>
        <AppShell />
      </ProtectedElement>
    ),
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      {
        path: "dashboard",
        element: (
          <Suspense fallback={<PageLoader />}>
            <DashboardPage />
          </Suspense>
        ),
      },
      {
        path: "customers",
        children: [
          {
            index: true,
            element: (
              <Suspense fallback={<PageLoader />}>
                <CustomersPage />
              </Suspense>
            ),
          },
          {
            path: "new",
            element: (
              <Suspense fallback={<PageLoader />}>
                <NewCustomerPage />
              </Suspense>
            ),
          },
          {
            path: ":customerId",
            element: (
              <Suspense fallback={<PageLoader />}>
                <CustomerDetailPage />
              </Suspense>
            ),
          },
        ],
      },
      {
        path: "sales",
        children: [
          {
            index: true,
            element: (
              <Suspense fallback={<PageLoader />}>
                <SalesPage />
              </Suspense>
            ),
          },
          {
            path: "new",
            element: (
              <Suspense fallback={<PageLoader />}>
                <NewSalePage />
              </Suspense>
            ),
          },
        ],
      },
      {
        path: "payments",
        children: [
          {
            index: true,
            element: (
              <Suspense fallback={<PageLoader />}>
                <PaymentsPage />
              </Suspense>
            ),
          },
          {
            path: "new",
            element: (
              <Suspense fallback={<PageLoader />}>
                <NewPaymentPage />
              </Suspense>
            ),
          },
        ],
      },
      {
        path: "outstanding",
        element: (
          <Suspense fallback={<PageLoader />}>
            <OutstandingPage />
          </Suspense>
        ),
      },
      {
        path: "reports",
        element: (
          <Suspense fallback={<PageLoader />}>
            <ReportsPage />
          </Suspense>
        ),
      },
      {
        path: "settings",
        element: (
          <Suspense fallback={<PageLoader />}>
            <SettingsPage />
          </Suspense>
        ),
      },
    ],
  },
  {
    path: "*",
    element: <Navigate to={isAuthenticated() ? "/dashboard" : "/login"} replace />,
  },
])
