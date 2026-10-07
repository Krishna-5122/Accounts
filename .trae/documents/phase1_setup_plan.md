# Phase 1: Project Setup & Architecture Implementation Plan

## Repository Research

### Current State
- Working directory `/Users/krishnatejam/Downloads/Accounting/` is empty (fresh project)
- No prior memory or sessions for this project

### Requirements Summary
Per the 40-section PRD, this is a production-grade Saree Business Management System that replaces a physical ledger. Key tech stack requirements for Phase 1:

**Frontend**: React 18+, TypeScript (strict), Vite, Tailwind CSS, shadcn/ui, React Router, TanStack Query, React Hook Form + Zod, Lucide React, Recharts

**Backend/Data**: Supabase (PostgreSQL + Auth + RLS + Realtime). User confirmed using:
- SUPABASE_URL: `https://nrydnvatsnviqankorfc.supabase.co`
- Keys provided for publishable, secret, and JWKS
- `@supabase/server` package needed
- Environment variables must be configured

**Tooling**: ESLint, Prettier, Vitest, Playwright (later phases)

**Phase 1 Scope**: Set up project architecture — React, TypeScript, Vite, Tailwind, shadcn/ui, routing, Supabase integration, and folder structure.

### Architectural Decisions
1. **Vite + React + TypeScript**: Standard scaffolding via `npm create vite@latest`
2. **Tailwind CSS v3**: Standard install with PostCSS config
3. **shadcn/ui**: Install via CLI with manual component setup (not npx shadcn@latest init)
4. **Supabase Architecture**:
   - Frontend: `@supabase/supabase-js` for client operations (anon key only)
   - Backend/SSR: `@supabase/server` for server-side verification (service role)
   - Client singleton pattern for Supabase client instances
5. **Routing**: React Router v6 with createBrowserRouter for data-router API
6. **TanStack Query v5**: For data fetching cache layer
7. **Folder structure**: Clean architecture separation — components, pages, hooks, lib (utils/supabase), types, schemas, features

---

## Files and Modules

| File / Directory | Expected Change |
|---|---|
| `package.json` | Create with all Phase 1 dependencies |
| `package-lock.json` | Installed deps lockfile |
| `vite.config.ts` | Vite config with path alias `@` → `src` |
| `tsconfig.json` | Strict mode, path alias, baseUrl |
| `tsconfig.node.json` | Node TS config for Vite |
| `tailwind.config.js` | shadcn/ui compatible config, custom colors, INR currency |
| `postcss.config.js` | Tailwind + Autoprefixer |
| `index.html` | Vite entry, correct title, Indian locale considerations |
| `.env.example` | VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY |
| `.gitignore` | Standard node_modules, dist, .env, .env.local |
| `.eslintrc.cjs` | ESLint strict config (TypeScript, React, Tailwind plugins |
| `.prettierrc` | Prettier config with tailwind sort plugin |
| `src/main.tsx` | React Router + TanStack Query providers |
| `src/App.tsx` | Router outlet/layout shell |
| `src/index.css` | Tailwind directives + shadcn variables |
| `src/lib/utils.ts` | cn() className merger (clsx + tailwind-merge) |
| `src/lib/supabase/client.ts` | Browser Supabase client singleton (createBrowserClient) |
| `src/lib/supabase/server.ts` | Server Supabase client (createServerClient) |
| `src/lib/supabase/middleware.ts` | Supabase auth middleware stub |
| `src/types/database.ts` | Generated types placeholder + Supabase DB type stub |
| `src/types/index.ts` | Domain type re-exports |
| `src/schemas/` | Zod schema stubs — customer, sale, payment, auth |
| `src/hooks/` | Custom hooks stubs dir |
| `src/components/ui/` | shadcn/ui installed components |
| `src/components/layout/` | Sidebar, Navbar, Shell |
| `src/pages/` | Page components (Dashboard, Customers, etc. — skeleton pages + Layout |
| `src/router/` | Router config |
| `src/features/` | Feature module folders |
| `src/assets/` | Static assets |
| `public/` | Static public assets |
| `supabase/` | Config folder (migrations later) |

---

## Implementation Steps (Dependency Order)

### Step 1: Initialize Vite + React + TypeScript Project
- Run `npm create vite@latest . -- --template react-ts
- Accept scaffold project
- Verify package.json created with React 18, Vite 5+, TypeScript 5+

### Step 2: Configure TypeScript Strict Mode & Path Aliases
- Update `tsconfig.json`:
  - `strict: true`
  - `baseUrl: "."`
  - `paths: { "@/*": ["./src/*"] }`
  - Recommended: `noUncheckedIndexedAccess`, `noImplicitReturns`
- Update `vite.config.ts`: add `@` path resolution with `vite-tsconfig-paths` plugin or resolve.alias

### Step 3: Install Core Dependencies
```
npm install react-router-dom @tanstack/react-query @hookform/resolvers react-hook-form zod lucide-react recharts clsx tailwind-merge class-variance-authority
```

### Step 4: Install & Configure Tailwind CSS
```
npm install -D tailwindcss@^3 postcss autoprefixer
npx tailwindcss init -p
```
- Configure `tailwind.config.js` with shadcn/ui pattern:
  - content paths covering src/**/*.{ts,tsx}
  - dark mode class strategy
  - theme.extend with colors, borderRadius, keyframes (shadcn slate theme)
- Update `src/index.css`: @tailwind base/components/utilities + :root CSS variables for shadcn

### Step 5: Install shadcn/ui via CLI
```
npx shadcn@latest init --defaults
```
- Or manual init with tailwind config already correct
- Install base components: button, input, label, card, table, dialog, toast, sonner, skeleton, badge, select, textarea, sheet, separator, avatar, dropdown-menu
- Configure `components.json` with `@/` alias

### Step 6: Install & Configure ESLint + Prettier
```
npm install -D eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin eslint-plugin-react eslint-plugin-react-hooks eslint-plugin-react-refresh eslint-plugin-tailwindcss prettier prettier-plugin-tailwindcss
```
- `.eslintrc.cjs` with recommended rules for React + TS + Tailwind
- `.prettierrc` with `plugins: ["prettier-plugin-tailwindcss`
- Add `lint` and `format` scripts

### Step 7: Supabase Installation & Configuration
```
npm install @supabase/supabase-js @supabase/server
```
- Create `src/lib/supabase/client.ts`:
  - Uses `import.meta.env.VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
  - `createBrowserClient` singleton
  - Auth persistence: local storage
- Create `src/lib/supabase/server.ts`:
  - `createServerClient` stub for future edge/server usage
  - Uses SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
- Create `src/lib/supabase/middleware.ts`:
  - auth middleware skeleton
- Create `src/types/database.ts`: Empty `Database` export stub
- Create `.env.example`:
  ```
  VITE_SUPABASE_URL=
  VITE_SUPABASE_ANON_KEY=
  SUPABASE_SECRET_KEY=
  SUPABASE_JWKS_URL=
  ```
- Create `.env.local` with actual user-provided values (never commit)
- Update `.gitignore` to exclude .env*.local

### Step 8: Folder Structure Scaffolding
Create directory tree:
```
src/
├── assets/
├── components/
│   ├── layout/        (Shell, Sidebar, Navbar)
│   └── ui/          (shadcn)
├── features/
│   ├── auth/
│   ├── customers/
│   ├── sales/
│   ├── payments/
│   ├── dashboard/
│   └── reports/
├── hooks/
├── lib/
│   └── supabase/
├── pages/
│   ├── DashboardPage.tsx
│   ├── CustomersPage.tsx
│   ├── SalesPage.tsx
│   ├── PaymentsPage.tsx
│   ├── OutstandingPage.tsx
│   ├── ReportsPage.tsx
│   ├── SettingsPage.tsx
│   └── auth/
│       └── LoginPage.tsx
├── router/
│   └── index.tsx
├── schemas/
└── types/
```

### Step 9: React Router + TanStack Query Setup
- `src/main.tsx`:
  - Wrap App with `<QueryClientProvider>` (defaultOptions: staleTime 1min, gcTime 5min, refetchOnWindowFocus false)
  - Render `<RouterProvider router={router} />`
- `src/router/index.tsx`:
  - createBrowserRouter with routes:
    - `/login` (public)
    - `/` protected layout → dashboard
    - `/customers`, `/sales`, `/payments`, `/outstanding`, `/reports`, `/settings`
  - Protected route wrapper component

### Step 10: Layout & Navigation Scaffold Pages
- `src/components/layout/AppShell.tsx`: Responsive shell with sidebar + navbar + outlet
- `src/components/layout/Sidebar.tsx`: Mobile responsive with Dashboard, Customers, Sales, Payments, Outstanding, Reports, Settings
- `src/pages/*Page.tsx`: Simple placeholder pages with card titles

### Step 11: Build Verification
- `npm run build` → must succeed
- `npx tsc --noEmit` → 0 errors
- `npm run lint` → 0 errors
- `npx vite` → dev server boots without errors

---

## Dependencies and Considerations

1. **Node.js version**: Expect 18.17+ or 20.3+ (required for some Vite 5 features)
2. **Supabase keys management**:
   - `VITE_SUPABASE_ANON_KEY` = publishable key (safe for browser)
   - `SUPABASE_SECRET_KEY` = service role (server-only, NEVER prefixed VITE_)
   - User provided: anon key `sb_publishable_aajWDJe0Ruoettay7QQfEw_yfskilHj` in env
3. **shadcn/ui CLI**: Requires correct tailwind config already present before init
4. **Prettier sort tailwind plugin**: Must match Prettier v3
5. **React 18 strict mode**: Will double-render — intentional for detection of bugs in development

---

## Validation

| Check | Command / Method | Expected Result |
|---|---|---|
| Vite build | `npm run build` | Exit 0, dist/ created |
| TypeScript strict | `npx tsc --noEmit` | 0 errors |
| ESLint | `npm run lint` | 0 errors (or only warnings) |
| Dev server | `npm run dev` | Boots at localhost, renders Dashboard placeholder |
| Path alias | Import `@/lib/utils` works | No TS or runtime error |
| shadcn Button | `<Button>Test</Button> renders styled | Correct tailwind styles applied |
| Supabase client | `createClient` in test | No undefined env error |
| Router | Navigate /customers | Route changes, page renders |

---

## Risks

| Risk | Handling / Fallback |
|---|---|
| `shadcn@latest init incompatible with pre-existing tailwind.config.js | Manual setup: manually create components.json, manually run `cn() helper instead of relying on CLI, copy individual components manually if needed |
| Node/npm version mismatch | Check node -v, use nvm fallback to 20.x if scaffold fails |
| Supabase URL / keys malformed | Verify env var names exactly match; test with a simple `from('customers').select('*') smoke test after setup |
| Path alias `@/*` breaks in Vite | Install `vite-tsconfig-paths` plugin as fallback |
| Tailwind + PostCSS config mismatch | Use `tailwindcss@3.4.x` stable with exact versions |
