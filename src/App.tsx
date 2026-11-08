import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { BooksOfAccounts } from './components/BooksOfAccounts';
import { BIRReports } from './components/BIRReports';
import { FinancialStatements } from './components/FinancialStatements';
import { AccountManagement } from './components/AccountManagement';
import { TransactionModal } from './components/TransactionModal';
import { SupabaseSyncModal } from './components/SupabaseSyncModal';
import { RenderDeployModal } from './components/RenderDeployModal';
import { CompanyProfileModal } from './components/CompanyProfileModal';
import { VoucherDetailModal } from './components/VoucherDetailModal';
import { AuthModal } from './components/AuthModal';
import { NewLedgerModal } from './components/NewLedgerModal';

import { JournalEntry, Account, CompanyProfile, SupabaseConfig, AuthUser, LedgerWorkspace } from './types/ledger';
import { DEFAULT_BIR_CHART_OF_ACCOUNTS } from './lib/defaultAccounts';
import { DEFAULT_COMPANY_PROFILE, INITIAL_JOURNAL_ENTRIES } from './lib/sampleData';
import { 
  getStoredSupabaseConfig, 
  setupRealtimeSubscription, 
  syncEntryToSupabase 
} from './lib/supabase';
import { getStoredAuthUser, saveStoredAuthUser } from './lib/auth';

const STORAGE_KEY_ENTRIES = 'acu_ledger_entries_v1';
const STORAGE_KEY_ACCOUNTS = 'acu_ledger_accounts_v1';
const STORAGE_KEY_PROFILE = 'acu_ledger_profile_v1';
const STORAGE_KEY_LEDGERS = 'calypso_ledgers_v1';
const STORAGE_KEY_ACTIVE_LEDGER = 'calypso_active_ledger_id_v1';

const INITIAL_LEDGERS: LedgerWorkspace[] = [
  {
    id: 'ledger-main-2026',
    name: 'FY 2026 - Main Operating Ledger',
    code: 'GL-2026-MAIN',
    fiscalYear: '2026',
    currency: 'PHP',
    basis: 'ACCRUAL',
    branchName: 'Headquarters - Metro Manila',
    description: 'Primary double-entry sales, disbursements, and 12% VAT general ledger',
    isPrimary: true,
    createdAt: '2026-01-01T00:00:00Z',
  },
];

export default function App() {
  // Navigation State
  const [activeView, setActiveView] = useState<'dashboard' | 'books' | 'bir' | 'financials' | 'accounts'>('dashboard');
  const [activeBook, setActiveBook] = useState<'GENERAL_JOURNAL' | 'CASH_RECEIPTS' | 'CASH_DISBURSEMENTS' | 'GENERAL_LEDGER'>('GENERAL_JOURNAL');

  // Core Ledger State with localStorage persistence
  const [entries, setEntries] = useState<JournalEntry[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_ENTRIES);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.warn('Error reading stored entries:', e);
    }
    return INITIAL_JOURNAL_ENTRIES;
  });

  const [accounts, setAccounts] = useState<Account[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_ACCOUNTS);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.warn('Error reading stored accounts:', e);
    }
    return DEFAULT_BIR_CHART_OF_ACCOUNTS;
  });

  const [company, setCompany] = useState<CompanyProfile>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_PROFILE);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.warn('Error reading stored company:', e);
    }
    return DEFAULT_COMPANY_PROFILE;
  });

  const [supabaseConfig, setSupabaseConfig] = useState<SupabaseConfig>(getStoredSupabaseConfig);

  // Authentication State
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(getStoredAuthUser);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'login' | 'register'>('login');
  const [isAuthMandatory, setIsAuthMandatory] = useState(false);

  // Ledgers Management State
  const [ledgers, setLedgers] = useState<LedgerWorkspace[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_LEDGERS);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.warn('Error reading stored ledgers:', e);
    }
    return INITIAL_LEDGERS;
  });

  const [activeLedgerId, setActiveLedgerId] = useState<string>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_ACTIVE_LEDGER);
      if (stored) return stored;
    } catch (e) {
      console.warn('Error reading active ledger id:', e);
    }
    return 'ledger-main-2026';
  });

  const [isNewLedgerModalOpen, setIsNewLedgerModalOpen] = useState(false);

  // Modals
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [transactionModalMode, setTransactionModalMode] = useState<'income' | 'expense' | 'manual'>('income');
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);
  const [isRenderModalOpen, setIsRenderModalOpen] = useState(false);
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);

  // Persist ledgers
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_LEDGERS, JSON.stringify(ledgers));
    } catch (e) {
      console.error('Failed to save ledgers to localStorage:', e);
    }
  }, [ledgers]);

  // Persist active ledger id
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_ACTIVE_LEDGER, activeLedgerId);
    } catch (e) {
      console.error('Failed to save active ledger id:', e);
    }
  }, [activeLedgerId]);

  // Persist entries to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_ENTRIES, JSON.stringify(entries));
    } catch (e) {
      console.error('Failed to save entries to localStorage:', e);
    }
  }, [entries]);

  // Persist accounts to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_ACCOUNTS, JSON.stringify(accounts));
    } catch (e) {
      console.error('Failed to save accounts to localStorage:', e);
    }
  }, [accounts]);

  // Persist company to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_PROFILE, JSON.stringify(company));
    } catch (e) {
      console.error('Failed to save company to localStorage:', e);
    }
  }, [company]);

  // Handle Supabase Real-Time Subscriptions
  useEffect(() => {
    if (!supabaseConfig.isConnected) return;

    const unsubscribe = setupRealtimeSubscription(supabaseConfig, (payload) => {
      console.log('Realtime Postgres update received:', payload);
      if (payload.eventType === 'INSERT' && payload.new) {
        const row = payload.new;
        const newEntry: JournalEntry = {
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
        };

        setEntries((prev) => {
          if (prev.some((e) => e.id === newEntry.id)) {
            return prev.map((e) => (e.id === newEntry.id ? newEntry : e));
          }
          return [newEntry, ...prev];
        });
      }
    });

    return () => {
      unsubscribe();
    };
  }, [supabaseConfig]);

  // Save new journal entry
  const handleSaveEntry = useCallback(async (newEntry: JournalEntry) => {
    setEntries((prev) => [newEntry, ...prev]);

    if (supabaseConfig.isConnected) {
      try {
        await syncEntryToSupabase(newEntry, supabaseConfig);
      } catch (err) {
        console.error('Error background syncing entry to Supabase:', err);
      }
    }
  }, [supabaseConfig]);

  // BIR-Compliant Reversal: Creates an offsetting journal voucher
  const handleReverseEntry = useCallback(async (entryId: string, reason: string) => {
    const target = entries.find((e) => e.id === entryId);
    if (!target) return;

    const seq = String(entries.length + 1).padStart(4, '0');
    const reversalVoucherNumber = `RV-2026-${seq}`;

    // Reverse debits and credits
    const reversedLines = target.lines.map((line) => ({
      ...line,
      id: `jl-rev-${Date.now()}-${line.id}`,
      debit: line.credit,
      credit: line.debit,
      memo: `Reversal of ${target.voucherNumber}: ${reason}`,
    }));

    const reversalEntry: JournalEntry = {
      id: `je-rev-${Date.now()}`,
      voucherNumber: reversalVoucherNumber,
      date: new Date().toISOString().slice(0, 10),
      description: `BIR AUDIT REVERSAL: ${target.voucherNumber} - ${reason}`,
      bookType: target.bookType,
      isPosted: true,
      reversalOfId: target.id,
      lines: reversedLines,
      birMetadata: target.birMetadata ? {
        ...target.birMetadata,
        documentNumber: `REV-${target.birMetadata.documentNumber}`,
      } : undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setEntries((prev) => [
      reversalEntry,
      ...prev.map((e) => (e.id === entryId ? { ...e, isReversed: true } : e)),
    ]);

    if (supabaseConfig.isConnected) {
      await syncEntryToSupabase(reversalEntry, supabaseConfig);
      await syncEntryToSupabase({ ...target, isReversed: true }, supabaseConfig);
    }
  }, [entries, supabaseConfig]);

  // Merge remote entries from Supabase
  const handleMergeRemoteEntries = useCallback((remote: JournalEntry[]) => {
    setEntries((prev) => {
      const map = new Map<string, JournalEntry>();
      prev.forEach((e) => map.set(e.id, e));
      remote.forEach((e) => map.set(e.id, e));
      return Array.from(map.values()).sort((a, b) => b.date.localeCompare(a.date));
    });
  }, []);

  // Auth Handlers
  const handleOpenAuthModal = useCallback((tab: 'login' | 'register' = 'login') => {
    setAuthModalTab(tab);
    setIsAuthMandatory(false);
    setIsAuthModalOpen(true);
  }, []);

  const handleLoginSuccess = useCallback((user: AuthUser) => {
    setCurrentUser(user);
    saveStoredAuthUser(user);
    setIsAuthMandatory(false);
    setIsAuthModalOpen(false);
  }, []);

  const handleLogout = useCallback(() => {
    setCurrentUser(null);
    saveStoredAuthUser(null);
    setAuthModalTab('login');
    setIsAuthMandatory(true);
    setIsAuthModalOpen(true);
  }, []);

  // Ledger Creation Handler
  const handleCreateLedger = useCallback((newLedger: LedgerWorkspace) => {
    setLedgers((prev) => [...prev, newLedger]);
    setActiveLedgerId(newLedger.id);
  }, []);

  return (
    <div className="min-h-screen bg-[#f4f5f7] text-zinc-900 flex flex-col font-sans antialiased relative selection:bg-zinc-900 selection:text-white">
      {/* Spatial Ambient Lighting & Atmospheric Depth Planes */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
        {/* Top-center dimensional ambient beam */}
        <div className="absolute -top-48 left-1/2 -translate-x-1/2 w-[900px] h-[550px] rounded-full bg-gradient-to-b from-white/90 via-zinc-200/35 to-transparent blur-[130px]" />
        {/* Left subtle alabaster light aura */}
        <div className="absolute top-1/3 -left-48 w-[600px] h-[600px] rounded-full bg-gradient-to-r from-zinc-200/40 via-stone-100/30 to-transparent blur-[120px]" />
        {/* Bottom-right cool slate aura */}
        <div className="absolute -bottom-48 right-1/4 w-[750px] h-[650px] rounded-full bg-gradient-to-t from-slate-200/35 via-zinc-100/20 to-transparent blur-[130px]" />
        {/* Subtle Spatial Optical Matrix */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(#18181b 1px, transparent 1px)`,
            backgroundSize: '32px 32px'
          }}
        />
      </div>

      {/* Floating Spatial Navigation Dock */}
      <div className="relative z-20 pt-3 sm:pt-4 px-3 sm:px-6">
        <Header
          company={company}
          supabaseConfig={supabaseConfig}
          currentUser={currentUser}
          ledgers={ledgers}
          activeLedgerId={activeLedgerId}
          onSelectLedger={setActiveLedgerId}
          onOpenNewLedgerModal={() => setIsNewLedgerModalOpen(true)}
          onOpenAuthModal={handleOpenAuthModal}
          onLogout={handleLogout}
          onOpenNewTransaction={() => {
            setTransactionModalMode('income');
            setIsTransactionModalOpen(true);
          }}
          onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)}
          onOpenRenderModal={() => setIsRenderModalOpen(true)}
          onOpenCompanyModal={() => setIsCompanyModalOpen(true)}
          activeView={activeView}
          setActiveView={setActiveView}
        />
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 relative z-10">
        {activeView === 'dashboard' && (
          <Dashboard
            entries={entries}
            accounts={accounts}
            company={company}
            onOpenNewTransaction={(mode) => {
              setTransactionModalMode(mode || 'income');
              setIsTransactionModalOpen(true);
            }}
            onViewBooks={(book) => {
              setActiveBook(book);
              setActiveView('books');
            }}
            onSelectEntry={(entry) => setSelectedEntry(entry)}
            onOpenNewLedgerModal={() => setIsNewLedgerModalOpen(true)}
          />
        )}

        {activeView === 'books' && (
          <BooksOfAccounts
            entries={entries}
            accounts={accounts}
            company={company}
            activeBook={activeBook}
            onChangeBook={setActiveBook}
            onReverseEntry={handleReverseEntry}
            onSelectEntry={(entry) => setSelectedEntry(entry)}
            onOpenNewLedgerModal={() => setIsNewLedgerModalOpen(true)}
          />
        )}

        {activeView === 'bir' && (
          <BIRReports
            entries={entries}
            company={company}
          />
        )}

        {activeView === 'financials' && (
          <FinancialStatements
            entries={entries}
            accounts={accounts}
            company={company}
          />
        )}

        {activeView === 'accounts' && (
          <AccountManagement
            accounts={accounts}
            onUpdateAccounts={setAccounts}
            entries={entries}
            company={company}
            onOpenCompanyModal={() => setIsCompanyModalOpen(true)}
          />
        )}
      </main>

      {/* Spatial Neutral Floating Footer */}
      <footer className="relative z-10 mt-auto border-t border-zinc-200/80 bg-white/60 backdrop-blur-xl text-zinc-600 text-xs py-4 px-6 text-center shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center space-x-2 text-zinc-600">
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-900 shadow-xs" />
            <span className="font-medium text-zinc-700">
              Calypso Spatial General Ledger &bull; Bureau of Internal Revenue Compliant &bull; RR 9-2009 / RR 11-2004
            </span>
          </div>
          <div className="flex items-center space-x-4 font-semibold text-zinc-600">
            <button
              onClick={() => setIsRenderModalOpen(true)}
              className="hover:text-zinc-950 hover:underline transition"
            >
              Render Blueprint
            </button>
            <button
              onClick={() => setIsSupabaseModalOpen(true)}
              className="hover:text-zinc-950 hover:underline transition"
            >
              Supabase Real-Time
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <TransactionModal
        isOpen={isTransactionModalOpen}
        onClose={() => setIsTransactionModalOpen(false)}
        onSaveEntry={handleSaveEntry}
        accounts={accounts}
        existingEntriesCount={entries.length}
        initialMode={transactionModalMode}
      />

      <SupabaseSyncModal
        isOpen={isSupabaseModalOpen}
        onClose={() => setIsSupabaseModalOpen(false)}
        config={supabaseConfig}
        onUpdateConfig={setSupabaseConfig}
        entries={entries}
        onMergeEntriesFromRemote={handleMergeRemoteEntries}
      />

      <RenderDeployModal
        isOpen={isRenderModalOpen}
        onClose={() => setIsRenderModalOpen(false)}
      />

      <CompanyProfileModal
        isOpen={isCompanyModalOpen}
        onClose={() => setIsCompanyModalOpen(false)}
        profile={company}
        onSaveProfile={setCompany}
      />

      <VoucherDetailModal
        entry={selectedEntry}
        onClose={() => setSelectedEntry(null)}
        company={company}
        onRequestReversal={(id) => handleReverseEntry(id, 'User requested audit reversal')}
      />

      {/* Dedicated Log In and New User Registration Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
        initialTab={authModalTab}
        isMandatory={isAuthMandatory}
      />

      {/* New General Ledger Creation Modal */}
      <NewLedgerModal
        isOpen={isNewLedgerModalOpen}
        onClose={() => setIsNewLedgerModalOpen(false)}
        onCreateLedger={handleCreateLedger}
        existingLedgersCount={ledgers.length}
      />
    </div>
  );
}
