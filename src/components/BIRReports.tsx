import React, { useState } from 'react';
import { 
  ShieldCheck, 
  FileText, 
  Printer, 
  Download, 
  ExternalLink, 
  CheckCircle, 
  Info,
  Calendar,
  Building2,
  BadgePercent,
  FileSpreadsheet
} from 'lucide-react';
import { JournalEntry, CompanyProfile } from '../types/ledger';
import { 
  computeBIRVATSummary, 
  extractBIR2307Records, 
  BIRForm2307Record, 
  formatPHP 
} from '../lib/birCompliance';
import { 
  exportBIRForm2550ToExcel, 
  exportBIR2307RegisterToExcel 
} from '../lib/excelExport';

interface BIRReportsProps {
  entries: JournalEntry[];
  company: CompanyProfile;
}

export const BIRReports: React.FC<BIRReportsProps> = ({ entries, company }) => {
  const [activeTab, setActiveTab] = useState<'2550' | '2307' | 'compliance'>('2550');
  const [selected2307, setSelected2307] = useState<BIRForm2307Record | null>(null);

  const vatSummary = computeBIRVATSummary(entries);
  const records2307 = extractBIR2307Records(entries);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadExcel = () => {
    if (activeTab === '2550') {
      exportBIRForm2550ToExcel(vatSummary, company);
    } else if (activeTab === '2307') {
      exportBIR2307RegisterToExcel(records2307, company);
    } else {
      exportBIRForm2550ToExcel(vatSummary, company);
    }
  };

  return (
    <div className="space-y-6">
      {/* BIR Return Tabs with Spatial Neutral Segmented Dock */}
      <div className="spatial-glass rounded-3xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-zinc-200/80">
        <div className="flex p-1 bg-zinc-100/90 rounded-2xl border border-zinc-200/80 overflow-x-auto scrollbar-none gap-1">
          <button
            onClick={() => setActiveTab('2550')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl whitespace-nowrap transition-all ${
              activeTab === '2550'
                ? 'bg-white text-zinc-950 font-bold shadow-xs border border-zinc-200/80'
                : 'text-zinc-600 hover:text-zinc-950 hover:bg-white/50'
            }`}
          >
            BIR Form 2550M / 2550Q (VAT)
          </button>

          <button
            onClick={() => setActiveTab('2307')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl whitespace-nowrap transition-all ${
              activeTab === '2307'
                ? 'bg-white text-zinc-950 font-bold shadow-xs border border-zinc-200/80'
                : 'text-zinc-600 hover:text-zinc-950 hover:bg-white/50'
            }`}
          >
            BIR Form 2307 (Withholding)
          </button>

          <button
            onClick={() => setActiveTab('compliance')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl whitespace-nowrap transition-all ${
              activeTab === 'compliance'
                ? 'bg-white text-zinc-950 font-bold shadow-xs border border-zinc-200/80'
                : 'text-zinc-600 hover:text-zinc-950 hover:bg-white/50'
            }`}
          >
            CAS Compliance
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleDownloadExcel}
            className="spatial-button-primary px-3.5 py-2 text-xs font-bold rounded-xl flex items-center space-x-1.5 cursor-pointer"
            title="Download report formatted in Microsoft Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-zinc-300" />
            <span>Download Excel (.xlsx)</span>
          </button>

          <button
            onClick={handlePrint}
            className="spatial-button-secondary px-3.5 py-2 text-xs font-semibold rounded-xl flex items-center space-x-1.5"
          >
            <Printer className="w-3.5 h-3.5 text-zinc-600" />
            <span>Print</span>
          </button>
        </div>
      </div>

      {/* TAB 1: BIR FORM 2550M / 2550Q (VAT RETURN) */}
      {activeTab === '2550' && (
        <div className="spatial-glass rounded-3xl p-6 sm:p-8 shadow-xl space-y-6 max-w-4xl mx-auto border border-zinc-200/80 print:border-none print:shadow-none print:p-0">
          {/* Header of Form */}
          <div className="border-b border-zinc-200/80 pb-5 text-center relative">
            <span className="absolute left-0 top-0 text-[10px] uppercase font-bold text-zinc-400 tracking-wider hidden sm:block text-left">
              REPUBLIC OF THE PHILIPPINES<br />DEPARTMENT OF FINANCE<br />BUREAU OF INTERNAL REVENUE
            </span>
            <div className="inline-block">
              <span className="text-xs font-bold text-zinc-800 uppercase tracking-widest bg-zinc-100 px-3 py-1 rounded-md border border-zinc-200">
                BIR Form No. 2550M / 2550Q
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-zinc-900 uppercase tracking-tight mt-2">
                Value-Added Tax Declaration
              </h1>
              <p className="text-xs text-zinc-500 mt-0.5 font-medium">
                Monthly / Quarterly Summary of Taxable Sales, Purchases & Net VAT Remittance
              </p>
            </div>
          </div>

          {/* Part I: Taxpayer Background Information */}
          <div className="bg-zinc-50 border border-zinc-200/80 rounded-2xl p-4 text-xs space-y-3">
            <div className="font-bold text-zinc-800 uppercase tracking-wider text-[11px] border-b border-zinc-200/80 pb-1">
              Part I: Taxpayer Information
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <span className="text-zinc-500 block text-[10px] uppercase font-semibold">1. TIN</span>
                <span className="font-mono font-bold text-zinc-900 text-sm">{company.tin}</span>
              </div>
              <div>
                <span className="text-zinc-500 block text-[10px] uppercase font-semibold">2. RDO Code</span>
                <span className="font-bold text-zinc-900">{company.rdoCode}</span>
              </div>
              <div>
                <span className="text-zinc-500 block text-[10px] uppercase font-semibold">3. Line of Business / PSIC</span>
                <span className="font-medium text-zinc-800">{company.lineOfBusiness}</span>
              </div>
              <div className="md:col-span-2">
                <span className="text-zinc-500 block text-[10px] uppercase font-semibold">4. Taxpayer Registered Name</span>
                <span className="font-bold text-zinc-900 text-sm">{company.businessName}</span>
              </div>
              <div>
                <span className="text-zinc-500 block text-[10px] uppercase font-semibold">5. Trade Name</span>
                <span className="font-medium text-zinc-800">{company.tradeName}</span>
              </div>
              <div className="md:col-span-3">
                <span className="text-zinc-500 block text-[10px] uppercase font-semibold">6. Registered Address</span>
                <span className="text-zinc-800 font-medium">{company.registeredAddress}</span>
              </div>
            </div>
          </div>

          {/* Part II: Computation of VAT */}
          <div className="space-y-3 text-xs">
            <div className="font-bold text-zinc-800 uppercase tracking-wider text-[11px] border-b border-zinc-200/80 pb-1">
              Part II: Computation of Tax Liability
            </div>

            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 text-zinc-500 font-semibold uppercase text-[10px]">
                  <th className="py-2 px-3">Line Item & Description</th>
                  <th className="py-2 px-3 text-right">Gross Taxable Base (PHP)</th>
                  <th className="py-2 px-3 text-right">Output / Input Tax (PHP)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {/* 15: Vatable Sales */}
                <tr className="hover:bg-zinc-50">
                  <td className="py-2.5 px-3">
                    <span className="font-semibold text-zinc-900">15. Vatable Sales / Receipts (Subject to 12% Output Tax)</span>
                    <span className="block text-[11px] text-zinc-500 font-medium">Generated under regular invoices & ORs</span>
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-zinc-800 font-semibold tabular-nums">
                    {formatPHP(vatSummary.taxableSales)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-zinc-900 tabular-nums">
                    {formatPHP(vatSummary.outputVat)}
                  </td>
                </tr>

                {/* 16: Zero-Rated Sales */}
                <tr className="hover:bg-zinc-50">
                  <td className="py-2 px-3">
                    <span className="font-medium text-zinc-700">16. Zero-Rated Sales / Receipts (0% VAT)</span>
                  </td>
                  <td className="py-2 px-3 text-right font-mono text-zinc-500 tabular-nums">
                    {formatPHP(vatSummary.zeroRatedSales)}
                  </td>
                  <td className="py-2 px-3 text-right font-mono text-zinc-500 tabular-nums">
                    ₱0.00
                  </td>
                </tr>

                {/* 17: Exempt Sales */}
                <tr className="hover:bg-zinc-50">
                  <td className="py-2 px-3">
                    <span className="font-medium text-zinc-700">17. VAT-Exempt Sales / Receipts</span>
                  </td>
                  <td className="py-2 px-3 text-right font-mono text-zinc-500 tabular-nums">
                    {formatPHP(vatSummary.vatExemptSales)}
                  </td>
                  <td className="py-2 px-3 text-right font-mono text-zinc-500 tabular-nums">
                    ₱0.00
                  </td>
                </tr>

                {/* 19: Total Sales & Output Tax */}
                <tr className="bg-zinc-100/70 font-semibold border-t border-zinc-200">
                  <td className="py-2.5 px-3 text-zinc-900 uppercase text-[11px] font-bold">
                    19. Total Sales / Receipts and Total Output Tax
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-zinc-900 font-bold tabular-nums">
                    {formatPHP(vatSummary.totalSales)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-zinc-900 font-bold tabular-nums">
                    {formatPHP(vatSummary.outputVat)}
                  </td>
                </tr>

                {/* Section B: Allowable Input Tax */}
                <tr className="bg-zinc-50">
                  <td colSpan={3} className="py-2 px-3 font-bold text-zinc-700 uppercase text-[10px] tracking-wider">
                    Less: Allowable Input Tax (Paid to VAT-Registered Vendors)
                  </td>
                </tr>

                <tr className="hover:bg-zinc-50">
                  <td className="py-2 px-3">
                    <span className="font-medium text-zinc-700">20. Domestic Purchases of Goods & Services</span>
                    <span className="block text-[11px] text-zinc-500">Supported by valid VAT invoices/ORs</span>
                  </td>
                  <td className="py-2 px-3 text-right font-mono text-zinc-500 tabular-nums">
                    {formatPHP(vatSummary.taxablePurchases)}
                  </td>
                  <td className="py-2 px-3 text-right font-mono text-zinc-700 font-bold tabular-nums">
                    {formatPHP(vatSummary.inputVat)}
                  </td>
                </tr>

                {/* 22: Net VAT Payable */}
                <tr className="bg-zinc-100 font-bold border-t border-b border-zinc-200 text-zinc-900">
                  <td className="py-2.5 px-3">
                    22. Net VAT Payable / (Excess Input Tax) [Item 19 - Item 20]
                  </td>
                  <td className="py-2.5 px-3 text-right text-zinc-400 font-mono">-</td>
                  <td className="py-2.5 px-3 text-right font-mono text-sm text-zinc-900 tabular-nums">
                    {formatPHP(vatSummary.netVatPayable)}
                  </td>
                </tr>

                {/* 23: Less Tax Credits - Form 2307 */}
                <tr className="hover:bg-zinc-50">
                  <td className="py-2.5 px-3">
                    <span className="font-semibold text-zinc-900">23. Less: Creditable Value-Added Tax Withheld (BIR Form 2307)</span>
                    <span className="block text-[11px] text-zinc-500 font-medium">Certificates received from withholding clients</span>
                  </td>
                  <td className="py-2.5 px-3 text-right text-zinc-400 font-mono">-</td>
                  <td className="py-2.5 px-3 text-right font-mono text-zinc-600 font-bold tabular-nums">
                    ({formatPHP(vatSummary.creditableWithholdingTaxClaimed)})
                  </td>
                </tr>

                {/* 24: Total Tax Still Payable in Spatial Neutral Solid */}
                <tr className="bg-zinc-900 text-white font-bold shadow-xs">
                  <td className="py-3 px-3 uppercase text-xs">
                    24. Total Amount Payable / (Overpayment) to Bureau of Internal Revenue
                  </td>
                  <td className="py-3 px-3 text-right text-zinc-400 font-mono">-</td>
                  <td className="py-3 px-3 text-right font-mono text-base text-white tabular-nums">
                    {formatPHP(vatSummary.finalVatPayable)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Certification Signature */}
          <div className="border-t border-zinc-200/80 pt-4 text-xs text-zinc-500 space-y-4">
            <p className="text-[11px] text-zinc-400 italic leading-relaxed">
              I declare under the penalties of perjury that this declaration has been made in good faith, verified by me, and to the best of my knowledge and belief, is a true and correct declaration pursuant to the provisions of the National Internal Revenue Code, as amended.
            </p>
            <div className="flex justify-between items-end pt-4">
              <div>
                <span className="text-[10px] uppercase text-zinc-500 block font-semibold">Date Filed:</span>
                <span className="font-mono text-zinc-800 font-bold">{new Date().toISOString().slice(0, 10)}</span>
              </div>
              <div className="text-right">
                <div className="w-64 border-b border-zinc-400 pb-1 font-bold text-zinc-900 text-center">
                  {company.authorizedSignatory}
                </div>
                <div className="text-[11px] text-zinc-500 text-center mt-1 font-medium">
                  {company.signatoryTitle}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: BIR FORM 2307 REGISTER */}
      {activeTab === '2307' && (
        <div className="space-y-6">
          <div className="spatial-glass rounded-3xl p-6 shadow-xl space-y-4 border border-zinc-200/80">
            <div className="flex items-center justify-between border-b border-zinc-200/80 pb-4">
              <div>
                <h2 className="text-base font-bold text-zinc-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-zinc-700" />
                  BIR Form 2307 Register (Creditable Tax Withheld at Source)
                </h2>
                <p className="text-xs text-zinc-500 font-medium">
                  Tax certificates issued by clients deducting Expanded Withholding Tax (EWT)
                </p>
              </div>
              <span className="px-3 py-1 rounded-md bg-zinc-100 text-zinc-800 border border-zinc-200 text-xs font-bold">
                {records2307.length} Active Certificates
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-zinc-200 text-zinc-500 font-semibold uppercase text-[10px] tracking-wider">
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Form Ref #</th>
                    <th className="py-2.5 px-3">Withholding Agent (Payor)</th>
                    <th className="py-2.5 px-3">Payor TIN</th>
                    <th className="py-2.5 px-3">ATC Code</th>
                    <th className="py-2.5 px-3 text-right">Tax Base</th>
                    <th className="py-2.5 px-3 text-right">Rate</th>
                    <th className="py-2.5 px-3 text-right">Tax Withheld</th>
                    <th className="py-2.5 px-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {records2307.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-zinc-400 font-medium">
                        No BIR 2307 withholding tax records generated yet. Record a sale with EWT to generate certificates.
                      </td>
                    </tr>
                  ) : (
                    records2307.map((rec, i) => (
                      <tr key={i} className="hover:bg-zinc-50 text-zinc-800 transition">
                        <td className="py-3 px-3 font-mono text-zinc-500 whitespace-nowrap">{rec.documentDate}</td>
                        <td className="py-3 px-3 font-mono font-bold text-zinc-900 whitespace-nowrap">{rec.formRef}</td>
                        <td className="py-3 px-3 font-semibold text-zinc-900">{rec.payorName}</td>
                        <td className="py-3 px-3 font-mono text-zinc-600">{rec.payorTin}</td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-800 font-mono text-[11px] border border-zinc-200 font-semibold">
                            {rec.atcCode}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-zinc-800 tabular-nums">{formatPHP(rec.taxBaseAmount)}</td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-zinc-700 tabular-nums">{rec.taxRatePercent}%</td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-zinc-900 tabular-nums">{formatPHP(rec.taxWithheldAmount)}</td>
                        <td className="py-3 px-3 text-center">
                          <button
                            onClick={() => setSelected2307(rec)}
                            className="spatial-button-secondary px-3 py-1 text-[11px] font-bold rounded-lg cursor-pointer"
                          >
                            Preview Form
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Form 2307 Modal Preview in Spatial Neutral Style */}
          {selected2307 && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/35 backdrop-blur-xl p-4 overflow-y-auto">
              <div className="spatial-elevated rounded-3xl p-6 max-w-2xl w-full shadow-2xl space-y-4 my-8 text-zinc-900 border border-zinc-200/90">
                <div className="flex justify-between items-start border-b border-zinc-100 pb-3">
                  <div>
                    <span className="text-[10px] font-bold text-zinc-800 uppercase tracking-widest bg-zinc-100 px-2.5 py-0.5 rounded-md border border-zinc-200">
                      BIR Form No. 2307
                    </span>
                    <h3 className="text-lg font-bold text-zinc-900 mt-1">
                      Certificate of Creditable Tax Withheld At Source
                    </h3>
                  </div>
                  <button
                    onClick={() => setSelected2307(null)}
                    className="text-zinc-400 hover:text-zinc-700 text-lg font-bold p-1 cursor-pointer"
                  >
                    &times;
                  </button>
                </div>

                {/* Form Body */}
                <div className="bg-zinc-50 border border-zinc-200/80 rounded-2xl p-4 text-xs space-y-4">
                  {/* Part I: Payor Information */}
                  <div>
                    <div className="font-bold text-zinc-900 text-[11px] uppercase border-b border-zinc-200 pb-1 mb-2">
                      Part I - Payor Information (Withholding Agent)
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-zinc-500 block text-[10px]">TIN of Payor:</span>
                        <span className="font-mono font-bold text-zinc-800">{selected2307.payorTin}</span>
                      </div>
                      <div>
                        <span className="text-zinc-500 block text-[10px]">Payor's Registered Name:</span>
                        <span className="font-bold text-zinc-900">{selected2307.payorName}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-zinc-500 block text-[10px]">Registered Address:</span>
                        <span className="text-zinc-800">{selected2307.payorAddress}</span>
                      </div>
                    </div>
                  </div>

                  {/* Part II: Payee Information */}
                  <div>
                    <div className="font-bold text-zinc-900 text-[11px] uppercase border-b border-zinc-200 pb-1 mb-2">
                      Part II - Payee Information (Recipient of Income)
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-zinc-500 block text-[10px]">TIN of Payee:</span>
                        <span className="font-mono font-bold text-zinc-900">{company.tin}</span>
                      </div>
                      <div>
                        <span className="text-zinc-500 block text-[10px]">Payee's Registered Name:</span>
                        <span className="font-bold text-zinc-900">{company.businessName}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-zinc-500 block text-[10px]">Registered Address:</span>
                        <span className="text-zinc-800">{company.registeredAddress}</span>
                      </div>
                    </div>
                  </div>

                  {/* Part III: Details of Income & Tax Withheld */}
                  <div>
                    <div className="font-bold text-zinc-900 text-[11px] uppercase border-b border-zinc-200 pb-1 mb-2">
                      Part III - Details of Monthly Income Payment & Tax Withheld
                    </div>
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-zinc-200 text-zinc-500 uppercase text-[10px]">
                          <th className="py-1.5 px-2">ATC</th>
                          <th className="py-1.5 px-2">Nature of Payment</th>
                          <th className="py-1.5 px-2 text-right">Tax Base</th>
                          <th className="py-1.5 px-2 text-right">Rate</th>
                          <th className="py-1.5 px-2 text-right">Tax Withheld</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="py-2 px-2 font-mono font-bold text-zinc-900">{selected2307.atcCode}</td>
                          <td className="py-2 px-2 text-zinc-800 font-medium">{selected2307.natureOfPayment}</td>
                          <td className="py-2 px-2 text-right font-mono text-zinc-900 tabular-nums">{formatPHP(selected2307.taxBaseAmount)}</td>
                          <td className="py-2 px-2 text-right font-mono font-bold text-zinc-800 tabular-nums">{selected2307.taxRatePercent}%</td>
                          <td className="py-2 px-2 text-right font-mono font-bold text-zinc-900 tabular-nums">{formatPHP(selected2307.taxWithheldAmount)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2">
                  <span className="text-[11px] text-zinc-500">
                    Reference: {selected2307.formRef}
                  </span>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        exportBIR2307RegisterToExcel([selected2307], company);
                      }}
                      className="spatial-button-secondary px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5 text-zinc-600" />
                      <span>Download Excel</span>
                    </button>
                    <button
                      onClick={() => window.print()}
                      className="spatial-button-secondary px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1"
                    >
                      <Printer className="w-3.5 h-3.5 text-zinc-600" />
                      <span>Print</span>
                    </button>
                    <button
                      onClick={() => setSelected2307(null)}
                      className="spatial-button-primary px-4 py-1.5 rounded-xl text-xs font-bold cursor-pointer"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: BIR CAS & LOOSE-LEAF COMPLIANCE CERTIFICATE */}
      {activeTab === 'compliance' && (
        <div className="spatial-glass rounded-3xl p-6 sm:p-8 shadow-xl space-y-6 max-w-3xl mx-auto border border-zinc-200/80">
          <div className="flex items-center space-x-3 text-zinc-900 border-b border-zinc-200/80 pb-4">
            <ShieldCheck className="w-7 h-7" />
            <div>
              <h2 className="text-lg font-bold text-zinc-900">BIR Regulatory Accounting Compliance</h2>
              <p className="text-xs text-zinc-500">Section 232 of the National Internal Revenue Code (NIRC)</p>
            </div>
          </div>

          <div className="space-y-4 text-xs text-zinc-700 leading-relaxed font-medium">
            <div className="bg-zinc-50 border border-zinc-200/80 rounded-2xl p-4 space-y-2">
              <h3 className="font-bold text-zinc-900 flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-zinc-700" />
                Computerized Accounting System (CAS) Ready
              </h3>
              <p>
                Calypso maintains the complete, unedited transaction log required for Bureau of Internal Revenue (BIR) audits. Transactions generate sequential voucher numbers and cannot be deleted; corrections are posted via reversing journal vouchers under standard accounting principles.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-white border border-zinc-200/80 rounded-2xl space-y-2 shadow-2xs">
                <span className="font-bold text-zinc-900 text-xs">Standard Books Maintained:</span>
                <ul className="list-disc pl-4 space-y-1 text-zinc-600 text-[11px]">
                  <li>General Journal (Chronological postings)</li>
                  <li>General Ledger (Account summary & balances)</li>
                  <li>Cash Receipts Journal (Official Receipt registry)</li>
                  <li>Cash Disbursements Journal (Disbursement register)</li>
                </ul>
              </div>

              <div className="p-4 bg-white border border-zinc-200/80 rounded-2xl space-y-2 shadow-2xs">
                <span className="font-bold text-zinc-900 text-xs">Statutory Tax Integration:</span>
                <ul className="list-disc pl-4 space-y-1 text-zinc-600 text-[11px]">
                  <li>12% Value-Added Tax (Output vs Input Tax)</li>
                  <li>BIR Form 2550M / 2550Q calculation</li>
                  <li>BIR Form 2307 Creditable Tax tracking</li>
                  <li>Expanded Withholding Tax (EWT) remittances</li>
                </ul>
              </div>
            </div>

            <div className="border-t border-zinc-200/80 pt-4 flex justify-between items-center text-[11px] text-zinc-500">
              <div>
                Registered CAS Permit / COR: <strong className="text-zinc-900">{company.casPermitNumber || company.birRegistrationNumber}</strong>
              </div>
              <div>
                Accounting Method: <strong className="text-zinc-900">{company.accountingMethod}</strong>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
