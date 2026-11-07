import React from 'react';
import { 
  Building2, 
  Database, 
  Cloud, 
  PlusCircle, 
  ShieldCheck, 
  Radio, 
  Sliders,
  FileCheck2,
} from 'lucide-react';
import { CompanyProfile, SupabaseConfig } from '../types/ledger';

interface HeaderProps {
  company: CompanyProfile;
  supabaseConfig: SupabaseConfig;
  onOpenNewTransaction: () => void;
  onOpenSupabaseModal: () => void;
  onOpenRenderModal: () => void;
  onOpenCompanyModal: () => void;
  activeView: 'dashboard' | 'books' | 'bir' | 'financials';
  setActiveView: (view: 'dashboard' | 'books' | 'bir' | 'financials') => void;
}

export const Header: React.FC<HeaderProps> = ({
  company,
  supabaseConfig,
  onOpenNewTransaction,
  onOpenSupabaseModal,
  onOpenRenderModal,
  onOpenCompanyModal,
  activeView,
  setActiveView,
}) => {
  return (
    <header className="max-w-7xl mx-auto spatial-glass rounded-3xl p-3 sm:p-4 shadow-[0_18px_40px_-12px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] border border-white/80 ring-1 ring-zinc-950/5">
      {/* Top Bar with Brand & Spatial Tools */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-200/60">
        {/* Brand & Identity */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-b from-zinc-800 to-zinc-950 border border-zinc-700/60 flex items-center justify-center text-white shadow-md shadow-zinc-950/20">
            <Building2 className="w-5 h-5 text-zinc-100" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-lg tracking-tight text-zinc-900">
                Calypso
              </span>
              <span className="px-2 py-0.5 text-[10px] font-semibold bg-zinc-100 text-zinc-700 border border-zinc-200/80 rounded-md flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-zinc-600" />
                BIR RR 9-2009
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 truncate max-w-[240px] sm:max-w-xs font-medium">
              {company.businessName} &bull; TIN {company.tin}
            </p>
          </div>
        </div>

        {/* Quick Actions & Status Badges in Neutral Palette */}
        <div className="flex items-center space-x-2 sm:space-x-2.5 flex-wrap">
          {/* Supabase Connection Status Pill */}
          <button
            onClick={onOpenSupabaseModal}
            title="Supabase Database Management & Real-time Sync"
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              supabaseConfig.isConnected
                ? 'bg-zinc-900 text-white border-zinc-800 shadow-xs'
                : 'bg-white hover:bg-zinc-50 text-zinc-700 border-zinc-200 shadow-xs'
            }`}
          >
            <Database className="w-3.5 h-3.5 text-zinc-400" />
            <span className="hidden md:inline">
              {supabaseConfig.isConnected ? 'Supabase Real-Time' : 'Connect Supabase'}
            </span>
            {supabaseConfig.isConnected && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block shadow-xs" />
            )}
          </button>

          {/* Render Cloud Deploy Badge */}
          <button
            onClick={onOpenRenderModal}
            title="Render Cloud Deployment & Blueprint"
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white hover:bg-zinc-50 text-zinc-700 border border-zinc-200 shadow-xs transition-all"
          >
            <Cloud className="w-3.5 h-3.5 text-zinc-500" />
            <span className="hidden sm:inline">Deploy on Render</span>
          </button>

          {/* Company Settings */}
          <button
            onClick={onOpenCompanyModal}
            title="Company BIR Registration & Tax Settings"
            className="p-2 text-zinc-600 hover:text-zinc-950 bg-white hover:bg-zinc-50 border border-zinc-200 rounded-xl transition shadow-xs"
          >
            <Sliders className="w-4 h-4" />
          </button>

          {/* Primary Action: Record Transaction Voucher */}
          <button
            onClick={onOpenNewTransaction}
            className="spatial-button-primary px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4 text-zinc-300" />
            <span>Record Voucher</span>
          </button>
        </div>
      </div>

      {/* Floating Spatial Segmented Navigation Dock */}
      <div className="pt-2.5">
        <div className="flex p-1 bg-zinc-100/80 rounded-2xl border border-zinc-200/80 overflow-x-auto scrollbar-none gap-1">
          <button
            onClick={() => setActiveView('dashboard')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl whitespace-nowrap transition-all flex items-center space-x-1.5 ${
              activeView === 'dashboard'
                ? 'bg-white text-zinc-950 font-bold shadow-xs border border-zinc-200/70'
                : 'text-zinc-600 hover:text-zinc-950 hover:bg-white/50'
            }`}
          >
            <Radio className="w-3.5 h-3.5 text-zinc-500" />
            <span>Real-Time Overview</span>
          </button>

          <button
            onClick={() => setActiveView('books')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl whitespace-nowrap transition-all flex items-center space-x-1.5 ${
              activeView === 'books'
                ? 'bg-white text-zinc-950 font-bold shadow-xs border border-zinc-200/70'
                : 'text-zinc-600 hover:text-zinc-950 hover:bg-white/50'
            }`}
          >
            <FileCheck2 className="w-3.5 h-3.5 text-zinc-500" />
            <span>4 BIR Books of Accounts</span>
          </button>

          <button
            onClick={() => setActiveView('bir')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl whitespace-nowrap transition-all flex items-center space-x-1.5 ${
              activeView === 'bir'
                ? 'bg-white text-zinc-950 font-bold shadow-xs border border-zinc-200/70'
                : 'text-zinc-600 hover:text-zinc-950 hover:bg-white/50'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-zinc-500" />
            <span>BIR Tax Returns (2550 & 2307)</span>
          </button>

          <button
            onClick={() => setActiveView('financials')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl whitespace-nowrap transition-all flex items-center space-x-1.5 ${
              activeView === 'financials'
                ? 'bg-white text-zinc-950 font-bold shadow-xs border border-zinc-200/70'
                : 'text-zinc-600 hover:text-zinc-950 hover:bg-white/50'
            }`}
          >
            <Building2 className="w-3.5 h-3.5 text-zinc-500" />
            <span>Financial Statements</span>
          </button>
        </div>
      </div>
    </header>
  );
};
