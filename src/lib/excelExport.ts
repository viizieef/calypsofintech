import * as XLSX from 'xlsx';
import { JournalEntry, Account, CompanyProfile } from '../types/ledger';
import { BIRVATSummary, BIRForm2307Record, AccountLedgerReport } from './birCompliance';

/**
 * Utility to save an XLSX workbook in the browser
 */
function downloadWorkbook(workbook: XLSX.WorkBook, filename: string) {
  XLSX.writeFile(workbook, filename, { compression: true });
}

/**
 * 1. Export Journal Books (General Journal, CRJ, CDJ) to Excel
 */
export function exportJournalToExcel(
  entries: JournalEntry[],
  bookName: string,
  company: CompanyProfile
) {
  const wb = XLSX.utils.book_new();

  const titleRows: any[][] = [
    [company.businessName.toUpperCase()],
    [`BIR TIN: ${company.tin} | RDO: ${company.rdoCode} | ${company.taxpayerType}-Registered`],
    [`BOOK OF ACCOUNTS: ${bookName.toUpperCase().replace('_', ' ')}`],
    [`Generated Date: ${new Date().toISOString().slice(0, 10)} | Accounting System: Calypso CAS`],
    [], // Blank line
  ];

  const headerRow: any[] = [
    'Posting Date',
    'Voucher #',
    'Book Type',
    'Particulars / Description',
    'Account Code',
    'Account Title',
    'Debit (PHP)',
    'Credit (PHP)',
    'BIR Doc Type',
    'BIR Doc #',
    'Entity / Payee',
    'Entity TIN',
    'Tax Treatment',
    'Tax Base (PHP)',
    '12% VAT (PHP)',
    'EWT Withheld (PHP)',
    'Status'
  ];

  const dataRows: any[][] = [];
  let totalDebit = 0;
  let totalCredit = 0;

  entries.forEach((entry) => {
    entry.lines.forEach((line, idx) => {
      totalDebit += line.debit;
      totalCredit += line.credit;

      dataRows.push([
        idx === 0 ? entry.date : '',
        idx === 0 ? entry.voucherNumber : '',
        idx === 0 ? entry.bookType : '',
        idx === 0 ? entry.description : (line.memo || ''),
        line.accountCode,
        line.accountName,
        line.debit > 0 ? line.debit : 0,
        line.credit > 0 ? line.credit : 0,
        idx === 0 ? (entry.birMetadata?.documentType || '') : '',
        idx === 0 ? (entry.birMetadata?.documentNumber || '') : '',
        idx === 0 ? (entry.birMetadata?.entityName || '') : '',
        idx === 0 ? (entry.birMetadata?.entityTin || '') : '',
        idx === 0 ? (entry.birMetadata?.taxType || '') : '',
        idx === 0 ? (entry.birMetadata?.netAmount || 0) : '',
        idx === 0 ? (entry.birMetadata?.vatAmount || 0) : '',
        idx === 0 ? (entry.birMetadata?.ewtAmount || 0) : '',
        entry.isReversed ? 'REVERSED' : 'POSTED'
      ]);
    });
  });

  // Summary Row
  const summaryRow: any[] = [
    'TOTAL',
    '',
    '',
    `${entries.length} Vouchers`,
    '',
    '',
    totalDebit,
    totalCredit,
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    ''
  ];

  const ws = XLSX.utils.aoa_to_sheet([
    ...titleRows,
    headerRow,
    ...dataRows,
    [],
    summaryRow
  ]);

  // Adjust column widths
  ws['!cols'] = [
    { wch: 13 }, // Date
    { wch: 16 }, // Voucher #
    { wch: 20 }, // Book Type
    { wch: 36 }, // Description
    { wch: 14 }, // Code
    { wch: 32 }, // Name
    { wch: 16 }, // Debit
    { wch: 16 }, // Credit
    { wch: 18 }, // BIR Doc Type
    { wch: 16 }, // BIR Doc #
    { wch: 24 }, // Entity
    { wch: 18 }, // Entity TIN
    { wch: 16 }, // Tax Type
    { wch: 15 }, // Tax Base
    { wch: 15 }, // VAT
    { wch: 16 }, // EWT
    { wch: 12 }, // Status
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Journal Log');
  downloadWorkbook(wb, `Calypso_${bookName}_${company.tin}_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

/**
 * 2. Export General Ledger (Account Summaries & Detailed Postings) to Excel
 */
export function exportGeneralLedgerToExcel(
  ledgerMap: Map<string, AccountLedgerReport>,
  accounts: Account[],
  company: CompanyProfile
) {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Summary of All Accounts
  const summaryData: any[][] = [
    [company.businessName.toUpperCase()],
    [`BIR TIN: ${company.tin} | RDO: ${company.rdoCode}`],
    ['GENERAL LEDGER - CHART OF ACCOUNTS SUMMARY'],
    [`Generated Date: ${new Date().toISOString().slice(0, 10)}`],
    [],
    [
      'Account Code',
      'Account Title',
      'Category',
      'Normal Balance',
      'Beginning Balance (PHP)',
      'Total Debits (PHP)',
      'Total Credits (PHP)',
      'Ending Balance (PHP)'
    ]
  ];

  accounts.forEach((acc) => {
    const report = ledgerMap.get(acc.id);
    const beg = report?.beginningBalance || 0;
    const deb = report?.totalDebits || 0;
    const cred = report?.totalCredits || 0;
    const end = report?.endingBalance || 0;

    summaryData.push([
      acc.code,
      acc.name,
      acc.type.toUpperCase(),
      acc.normalBalance.toUpperCase(),
      beg,
      deb,
      cred,
      end
    ]);
  });

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  wsSummary['!cols'] = [
    { wch: 14 },
    { wch: 38 },
    { wch: 16 },
    { wch: 16 },
    { wch: 20 },
    { wch: 18 },
    { wch: 18 },
    { wch: 20 }
  ];
  XLSX.utils.book_append_sheet(wb, wsSummary, 'GL Summary');

  // Sheet 2: Account Detailed Transactions
  const detailsData: any[][] = [
    [company.businessName.toUpperCase()],
    ['GENERAL LEDGER - DETAILED TRANSACTION POSTINGS'],
    [`As of ${new Date().toISOString().slice(0, 10)}`],
    [],
    [
      'Account Code',
      'Account Title',
      'Posting Date',
      'Voucher #',
      'Description / Particulars',
      'Debit (PHP)',
      'Credit (PHP)',
      'Running Balance (PHP)'
    ]
  ];

  accounts.forEach((acc) => {
    const report = ledgerMap.get(acc.id);
    if (!report || report.transactions.length === 0) return;

    report.transactions.forEach((tx) => {
      detailsData.push([
        acc.code,
        acc.name,
        tx.date,
        tx.voucherNumber,
        tx.description,
        tx.debit > 0 ? tx.debit : 0,
        tx.credit > 0 ? tx.credit : 0,
        tx.runningBalance
      ]);
    });
  });

  const wsDetails = XLSX.utils.aoa_to_sheet(detailsData);
  wsDetails['!cols'] = [
    { wch: 14 },
    { wch: 32 },
    { wch: 13 },
    { wch: 16 },
    { wch: 36 },
    { wch: 16 },
    { wch: 16 },
    { wch: 20 }
  ];
  XLSX.utils.book_append_sheet(wb, wsDetails, 'GL Detailed Postings');

  downloadWorkbook(wb, `Calypso_General_Ledger_${company.tin}_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

/**
 * 3. Export BIR Form 2550M / 2550Q (Value-Added Tax Declaration) to Excel
 */
export function exportBIRForm2550ToExcel(
  vatSummary: BIRVATSummary,
  company: CompanyProfile
) {
  const wb = XLSX.utils.book_new();

  const data: any[][] = [
    ['REPUBLIC OF THE PHILIPPINES'],
    ['DEPARTMENT OF FINANCE - BUREAU OF INTERNAL REVENUE'],
    ['BIR FORM NO. 2550M / 2550Q - VALUE-ADDED TAX DECLARATION'],
    [],
    ['PART I: TAXPAYER INFORMATION', '', ''],
    ['1. Taxpayer TIN:', company.tin, ''],
    ['2. RDO Code:', company.rdoCode, ''],
    ['3. Line of Business / PSIC:', company.lineOfBusiness, ''],
    ['4. Registered Name:', company.businessName, ''],
    ['5. Trade Name:', company.tradeName, ''],
    ['6. Registered Address:', company.registeredAddress, ''],
    ['7. Accounting Method:', company.accountingMethod, ''],
    [],
    ['PART II: COMPUTATION OF VAT LIABILITY', 'Taxable Base (PHP)', 'Output / Input Tax (PHP)'],
    ['15. Vatable Sales / Receipts (12% Standard Rate)', vatSummary.taxableSales, vatSummary.outputVat],
    ['16. Zero-Rated Sales / Receipts (0% VAT)', vatSummary.zeroRatedSales, 0],
    ['17. VAT-Exempt Sales / Receipts', vatSummary.vatExemptSales, 0],
    ['19. Total Sales / Receipts and Total Output Tax', vatSummary.totalSales, vatSummary.outputVat],
    [],
    ['LESS: ALLOWABLE INPUT TAX', '', ''],
    ['20. Domestic Purchases of Goods and Services', vatSummary.taxablePurchases, vatSummary.inputVat],
    [],
    ['22. Net VAT Payable / (Excess Input Tax)', '', vatSummary.netVatPayable],
    ['23. Less: Creditable Value-Added Tax Withheld (BIR Form 2307)', '', -vatSummary.creditableWithholdingTaxClaimed],
    [],
    ['24. TOTAL AMOUNT PAYABLE TO BUREAU OF INTERNAL REVENUE', '', vatSummary.finalVatPayable],
    [],
    ['I declare under penalties of perjury that this return has been made in good faith and verified by me.'],
    ['Authorized Signatory:', company.authorizedSignatory, company.signatoryTitle],
    ['Filing Date:', new Date().toISOString().slice(0, 10), '']
  ];

  const ws = XLSX.utils.aoa_to_sheet(data);
  ws['!cols'] = [
    { wch: 56 },
    { wch: 24 },
    { wch: 24 }
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'BIR Form 2550');
  downloadWorkbook(wb, `BIR_Form_2550_${company.tin}_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

/**
 * 4. Export BIR Form 2307 Register to Excel
 */
export function exportBIR2307RegisterToExcel(
  records: BIRForm2307Record[],
  company: CompanyProfile
) {
  const wb = XLSX.utils.book_new();

  const titleRows: any[][] = [
    [company.businessName.toUpperCase()],
    [`BIR TIN: ${company.tin} | RDO: ${company.rdoCode}`],
    ['BIR FORM 2307 REGISTER - CREDITABLE TAX WITHHELD AT SOURCE'],
    [`Generated Date: ${new Date().toISOString().slice(0, 10)} | Total Certificates: ${records.length}`],
    [],
  ];

  const headerRow: any[] = [
    'Document Date',
    'Form 2307 Ref #',
    'Withholding Agent (Payor)',
    'Payor TIN',
    'Payor Registered Address',
    'ATC Code',
    'Nature of Income Payment',
    'Taxable Base Amount (PHP)',
    'EWT Rate %',
    'Tax Withheld Amount (PHP)'
  ];

  let totalTaxBase = 0;
  let totalTaxWithheld = 0;

  const dataRows: any[][] = records.map((rec) => {
    totalTaxBase += rec.taxBaseAmount;
    totalTaxWithheld += rec.taxWithheldAmount;

    return [
      rec.documentDate,
      rec.formRef,
      rec.payorName,
      rec.payorTin,
      rec.payorAddress,
      rec.atcCode,
      rec.natureOfPayment,
      rec.taxBaseAmount,
      rec.taxRatePercent,
      rec.taxWithheldAmount
    ];
  });

  const summaryRow: any[] = [
    'TOTAL TAX CREDITS',
    '',
    '',
    '',
    '',
    '',
    '',
    totalTaxBase,
    '',
    totalTaxWithheld
  ];

  const ws = XLSX.utils.aoa_to_sheet([
    ...titleRows,
    headerRow,
    ...dataRows,
    [],
    summaryRow
  ]);

  ws['!cols'] = [
    { wch: 14 },
    { wch: 18 },
    { wch: 30 },
    { wch: 18 },
    { wch: 35 },
    { wch: 12 },
    { wch: 32 },
    { wch: 22 },
    { wch: 12 },
    { wch: 22 }
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'BIR 2307 Register');
  downloadWorkbook(wb, `BIR_Form_2307_Register_${company.tin}_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

/**
 * 5. Export Trial Balance to Excel
 */
export function exportTrialBalanceToExcel(
  trialBalance: {
    rows: Array<{ account: Account; debit: number; credit: number }>;
    totalDebit: number;
    totalCredit: number;
    isBalanced: boolean;
  },
  company: CompanyProfile
) {
  const wb = XLSX.utils.book_new();

  const data: any[][] = [
    [company.businessName.toUpperCase()],
    [`BIR TIN: ${company.tin} | RDO: ${company.rdoCode}`],
    ['TRIAL BALANCE (DEBIT = CREDIT AUDIT)'],
    [`As of ${new Date().toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' })}`],
    [`Status: ${trialBalance.isBalanced ? 'BALANCED' : 'OUT OF BALANCE'}`],
    [],
    ['Account Code', 'Account Title', 'Classification', 'Normal Balance', 'Debit (PHP)', 'Credit (PHP)']
  ];

  trialBalance.rows.forEach((r) => {
    data.push([
      r.account.code,
      r.account.name,
      r.account.type.toUpperCase(),
      r.account.normalBalance.toUpperCase(),
      r.debit > 0 ? r.debit : 0,
      r.credit > 0 ? r.credit : 0
    ]);
  });

  data.push([]);
  data.push([
    'TOTAL',
    '',
    '',
    '',
    trialBalance.totalDebit,
    trialBalance.totalCredit
  ]);

  const ws = XLSX.utils.aoa_to_sheet(data);
  ws['!cols'] = [
    { wch: 14 },
    { wch: 38 },
    { wch: 18 },
    { wch: 16 },
    { wch: 18 },
    { wch: 18 }
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Trial Balance');
  downloadWorkbook(wb, `Calypso_Trial_Balance_${company.tin}_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

/**
 * 6. Export Income Statement (Profit & Loss) to Excel
 */
export function exportIncomeStatementToExcel(
  incomeStatement: {
    revenueLines: Array<{ name: string; code: string; amount: number }>;
    costLines: Array<{ name: string; code: string; amount: number }>;
    expenseLines: Array<{ name: string; code: string; amount: number }>;
    totalRevenue: number;
    totalCostOfSales: number;
    grossProfit: number;
    totalOperatingExpenses: number;
    netIncome: number;
  },
  company: CompanyProfile
) {
  const wb = XLSX.utils.book_new();

  const data: any[][] = [
    [company.businessName.toUpperCase()],
    [`BIR TIN: ${company.tin} | RDO: ${company.rdoCode}`],
    ['INCOME STATEMENT (STATEMENT OF COMPREHENSIVE INCOME)'],
    [`For the Period Ended ${new Date().toISOString().slice(0, 10)}`],
    [],
    ['Account Code', 'Line Item Description', 'Amount (PHP)', 'Subtotal (PHP)']
  ];

  // REVENUE
  data.push(['', 'REVENUES / GROSS SALES', '', '']);
  incomeStatement.revenueLines.forEach((l) => {
    data.push([l.code, l.name, l.amount, '']);
  });
  data.push(['', 'TOTAL REVENUES', '', incomeStatement.totalRevenue]);
  data.push([]);

  // COST OF SALES
  data.push(['', 'COST OF SALES & SERVICES', '', '']);
  incomeStatement.costLines.forEach((l) => {
    data.push([l.code, l.name, l.amount, '']);
  });
  data.push(['', 'TOTAL COST OF SALES', '', incomeStatement.totalCostOfSales]);
  data.push([]);

  // GROSS PROFIT
  data.push(['', 'GROSS PROFIT', '', incomeStatement.grossProfit]);
  data.push([]);

  // OPERATING EXPENSES
  data.push(['', 'OPERATING EXPENSES (OVERHEAD)', '', '']);
  incomeStatement.expenseLines.forEach((l) => {
    data.push([l.code, l.name, l.amount, '']);
  });
  data.push(['', 'TOTAL OPERATING EXPENSES', '', incomeStatement.totalOperatingExpenses]);
  data.push([]);

  // NET OPERATING INCOME
  data.push(['', 'NET OPERATING INCOME / (LOSS)', '', incomeStatement.netIncome]);

  const ws = XLSX.utils.aoa_to_sheet(data);
  ws['!cols'] = [
    { wch: 14 },
    { wch: 42 },
    { wch: 18 },
    { wch: 22 }
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Income Statement');
  downloadWorkbook(wb, `Calypso_Income_Statement_${company.tin}_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

/**
 * 7. Export Balance Sheet (Financial Position) to Excel
 */
export function exportBalanceSheetToExcel(
  balanceSheet: {
    assetLines: Array<{ name: string; code: string; amount: number }>;
    liabilityLines: Array<{ name: string; code: string; amount: number }>;
    equityLines: Array<{ name: string; code: string; amount: number }>;
    totalAssets: number;
    totalLiabilities: number;
    totalEquity: number;
    currentPeriodNetIncome: number;
    totalEquityAndProfit: number;
    totalLiabilitiesAndEquity: number;
    isBalanced: boolean;
  },
  company: CompanyProfile
) {
  const wb = XLSX.utils.book_new();

  const data: any[][] = [
    [company.businessName.toUpperCase()],
    [`BIR TIN: ${company.tin} | RDO: ${company.rdoCode}`],
    ['BALANCE SHEET (STATEMENT OF FINANCIAL POSITION)'],
    [`As of ${new Date().toISOString().slice(0, 10)}`],
    [`Accounting Status: ${balanceSheet.isBalanced ? 'BALANCED' : 'OUT OF BALANCE'}`],
    [],
    ['Account Code', 'Line Item Description', 'Amount (PHP)', 'Total (PHP)']
  ];

  // ASSETS
  data.push(['', 'ASSETS', '', '']);
  balanceSheet.assetLines.forEach((l) => {
    data.push([l.code, l.name, l.amount, '']);
  });
  data.push(['', 'TOTAL ASSETS', '', balanceSheet.totalAssets]);
  data.push([]);

  // LIABILITIES
  data.push(['', 'LIABILITIES', '', '']);
  balanceSheet.liabilityLines.forEach((l) => {
    data.push([l.code, l.name, l.amount, '']);
  });
  data.push(['', 'TOTAL LIABILITIES', '', balanceSheet.totalLiabilities]);
  data.push([]);

  // EQUITY
  data.push(['', 'STOCKHOLDERS’ EQUITY', '', '']);
  balanceSheet.equityLines.forEach((l) => {
    data.push([l.code, l.name, l.amount, '']);
  });
  data.push(['', 'Current Period Net Income / (Loss)', balanceSheet.currentPeriodNetIncome, '']);
  data.push(['', 'TOTAL STOCKHOLDERS’ EQUITY', '', balanceSheet.totalEquityAndProfit]);
  data.push([]);

  // TOTAL LIABILITIES & EQUITY
  data.push(['', 'TOTAL LIABILITIES AND STOCKHOLDERS’ EQUITY', '', balanceSheet.totalLiabilitiesAndEquity]);

  const ws = XLSX.utils.aoa_to_sheet(data);
  ws['!cols'] = [
    { wch: 14 },
    { wch: 42 },
    { wch: 18 },
    { wch: 22 }
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Balance Sheet');
  downloadWorkbook(wb, `Calypso_Balance_Sheet_${company.tin}_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

/**
 * 8. Export Complete Enterprise Package (All Statements & Ledgers in one multi-sheet Excel file)
 */
export function exportCompletePackageToExcel(
  company: CompanyProfile,
  entries: JournalEntry[],
  accounts: Account[],
  ledgerMap: Map<string, AccountLedgerReport>,
  trialBalance: {
    rows: Array<{ account: Account; debit: number; credit: number }>;
    totalDebit: number;
    totalCredit: number;
    isBalanced: boolean;
  },
  incomeStatement: any,
  balanceSheet: any,
  vatSummary: BIRVATSummary,
  records2307: BIRForm2307Record[]
) {
  const wb = XLSX.utils.book_new();

  // Tab 1: Trial Balance
  const tbData: any[][] = [
    [company.businessName.toUpperCase()],
    ['TRIAL BALANCE'],
    [`Date: ${new Date().toISOString().slice(0, 10)}`],
    [],
    ['Account Code', 'Account Title', 'Classification', 'Debit (PHP)', 'Credit (PHP)']
  ];
  trialBalance.rows.forEach((r) => {
    tbData.push([r.account.code, r.account.name, r.account.type.toUpperCase(), r.debit, r.credit]);
  });
  tbData.push([], ['TOTAL', '', '', trialBalance.totalDebit, trialBalance.totalCredit]);
  const wsTB = XLSX.utils.aoa_to_sheet(tbData);
  XLSX.utils.book_append_sheet(wb, wsTB, 'Trial Balance');

  // Tab 2: Income Statement
  const isData: any[][] = [
    [company.businessName.toUpperCase()],
    ['INCOME STATEMENT'],
    [],
    ['REVENUES', '', incomeStatement.totalRevenue],
    ['COST OF SALES', '', incomeStatement.totalCostOfSales],
    ['GROSS PROFIT', '', incomeStatement.grossProfit],
    ['OPERATING EXPENSES', '', incomeStatement.totalOperatingExpenses],
    ['NET INCOME', '', incomeStatement.netIncome]
  ];
  const wsIS = XLSX.utils.aoa_to_sheet(isData);
  XLSX.utils.book_append_sheet(wb, wsIS, 'Income Statement');

  // Tab 3: Balance Sheet
  const bsData: any[][] = [
    [company.businessName.toUpperCase()],
    ['BALANCE SHEET'],
    [],
    ['TOTAL ASSETS', '', balanceSheet.totalAssets],
    ['TOTAL LIABILITIES', '', balanceSheet.totalLiabilities],
    ['TOTAL EQUITY & PROFIT', '', balanceSheet.totalEquityAndProfit],
    ['TOTAL LIABILITIES & EQUITY', '', balanceSheet.totalLiabilitiesAndEquity]
  ];
  const wsBS = XLSX.utils.aoa_to_sheet(bsData);
  XLSX.utils.book_append_sheet(wb, wsBS, 'Balance Sheet');

  // Tab 4: BIR 2550 VAT
  const vatData: any[][] = [
    [company.businessName.toUpperCase()],
    ['BIR FORM 2550 VAT RETURN SUMMARY'],
    [],
    ['Vatable Sales', vatSummary.taxableSales],
    ['Output VAT (12%)', vatSummary.outputVat],
    ['Domestic Purchases', vatSummary.taxablePurchases],
    ['Input VAT (12%)', vatSummary.inputVat],
    ['Net VAT Payable', vatSummary.netVatPayable],
    ['Creditable Withholding (Form 2307)', -vatSummary.creditableWithholdingTaxClaimed],
    ['Final VAT Payable to BIR', vatSummary.finalVatPayable]
  ];
  const wsVAT = XLSX.utils.aoa_to_sheet(vatData);
  XLSX.utils.book_append_sheet(wb, wsVAT, 'BIR 2550 VAT');

  // Tab 5: Form 2307
  const certData: any[][] = [
    [company.businessName.toUpperCase()],
    ['BIR FORM 2307 CERTIFICATES'],
    [],
    ['Date', 'Form Ref', 'Payor Name', 'Payor TIN', 'ATC', 'Base (PHP)', 'Rate %', 'Tax Withheld (PHP)']
  ];
  records2307.forEach((r) => {
    certData.push([r.documentDate, r.formRef, r.payorName, r.payorTin, r.atcCode, r.taxBaseAmount, r.taxRatePercent, r.taxWithheldAmount]);
  });
  const ws2307 = XLSX.utils.aoa_to_sheet(certData);
  XLSX.utils.book_append_sheet(wb, ws2307, 'Form 2307 Certificates');

  downloadWorkbook(wb, `Calypso_Complete_Financial_Package_${company.tin}_${new Date().toISOString().slice(0, 10)}.xlsx`);
}
