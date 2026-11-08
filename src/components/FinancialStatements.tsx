import React, { useState, useMemo } from 'react';
import { 
  Building2, 
  Scale, 
  FileSpreadsheet, 
  Printer, 
  CheckCircle2, 
  AlertTriangle 
} from 'lucide-react';
import { JournalEntry, Account, CompanyProfile } from '../types/ledger';
import { 
  computeGeneralLedgerByAccount, 
  computeBIRVATSummary, 
  extractBIR2307Records, 
  formatPHP 
} from '../lib/birCompliance';
import { 
  exportTrialBalanceToExcel, 
  exportIncomeStatementToExcel, 
  exportBalanceSheetToExcel,
  exportCompletePackageToExcel 
} from '../lib/excelExport';

interface FinancialStatementsProps {
  entries: JournalEntry[];
  accounts: Account[];
  company: CompanyProfile;
}

export const FinancialStatements: React.FC<FinancialStatementsProps> = ({
  entries,
  accounts,
  company,
}) => {
  const [statementType, setStatementType] = useState<'trial_balance' | 'income_statement' | 'balance_sheet'>('trial_balance');

  const ledgerMap = useMemo(() => {
    return computeGeneralLedgerByAccount(accounts, entries);
  }, [accounts, entries]);

  // Compute trial balance rows
  const trialBalanceRows = useMemo(() => {
    let totalDebit = 0;
    let totalCredit = 0;

    const rows = accounts.map((acc) => {
      const report = ledgerMap.get(acc.id);
      const bal = report?.endingBalance || 0;
      let debit = 0;
      let credit = 0;

      if (acc.normalBalance === 'debit') {
        if (bal >= 0) debit = bal;
        else credit = -bal;
      } else {
        if (bal >= 0) credit = bal;
        else debit = -bal;
      }

      totalDebit += debit;
      totalCredit += credit;

      return {
        account: acc,
        debit,
        credit,
      };
    });

    return {
      rows,
      totalDebit,
      totalCredit,
      isBalanced: Math.abs(totalDebit - totalCredit) < 0.01,
    };
  }, [accounts, ledgerMap]);

  // Income Statement computation
  const incomeStatement = useMemo(() => {
    let totalRevenue = 0;
    let totalCostOfSales = 0;
    let totalOperatingExpenses = 0;

    const revenueLines: { name: string; code: string; amount: number }[] = [];
    const costLines: { name: string; code: string; amount: number }[] = [];
    const expenseLines: { name: string; code: string; amount: number }[] = [];

    accounts.forEach((acc) => {
      const rep = ledgerMap.get(acc.id);
      const bal = rep?.endingBalance || 0;
      if (bal === 0) return;

      if (acc.type === 'revenue') {
        revenueLines.push({ name: acc.name, code: acc.code, amount: bal });
        totalRevenue += bal;
      } else if (acc.type === 'cost_of_sales') {
        costLines.push({ name: acc.name, code: acc.code, amount: bal });
        totalCostOfSales += bal;
      } else if (acc.type === 'expense') {
        expenseLines.push({ name: acc.name, code: acc.code, amount: bal });
        totalOperatingExpenses += bal;
      }
    });

    const grossProfit = totalRevenue - totalCostOfSales;
    const netIncome = grossProfit - totalOperatingExpenses;

    return {
      revenueLines,
      costLines,
      expenseLines,
      totalRevenue,
      totalCostOfSales,
      grossProfit,
      totalOperatingExpenses,
      netIncome,
    };
  }, [accounts, ledgerMap]);

  // Balance Sheet computation
  const balanceSheet = useMemo(() => {
    let totalAssets = 0;
    let totalLiabilities = 0;
    let totalEquity = 0;

    const assetLines: { name: string; code: string; amount: number }[] = [];
    const liabilityLines: { name: string; code: string; amount: number }[] = [];
    const equityLines: { name: string; code: string; amount: number }[] = [];

    accounts.forEach((acc) => {
      const rep = ledgerMap.get(acc.id);
      const bal = rep?.endingBalance || 0;
      if (bal === 0) return;

      if (acc.type === 'asset') {
        assetLines.push({ name: acc.name, code: acc.code, amount: bal });
        totalAssets += bal;
      } else if (acc.type === 'liability') {
        liabilityLines.push({ name: acc.name, code: acc.code, amount: bal });
        totalLiabilities += bal;
      } else if (acc.type === 'equity') {
        equityLines.push({ name: acc.name, code: acc.code, amount: bal });
        totalEquity += bal;
      }
    });

    // Add Current Year Net Income to Equity
    const totalEquityAndProfit = totalEquity + incomeStatement.netIncome;
    const totalLiabilitiesAndEquity = totalLiabilities + totalEquityAndProfit;
    const isBalanced = Math.abs(totalAssets - totalLiabilitiesAndEquity) < 0.05;

    return {
      assetLines,
      liabilityLines,
      equityLines,
      totalAssets,
      totalLiabilities,
      totalEquity,
      currentPeriodNetIncome: incomeStatement.netIncome,
      totalEquityAndProfit,
      totalLiabilitiesAndEquity,
      isBalanced,
    };
  }, [accounts, ledgerMap, incomeStatement]);

  const handleExportExcel = () => {
    if (statementType === 'trial_balance') {
      exportTrialBalanceToExcel(trialBalanceRows, company);
    } else if (statementType === 'income_statement') {
      exportIncomeStatementToExcel(incomeStatement, company);
    } else {
      exportBalanceSheetToExcel(balanceSheet, company);
    }
  };

  const handleExportAllPackage = () => {
    const vatSummary = computeBIRVATSummary(entries);
    const records2307 = extractBIR2307Records(entries);
    exportCompletePackageToExcel(
      company,
      entries,
      accounts,
      ledgerMap,
      trialBalanceRows,
      incomeStatement,
      balanceSheet,
      vatSummary,
      records2307
    );
  };

  return (
    <div className="space-y-6">
      {/* Statement Selector with Spatial Glass & Neutral Palette */}
      <div className="spatial-glass rounded-2xl p-3 sm:p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-zinc-200/80">
        <div className="flex p-1 bg-zinc-100/90 rounded-xl space-x-1 border border-zinc-200/70 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setStatementType('trial_balance')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-all ${
              statementType === 'trial_balance'
                ? 'bg-zinc-900 text-white shadow-xs font-bold'
                : 'text-zinc-600 hover:text-zinc-900 hover:bg-white/60'
            }`}
          >
            Trial Balance (Debit = Credit)
          </button>

          <button
            onClick={() => setStatementType('income_statement')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-all ${
              statementType === 'income_statement'
                ? 'bg-zinc-900 text-white shadow-xs font-bold'
                : 'text-zinc-600 hover:text-zinc-900 hover:bg-white/60'
            }`}
          >
            Income Statement (Profit & Loss)
          </button>

          <button
            onClick={() => setStatementType('balance_sheet')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-all ${
              statementType === 'balance_sheet'
                ? 'bg-zinc-900 text-white shadow-xs font-bold'
                : 'text-zinc-600 hover:text-zinc-900 hover:bg-white/60'
            }`}
          >
            Balance Sheet (Financial Position)
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleExportExcel}
            className="spatial-button-primary flex items-center space-x-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl"
            title="Download active financial statement as Microsoft Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-white" />
            <span>Download Excel (.xlsx)</span>
          </button>

          <button
            onClick={handleExportAllPackage}
            className="spatial-button-secondary flex items-center space-x-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl text-zinc-800"
            title="Download multi-tab Excel workbook with all statements and BIR returns"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-zinc-600" />
            <span>All Statements (.xlsx)</span>
          </button>

          <button
            onClick={() => window.print()}
            className="spatial-button-secondary flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold rounded-xl text-zinc-700"
          >
            <Printer className="w-3.5 h-3.5 text-zinc-600" />
            <span>Print</span>
          </button>
        </div>
      </div>

      {/* 1. TRIAL BALANCE */}
      {statementType === 'trial_balance' && (
        <div className="spatial-elevated rounded-3xl p-6 sm:p-8 shadow-xl space-y-6 max-w-4xl mx-auto border border-zinc-200/80">
          <div className="text-center border-b border-zinc-200 pb-4">
            <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">{company.businessName}</h2>
            <h1 className="text-2xl font-black text-zinc-900 tracking-tight mt-1">TRIAL BALANCE</h1>
            <p className="text-xs text-zinc-500 mt-0.5 font-medium">
              As of {new Date().toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' })} &bull; Philippine Peso (PHP)
            </p>
          </div>

          <div className="flex justify-end">
            {trialBalanceRows.isBalanced ? (
              <span className="flex items-center space-x-1.5 text-xs font-bold text-zinc-800 bg-zinc-100 px-3.5 py-1.5 rounded-xl border border-zinc-300/80 shadow-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span className="font-mono">BOOKS IN BALANCE: Total Debits == Total Credits</span>
              </span>
            ) : (
              <span className="flex items-center space-x-1.5 text-xs font-bold text-rose-900 bg-rose-50 px-3.5 py-1.5 rounded-xl border border-rose-200">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>OUT OF BALANCE (Check pending vouchers)</span>
              </span>
            )}
          </div>

          <div className="overflow-x-auto rounded-2xl border border-zinc-200/80 bg-white/70">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50/90 text-zinc-700 font-semibold">
                  <th className="py-3 px-3.5">Account Code</th>
                  <th className="py-3 px-3.5">Account Title</th>
                  <th className="py-3 px-3.5">Category</th>
                  <th className="py-3 px-3.5 text-right">Debit (PHP)</th>
                  <th className="py-3 px-3.5 text-right">Credit (PHP)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {trialBalanceRows.rows.map((row) => (
                  <tr key={row.account.id} className="hover:bg-zinc-50/80 text-zinc-800 transition">
                    <td className="py-2.5 px-3.5 font-mono text-zinc-500">{row.account.code}</td>
                    <td className="py-2.5 px-3.5 font-semibold text-zinc-900">{row.account.name}</td>
                    <td className="py-2.5 px-3.5 uppercase text-[10px] text-zinc-400 font-medium">{row.account.type.replace('_', ' ')}</td>
                    <td className="py-2.5 px-3.5 text-right font-mono text-zinc-900 font-medium tabular-nums">
                      {row.debit > 0 ? formatPHP(row.debit) : ''}
                    </td>
                    <td className="py-2.5 px-3.5 text-right font-mono text-zinc-900 font-medium tabular-nums">
                      {row.credit > 0 ? formatPHP(row.credit) : ''}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-zinc-300 font-bold font-mono text-sm bg-zinc-100/80">
                  <td colSpan={3} className="py-3 px-3.5 uppercase text-right text-zinc-900 font-bold">
                    TOTALS
                  </td>
                  <td className="py-3 px-3.5 text-right text-zinc-900 tabular-nums">
                    <span className="accounting-double-underline inline-block pb-0.5">
                      {formatPHP(trialBalanceRows.totalDebit)}
                    </span>
                  </td>
                  <td className="py-3 px-3.5 text-right text-zinc-900 tabular-nums">
                    <span className="accounting-double-underline inline-block pb-0.5">
                      {formatPHP(trialBalanceRows.totalCredit)}
                    </span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* 2. INCOME STATEMENT */}
      {statementType === 'income_statement' && (
        <div className="spatial-elevated rounded-3xl p-6 sm:p-8 shadow-xl space-y-6 max-w-3xl mx-auto border border-zinc-200/80">
          <div className="text-center border-b border-zinc-200 pb-4">
            <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">{company.businessName}</h2>
            <h1 className="text-2xl font-black text-zinc-900 tracking-tight mt-1">STATEMENT OF COMPREHENSIVE INCOME</h1>
            <p className="text-xs text-zinc-500 mt-0.5 font-medium">For the period ended December 31, 2026 (Philippine Peso)</p>
          </div>

          <div className="space-y-5 text-xs">
            {/* Revenues */}
            <div>
              <div className="font-bold text-zinc-900 uppercase text-xs border-b border-zinc-200 pb-1.5 mb-2">
                REVENUES
              </div>
              <div className="space-y-1 pl-3">
                {incomeStatement.revenueLines.map((l, i) => (
                  <div key={i} className="flex justify-between py-1.5 text-zinc-800 border-b border-zinc-100">
                    <span className="font-medium text-zinc-700">{l.code} - {l.name}</span>
                    <span className="font-mono text-zinc-900 font-bold tabular-nums">{formatPHP(l.amount)}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between py-2.5 font-bold text-zinc-900 bg-zinc-50 px-4 rounded-xl mt-2 border border-zinc-200">
                <span>Total Revenues</span>
                <span className="font-mono text-zinc-900 font-bold tabular-nums">{formatPHP(incomeStatement.totalRevenue)}</span>
              </div>
            </div>

            {/* Cost of Sales */}
            <div>
              <div className="font-bold text-zinc-900 uppercase text-xs border-b border-zinc-200 pb-1.5 mb-2">
                LESS: COST OF SALES / DIRECT SERVICES
              </div>
              <div className="space-y-1 pl-3">
                {incomeStatement.costLines.length === 0 ? (
                  <div className="text-zinc-400 py-1.5 italic">No direct cost accounts posted</div>
                ) : (
                  incomeStatement.costLines.map((l, i) => (
                    <div key={i} className="flex justify-between py-1.5 text-zinc-800 border-b border-zinc-100">
                      <span className="font-medium text-zinc-700">{l.code} - {l.name}</span>
                      <span className="font-mono text-zinc-700 font-bold tabular-nums">({formatPHP(l.amount)})</span>
                    </div>
                  ))
                )}
              </div>
              <div className="flex justify-between py-2.5 font-bold text-zinc-900 bg-zinc-50 px-4 rounded-xl mt-2 border border-zinc-200">
                <span>Total Cost of Sales</span>
                <span className="font-mono text-zinc-700 font-bold tabular-nums">({formatPHP(incomeStatement.totalCostOfSales)})</span>
              </div>
            </div>

            {/* Gross Profit */}
            <div className="flex justify-between py-3 font-bold text-sm bg-zinc-100/90 border border-zinc-300 px-4 rounded-xl text-zinc-900">
              <span className="uppercase tracking-wide font-extrabold">GROSS PROFIT</span>
              <span className="font-mono text-zinc-900 tabular-nums">{formatPHP(incomeStatement.grossProfit)}</span>
            </div>

            {/* Operating Expenses */}
            <div>
              <div className="font-bold text-zinc-900 uppercase text-xs border-b border-zinc-200 pb-1.5 mb-2">
                LESS: OPERATING & ADMINISTRATIVE EXPENSES
              </div>
              <div className="space-y-1 pl-3">
                {incomeStatement.expenseLines.map((l, i) => (
                  <div key={i} className="flex justify-between py-1.5 text-zinc-800 border-b border-zinc-100">
                    <span className="font-medium text-zinc-700">{l.code} - {l.name}</span>
                    <span className="font-mono text-zinc-700 font-bold tabular-nums">({formatPHP(l.amount)})</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between py-2.5 font-bold text-zinc-900 bg-zinc-50 px-4 rounded-xl mt-2 border border-zinc-200">
                <span>Total Operating Expenses</span>
                <span className="font-mono text-zinc-700 font-bold tabular-nums">({formatPHP(incomeStatement.totalOperatingExpenses)})</span>
              </div>
            </div>

            {/* Net Operating Income in Spatial Card */}
            <div className="flex justify-between py-3.5 font-bold text-base bg-zinc-900 text-white border border-zinc-800 px-5 rounded-2xl shadow-md">
              <span className="uppercase tracking-wide font-extrabold text-sm">NET INCOME BEFORE TAX</span>
              <span className="font-mono text-white tabular-nums">{formatPHP(incomeStatement.netIncome)}</span>
            </div>
          </div>
        </div>
      )}

      {/* 3. BALANCE SHEET */}
      {statementType === 'balance_sheet' && (
        <div className="spatial-elevated rounded-3xl p-6 sm:p-8 shadow-xl space-y-6 max-w-3xl mx-auto border border-zinc-200/80">
          <div className="text-center border-b border-zinc-200 pb-4">
            <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">{company.businessName}</h2>
            <h1 className="text-2xl font-black text-zinc-900 tracking-tight mt-1">STATEMENT OF FINANCIAL POSITION</h1>
            <p className="text-xs text-zinc-500 mt-0.5 font-medium">As of December 31, 2026 (Philippine Peso)</p>
          </div>

          <div className="space-y-6 text-xs">
            {/* ASSETS */}
            <div>
              <div className="font-bold text-zinc-900 uppercase text-xs border-b border-zinc-200 pb-1.5 mb-2">
                ASSETS
              </div>
              <div className="space-y-1 pl-3">
                {balanceSheet.assetLines.map((l, i) => (
                  <div key={i} className="flex justify-between py-1.5 text-zinc-800 border-b border-zinc-100">
                    <span className="font-medium text-zinc-700">{l.code} - {l.name}</span>
                    <span className="font-mono text-zinc-900 font-bold tabular-nums">{formatPHP(l.amount)}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between py-2.5 font-bold text-sm bg-zinc-100/90 border border-zinc-300 px-4 rounded-xl mt-3 text-zinc-900">
                <span className="uppercase font-bold tracking-wide">TOTAL ASSETS</span>
                <span className="font-mono tabular-nums">{formatPHP(balanceSheet.totalAssets)}</span>
              </div>
            </div>

            {/* LIABILITIES */}
            <div>
              <div className="font-bold text-zinc-900 uppercase text-xs border-b border-zinc-200 pb-1.5 mb-2">
                LIABILITIES
              </div>
              <div className="space-y-1 pl-3">
                {balanceSheet.liabilityLines.map((l, i) => (
                  <div key={i} className="flex justify-between py-1.5 text-zinc-800 border-b border-zinc-100">
                    <span className="font-medium text-zinc-700">{l.code} - {l.name}</span>
                    <span className="font-mono text-zinc-900 font-bold tabular-nums">{formatPHP(l.amount)}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between py-2.5 font-bold text-zinc-900 bg-zinc-50 px-4 rounded-xl mt-2 border border-zinc-200">
                <span>Total Liabilities</span>
                <span className="font-mono text-zinc-900 font-bold tabular-nums">{formatPHP(balanceSheet.totalLiabilities)}</span>
              </div>
            </div>

            {/* EQUITY */}
            <div>
              <div className="font-bold text-zinc-900 uppercase text-xs border-b border-zinc-200 pb-1.5 mb-2">
                STOCKHOLDERS' EQUITY
              </div>
              <div className="space-y-1 pl-3">
                {balanceSheet.equityLines.map((l, i) => (
                  <div key={i} className="flex justify-between py-1.5 text-zinc-800 border-b border-zinc-100">
                    <span className="font-medium text-zinc-700">{l.code} - {l.name}</span>
                    <span className="font-mono text-zinc-900 font-bold tabular-nums">{formatPHP(l.amount)}</span>
                  </div>
                ))}
                <div className="flex justify-between py-1.5 text-zinc-900 border-b border-zinc-100 font-bold">
                  <span>Current Period Net Income (from Income Statement)</span>
                  <span className="font-mono tabular-nums">{formatPHP(balanceSheet.currentPeriodNetIncome)}</span>
                </div>
              </div>
              <div className="flex justify-between py-2.5 font-bold text-zinc-900 bg-zinc-50 px-4 rounded-xl mt-2 border border-zinc-200">
                <span>Total Equity</span>
                <span className="font-mono text-zinc-900 font-bold tabular-nums">{formatPHP(balanceSheet.totalEquityAndProfit)}</span>
              </div>
            </div>

            {/* TOTAL LIABILITIES & EQUITY */}
            <div className="flex justify-between py-3 font-bold text-sm bg-zinc-900 text-white border border-zinc-800 px-5 rounded-xl shadow-md">
              <span className="uppercase tracking-wide font-extrabold">TOTAL LIABILITIES & EQUITY</span>
              <span className="font-mono tabular-nums text-white">{formatPHP(balanceSheet.totalLiabilitiesAndEquity)}</span>
            </div>

            {balanceSheet.isBalanced && (
              <div className="flex items-center justify-center space-x-1.5 text-xs text-zinc-700 font-bold pt-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Accounting Balance Verified: Assets == Liabilities + Equity</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
