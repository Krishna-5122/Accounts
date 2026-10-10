import pg from 'pg'
const { Client } = pg

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://postgres:SUMANTH%241975@db.nrydnvatsnviqankorfc.supabase.co:5432/postgres'

async function runMigration() {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  })

  try {
    await client.connect()
    console.log('Connected to PostgreSQL database.')

    const sql = `
      -- Enable pgcrypto / uuid-ossp
      CREATE EXTENSION IF NOT EXISTS "pgcrypto";

      -- Customers table
      CREATE TABLE IF NOT EXISTS public.customers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        phone TEXT DEFAULT '',
        address TEXT DEFAULT '',
        notes TEXT DEFAULT '',
        opening_balance NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      -- Sales table
      CREATE TABLE IF NOT EXISTS public.sales (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
        bill_number TEXT NOT NULL UNIQUE,
        sale_date_iso DATE NOT NULL DEFAULT CURRENT_DATE,
        saree_name TEXT NOT NULL,
        saree_code TEXT DEFAULT '',
        description TEXT DEFAULT '',
        quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
        rate NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
        sale_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
        items JSONB DEFAULT '[]'::jsonb,
        notes TEXT DEFAULT '',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      -- Payments table
      CREATE TABLE IF NOT EXISTS public.payments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
        sale_id UUID REFERENCES public.sales(id) ON DELETE SET NULL,
        payment_date_iso DATE NOT NULL DEFAULT CURRENT_DATE,
        amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
        payment_method TEXT NOT NULL DEFAULT 'Cash',
        notes TEXT DEFAULT '',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      -- Bill counters
      CREATE TABLE IF NOT EXISTS public.bill_number_counters (
        fy INTEGER PRIMARY KEY,
        seq INTEGER NOT NULL DEFAULT 0
      );

      -- Indexes for fast queries
      CREATE INDEX IF NOT EXISTS idx_sales_customer_id ON public.sales(customer_id);
      CREATE INDEX IF NOT EXISTS idx_sales_date ON public.sales(sale_date_iso);
      CREATE INDEX IF NOT EXISTS idx_payments_customer_id ON public.payments(customer_id);
      CREATE INDEX IF NOT EXISTS idx_payments_sale_id ON public.payments(sale_id);
      CREATE INDEX IF NOT EXISTS idx_payments_date ON public.payments(payment_date_iso);

      -- Enable RLS
      ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.bill_number_counters ENABLE ROW LEVEL SECURITY;

      -- Drop existing policies if any
      DO $$
      BEGIN
        DROP POLICY IF EXISTS "Allow all for customers" ON public.customers;
        DROP POLICY IF EXISTS "Allow all for sales" ON public.sales;
        DROP POLICY IF EXISTS "Allow all for payments" ON public.payments;
        DROP POLICY IF EXISTS "Allow all for bill_counters" ON public.bill_number_counters;
      END $$;

      -- Policies for full access
      CREATE POLICY "Allow all for customers" ON public.customers FOR ALL TO public USING (true) WITH CHECK (true);
      CREATE POLICY "Allow all for sales" ON public.sales FOR ALL TO public USING (true) WITH CHECK (true);
      CREATE POLICY "Allow all for payments" ON public.payments FOR ALL TO public USING (true) WITH CHECK (true);
      CREATE POLICY "Allow all for bill_counters" ON public.bill_number_counters FOR ALL TO public USING (true) WITH CHECK (true);
    `

    await client.query(sql)
    console.log('Tables, indexes, and policies created successfully!')

    // Check tables
    const res = await client.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name"
    )
    console.log('Public tables created:', res.rows.map((r) => r.table_name))

    await client.end()
  } catch (err) {
    console.error('Migration failed:', err)
    process.exit(1)
  }
}

runMigration()
