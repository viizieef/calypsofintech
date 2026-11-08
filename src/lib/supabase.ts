import { createClient, SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import { JournalEntry, Account, CompanyProfile, SupabaseConfig } from '../types/ledger';

const STORAGE_KEY_CONFIG = 'acu_ledger_supabase_config';
const STORAGE_KEY_ENTRIES = 'acu_ledger_local_entries';
const STORAGE_KEY_ACCOUNTS = 'acu_ledger_local_accounts';
const STORAGE_KEY_PROFILE = 'acu_ledger_company_profile';

export const SUPABASE_SQL_SCHEMA = `-- ========================================================
-- CALYPSO BIR GENERAL LEDGER: SUPABASE DATABASE SCHEMA
-- Compliant with Bureau of Internal Revenue (BIR) Audit Rules
-- ========================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Accounts / Chart of Accounts Table
CREATE TABLE IF NOT EXISTS accounts (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('asset', 'liability', 'equity', 'revenue', 'cost_of_sales', 'expense')),
  description TEXT,
  normal_balance TEXT NOT NULL CHECK (normal_balance IN ('debit', 'credit')),
  is_bir_standard BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Journal Entries & Double-Entry Vouchers
CREATE TABLE IF NOT EXISTS journal_entries (
  id TEXT PRIMARY KEY,
  voucher_number TEXT NOT NULL UNIQUE,
  date DATE NOT NULL,
  description TEXT NOT NULL,
  book_type TEXT NOT NULL CHECK (book_type IN ('GENERAL_JOURNAL', 'CASH_RECEIPTS', 'CASH_DISBURSEMENTS')),
  is_posted BOOLEAN DEFAULT true,
  is_reversed BOOLEAN DEFAULT false,
  reversal_of_id TEXT REFERENCES journal_entries(id) ON DELETE SET NULL,
  bir_metadata JSONB,
  lines JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Company Profile & BIR Registration Table
CREATE TABLE IF NOT EXISTS company_profile (
  id TEXT PRIMARY KEY DEFAULT 'primary',
  business_name TEXT NOT NULL,
  trade_name TEXT,
  tin TEXT NOT NULL,
  rdo_code TEXT NOT NULL,
  registered_address TEXT NOT NULL,
  line_of_business TEXT,
  taxpayer_type TEXT NOT NULL CHECK (taxpayer_type IN ('VAT', 'NON_VAT')),
  accounting_method TEXT DEFAULT 'ACCRUAL',
  fiscal_year_end TEXT DEFAULT 'December 31',
  bir_registration_number TEXT,
  cas_permit_number TEXT,
  authorized_signatory TEXT,
  signatory_title TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Enable Real-Time Replication for Supabase Listeners (Idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'journal_entries'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE journal_entries;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'accounts'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE accounts;
  END IF;
END $$;

-- 6. Row Level Security (RLS) - Idempotent
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_profile ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anonymous read accounts" ON accounts;
CREATE POLICY "Allow anonymous read accounts" ON accounts FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow anonymous insert/update accounts" ON accounts;
CREATE POLICY "Allow anonymous insert/update accounts" ON accounts FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow anonymous read entries" ON journal_entries;
CREATE POLICY "Allow anonymous read entries" ON journal_entries FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow anonymous insert/update entries" ON journal_entries;
CREATE POLICY "Allow anonymous insert/update entries" ON journal_entries FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow anonymous read profile" ON company_profile;
CREATE POLICY "Allow anonymous read profile" ON company_profile FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow anonymous insert/update profile" ON company_profile;
CREATE POLICY "Allow anonymous insert/update profile" ON company_profile FOR ALL USING (true);

-- Success verification index
CREATE INDEX IF NOT EXISTS idx_je_date ON journal_entries(date);
CREATE INDEX IF NOT EXISTS idx_je_voucher ON journal_entries(voucher_number);
`;

export function getStoredSupabaseConfig(): SupabaseConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CONFIG);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn('Failed to parse Supabase config from localStorage:', e);
  }
  return {
    url: '',
    anonKey: '',
    isConnected: false,
    tableName: 'journal_entries',
    autoSync: false,
  };
}

export function saveStoredSupabaseConfig(config: SupabaseConfig): void {
  localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(config));
}

let cachedClient: SupabaseClient | null = null;
let activeChannel: RealtimeChannel | null = null;

export function getSupabaseClient(config?: SupabaseConfig): SupabaseClient | null {
  const currentConfig = config || getStoredSupabaseConfig();
  if (!currentConfig.url || !currentConfig.anonKey) {
    return null;
  }
  if (!cachedClient) {
    try {
      cachedClient = createClient(currentConfig.url.trim(), currentConfig.anonKey.trim(), {
        auth: { persistSession: false },
        realtime: { params: { eventsPerSecond: 10 } },
      });
    } catch (err) {
      console.error('Failed to create Supabase client:', err);
      return null;
    }
  }
  return cachedClient;
}

export function resetSupabaseClient(): void {
  if (activeChannel) {
    activeChannel.unsubscribe();
    activeChannel = null;
  }
  cachedClient = null;
}

export async function testSupabaseConnection(url: string, anonKey: string): Promise<{ success: boolean; message: string; tableFound: boolean }> {
  try {
    const testClient = createClient(url.trim(), anonKey.trim(), {
      auth: { persistSession: false },
    });

    const start = performance.now();
    const { data, error } = await testClient
      .from('journal_entries')
      .select('id')
      .limit(1);

    const latency = Math.round(performance.now() - start);

    if (error) {
      // Check if table missing vs auth failed
      if (error.code === '42P01' || error.message.includes('relation "journal_entries" does not exist')) {
        return {
          success: true,
          tableFound: false,
          message: `Connected successfully (${latency}ms)! However, the 'journal_entries' table does not exist yet. Please execute the provided SQL migration in your Supabase SQL Editor.`,
        };
      }
      return {
        success: false,
        tableFound: false,
        message: `Connection error: ${error.message} (Code: ${error.code})`,
      };
    }

    return {
      success: true,
      tableFound: true,
      message: `Connected successfully! Table 'journal_entries' is ready (${latency}ms latency).`,
    };
  } catch (err: any) {
    return {
      success: false,
      tableFound: false,
      message: `Network or invalid credentials error: ${err.message || 'Unknown error'}`,
    };
  }
}

export function setupRealtimeSubscription(
  config: SupabaseConfig,
  onRemoteChange: (payload: any) => void
): () => void {
  const client = getSupabaseClient(config);
  if (!client || !config.isConnected) {
    return () => {};
  }

  try {
    if (activeChannel) {
      activeChannel.unsubscribe();
    }

    activeChannel = client
      .channel('public:journal_entries')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'journal_entries' },
        (payload) => {
          onRemoteChange(payload);
        }
      )
      .subscribe((status) => {
        console.log('Supabase Realtime status:', status);
      });

    return () => {
      if (activeChannel) {
        activeChannel.unsubscribe();
        activeChannel = null;
      }
    };
  } catch (e) {
    console.error('Realtime subscription error:', e);
    return () => {};
  }
}

export async function syncEntryToSupabase(entry: JournalEntry, config: SupabaseConfig): Promise<boolean> {
  const client = getSupabaseClient(config);
  if (!client || !config.isConnected) return false;

  try {
    const payload = {
      id: entry.id,
      voucher_number: entry.voucherNumber,
      date: entry.date,
      description: entry.description,
      book_type: entry.bookType,
      is_posted: entry.isPosted,
      is_reversed: entry.isReversed || false,
      reversal_of_id: entry.reversalOfId || null,
      bir_metadata: entry.birMetadata || null,
      lines: entry.lines,
      created_at: entry.createdAt,
      updated_at: new Date().toISOString(),
    };

    const { error } = await client.from('journal_entries').upsert(payload);
    if (error) {
      console.error('Error syncing entry to Supabase:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Exception syncing entry to Supabase:', err);
    return false;
  }
}

export async function fetchEntriesFromSupabase(config: SupabaseConfig): Promise<JournalEntry[] | null> {
  const client = getSupabaseClient(config);
  if (!client || !config.isConnected) return null;

  try {
    const { data, error } = await client
      .from('journal_entries')
      .select('*')
      .order('date', { ascending: false });

    if (error) {
      console.warn('Could not fetch from Supabase:', error.message);
      return null;
    }

    return (data || []).map((row: any) => ({
      id: row.id,
      voucherNumber: row.voucher_number,
      date: row.date,
      description: row.description,
      bookType: row.book_type,
      isPosted: row.is_posted,
      isReversed: row.is_reversed,
      reversalOfId: row.reversal_of_id,
      birMetadata: row.bir_metadata,
      lines: row.lines,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  } catch (err) {
    console.error('Failed to fetch from Supabase:', err);
    return null;
  }
}
