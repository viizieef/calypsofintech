import React from 'react';
import { 
  X, 
  Printer, 
  RotateCcw,
  FileSpreadsheet
} from 'lucide-react';
import { JournalEntry, CompanyProfile } from '../types/ledger';
import { formatPHP } from '../lib/birCompliance';
import { exportJournalToExcel } from '../lib/excelExport';

interface VoucherDetailModalProps {
  entry: JournalEntry | null;
  onClose: () => void;
  company: CompanyProfile;
  onRequestReversal: (entryId: string) => void;
}

export const VoucherDetailModal: React.FC<VoucherDetailModalProps> = ({
  entry,
  onClose,
  company,
  onRequestReversal,
}) => {
  if (!entry) return null;

  const totalDebit = entry.lines.reduce((s, l) => s + l.debit, 0);
  const totalCredit = entry.lines.reduce((s, l) => s + l.credit, 0);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/45 backdrop-blur-md p-4 overflow-y-auto">
      <div className="spatial-elevated rounded-3xl max-w-2xl w-full shadow-2xl p-6 sm:p-8 space-y-4 my-8 text-zinc-800 border border-zinc-200/90 ring-1 ring-zinc-900/5 print:border-none print:shadow-none print:p-0 print:bg-white">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-200/80 pb-3">
          <div className="flex items-center space-x-2.5">
            <span className="font-mono text-zinc-900 font-bold text-base bg-zinc-100 border border-zinc-300 px-3 py-1 rounded-xl shadow-xs">
              {entry.voucherNumber}
            </span>
            <span className="text-xs uppercase font-semibold text-zinc-500">
              Official BIR Double-Entry Voucher
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => exportJournalToExcel([entry], entry.voucherNumber, company)}
              className="spatial-button-secondary flex items-center space-x-1 px-2.5 py-1 text-xs font-semibold rounded-xl text-zinc-800"
              title="Download Voucher as Microsoft Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-zinc-600" />
              <span>Excel (.xlsx)</span>
            </button>
            <button
              onClick={handlePrint}
              className="spatial-button-secondary p-1.5 rounded-xl text-zinc-600"
              title="Print Voucher"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Company Header for Print / Official Voucher */}
        <div className="text-center py-2 border-b border-zinc-200/80">
          <h2 className="text-base font-bold text-zinc-900 uppercase tracking-wide">{company.businessName}</h2>
          <p className="text-[11px] text-zinc-500 mt-0.5">
            TIN: {company.tin} &bull; RDO {company.rdoCode} &bull; {company.registeredAddress}
          </p>
        </div>

        {/* Particulars & Date */}
        <div className="grid grid-cols-2 gap-3 text-xs bg-zinc-50 p-3.5 rounded-2xl border border-zinc-200">
          <div>
            <span className="text-zinc-500 block text-[10px] uppercase font-semibold">Posting Date:</span>
            <span className="font-mono font-bold text-zinc-900">{entry.date}</span>
          </div>
          <div>
            <span className="text-zinc-500 block text-[10px] uppercase font-semibold">Book of Accounts:</span>
            <span className="font-bold text-zinc-800">{entry.bookType}</span>
          </div>
          <div className="col-span-2">
            <span className="text-zinc-500 block text-[10px] uppercase font-semibold">Particulars:</span>
            <span className="text-zinc-900 font-medium">{entry.description}</span>
          </div>
        </div>

        {/* BIR Document Metadata if present */}
        {entry.birMetadata && (
          <div className="spatial-card rounded-2xl p-4 text-xs space-y-2 border border-zinc-200/80 bg-zinc-50/70">
            <div className="font-bold text-zinc-900 text-[11px] uppercase border-b border-zinc-200/80 pb-1">
              BIR Reference Document
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              <div>
                <span className="text-zinc-500 block text-[10px] font-medium">Doc Type & Number:</span>
                <span className="font-mono text-zinc-900 font-semibold">{entry.birMetadata.documentType} #{entry.birMetadata.documentNumber}</span>
              </div>
              <div>
                <span className="text-zinc-500 block text-[10px] font-medium">Entity / Payee:</span>
                <span className="text-zinc-900 font-semibold">{entry.birMetadata.entityName}</span>
              </div>
              <div>
                <span className="text-zinc-500 block text-[10px] font-medium">Entity TIN:</span>
                <span className="font-mono text-zinc-900 font-semibold">{entry.birMetadata.entityTin}</span>
              </div>
              <div>
                <span className="text-zinc-500 block text-[10px] font-medium">Tax Base:</span>
                <span className="font-mono text-zinc-900 tabular-nums font-semibold">{formatPHP(entry.birMetadata.netAmount)}</span>
              </div>
              <div>
                <span className="text-zinc-500 block text-[10px] font-medium">12% VAT:</span>
                <span className="font-mono text-zinc-900 tabular-nums font-semibold">{formatPHP(entry.birMetadata.vatAmount)}</span>
              </div>
              <div>
                <span className="text-zinc-500 block text-[10px] font-medium">EWT Withheld:</span>
                <span className="font-mono text-zinc-900 tabular-nums font-semibold">{formatPHP(entry.birMetadata.ewtAmount)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Double-Entry Account Rows */}
        <div className="overflow-x-auto rounded-xl border border-zinc-200/80 bg-white">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-200 text-zinc-600 font-semibold bg-zinc-50">
                <th className="py-2.5 px-3">Account Code</th>
                <th className="py-2.5 px-3">Account Title</th>
                <th className="py-2.5 px-3">Memo / Description</th>
                <th className="py-2.5 px-3 text-right">Debit (PHP)</th>
                <th className="py-2.5 px-3 text-right">Credit (PHP)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {entry.lines.map((l) => (
                <tr key={l.id} className="text-zinc-800 hover:bg-zinc-50/50 transition">
                  <td className="py-2 px-3 font-mono text-zinc-600 font-medium">{l.accountCode}</td>
                  <td className="py-2 px-3 font-medium text-zinc-900">{l.accountName}</td>
                  <td className="py-2 px-3 text-zinc-500">{l.memo || '-'}</td>
                  <td className="py-2 px-3 text-right font-mono text-zinc-900 tabular-nums font-medium">
                    {l.debit > 0 ? formatPHP(l.debit) : ''}
                  </td>
                  <td className="py-2 px-3 text-right font-mono text-zinc-900 tabular-nums font-medium">
                    {l.credit > 0 ? formatPHP(l.credit) : ''}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-zinc-300 font-mono font-bold text-sm bg-zinc-100/90">
                <td colSpan={3} className="py-2.5 px-3 text-right uppercase text-xs text-zinc-900 font-bold">
                  Voucher Total
                </td>
                <td className="py-2.5 px-3 text-right text-zinc-900 tabular-nums">
                  {formatPHP(totalDebit)}
                </td>
                <td className="py-2.5 px-3 text-right text-zinc-900 tabular-nums">
                  {formatPHP(totalCredit)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Signatures for BIR CAS Compliance */}
        <div className="grid grid-cols-2 gap-4 border-t border-zinc-200/80 pt-4 text-xs text-zinc-500">
          <div>
            <span className="text-[10px] uppercase font-semibold block mb-6">Prepared by:</span>
            <div className="border-b border-zinc-300 pb-1 font-mono text-zinc-800">
              Staff Accountant
            </div>
          </div>
          <div>
            <span className="text-[10px] uppercase font-semibold block mb-6">Approved by:</span>
            <div className="border-b border-zinc-300 pb-1 text-zinc-900 font-semibold">
              {company.authorizedSignatory}
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex justify-between items-center pt-2 border-t border-zinc-200/80">
          {!entry.isReversed ? (
            <button
              onClick={() => {
                onRequestReversal(entry.id);
                onClose();
              }}
              className="spatial-button-secondary px-3.5 py-1.5 rounded-xl text-xs font-semibold text-rose-700 border-rose-200 hover:bg-rose-50 transition flex items-center space-x-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Create Audit Reversal</span>
            </button>
          ) : (
            <span className="text-xs text-rose-600 font-semibold italic">
              Status: Reversed by offsetting audit voucher
            </span>
          )}

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
