import React from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  FileText, 
  Receipt, 
  ArrowUpRight, 
  ArrowDownRight, 
  Layers, 
  Scale, 
  ExternalLink,
  FileSpreadsheet,
  BookPlus
} from 'lucide-react';
import { JournalEntry, Account, CompanyProfile } from '../types/ledger';
import { computeBIRVATSummary, formatPHP } from '../lib/birCompliance';
import { exportJournalToExcel } from '../lib/excelExport';

interface DashboardProps {
  entries: JournalEntry[];
  accounts: Account[];
  company: CompanyProfile;
  onOpenNewTransaction: (type?: 'income' | 'expense' | 'manual') => void;
  onViewBooks: (book: 'GENERAL_JOURNAL' | 'CASH_RECEIPTS' | 'CASH_DISBURSEMENTS' | 'GENERAL_LEDGER') => void;
  onSelectEntry: (entry: JournalEntry) => void;
  onOpenNewLedgerModal?: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  entries,
  accounts,
  company,
  onOpenNewTransaction,
  onViewBooks,
  onSelectEntry,
  onOpenNewLedgerModal,
}) => {
  // Real-time calculations
  let grossRevenue = 0;
  let totalExpenses = 0;
  let cashBalance = 0;

  for (const entry of entries) {
    if (!entry.isPosted || entry.isReversed) continue;
    for (const line of entry.lines) {
      if (line.accountCode.startsWith('4')) {
        grossRevenue += (line.credit - line.debit);
      }
      if (line.accountCode.startsWith('5') || line.accountCode.startsWith('6')) {
        totalExpenses += (line.debit - line.credit);
      }
      if (line.accountCode === '1010' || line.accountCode === '1020') {
        cashBalance += (line.debit - line.credit);
      }
    }
  }

  const netIncome = grossRevenue - totalExpenses;
  const netMargin = grossRevenue > 0 ? ((netIncome / grossRevenue) * 100).toFixed(1) : '0.0';
  const vatSummary = computeBIRVATSummary(entries);

  // Recent 6 transactions
  const recentEntries = [...entries]
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))
    .slice(0, 6);

  return (
    <div className="space-y-6">
      {/* Top Banner: Spatial Neutral Command Plate */}
      <div className="relative overflow-hidden rounded-3xl p-6 sm:p-7 spatial-glass border border-white/90 shadow-[0_16px_36px_-8px_rgba(0,0,0,0.05)] bg-gradient-to-r from-zinc-100/90 via-white/85 to-stone-100/70">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div>
            <div className="flex items-center space-x-2 text-xs">
              <span className="font-semibold text-zinc-800 bg-white/90 border border-zinc-200 px-2.5 py-0.5 rounded-md shadow-2xs">
                BIR {company.taxpayerType} Registered Enterprise
              </span>
              <span className="text-zinc-500 font-medium">
                RDO: <strong className="text-zinc-900 font-bold">{company.rdoCode}</strong>
              </span>
              <span className="text-zinc-400">&bull;</span>
              <span className="text-zinc-600 font-medium">
                CAS Permitted (RR 9-2009)
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 tracking-tight mt-2 font-display">
              General Ledger & Tax Audit Suite
            </h1>
            <p className="text-xs text-zinc-600 mt-1 max-w-2xl leading-relaxed font-medium">
              Real-time double-entry bookkeeping with automatic 12% VAT calculations, BIR Form 2307 Creditable Withholding Tax tracking, and certified 4 Books of Accounts.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            {onOpenNewLedgerModal && (
              <button
                onClick={onOpenNewLedgerModal}
                className="spatial-button-secondary px-3.5 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 cursor-pointer shadow-xs bg-white text-zinc-900 border border-zinc-200"
                title="Create a new General Ledger or subsidiary fiscal book"
              >
                <BookPlus className="w-4 h-4 text-zinc-700" />
                <span>+ New Ledger</span>
              </button>
            )}
            <button
              onClick={() => exportJournalToExcel(entries, 'All_Transactions', company)}
              className="spatial-button-secondary px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 cursor-pointer shadow-xs"
              title="Download entire transaction ledger as Microsoft Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-4 h-4 text-zinc-600" />
              <span>Export Excel (.xlsx)</span>
            </button>
            <button
              onClick={() => onOpenNewTransaction('income')}
              className="spatial-button-primary px-3.5 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 cursor-pointer shadow-xs"
            >
              <ArrowUpRight className="w-4 h-4 text-zinc-400" />
              <span>Record Sale (12% VAT)</span>
            </button>
            <button
              onClick={() => onOpenNewTransaction('expense')}
              className="spatial-button-secondary px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 cursor-pointer shadow-xs"
            >
              <ArrowDownRight className="w-4 h-4 text-zinc-500" />
              <span>Record Expense (EWT)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Dimensional Spatial KPI Cards in Executive Neutral Palette */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Gross Revenue */}
        <div className="spatial-card rounded-2xl p-5 border border-zinc-200/70 hover:border-zinc-300 transition-all shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Gross Income / Sales</span>
            <div className="w-8 h-8 rounded-xl bg-zinc-100/90 text-zinc-700 flex items-center justify-center border border-zinc-200/80 shadow-2xs">
              <TrendingUp className="w-4 h-4 text-zinc-800" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-zinc-900 tracking-tight font-mono tabular-nums">
              {formatPHP(grossRevenue)}
            </span>
          </div>
          <div className="mt-2.5 pt-2 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-500 font-medium">
            <span>VATable & Zero-Rated</span>
            <span className="text-zinc-700 font-semibold font-mono">12% Output</span>
          </div>
        </div>

        {/* Operating Expenses */}
        <div className="spatial-card rounded-2xl p-5 border border-zinc-200/70 hover:border-zinc-300 transition-all shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Total Expenses & Costs</span>
            <div className="w-8 h-8 rounded-xl bg-zinc-100/90 text-zinc-700 flex items-center justify-center border border-zinc-200/80 shadow-2xs">
              <TrendingDown className="w-4 h-4 text-zinc-800" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-zinc-900 tracking-tight font-mono tabular-nums">
              {formatPHP(totalExpenses)}
            </span>
          </div>
          <div className="mt-2.5 pt-2 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-500 font-medium">
            <span>Direct & Operating</span>
            <span className="text-zinc-700 font-semibold font-mono">EWT Deducted</span>
          </div>
        </div>

        {/* Net Operating Income */}
        <div className="spatial-card rounded-2xl p-5 border border-zinc-200/70 hover:border-zinc-300 transition-all shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Net Operating Income</span>
            <div className="w-8 h-8 rounded-xl bg-zinc-100/90 text-zinc-700 flex items-center justify-center border border-zinc-200/80 shadow-2xs">
              <Scale className="w-4 h-4 text-zinc-800" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-zinc-900 tracking-tight font-mono tabular-nums">
              {formatPHP(netIncome)}
            </span>
          </div>
          <div className="mt-2.5 pt-2 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-500 font-medium">
            <span>Operating Margin</span>
            <span className="text-zinc-900 font-bold font-mono">{netMargin}%</span>
          </div>
        </div>

        {/* Liquid Cash & Bank */}
        <div className="spatial-card rounded-2xl p-5 border border-zinc-200/70 hover:border-zinc-300 transition-all shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Liquid Cash in Bank</span>
            <div className="w-8 h-8 rounded-xl bg-zinc-100/90 text-zinc-700 flex items-center justify-center border border-zinc-200/80 shadow-2xs">
              <Wallet className="w-4 h-4 text-zinc-800" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-zinc-900 tracking-tight font-mono tabular-nums">
              {formatPHP(cashBalance)}
            </span>
          </div>
          <div className="mt-2.5 pt-2 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-500 font-medium">
            <span>Accounts 1010 & 1020</span>
            <span className="text-zinc-700 font-semibold font-mono">Reconciled</span>
          </div>
        </div>
      </div>

      {/* Tax Position & Compliance Widgets (BIR Form 2550 & 2307) in Neutral Spatial Glass */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* VAT Position (BIR Form 2550M / 2550Q) */}
        <div className="spatial-glass rounded-2xl p-5 shadow-xs space-y-4 border border-zinc-200/70">
          <div className="flex items-center justify-between border-b border-zinc-200/70 pb-3">
            <div>
              <h2 className="text-sm font-bold text-zinc-900 flex items-center gap-1.5">
                <Receipt className="w-4 h-4 text-zinc-700" />
                BIR Form 2550 VAT Position
              </h2>
              <p className="text-[11px] text-zinc-500">Current Monthly/Quarterly Liability</p>
            </div>
            <span className="px-2 py-0.5 text-[10px] font-semibold rounded-md bg-zinc-100 text-zinc-700 border border-zinc-200">
              12% Standard
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-zinc-100">
              <span className="text-zinc-600 font-medium">Total Taxable Sales</span>
              <span className="font-semibold text-zinc-900 font-mono tabular-nums">{formatPHP(vatSummary.taxableSales)}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-zinc-100">
              <span className="text-zinc-600 font-medium">Output VAT (Billed to Clients)</span>
              <span className="font-semibold text-zinc-900 font-mono tabular-nums">{formatPHP(vatSummary.outputVat)}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-zinc-100">
              <span className="text-zinc-600 font-medium">Less: Input VAT (Paid on Purchases)</span>
              <span className="font-semibold text-zinc-600 font-mono tabular-nums">- {formatPHP(vatSummary.inputVat)}</span>
            </div>
            <div className="flex justify-between py-1.5 bg-zinc-50/80 border border-zinc-200/70 px-3 rounded-xl">
              <span className="font-semibold text-zinc-900">Net VAT Payable (2550M/Q)</span>
              <span className="font-bold text-zinc-900 text-sm font-mono tabular-nums">{formatPHP(vatSummary.netVatPayable)}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-zinc-100">
              <span className="text-zinc-600 font-medium">Creditable Tax Withheld (2307)</span>
              <span className="font-semibold text-zinc-600 font-mono tabular-nums">- {formatPHP(vatSummary.creditableWithholdingTaxClaimed)}</span>
            </div>
            <div className="flex justify-between py-2 bg-zinc-900 text-white border border-zinc-800 px-3.5 rounded-xl shadow-xs">
              <span className="font-bold">Final VAT Remittance</span>
              <span className="font-bold text-sm font-mono tabular-nums">{formatPHP(vatSummary.finalVatPayable)}</span>
            </div>
          </div>
        </div>

        {/* BIR Creditable Withholding Tax Asset (Form 2307) */}
        <div className="spatial-glass rounded-2xl p-5 shadow-xs space-y-4 border border-zinc-200/70">
          <div className="flex items-center justify-between border-b border-zinc-200/70 pb-3">
            <div>
              <h2 className="text-sm font-bold text-zinc-900 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-zinc-700" />
                Creditable Tax Withheld (BIR 2307)
              </h2>
              <p className="text-[11px] text-zinc-500">Tax Credits Deducted by Customers</p>
            </div>
            <span className="px-2 py-0.5 text-[10px] font-semibold rounded-md bg-zinc-100 text-zinc-700 border border-zinc-200">
              Asset (Acc 1040)
            </span>
          </div>

          <div className="p-3.5 bg-zinc-50/90 rounded-xl border border-zinc-200/80">
            <div className="text-[11px] font-medium text-zinc-500">Total Claimable Tax Credits:</div>
            <div className="text-2xl font-bold text-zinc-900 mt-1 font-mono tabular-nums">
              {formatPHP(vatSummary.creditableWithholdingTaxClaimed)}
            </div>
            <p className="text-[11px] text-zinc-600 mt-2 leading-relaxed font-medium">
              Deducted at source by corporate clients (ATC WC158 2% or WC100 1%). Valid to offset against quarterly/annual Income Tax Returns (BIR Form 1702-RT/Q).
            </p>
          </div>

          <div className="flex items-center justify-between text-xs text-zinc-600 border-t border-zinc-200/70 pt-3">
            <span>Registered Taxpayer TIN:</span>
            <span className="font-mono text-zinc-900 font-bold">{company.tin}</span>
          </div>
        </div>

        {/* Official BIR 4 Books of Accounts Quick Links */}
        <div className="spatial-glass rounded-2xl p-5 shadow-xs space-y-3 border border-zinc-200/70">
          <div className="flex items-center justify-between border-b border-zinc-200/70 pb-3">
            <div>
              <h2 className="text-sm font-bold text-zinc-900 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-zinc-700" />
                4 Official Books of Accounts
              </h2>
              <p className="text-[11px] text-zinc-500">BIR Mandate (RR 9-2009)</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2 text-xs">
            <button
              onClick={() => onViewBooks('GENERAL_JOURNAL')}
              className="flex items-center justify-between p-2.5 rounded-xl bg-white hover:bg-zinc-50 border border-zinc-200/80 transition group text-left shadow-2xs cursor-pointer"
            >
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-zinc-800" />
                <span className="font-semibold text-zinc-800 group-hover:text-zinc-950">1. General Journal</span>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-700" />
            </button>

            <button
              onClick={() => onViewBooks('CASH_RECEIPTS')}
              className="flex items-center justify-between p-2.5 rounded-xl bg-white hover:bg-zinc-50 border border-zinc-200/80 transition group text-left shadow-2xs cursor-pointer"
            >
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-zinc-600" />
                <span className="font-semibold text-zinc-800 group-hover:text-zinc-950">2. Cash Receipts Journal (CRJ)</span>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-700" />
            </button>

            <button
              onClick={() => onViewBooks('CASH_DISBURSEMENTS')}
              className="flex items-center justify-between p-2.5 rounded-xl bg-white hover:bg-zinc-50 border border-zinc-200/80 transition group text-left shadow-2xs cursor-pointer"
            >
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-zinc-500" />
                <span className="font-semibold text-zinc-800 group-hover:text-zinc-950">3. Cash Disbursements Journal (CDJ)</span>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-700" />
            </button>

            <button
              onClick={() => onViewBooks('GENERAL_LEDGER')}
              className="flex items-center justify-between p-2.5 rounded-xl bg-white hover:bg-zinc-50 border border-zinc-200/80 transition group text-left shadow-2xs cursor-pointer"
            >
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-zinc-400" />
                <span className="font-semibold text-zinc-800 group-hover:text-zinc-950">4. General Ledger (Master Accounts)</span>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-700" />
            </button>
          </div>
        </div>
      </div>

      {/* Real-time Recent Activity Stream with Spatial Glass Table */}
      <div className="spatial-glass rounded-2xl p-5 shadow-xs space-y-4 border border-zinc-200/70">
        <div className="flex items-center justify-between border-b border-zinc-200/70 pb-3">
          <div>
            <h2 className="text-base font-bold text-zinc-900 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-zinc-900 inline-block shadow-xs" />
              Real-Time Ledger Transaction Feed
            </h2>
            <p className="text-xs text-zinc-500 font-medium">
              Live double-entry postings synchronized with audit vouchers
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => exportJournalToExcel(entries, 'Transaction_Feed', company)}
              className="flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-white hover:bg-zinc-100 text-zinc-700 border border-zinc-200 shadow-2xs transition"
              title="Download transaction feed as Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-zinc-500" />
              <span>Export Feed (.xlsx)</span>
            </button>
            <button
              onClick={() => onOpenNewTransaction('manual')}
              className="text-xs text-zinc-800 hover:text-zinc-950 font-bold transition px-2 py-1"
            >
              + Create Voucher
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-200/70 text-zinc-500 font-semibold uppercase text-[10px] tracking-wider">
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Voucher #</th>
                <th className="py-2.5 px-3">Book</th>
                <th className="py-2.5 px-3">Description / Payee</th>
                <th className="py-2.5 px-3">BIR Document</th>
                <th className="py-2.5 px-3 text-right">Debit Balance</th>
                <th className="py-2.5 px-3 text-right">Credit Balance</th>
                <th className="py-2.5 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {recentEntries.map((entry) => {
                const totalDebit = entry.lines.reduce((sum, l) => sum + l.debit, 0);
                const totalCredit = entry.lines.reduce((sum, l) => sum + l.credit, 0);
                const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;

                return (
                  <tr
                    key={entry.id}
                    onClick={() => onSelectEntry(entry)}
                    className="hover:bg-zinc-100/60 cursor-pointer transition text-zinc-700 group"
                  >
                    <td className="py-3 px-3 whitespace-nowrap font-mono text-zinc-500">
                      {entry.date}
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-zinc-900 whitespace-nowrap">
                      {entry.voucherNumber}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-zinc-100 text-zinc-700 border border-zinc-200">
                        {entry.bookType === 'CASH_RECEIPTS' ? 'CRJ' : entry.bookType === 'CASH_DISBURSEMENTS' ? 'CDJ' : 'GJ'}
                      </span>
                    </td>
                    <td className="py-3 px-3 max-w-xs truncate">
                      <div className="font-semibold text-zinc-900 group-hover:text-black">
                        {entry.description}
                      </div>
                      {entry.birMetadata && (
                        <div className="text-[11px] text-zinc-500 truncate font-medium">
                          {entry.birMetadata.entityName} (TIN: {entry.birMetadata.entityTin})
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap text-zinc-600">
                      {entry.birMetadata ? (
                        <span className="font-mono text-[11px]">
                          {entry.birMetadata.documentType} #{entry.birMetadata.documentNumber}
                        </span>
                      ) : (
                        <span className="text-zinc-400">-</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-zinc-900 tabular-nums">
                      {totalDebit > 0 ? formatPHP(totalDebit) : '-'}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-zinc-900 tabular-nums">
                      {totalCredit > 0 ? formatPHP(totalCredit) : '-'}
                    </td>
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      {entry.isReversed ? (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-zinc-200 text-zinc-700 border border-zinc-300">
                          Reversed
                        </span>
                      ) : isBalanced ? (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-zinc-100 text-zinc-800 border border-zinc-200 shadow-2xs">
                          Posted
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-50 text-amber-900 border border-amber-200">
                          Unbalanced
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
