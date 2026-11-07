import React, { useState } from 'react';
import { 
  X, 
  Database, 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  Check, 
  Radio, 
  RefreshCw, 
  ArrowUpDown
} from 'lucide-react';
import { SupabaseConfig, JournalEntry } from '../types/ledger';
import { 
  testSupabaseConnection, 
  saveStoredSupabaseConfig, 
  resetSupabaseClient,
  SUPABASE_SQL_SCHEMA,
  syncEntryToSupabase,
  fetchEntriesFromSupabase
} from '../lib/supabase';

interface SupabaseSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: SupabaseConfig;
  onUpdateConfig: (newConfig: SupabaseConfig) => void;
  entries: JournalEntry[];
  onMergeEntriesFromRemote: (remoteEntries: JournalEntry[]) => void;
}

export const SupabaseSyncModal: React.FC<SupabaseSyncModalProps> = ({
  isOpen,
  onClose,
  config,
  onUpdateConfig,
  entries,
  onMergeEntriesFromRemote,
}) => {
  const [url, setUrl] = useState(config.url || '');
  const [anonKey, setAnonKey] = useState(config.anonKey || '');
  const [autoSync, setAutoSync] = useState(config.autoSync ?? true);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; tableFound: boolean } | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [hasCopiedSQL, setHasCopiedSQL] = useState(false);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    if (!url.trim() || !anonKey.trim()) {
      setTestResult({
        success: false,
        tableFound: false,
        message: 'Please provide both your Supabase Project URL and Anon API Key.',
      });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    const result = await testSupabaseConnection(url, anonKey);
    setIsTesting(false);
    setTestResult(result);

    if (result.success) {
      const updatedConfig: SupabaseConfig = {
        url: url.trim(),
        anonKey: anonKey.trim(),
        isConnected: true,
        tableName: 'journal_entries',
        autoSync,
        lastSyncedAt: new Date().toISOString(),
      };
      saveStoredSupabaseConfig(updatedConfig);
      onUpdateConfig(updatedConfig);
    }
  };

  const handleDisconnect = () => {
    const updatedConfig: SupabaseConfig = {
      url: '',
      anonKey: '',
      isConnected: false,
      tableName: 'journal_entries',
      autoSync: false,
    };
    resetSupabaseClient();
    saveStoredSupabaseConfig(updatedConfig);
    onUpdateConfig(updatedConfig);
    setUrl('');
    setAnonKey('');
    setTestResult(null);
    setSyncMessage('Disconnected from Supabase. App running in local-first mode.');
  };

  const handleCopySQL = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setHasCopiedSQL(true);
    setTimeout(() => setHasCopiedSQL(false), 2500);
  };

  const handleManualSyncNow = async () => {
    if (!config.isConnected) {
      setSyncMessage('Please connect and test your Supabase instance first.');
      return;
    }

    setIsSyncing(true);
    setSyncMessage(null);

    try {
      let pushed = 0;
      for (const entry of entries) {
        const ok = await syncEntryToSupabase(entry, config);
        if (ok) pushed++;
      }

      const remote = await fetchEntriesFromSupabase(config);
      if (remote && remote.length > 0) {
        onMergeEntriesFromRemote(remote);
      }

      setSyncMessage(`Synchronization complete: ${pushed} entries synced with Supabase.`);
      onUpdateConfig({
        ...config,
        lastSyncedAt: new Date().toISOString(),
      });
    } catch (e: any) {
      setSyncMessage(`Sync failed: ${e.message || 'Network error'}`);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/45 backdrop-blur-md p-4 overflow-y-auto">
      <div className="spatial-elevated rounded-3xl max-w-xl w-full shadow-2xl p-6 space-y-5 my-8 text-zinc-800 border border-zinc-200/90 ring-1 ring-zinc-900/5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-200/80 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white shadow-xs">
              <Database className="w-5 h-5 text-zinc-100" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
                <span>Supabase Cloud & Real-Time Sync</span>
              </h2>
              <p className="text-xs text-zinc-500">
                Connect your PostgreSQL database for persistent records & live team updates
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Connection Status Indicator */}
        <div className={`p-4 rounded-2xl border flex items-center justify-between text-xs ${
          config.isConnected
            ? 'bg-zinc-100/90 border-zinc-300 text-zinc-900'
            : 'bg-zinc-50 border-zinc-200 text-zinc-700'
        }`}>
          <div className="flex items-center space-x-2.5">
            <Radio className={`w-4 h-4 ${config.isConnected ? 'text-emerald-600 animate-pulse' : 'text-zinc-400'}`} />
            <div>
              <span className="font-semibold text-zinc-900">
                Status: {config.isConnected ? 'Connected to Supabase' : 'Offline / Browser Storage Mode'}
              </span>
              {config.lastSyncedAt && (
                <div className="text-[10px] text-zinc-500 font-mono">
                  Last synced: {new Date(config.lastSyncedAt).toLocaleTimeString()}
                </div>
              )}
            </div>
          </div>

          {config.isConnected && (
            <button
              onClick={handleDisconnect}
              className="text-[11px] text-rose-600 hover:text-rose-700 font-semibold underline"
            >
              Disconnect
            </button>
          )}
        </div>

        {/* Credentials Form */}
        <div className="space-y-3.5 text-xs">
          <div>
            <label className="block text-zinc-700 font-semibold mb-1">
              Supabase Project URL:
            </label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://your-project-ref.supabase.co"
              className="spatial-input w-full rounded-xl px-3 py-2 text-zinc-900 font-mono placeholder:text-zinc-400"
            />
          </div>

          <div>
            <label className="block text-zinc-700 font-semibold mb-1">
              Supabase Anon / Public API Key:
            </label>
            <input
              type="password"
              value={anonKey}
              onChange={(e) => setAnonKey(e.target.value)}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              className="spatial-input w-full rounded-xl px-3 py-2 text-zinc-900 font-mono placeholder:text-zinc-400"
            />
          </div>

          <div className="flex items-center space-x-2 pt-1">
            <input
              type="checkbox"
              id="autoSync"
              checked={autoSync}
              onChange={(e) => setAutoSync(e.target.checked)}
              className="rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900"
            />
            <label htmlFor="autoSync" className="text-zinc-600 cursor-pointer text-xs">
              Enable Real-time Postgres subscriptions (live updates across accountants)
            </label>
          </div>
        </div>

        {/* Test Result Feedback */}
        {testResult && (
          <div className={`p-3.5 rounded-2xl border text-xs flex items-start space-x-2 ${
            testResult.success 
              ? 'bg-zinc-100 border-zinc-300 text-zinc-800' 
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}>
            {testResult.success ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            )}
            <div>
              <p>{testResult.message}</p>
            </div>
          </div>
        )}

        {syncMessage && (
          <div className="p-3.5 rounded-2xl bg-zinc-100 border border-zinc-300 text-xs text-zinc-900 font-mono">
            {syncMessage}
          </div>
        )}

        {/* Database Migration Schema Accordion in Spatial Card */}
        <div className="spatial-card rounded-2xl p-4 space-y-2 border border-zinc-200/80 bg-zinc-50/80">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-800">
              Supabase SQL Table Schema & RLS
            </span>
            <button
              onClick={handleCopySQL}
              className="spatial-button-secondary flex items-center space-x-1.5 px-3 py-1 rounded-xl text-xs font-semibold text-zinc-800"
            >
              {hasCopiedSQL ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{hasCopiedSQL ? 'Copied to Clipboard!' : 'Copy SQL Schema'}</span>
            </button>
          </div>
          <p className="text-[11px] text-zinc-600 leading-relaxed">
            Paste this SQL script once into your Supabase project's <strong>SQL Editor</strong> to create the certified BIR journal entries table, chart of accounts, and real-time replication publication.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-2 pt-2 border-t border-zinc-200/80">
          <div className="flex space-x-2">
            <button
              onClick={handleTestConnection}
              disabled={isTesting}
              className="spatial-button-primary px-4 py-2 text-xs font-bold rounded-xl flex items-center space-x-1.5 disabled:opacity-50"
            >
              {isTesting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
              <span>{isTesting ? 'Verifying...' : 'Test & Connect'}</span>
            </button>

            {config.isConnected && (
              <button
                onClick={handleManualSyncNow}
                disabled={isSyncing}
                className="spatial-button-secondary px-3.5 py-2 text-xs font-semibold rounded-xl text-zinc-800 flex items-center space-x-1.5"
              >
                <ArrowUpDown className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
              </button>
            )}
          </div>

          <button
            onClick={onClose}
            className="spatial-button-secondary px-4 py-2 text-xs font-semibold rounded-xl text-zinc-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
