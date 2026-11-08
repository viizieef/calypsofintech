import React, { useState, useMemo } from 'react';
import { 
  BookOpen, 
  Search, 
  Calendar, 
  Download, 
  Printer, 
  Filter, 
  ChevronRight, 
  RotateCcw, 
  CheckCircle2, 
  AlertCircle,
  FileSpreadsheet,
  BookPlus
} from 'lucide-react';
import { JournalEntry, Account, CompanyProfile } from '../types/ledger';
import { 
  computeGeneralLedgerByAccount, 
  generateBIRGeneralJournalText, 
  formatPHP 
} from '../lib/birCompliance';
import { 
  exportJournalToExcel, 
  exportGeneralLedgerToExcel 
} from '../lib/excelExport';

interface BooksOfAccountsProps {
  entries: JournalEntry[];
  accounts: Account[];
  company: CompanyProfile;
  activeBook: 'GENERAL_JOURNAL' | 'CASH_RECEIPTS' | 'CASH_DISBURSEMENTS' | 'GENERAL_LEDGER';
  onChangeBook: (book: 'GENERAL_JOURNAL' | 'CASH_RECEIPTS' | 'CASH_DISBURSEMENTS' | 'GENERAL_LEDGER') => void;
  onReverseEntry: (entryId: string, reason: string) => void;
  onSelectEntry: (entry: JournalEntry) => void;
  onOpenNewLedgerModal?: () => void;
}

export const BooksOfAccounts: React.FC<BooksOfAccountsProps> = ({
  entries,
  accounts,
  company,
  activeBook,
  onChangeBook,
  onReverseEntry,
  onSelectEntry,
  onOpenNewLedgerModal,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState<string>(accounts[0]?.id || 'acc-1020');
  const [dateFilterStart, setDateFilterStart] = useState('');
  const [dateFilterEnd, setDateFilterEnd] = useState('');
  const [showReversalModal, setShowReversalModal] = useState<string | null>(null);
  const [reversalReason, setReversalReason] = useState('');

  // General Ledger accounts data map
  const ledgerMap = useMemo(() => {
    return computeGeneralLedgerByAccount(accounts, entries);
  }, [accounts, entries]);

  // Filtered entries for journals
  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      if (activeBook === 'CASH_RECEIPTS' && entry.bookType !== 'CASH_RECEIPTS') return false;
      if (activeBook === 'CASH_DISBURSEMENTS' && entry.bookType !== 'CASH_DISBURSEMENTS') return false;
      if (dateFilterStart && entry.date < dateFilterStart) return false;
      if (dateFilterEnd && entry.date > dateFilterEnd) return false;
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchesDesc = entry.description.toLowerCase().includes(term);
        const matchesVoucher = entry.voucherNumber.toLowerCase().includes(term);
        const matchesEntity = entry.birMetadata?.entityName.toLowerCase().includes(term);
        const matchesDoc = entry.birMetadata?.documentNumber.toLowerCase().includes(term);
        const matchesLine = entry.lines.some((l) => l.accountName.toLowerCase().includes(term) || l.accountCode.includes(term));
        if (!matchesDesc && !matchesVoucher && !matchesEntity && !matchesDoc && !matchesLine) {
          return false;
        }
      }
      return true;
    });
  }, [entries, activeBook, dateFilterStart, dateFilterEnd, searchTerm]);

  // Export BIR Text file
  const handleExportBIRText = () => {
    const textData = generateBIRGeneralJournalText(filteredEntries, company, dateFilterStart, dateFilterEnd);
    const blob = new Blob([textData], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `BIR_${activeBook}_${company.tin}_${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export CSV
  const handleExportCSV = () => {
    let csv = 'Date,Voucher Number,Book,Description,Account Code,Account Name,Debit,Credit,BIR Document Type,Document Number,Entity Name,Entity TIN\n';
    filteredEntries.forEach((entry) => {
      entry.lines.forEach((line) => {
        csv += `"${entry.date}","${entry.voucherNumber}","${entry.bookType}","${entry.description.replace(/"/g, '""')}","${line.accountCode}","${line.accountName.replace(/"/g, '""')}",${line.debit},${line.credit},"${entry.birMetadata?.documentType || ''}","${entry.birMetadata?.documentNumber || ''}","${entry.birMetadata?.entityName || ''}","${entry.birMetadata?.entityTin || ''}"\n`;
      });
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `BIR_Accounts_${activeBook}_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export Excel (.xlsx)
  const handleExportExcel = () => {
    if (activeBook === 'GENERAL_LEDGER') {
      exportGeneralLedgerToExcel(ledgerMap, accounts, company);
    } else {
      exportJournalToExcel(filteredEntries, activeBook, company);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleConfirmReversal = () => {
    if (showReversalModal && reversalReason.trim()) {
      onReverseEntry(showReversalModal, reversalReason);
      setShowReversalModal(null);
      setReversalReason('');
    }
  };

  const selectedLedgerAccount = ledgerMap.get(selectedAccountId);

  return (
    <div className="space-y-6">
      {/* Book Tabs Header with Spatial Neutral Segmented Dock */}
      <div className="spatial-glass rounded-3xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 border border-zinc-200/80">
        <div className="flex p-1 bg-zinc-100/90 rounded-2xl border border-zinc-200/80 overflow-x-auto scrollbar-none gap-1">
          <button
            onClick={() => onChangeBook('GENERAL_JOURNAL')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl whitespace-nowrap transition-all ${
              activeBook === 'GENERAL_JOURNAL'
                ? 'bg-white text-zinc-950 font-bold shadow-xs border border-zinc-200/80'
                : 'text-zinc-600 hover:text-zinc-950 hover:bg-white/50'
            }`}
          >
            1. General Journal
          </button>

          <button
            onClick={() => onChangeBook('CASH_RECEIPTS')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl whitespace-nowrap transition-all ${
              activeBook === 'CASH_RECEIPTS'
                ? 'bg-white text-zinc-950 font-bold shadow-xs border border-zinc-200/80'
                : 'text-zinc-600 hover:text-zinc-950 hover:bg-white/50'
            }`}
          >
            2. Cash Receipts Journal (CRJ)
          </button>

          <button
            onClick={() => onChangeBook('CASH_DISBURSEMENTS')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl whitespace-nowrap transition-all ${
              activeBook === 'CASH_DISBURSEMENTS'
                ? 'bg-white text-zinc-950 font-bold shadow-xs border border-zinc-200/80'
                : 'text-zinc-600 hover:text-zinc-950 hover:bg-white/50'
            }`}
          >
            3. Cash Disbursements Journal (CDJ)
          </button>

          <button
            onClick={() => onChangeBook('GENERAL_LEDGER')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl whitespace-nowrap transition-all ${
              activeBook === 'GENERAL_LEDGER'
                ? 'bg-white text-zinc-950 font-bold shadow-xs border border-zinc-200/80'
                : 'text-zinc-600 hover:text-zinc-950 hover:bg-white/50'
            }`}
          >
            4. General Ledger (Accounts)
          </button>
        </div>

        {/* Action Buttons: New Ledger, Download Excel (.xlsx), Export BIR Text, CSV, Print in Neutral Spatial Style */}
        <div className="flex items-center space-x-2 flex-wrap">
          {onOpenNewLedgerModal && (
            <button
              onClick={onOpenNewLedgerModal}
              className="spatial-button-secondary px-3.5 py-2 text-xs font-bold rounded-xl flex items-center space-x-1.5 cursor-pointer bg-white text-zinc-900 border border-zinc-200 shadow-2xs"
              title="Create a new General Ledger or subsidiary fiscal book"
            >
              <BookPlus className="w-3.5 h-3.5 text-zinc-700" />
              <span>+ New Ledger</span>
            </button>
          )}
          <button
            onClick={handleExportExcel}
            className="spatial-button-primary px-3.5 py-2 text-xs font-bold rounded-xl flex items-center space-x-1.5 cursor-pointer"
            title="Download official report in Microsoft Excel (.xlsx) format"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-zinc-300" />
            <span>Download Excel (.xlsx)</span>
          </button>

          <button
            onClick={handleExportBIRText}
            className="spatial-button-secondary px-3 py-2 text-xs font-semibold rounded-xl flex items-center space-x-1.5"
            title="Export official text file formatted per BIR Revenue Regulations RR 9-2009 for CAS audit"
          >
            <Download className="w-3.5 h-3.5 text-zinc-600" />
            <span>BIR .txt</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="spatial-button-secondary px-3 py-2 text-xs font-semibold rounded-xl flex items-center space-x-1.5"
            title="Export CSV spreadsheet"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-zinc-600" />
            <span>CSV</span>
          </button>

          <button
            onClick={handlePrint}
            className="spatial-button-secondary px-3 py-2 text-xs font-semibold rounded-xl flex items-center space-x-1.5"
          >
            <Printer className="w-3.5 h-3.5 text-zinc-600" />
            <span>Print</span>
          </button>
        </div>
      </div>

      {/* Filter Bar with Neutral Spatial Glass Elements */}
      <div className="spatial-glass rounded-2xl p-4 shadow-xs flex flex-wrap items-center gap-3 border border-zinc-200/80">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by voucher #, payee, TIN, account, or document..."
            className="w-full spatial-input text-zinc-900 rounded-xl pl-9 pr-3 py-2 text-xs placeholder:text-zinc-400"
          />
        </div>

        {/* Date Filter Range */}
        <div className="flex items-center space-x-2 text-xs text-zinc-700 font-medium">
          <Calendar className="w-4 h-4 text-zinc-500" />
          <input
            type="date"
            value={dateFilterStart}
            onChange={(e) => setDateFilterStart(e.target.value)}
            className="spatial-input rounded-xl px-2.5 py-1.5 text-xs text-zinc-900"
          />
          <span className="text-zinc-400">to</span>
          <input
            type="date"
            value={dateFilterEnd}
            onChange={(e) => setDateFilterEnd(e.target.value)}
            className="spatial-input rounded-xl px-2.5 py-1.5 text-xs text-zinc-900"
          />
          {(dateFilterStart || dateFilterEnd) && (
            <button
              onClick={() => {
                setDateFilterStart('');
                setDateFilterEnd('');
              }}
              className="text-xs text-zinc-600 font-semibold hover:underline"
            >
              Clear
            </button>
          )}
        </div>

        {/* Account Filter dropdown if General Ledger view */}
        {activeBook === 'GENERAL_LEDGER' && (
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-zinc-700">Account:</span>
            <select
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
              className="spatial-input rounded-xl px-3 py-2 text-xs font-medium text-zinc-900"
            >
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id} className="bg-white text-zinc-900">
                  {acc.code} - {acc.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Main Content Area based on Selected Book */}
      {activeBook === 'GENERAL_LEDGER' ? (
        /* GENERAL LEDGER VIEW: Account Ledger Card */
        <div className="spatial-glass rounded-3xl p-6 shadow-xs space-y-4 border border-zinc-200/80">
          {selectedLedgerAccount ? (
            <div>
              {/* Account Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-zinc-200/80 pb-4 gap-3">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-mono font-bold bg-zinc-100 text-zinc-900 border border-zinc-200 px-2.5 py-0.5 rounded-md">
                      Account Code {selectedLedgerAccount.account.code}
                    </span>
                    <span className="text-xs uppercase tracking-wider text-zinc-500 font-semibold">
                      Normal Balance: <strong className="text-zinc-900 capitalize">{selectedLedgerAccount.account.normalBalance}</strong>
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-zinc-900 mt-1.5">
                    {selectedLedgerAccount.account.name}
                  </h2>
                  <p className="text-xs text-zinc-500 font-medium">
                    {selectedLedgerAccount.account.description}
                  </p>
                </div>

                <div className="flex items-center space-x-6 bg-zinc-50 p-3.5 rounded-2xl border border-zinc-200 text-right">
                  <div>
                    <div className="text-[10px] uppercase text-zinc-500 font-bold">Total Debits</div>
                    <div className="text-sm font-bold text-zinc-900 font-mono tabular-nums">
                      {formatPHP(selectedLedgerAccount.totalDebits)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase text-zinc-500 font-bold">Total Credits</div>
                    <div className="text-sm font-bold text-zinc-900 font-mono tabular-nums">
                      {formatPHP(selectedLedgerAccount.totalCredits)}
                    </div>
                  </div>
                  <div className="border-l border-zinc-200 pl-4">
                    <div className="text-[10px] uppercase text-zinc-700 font-bold">Ending Balance</div>
                    <div className="text-base font-bold text-zinc-900 font-mono tabular-nums">
                      {formatPHP(selectedLedgerAccount.endingBalance)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Transactions Table for this account */}
              <div className="overflow-x-auto mt-4">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-zinc-200/80 text-zinc-500 font-semibold uppercase text-[10px] tracking-wider">
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Voucher #</th>
                      <th className="py-2.5 px-3">Particulars / Memo</th>
                      <th className="py-2.5 px-3">Reference Doc</th>
                      <th className="py-2.5 px-3 text-right">Debit (PHP)</th>
                      <th className="py-2.5 px-3 text-right">Credit (PHP)</th>
                      <th className="py-2.5 px-3 text-right">Running Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {selectedLedgerAccount.transactions.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-zinc-400 font-medium">
                          No transactions recorded under this account code for the selected period.
                        </td>
                      </tr>
                    ) : (
                      selectedLedgerAccount.transactions.map((tx, idx) => (
                        <tr key={idx} className="hover:bg-zinc-50 text-zinc-700 transition">
                          <td className="py-3 px-3 font-mono text-zinc-500 whitespace-nowrap">
                            {tx.date}
                          </td>
                          <td className="py-3 px-3 font-mono font-bold text-zinc-900 whitespace-nowrap">
                            {tx.voucherNumber}
                          </td>
                          <td className="py-3 px-3 max-w-sm truncate text-zinc-900 font-medium">
                            {tx.description}
                          </td>
                          <td className="py-3 px-3 text-zinc-500 whitespace-nowrap font-mono text-[11px]">
                            {tx.docRef}
                          </td>
                          <td className="py-3 px-3 text-right font-mono text-zinc-900 tabular-nums">
                            {tx.debit > 0 ? formatPHP(tx.debit) : '-'}
                          </td>
                          <td className="py-3 px-3 text-right font-mono text-zinc-900 tabular-nums">
                            {tx.credit > 0 ? formatPHP(tx.credit) : '-'}
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-bold text-zinc-900 tabular-nums">
                            {formatPHP(tx.runningBalance)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-zinc-400">Select an account to view its general ledger card.</div>
          )}
        </div>
      ) : (
        /* JOURNALS VIEW (General Journal, Cash Receipts, or Cash Disbursements) */
        <div className="spatial-glass rounded-3xl p-6 shadow-xs space-y-4 border border-zinc-200/80">
          <div className="flex items-center justify-between border-b border-zinc-200/80 pb-3">
            <div>
              <h2 className="text-base font-bold text-zinc-900">
                {activeBook === 'GENERAL_JOURNAL' && 'Official General Journal'}
                {activeBook === 'CASH_RECEIPTS' && 'Cash Receipts Journal (Sales & Inflows)'}
                {activeBook === 'CASH_DISBURSEMENTS' && 'Cash Disbursements Journal (Payments & Outflows)'}
              </h2>
              <p className="text-xs text-zinc-500 font-medium">
                {filteredEntries.length} registered double-entry audit vouchers in sequence
              </p>
            </div>
            <div className="text-xs text-zinc-500 font-medium">
              Taxpayer: <span className="text-zinc-900 font-bold font-mono">{company.tin}</span>
            </div>
          </div>

          <div className="space-y-4">
            {filteredEntries.length === 0 ? (
              <div className="py-12 text-center text-zinc-400">
                No entries found matching your search or date criteria.
              </div>
            ) : (
              filteredEntries.map((entry) => {
                const totalDebit = entry.lines.reduce((s, l) => s + l.debit, 0);
                const totalCredit = entry.lines.reduce((s, l) => s + l.credit, 0);

                return (
                  <div
                    key={entry.id}
                    className={`rounded-2xl p-4 transition ${
                      entry.isReversed
                        ? 'border border-zinc-300 bg-zinc-100/50 opacity-80'
                        : 'border border-zinc-200/80 bg-white hover:border-zinc-300 hover:bg-zinc-50/50 shadow-2xs'
                    }`}
                  >
                    {/* Voucher Header Line */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-zinc-100 gap-2">
                      <div className="flex items-center space-x-3">
                        <span className="font-mono font-bold text-sm text-zinc-900">
                          {entry.voucherNumber}
                        </span>
                        <span className="text-xs text-zinc-500 font-mono">
                          {entry.date}
                        </span>
                        <span className="px-2 py-0.5 text-[10px] font-semibold rounded-md bg-zinc-100 text-zinc-700 border border-zinc-200">
                          {entry.bookType}
                        </span>
                        {entry.isReversed && (
                          <span className="px-2 py-0.5 text-[10px] font-semibold rounded-md bg-zinc-200 text-zinc-700 border border-zinc-300">
                            Reversed
                          </span>
                        )}
                      </div>

                      <div className="flex items-center space-x-2">
                        {entry.birMetadata && (
                          <span className="text-xs bg-zinc-50 px-2.5 py-1 rounded-xl border border-zinc-200 text-zinc-800 font-mono font-semibold">
                            {entry.birMetadata.documentType}: <strong>{entry.birMetadata.documentNumber}</strong>
                          </span>
                        )}

                        {!entry.isReversed && (
                          <button
                            onClick={() => setShowReversalModal(entry.id)}
                            className="text-xs text-zinc-700 hover:text-zinc-950 font-semibold flex items-center space-x-1 px-2.5 py-1 rounded-xl bg-white border border-zinc-200 transition shadow-2xs"
                            title="Create BIR-compliant reversal journal voucher"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Audit Reversal</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Voucher Explanation & BIR Entity Details */}
                    <div className="py-2.5 flex flex-col sm:flex-row justify-between text-xs text-zinc-800 gap-2">
                      <div>
                        <strong className="text-zinc-900 font-bold">Particulars:</strong> {entry.description}
                      </div>
                      {entry.birMetadata && (
                        <div className="text-zinc-500 font-medium">
                          Payee/Payor: <span className="text-zinc-900 font-bold">{entry.birMetadata.entityName}</span> &bull; TIN: <span className="text-zinc-900 font-mono">{entry.birMetadata.entityTin}</span>
                        </div>
                      )}
                    </div>

                    {/* Double-Entry Debit/Credit Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="text-zinc-500 border-b border-zinc-100 font-semibold uppercase text-[10px] tracking-wider">
                            <th className="py-1 px-2">Account Code</th>
                            <th className="py-1 px-2">Account Title</th>
                            <th className="py-1 px-2">Memo</th>
                            <th className="py-1 px-2 text-right">Debit</th>
                            <th className="py-1 px-2 text-right">Credit</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-50">
                          {entry.lines.map((line) => (
                            <tr key={line.id} className="text-zinc-700">
                              <td className="py-1.5 px-2 font-mono text-zinc-500 w-28">
                                {line.accountCode}
                              </td>
                              <td className="py-1.5 px-2 font-medium text-zinc-900">
                                {line.accountName}
                              </td>
                              <td className="py-1.5 px-2 text-zinc-500 truncate max-w-xs">
                                {line.memo || '-'}
                              </td>
                              <td className="py-1.5 px-2 text-right font-mono font-medium text-zinc-900 w-32 tabular-nums">
                                {line.debit > 0 ? formatPHP(line.debit) : ''}
                              </td>
                              <td className="py-1.5 px-2 text-right font-mono font-medium text-zinc-900 w-32 tabular-nums">
                                {line.credit > 0 ? formatPHP(line.credit) : ''}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="border-t border-zinc-200 text-zinc-900 font-bold font-mono">
                            <td colSpan={3} className="py-2 px-2 text-right uppercase text-[10px] text-zinc-500 font-semibold">
                              Voucher Total Balance
                            </td>
                            <td className="py-2 px-2 text-right text-zinc-900 tabular-nums">
                              <span className="accounting-double-underline inline-block pb-0.5">
                                {formatPHP(totalDebit)}
                              </span>
                            </td>
                            <td className="py-2 px-2 text-right text-zinc-900 tabular-nums">
                              <span className="accounting-double-underline inline-block pb-0.5">
                                {formatPHP(totalCredit)}
                              </span>
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* BIR Audit Reversal Confirmation Modal */}
      {showReversalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/35 backdrop-blur-xl p-4">
          <div className="spatial-elevated rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 border border-zinc-200/90 text-zinc-900">
            <div className="flex items-center space-x-3 text-zinc-900">
              <RotateCcw className="w-6 h-6" />
              <h3 className="text-lg font-bold text-zinc-900">BIR Audit Reversal</h3>
            </div>
            <p className="text-xs text-zinc-600 leading-relaxed font-medium">
              Per Bureau of Internal Revenue Computerized Accounting System (CAS) rules, posted journal entries are <strong>immutable</strong> and cannot be deleted. An official offsetting Reversal Voucher will be created to preserve the complete audit trail.
            </p>
            <div>
              <label className="block text-xs font-semibold text-zinc-800 mb-1">
                Reason for Reversal (Required for BIR Audit):
              </label>
              <textarea
                value={reversalReason}
                onChange={(e) => setReversalReason(e.target.value)}
                placeholder="e.g. Sales Invoice cancelled by customer; or wrong account classification corrected on JV-2026-XXXX"
                className="w-full spatial-input text-zinc-900 rounded-xl p-2.5 text-xs focus:ring-1 focus:ring-zinc-900 focus:outline-none"
                rows={3}
              />
            </div>
            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => {
                  setShowReversalModal(null);
                  setReversalReason('');
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-white hover:bg-zinc-100 text-zinc-700 border border-zinc-200"
              >
                Cancel
              </button>
              <button
                disabled={!reversalReason.trim()}
                onClick={handleConfirmReversal}
                className="spatial-button-primary px-4 py-2 rounded-xl text-xs font-semibold disabled:opacity-50"
              >
                Create Reversal Voucher
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
