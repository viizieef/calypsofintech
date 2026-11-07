import React, { useState, useEffect } from 'react';
import { 
  X, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  TrendingUp, 
  TrendingDown, 
  FileCode2,
  Receipt,
} from 'lucide-react';
import { 
  JournalEntry, 
  Account, 
  BIRTaxType, 
  BIRWithholdingTaxRate, 
  JournalLine, 
  BIRMetadata 
} from '../types/ledger';
import { formatPHP } from '../lib/birCompliance';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveEntry: (entry: JournalEntry) => void;
  accounts: Account[];
  existingEntriesCount: number;
  initialMode?: 'income' | 'expense' | 'manual';
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  onSaveEntry,
  accounts,
  existingEntriesCount,
  initialMode = 'income',
}) => {
  const [mode, setMode] = useState<'income' | 'expense' | 'manual'>(initialMode);

  // Sync mode if changed from props
  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  // Form Fields for Quick Income / Expense
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState('');
  const [entityName, setEntityName] = useState('');
  const [entityTin, setEntityTin] = useState('');
  const [entityAddress, setEntityAddress] = useState('');
  const [documentType, setDocumentType] = useState<BIRMetadata['documentType']>('Sales Invoice');
  const [documentNumber, setDocumentNumber] = useState('');
  const [netAmount, setNetAmount] = useState<number>(50000);
  const [taxType, setTaxType] = useState<BIRTaxType>('VAT_12');
  const [ewtRate, setEwtRate] = useState<BIRWithholdingTaxRate>(0.02); // 2% default for technical services
  const [selectedAccountId, setSelectedAccountId] = useState('acc-4010'); // Default service revenue
  const [paymentAccountId, setPaymentAccountId] = useState('acc-1020'); // Cash in bank

  // Manual Multi-Line Journal Entry Fields
  const [manualVoucherNumber, setManualVoucherNumber] = useState('');
  const [manualBookType, setManualBookType] = useState<'GENERAL_JOURNAL' | 'CASH_RECEIPTS' | 'CASH_DISBURSEMENTS'>('GENERAL_JOURNAL');
  const [manualLines, setManualLines] = useState<JournalLine[]>([
    { id: '1', accountId: 'acc-1020', accountCode: '1020', accountName: 'Cash in Bank (Operating Account)', debit: 50000, credit: 0, memo: '' },
    { id: '2', accountId: 'acc-4010', accountCode: '4010', accountName: 'Service Revenue - VATable (12%)', debit: 0, credit: 50000, memo: '' },
  ]);

  // Reset or seed voucher number
  useEffect(() => {
    const seq = String(existingEntriesCount + 1).padStart(4, '0');
    if (mode === 'income') {
      setDocumentType('Sales Invoice');
      setSelectedAccountId('acc-4010');
      setDescription('Professional Services Delivered');
    } else if (mode === 'expense') {
      setDocumentType('Official Receipt');
      setSelectedAccountId('acc-6010'); // Rent or overhead
      setDescription('Office Operating Expense');
    } else {
      setManualVoucherNumber(`JV-2026-${seq}`);
    }
  }, [mode, existingEntriesCount]);

  if (!isOpen) return null;

  // Real-time computed taxes for Quick Mode
  const computedVat = taxType === 'VAT_12' ? netAmount * 0.12 : 0;
  const computedEwt = netAmount * ewtRate;
  const computedTotalReceivable = netAmount + computedVat;
  const computedCashInflow = computedTotalReceivable - computedEwt;
  const computedCashOutflow = netAmount + computedVat - computedEwt;

  // Manual Lines Totals
  const manualTotalDebit = manualLines.reduce((s, l) => s + (Number(l.debit) || 0), 0);
  const manualTotalCredit = manualLines.reduce((s, l) => s + (Number(l.credit) || 0), 0);
  const isManualBalanced = Math.abs(manualTotalDebit - manualTotalCredit) < 0.01 && manualTotalDebit > 0;

  // Quick submission
  const handleSubmitQuick = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || netAmount <= 0) return;

    const seq = String(existingEntriesCount + 1).padStart(4, '0');
    const voucherNumber = mode === 'income' ? `CRV-2026-${seq}` : `CDV-2026-${seq}`;
    const targetAcc = accounts.find((a) => a.id === selectedAccountId);
    const bankAcc = accounts.find((a) => a.id === paymentAccountId) || accounts[1];

    let generatedLines: JournalLine[] = [];

    if (mode === 'income') {
      generatedLines.push({
        id: `jl-${Date.now()}-1`,
        accountId: bankAcc.id,
        accountCode: bankAcc.code,
        accountName: bankAcc.name,
        debit: computedCashInflow,
        credit: 0,
        memo: `Collection for ${documentNumber || voucherNumber}`,
      });

      if (computedEwt > 0) {
        generatedLines.push({
          id: `jl-${Date.now()}-2`,
          accountId: 'acc-1040',
          accountCode: '1040',
          accountName: 'Creditable Withholding Tax (BIR Form 2307)',
          debit: computedEwt,
          credit: 0,
          memo: `${Math.round(ewtRate * 100)}% EWT deducted at source by client`,
        });
      }

      generatedLines.push({
        id: `jl-${Date.now()}-3`,
        accountId: targetAcc?.id || 'acc-4010',
        accountCode: targetAcc?.code || '4010',
        accountName: targetAcc?.name || 'Service Revenue',
        debit: 0,
        credit: netAmount,
        memo: description,
      });

      if (computedVat > 0) {
        generatedLines.push({
          id: `jl-${Date.now()}-4`,
          accountId: 'acc-2020',
          accountCode: '2020',
          accountName: 'Output Tax (12% VAT on Sales)',
          debit: 0,
          credit: computedVat,
          memo: `12% Output Tax on ${documentNumber || voucherNumber}`,
        });
      }
    } else {
      generatedLines.push({
        id: `jl-${Date.now()}-1`,
        accountId: targetAcc?.id || 'acc-6010',
        accountCode: targetAcc?.code || '6010',
        accountName: targetAcc?.name || 'Operating Expense',
        debit: netAmount,
        credit: 0,
        memo: description,
      });

      if (computedVat > 0) {
        generatedLines.push({
          id: `jl-${Date.now()}-2`,
          accountId: 'acc-1050',
          accountCode: '1050',
          accountName: 'Input Tax (12% VAT on Purchases)',
          debit: computedVat,
          credit: 0,
          memo: `12% Input VAT under valid supplier invoice`,
        });
      }

      if (computedEwt > 0) {
        generatedLines.push({
          id: `jl-${Date.now()}-3`,
          accountId: 'acc-2030',
          accountCode: '2030',
          accountName: 'Expanded Withholding Tax Payable (BIR 1601-EQ)',
          debit: 0,
          credit: computedEwt,
          memo: `${Math.round(ewtRate * 100)}% EWT to remit via BIR Form 1601-EQ`,
        });
      }

      generatedLines.push({
        id: `jl-${Date.now()}-4`,
        accountId: bankAcc.id,
        accountCode: bankAcc.code,
        accountName: bankAcc.name,
        debit: 0,
        credit: computedCashOutflow,
        memo: `Disbursement for ${entityName}`,
      });
    }

    const newEntry: JournalEntry = {
      id: `je-${Date.now()}`,
      voucherNumber,
      date,
      description,
      bookType: mode === 'income' ? 'CASH_RECEIPTS' : 'CASH_DISBURSEMENTS',
      isPosted: true,
      lines: generatedLines,
      birMetadata: {
        documentType,
        documentNumber: documentNumber || `DOC-${seq}`,
        entityName: entityName || (mode === 'income' ? 'Client' : 'Supplier'),
        entityTin: entityTin || '000-000-000-000',
        entityAddress: entityAddress || '',
        taxType,
        netAmount,
        vatAmount: computedVat,
        ewtRate,
        ewtAmount: computedEwt,
        atcCode: ewtRate === 0.05 ? 'WI100' : ewtRate === 0.01 ? 'WC100' : 'WC158',
        form2307Ref: mode === 'income' && computedEwt > 0 ? `2307-${voucherNumber}` : undefined,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSaveEntry(newEntry);
    onClose();
  };

  // Manual Multi-Line Submission
  const handleSubmitManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isManualBalanced || !description.trim()) return;

    const newEntry: JournalEntry = {
      id: `je-${Date.now()}`,
      voucherNumber: manualVoucherNumber || `JV-2026-${Date.now()}`,
      date,
      description,
      bookType: manualBookType,
      isPosted: true,
      lines: manualLines,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSaveEntry(newEntry);
    onClose();
  };

  const handleAddManualLine = () => {
    const nextAcc = accounts[0];
    setManualLines([
      ...manualLines,
      {
        id: `line-${Date.now()}`,
        accountId: nextAcc.id,
        accountCode: nextAcc.code,
        accountName: nextAcc.name,
        debit: 0,
        credit: 0,
        memo: '',
      },
    ]);
  };

  const handleRemoveManualLine = (id: string) => {
    if (manualLines.length <= 2) return;
    setManualLines(manualLines.filter((l) => l.id !== id));
  };

  const handleUpdateManualLine = (id: string, updates: Partial<JournalLine>) => {
    setManualLines(
      manualLines.map((l) => {
        if (l.id !== id) return l;
        const updated = { ...l, ...updates };
        if (updates.accountId) {
          const acc = accounts.find((a) => a.id === updates.accountId);
          if (acc) {
            updated.accountCode = acc.code;
            updated.accountName = acc.name;
          }
        }
        return updated;
      })
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/45 backdrop-blur-md p-4 overflow-y-auto">
      <div className="spatial-elevated rounded-3xl max-w-2xl w-full shadow-2xl space-y-4 my-8 text-zinc-800 border border-zinc-200/90 ring-1 ring-zinc-900/5">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-zinc-200/80">
          <div>
            <h2 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
              <Receipt className="w-5 h-5 text-zinc-900" />
              <span>Record Real-Time Ledger Voucher</span>
            </h2>
            <p className="text-xs text-zinc-500">
              Double-entry posting with automatic BIR 12% VAT and withholding tax splitting
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector Tabs with Spatial Segmented Styling */}
        <div className="px-5">
          <div className="flex p-1 bg-zinc-100/90 border border-zinc-200/80 rounded-2xl space-x-1">
            <button
              type="button"
              onClick={() => setMode('income')}
              className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all flex items-center justify-center space-x-1.5 ${
                mode === 'income'
                  ? 'bg-zinc-900 text-white shadow-xs font-bold'
                  : 'text-zinc-600 hover:text-zinc-900 hover:bg-white/60'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Quick Sale (Income)</span>
            </button>

            <button
              type="button"
              onClick={() => setMode('expense')}
              className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all flex items-center justify-center space-x-1.5 ${
                mode === 'expense'
                  ? 'bg-zinc-900 text-white shadow-xs font-bold'
                  : 'text-zinc-600 hover:text-zinc-900 hover:bg-white/60'
              }`}
            >
              <TrendingDown className="w-3.5 h-3.5" />
              <span>Quick Expense (Disbursement)</span>
            </button>

            <button
              type="button"
              onClick={() => setMode('manual')}
              className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all flex items-center justify-center space-x-1.5 ${
                mode === 'manual'
                  ? 'bg-zinc-900 text-white shadow-xs font-bold'
                  : 'text-zinc-600 hover:text-zinc-900 hover:bg-white/60'
              }`}
            >
              <FileCode2 className="w-3.5 h-3.5" />
              <span>Journal Voucher (Manual)</span>
            </button>
          </div>
        </div>

        {/* Form Body */}
        {mode !== 'manual' ? (
          /* QUICK INCOME OR EXPENSE FORM */
          <form onSubmit={handleSubmitQuick} className="p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-zinc-700 mb-1">
                  Posting Date
                </label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="spatial-input w-full rounded-xl px-3 py-2 text-xs text-zinc-900"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-zinc-700 mb-1">
                  Transaction Description / Particulars
                </label>
                <input
                  type="text"
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={mode === 'income' ? 'e.g. Cloud Security Architecture Retainer' : 'e.g. Monthly Fiber Office Internet Leased Line'}
                  className="spatial-input w-full rounded-xl px-3 py-2 text-xs text-zinc-900 placeholder:text-zinc-400"
                />
              </div>
            </div>

            {/* BIR Document Metadata with Spatial Card */}
            <div className="spatial-card rounded-2xl p-4 space-y-3 border border-zinc-200/80 bg-zinc-50/70">
              <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-900 flex items-center justify-between">
                <span>Bureau of Internal Revenue (BIR) Invoice Details</span>
                <span className="text-[10px] text-zinc-700 bg-zinc-200/80 px-2 py-0.5 rounded-md border border-zinc-300 font-mono font-semibold">
                  RR 9-2009
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-medium text-zinc-600 mb-1">
                    {mode === 'income' ? 'Client / Payor Name' : 'Supplier / Vendor Name'}
                  </label>
                  <input
                    type="text"
                    required
                    value={entityName}
                    onChange={(e) => setEntityName(e.target.value)}
                    placeholder={mode === 'income' ? 'Ayala Land Corp' : 'PLDT Inc.'}
                    className="spatial-input w-full rounded-xl px-3 py-1.5 text-xs text-zinc-900 placeholder:text-zinc-400"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-medium text-zinc-600 mb-1">
                    Taxpayer TIN (000-000-000-000)
                  </label>
                  <input
                    type="text"
                    required
                    value={entityTin}
                    onChange={(e) => setEntityTin(e.target.value)}
                    placeholder="001-234-567-000"
                    className="spatial-input w-full font-mono rounded-xl px-3 py-1.5 text-xs text-zinc-900 placeholder:text-zinc-400"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-medium text-zinc-600 mb-1">
                    Document Number (SI/OR #)
                  </label>
                  <input
                    type="text"
                    required
                    value={documentNumber}
                    onChange={(e) => setDocumentNumber(e.target.value)}
                    placeholder="SI-2026-0811"
                    className="spatial-input w-full font-mono rounded-xl px-3 py-1.5 text-xs text-zinc-900 placeholder:text-zinc-400"
                  />
                </div>
              </div>
            </div>

            {/* Financial Amounts & Taxes */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-zinc-700 mb-1">
                  Taxable Base Amount (PHP)
                </label>
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  required
                  value={netAmount}
                  onChange={(e) => setNetAmount(Number(e.target.value) || 0)}
                  className="spatial-input w-full font-mono font-bold text-zinc-900 rounded-xl px-3 py-2 text-xs tabular-nums"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-700 mb-1">
                  VAT Treatment
                </label>
                <select
                  value={taxType}
                  onChange={(e) => setTaxType(e.target.value as BIRTaxType)}
                  className="spatial-input w-full rounded-xl px-3 py-2 text-xs text-zinc-900"
                >
                  <option value="VAT_12">12% Standard Value-Added Tax</option>
                  <option value="VAT_EXEMPT">VAT-Exempt (Sec. 109)</option>
                  <option value="VAT_ZERO_RATED">0% Zero-Rated Export</option>
                  <option value="NON_VAT">Non-VAT Registered</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-700 mb-1">
                  {mode === 'income' ? 'Withholding Tax (2307 Deducted)' : 'EWT Withholding (1601-EQ)'}
                </label>
                <select
                  value={ewtRate}
                  onChange={(e) => setEwtRate(Number(e.target.value) as BIRWithholdingTaxRate)}
                  className="spatial-input w-full rounded-xl px-3 py-2 text-xs text-zinc-900"
                >
                  <option value={0}>0% - No Withholding</option>
                  <option value={0.01}>1% - Goods / Supplies (WC100)</option>
                  <option value={0.02}>2% - Contractors / Services (WC158)</option>
                  <option value={0.05}>5% - Real Property Lease / Rent (WI100)</option>
                  <option value={0.10}>10% - Professional Fees (WI010)</option>
                  <option value={0.15}>15% - Professional Fees Corp (WI020)</option>
                </select>
              </div>
            </div>

            {/* Account Mapping */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-zinc-700 mb-1">
                  {mode === 'income' ? 'Credit Revenue Account' : 'Debit Expense / Asset Account'}
                </label>
                <select
                  value={selectedAccountId}
                  onChange={(e) => setSelectedAccountId(e.target.value)}
                  className="spatial-input w-full rounded-xl px-3 py-2 text-xs text-zinc-900"
                >
                  {accounts
                    .filter((a) => (mode === 'income' ? a.type === 'revenue' : a.type === 'expense' || a.type === 'cost_of_sales' || a.type === 'asset'))
                    .map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.code} - {acc.name}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-700 mb-1">
                  Settlement Account (Cash / Bank)
                </label>
                <select
                  value={paymentAccountId}
                  onChange={(e) => setPaymentAccountId(e.target.value)}
                  className="spatial-input w-full rounded-xl px-3 py-2 text-xs text-zinc-900"
                >
                  {accounts
                    .filter((a) => a.code === '1010' || a.code === '1020')
                    .map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.code} - {acc.name}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            {/* Live Auto-Generated Double-Entry Preview in Spatial Card */}
            <div className="spatial-card rounded-2xl p-4 space-y-2 border border-zinc-200/80 bg-zinc-50/80">
              <span className="text-[10px] font-bold text-zinc-700 uppercase tracking-wider block">
                Automatic Double-Entry Posting Preview
              </span>
              <div className="text-xs space-y-1.5 font-mono">
                {mode === 'income' ? (
                  <>
                    <div className="flex justify-between text-zinc-900 font-medium">
                      <span>Debit: Cash in Bank (Net Inflow)</span>
                      <span className="tabular-nums font-bold">{formatPHP(computedCashInflow)}</span>
                    </div>
                    {computedEwt > 0 && (
                      <div className="flex justify-between text-zinc-600 font-medium">
                        <span>Debit: BIR Form 2307 Tax Credit ({Math.round(ewtRate * 100)}%)</span>
                        <span className="tabular-nums">{formatPHP(computedEwt)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-zinc-800 font-medium">
                      <span>Credit: Revenue Account</span>
                      <span className="tabular-nums">{formatPHP(netAmount)}</span>
                    </div>
                    {computedVat > 0 && (
                      <div className="flex justify-between text-zinc-700 font-medium">
                        <span>Credit: Output Tax 12% (BIR 2550)</span>
                        <span className="tabular-nums">{formatPHP(computedVat)}</span>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="flex justify-between text-zinc-800 font-medium">
                      <span>Debit: Expense / Asset Account</span>
                      <span className="tabular-nums">{formatPHP(netAmount)}</span>
                    </div>
                    {computedVat > 0 && (
                      <div className="flex justify-between text-zinc-700 font-medium">
                        <span>Debit: Input Tax 12% (BIR 2550)</span>
                        <span className="tabular-nums">{formatPHP(computedVat)}</span>
                      </div>
                    )}
                    {computedEwt > 0 && (
                      <div className="flex justify-between text-zinc-700 font-medium">
                        <span>Credit: Expanded Withholding Tax Payable (1601-EQ)</span>
                        <span className="tabular-nums">{formatPHP(computedEwt)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-zinc-900 font-medium">
                      <span>Credit: Cash in Bank (Disbursement Outflow)</span>
                      <span className="tabular-nums font-bold">{formatPHP(computedCashOutflow)}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Submit Actions */}
            <div className="flex justify-end space-x-2 pt-2 border-t border-zinc-200/80">
              <button
                type="button"
                onClick={onClose}
                className="spatial-button-secondary px-4 py-2 text-xs font-semibold rounded-xl text-zinc-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="spatial-button-primary px-5 py-2 text-xs font-bold rounded-xl"
              >
                Post to General Ledger & Journals
              </button>
            </div>
          </form>
        ) : (
          /* MANUAL MULTI-LINE JOURNAL VOUCHER */
          <form onSubmit={handleSubmitManual} className="p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-zinc-700 mb-1">
                  Voucher Number
                </label>
                <input
                  type="text"
                  required
                  value={manualVoucherNumber}
                  onChange={(e) => setManualVoucherNumber(e.target.value)}
                  className="spatial-input w-full font-mono text-zinc-900 font-bold rounded-xl px-3 py-2 text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-700 mb-1">
                  Posting Date
                </label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="spatial-input w-full rounded-xl px-3 py-2 text-xs text-zinc-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-700 mb-1">
                  Book of Accounts
                </label>
                <select
                  value={manualBookType}
                  onChange={(e) => setManualBookType(e.target.value as any)}
                  className="spatial-input w-full rounded-xl px-3 py-2 text-xs text-zinc-900"
                >
                  <option value="GENERAL_JOURNAL">General Journal</option>
                  <option value="CASH_RECEIPTS">Cash Receipts Journal</option>
                  <option value="CASH_DISBURSEMENTS">Cash Disbursements Journal</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-zinc-700 mb-1">
                Particulars / Explanation
              </label>
              <input
                type="text"
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Month-end depreciation adjustment for IT equipment"
                className="spatial-input w-full rounded-xl px-3 py-2 text-xs text-zinc-900 placeholder:text-zinc-400"
              />
            </div>

            {/* Dynamic Lines Table */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-bold text-zinc-700 uppercase">
                  Double-Entry Account Lines
                </span>
                <button
                  type="button"
                  onClick={handleAddManualLine}
                  className="text-xs text-zinc-900 hover:text-black font-semibold flex items-center space-x-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Line</span>
                </button>
              </div>

              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {manualLines.map((line) => (
                  <div key={line.id} className="grid grid-cols-12 gap-2 items-center bg-zinc-50 p-2.5 rounded-xl border border-zinc-200">
                    <div className="col-span-5">
                      <select
                        value={line.accountId}
                        onChange={(e) => handleUpdateManualLine(line.id, { accountId: e.target.value })}
                        className="spatial-input w-full text-zinc-900 bg-white rounded-lg px-2 py-1.5 text-xs"
                      >
                        {accounts.map((acc) => (
                          <option key={acc.id} value={acc.id}>
                            {acc.code} - {acc.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-span-3">
                      <input
                        type="number"
                        placeholder="Debit"
                        min="0"
                        step="0.01"
                        value={line.debit || ''}
                        onChange={(e) => handleUpdateManualLine(line.id, { debit: Number(e.target.value) || 0 })}
                        className="spatial-input w-full text-zinc-900 bg-white font-mono text-right rounded-lg px-2 py-1.5 text-xs"
                      />
                    </div>

                    <div className="col-span-3">
                      <input
                        type="number"
                        placeholder="Credit"
                        min="0"
                        step="0.01"
                        value={line.credit || ''}
                        onChange={(e) => handleUpdateManualLine(line.id, { credit: Number(e.target.value) || 0 })}
                        className="spatial-input w-full text-zinc-900 bg-white font-mono text-right rounded-lg px-2 py-1.5 text-xs"
                      />
                    </div>

                    <div className="col-span-1 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveManualLine(line.id)}
                        disabled={manualLines.length <= 2}
                        className="text-zinc-400 hover:text-rose-600 disabled:opacity-30"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Total Balance Check */}
            <div className="bg-zinc-100 p-3 rounded-2xl border border-zinc-200 flex justify-between items-center text-xs font-mono">
              <div className="text-zinc-600">
                Debits: <strong className="text-zinc-900">{formatPHP(manualTotalDebit)}</strong> | Credits: <strong className="text-zinc-900">{formatPHP(manualTotalCredit)}</strong>
              </div>

              {isManualBalanced ? (
                <span className="flex items-center space-x-1 text-emerald-700 font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Balanced</span>
                </span>
              ) : (
                <span className="flex items-center space-x-1 text-amber-700 font-bold">
                  <AlertCircle className="w-4 h-4" />
                  <span>Diff: {formatPHP(Math.abs(manualTotalDebit - manualTotalCredit))}</span>
                </span>
              )}
            </div>

            {/* Submit Actions */}
            <div className="flex justify-end space-x-2 pt-2 border-t border-zinc-200/80">
              <button
                type="button"
                onClick={onClose}
                className="spatial-button-secondary px-4 py-2 text-xs font-semibold rounded-xl text-zinc-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!isManualBalanced}
                className="spatial-button-primary px-5 py-2 text-xs font-bold rounded-xl disabled:opacity-40"
              >
                Post Balanced Journal Voucher
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
