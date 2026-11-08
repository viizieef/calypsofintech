import React, { useState } from 'react';
import { 
  BookOpen, 
  Plus, 
  X, 
  Calendar, 
  Layers, 
  Building2, 
  CheckCircle2, 
  AlertCircle,
  ShieldCheck,
  Coins
} from 'lucide-react';
import { LedgerWorkspace } from '../types/ledger';

interface NewLedgerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateLedger: (ledger: LedgerWorkspace) => void;
  existingLedgersCount: number;
}

export const NewLedgerModal: React.FC<NewLedgerModalProps> = ({
  isOpen,
  onClose,
  onCreateLedger,
  existingLedgersCount,
}) => {
  const currentYear = new Date().getFullYear().toString();
  const [ledgerName, setLedgerName] = useState('');
  const [ledgerCode, setLedgerCode] = useState(`GL-${currentYear}-00${existingLedgersCount + 1}`);
  const [fiscalYear, setFiscalYear] = useState(currentYear);
  const [branchName, setBranchName] = useState('Head Office - Metro Manila');
  const [basis, setBasis] = useState<'ACCRUAL' | 'CASH'>('ACCRUAL');
  const [currency] = useState('PHP');
  const [description, setDescription] = useState('');
  const [template, setTemplate] = useState<'standard' | 'blank'>('standard');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!ledgerName.trim()) {
      setError('Please provide a name for this General Ledger.');
      return;
    }
    if (!ledgerCode.trim()) {
      setError('Please enter a unique Ledger Code identifier.');
      return;
    }

    const newLedger: LedgerWorkspace = {
      id: `ledger-${Date.now()}`,
      name: ledgerName.trim(),
      code: ledgerCode.trim().toUpperCase(),
      fiscalYear: fiscalYear.trim(),
      currency,
      basis,
      branchName: branchName.trim() || undefined,
      description: description.trim() || undefined,
      isPrimary: existingLedgersCount === 0,
      createdAt: new Date().toISOString(),
    };

    onCreateLedger(newLedger);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 backdrop-blur-md p-4 overflow-y-auto">
      <div className="spatial-elevated rounded-3xl max-w-lg w-full shadow-2xl p-6 sm:p-7 space-y-4 my-8 text-zinc-900 border border-white/80 ring-1 ring-zinc-950/10 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition cursor-pointer"
          title="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center space-x-3.5 border-b border-zinc-200/80 pb-4">
          <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white shadow-md">
            <BookOpen className="w-6 h-6 text-zinc-100" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-extrabold text-lg text-zinc-950 tracking-tight font-display">
                Create New General Ledger
              </h3>
              <span className="px-2 py-0.5 text-[10px] font-semibold bg-zinc-100 text-zinc-700 border border-zinc-200 rounded-md">
                RR 9-2009
              </span>
            </div>
            <p className="text-xs text-zinc-500 font-medium mt-0.5">
              Establish a new independent fiscal book, branch ledger, or subsidiary accounts
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block text-zinc-700 font-semibold mb-1">
              General Ledger Name
            </label>
            <input
              type="text"
              required
              value={ledgerName}
              onChange={(e) => setLedgerName(e.target.value)}
              placeholder="e.g. FY 2026 - Main Operating Ledger or Cebu Regional Branch"
              className="spatial-input w-full rounded-xl px-3 py-2 text-zinc-900 font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-zinc-700 font-semibold mb-1">
                Ledger Code / Reference
              </label>
              <input
                type="text"
                required
                value={ledgerCode}
                onChange={(e) => setLedgerCode(e.target.value)}
                placeholder="e.g. GL-2026-MAIN"
                className="spatial-input w-full rounded-xl px-3 py-2 text-zinc-900 font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-zinc-700 font-semibold mb-1">
                Fiscal Year Period
              </label>
              <input
                type="text"
                required
                value={fiscalYear}
                onChange={(e) => setFiscalYear(e.target.value)}
                placeholder="e.g. 2026"
                className="spatial-input w-full rounded-xl px-3 py-2 text-zinc-900 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-zinc-700 font-semibold mb-1">
                Branch / Entity Division
              </label>
              <input
                type="text"
                value={branchName}
                onChange={(e) => setBranchName(e.target.value)}
                placeholder="e.g. Head Office / Branch 01"
                className="spatial-input w-full rounded-xl px-3 py-2 text-zinc-900 font-medium"
              />
            </div>

            <div>
              <label className="block text-zinc-700 font-semibold mb-1">
                Accounting Method
              </label>
              <select
                value={basis}
                onChange={(e) => setBasis(e.target.value as 'ACCRUAL' | 'CASH')}
                className="spatial-input w-full rounded-xl px-3 py-2 text-zinc-900 font-medium"
              >
                <option value="ACCRUAL">Accrual Basis (BIR Standard)</option>
                <option value="CASH">Cash Basis</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-zinc-700 font-semibold mb-1">
                Functional Currency
              </label>
              <div className="relative">
                <input
                  type="text"
                  disabled
                  value="PHP - Philippine Peso (₱)"
                  className="spatial-input w-full rounded-xl px-3 py-2 text-zinc-600 bg-zinc-50 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-zinc-700 font-semibold mb-1">
                Chart of Accounts Starter
              </label>
              <select
                value={template}
                onChange={(e) => setTemplate(e.target.value as any)}
                className="spatial-input w-full rounded-xl px-3 py-2 text-zinc-900 font-medium"
              >
                <option value="standard">Standard BIR 6-Digit (RR 9-2009)</option>
                <option value="blank">Blank Ledger Structure</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-zinc-700 font-semibold mb-1">
              Description / Notes (Optional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Primary sales, purchases, and VAT ledger for main operations"
              className="spatial-input w-full rounded-xl px-3 py-2 text-zinc-900 font-medium"
            />
          </div>

          {/* Compliance notice */}
          <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200/80 text-[11px] text-zinc-600 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-zinc-700 shrink-0 mt-0.5" />
            <span>
              Each ledger maintains its independent 4 Books of Accounts, VAT 2550 calculation sheets, and audit vouchers per BIR Computerized Accounting System standards.
            </span>
          </div>

          <div className="flex justify-end space-x-2 pt-3 border-t border-zinc-200">
            <button
              type="button"
              onClick={onClose}
              className="spatial-button-secondary px-4 py-2 text-xs font-semibold rounded-xl text-zinc-700 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="spatial-button-primary px-5 py-2 text-xs font-bold rounded-xl flex items-center space-x-1.5 cursor-pointer shadow-sm"
            >
              <Plus className="w-4 h-4 text-zinc-300" />
              <span>Create General Ledger</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
