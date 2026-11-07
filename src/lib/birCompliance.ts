import { JournalEntry, Account, CompanyProfile } from '../types/ledger';

export interface BIRVATSummary {
  taxableSales: number;
  vatExemptSales: number;
  zeroRatedSales: number;
  totalSales: number;
  outputVat: number;
  taxablePurchases: number;
  inputVat: number;
  netVatPayable: number;
  creditableWithholdingTaxClaimed: number; // BIR 2307
  finalVatPayable: number;
}

export interface BIRForm2307Record {
  period: string; // e.g., "2026-Q4" or "2026-10"
  documentDate: string;
  payorName: string;
  payorTin: string;
  payorAddress: string;
  natureOfPayment: string;
  atcCode: string;
  taxBaseAmount: number;
  taxRatePercent: number;
  taxWithheldAmount: number;
  formRef: string;
}

export function computeBIRVATSummary(entries: JournalEntry[]): BIRVATSummary {
  let taxableSales = 0;
  let vatExemptSales = 0;
  let zeroRatedSales = 0;
  let outputVat = 0;
  let taxablePurchases = 0;
  let inputVat = 0;
  let creditableWithholdingTaxClaimed = 0;

  for (const entry of entries) {
    if (!entry.isPosted || entry.isReversed) continue;

    // Inspect lines for standard tax accounts
    for (const line of entry.lines) {
      // Output VAT (Code 2020)
      if (line.accountCode === '2020') {
        outputVat += (line.credit - line.debit);
      }
      // Input VAT (Code 1050)
      if (line.accountCode === '1050') {
        inputVat += (line.debit - line.credit);
      }
      // Creditable Withholding Tax (Code 1040)
      if (line.accountCode === '1040') {
        creditableWithholdingTaxClaimed += (line.debit - line.credit);
      }

      // Revenue breakdown
      if (line.accountCode === '4010' || line.accountCode === '4020') {
        taxableSales += (line.credit - line.debit);
      } else if (line.accountCode === '4030') {
        vatExemptSales += (line.credit - line.debit);
      } else if (line.accountCode === '4040') {
        zeroRatedSales += (line.credit - line.debit);
      }

      // Purchases with input tax
      if (line.accountCode.startsWith('50') || line.accountCode.startsWith('60') || line.accountCode.startsWith('15')) {
        if (entry.birMetadata && entry.birMetadata.taxType === 'VAT_12' && line.debit > 0) {
          taxablePurchases += line.debit;
        }
      }
    }
  }

  const totalSales = taxableSales + vatExemptSales + zeroRatedSales;
  const netVatPayable = Math.max(0, outputVat - inputVat);
  const finalVatPayable = Math.max(0, netVatPayable - creditableWithholdingTaxClaimed);

  return {
    taxableSales,
    vatExemptSales,
    zeroRatedSales,
    totalSales,
    outputVat,
    taxablePurchases,
    inputVat,
    netVatPayable,
    creditableWithholdingTaxClaimed,
    finalVatPayable,
  };
}

export function extractBIR2307Records(entries: JournalEntry[]): BIRForm2307Record[] {
  const records: BIRForm2307Record[] = [];

  for (const entry of entries) {
    if (!entry.isPosted || entry.isReversed) continue;
    if (!entry.birMetadata) continue;

    const { ewtRate, ewtAmount, netAmount, entityName, entityTin, entityAddress, atcCode, form2307Ref } = entry.birMetadata;
    if (ewtAmount > 0) {
      records.push({
        period: entry.date.substring(0, 7), // YYYY-MM
        documentDate: entry.date,
        payorName: entityName || 'Various Payors',
        payorTin: entityTin || '000-000-000-000',
        payorAddress: entityAddress || 'Metro Manila, Philippines',
        natureOfPayment: getAtcDescription(atcCode || 'WC158'),
        atcCode: atcCode || 'WC158',
        taxBaseAmount: netAmount,
        taxRatePercent: Math.round(ewtRate * 100),
        taxWithheldAmount: ewtAmount,
        formRef: form2307Ref || `2307-${entry.voucherNumber}`,
      });
    }
  }

  return records;
}

export function getAtcDescription(atcCode: string): string {
  switch (atcCode) {
    case 'WC158':
      return 'Income Payments to Certain Contractors & Technical Services (2%)';
    case 'WC100':
      return 'Payments made by Top Withholding Agents to Regular Suppliers of Goods (1%)';
    case 'WI100':
      return 'Gross Rentals on Real Property / Commercial Lease (5%)';
    case 'WI010':
      return 'Professional Fees (Lawyers, CPAs, Engineers, Doctors) - Individual (5% / 10%)';
    case 'WI020':
      return 'Professional Fees - Corporate / Juridical (10% / 15%)';
    case 'WC160':
      return 'Payments to Subcontractors (2%)';
    default:
      return 'Expanded Withholding Tax - General Service or Goods';
  }
}

// Generate BIR-compliant General Journal Export (RR 9-2009 / RR 11-2004 format)
export function generateBIRGeneralJournalText(
  entries: JournalEntry[],
  company: CompanyProfile,
  startDate?: string,
  endDate?: string
): string {
  const filtered = entries.filter((e) => {
    if (startDate && e.date < startDate) return false;
    if (endDate && e.date > endDate) return false;
    return true;
  });

  let out = '';
  out += '========================================================================================\r\n';
  out += `BUREAU OF INTERNAL REVENUE - GENERAL JOURNAL (OFFICIAL BOOK OF ACCOUNTS)\r\n`;
  out += `Taxpayer Name      : ${company.businessName}\r\n`;
  out += `Trade Name         : ${company.tradeName}\r\n`;
  out += `TIN                : ${company.tin} | RDO: ${company.rdoCode}\r\n`;
  out += `Registered Address : ${company.registeredAddress}\r\n`;
  out += `BIR Reg / CAS #    : ${company.casPermitNumber || company.birRegistrationNumber}\r\n`;
  out += `Period Covered     : ${startDate || 'All Time'} to ${endDate || 'Current'}\r\n`;
  out += '========================================================================================\r\n\r\n';
  out += 'DATE       | VOUCHER #     | ACCT CODE | ACCOUNT TITLE                          | DEBIT (PHP)    | CREDIT (PHP)   | REF / DOC #\r\n';
  out += '----------------------------------------------------------------------------------------------------------------\r\n';

  let totalDebit = 0;
  let totalCredit = 0;

  for (const entry of filtered) {
    const docRef = entry.birMetadata ? `${entry.birMetadata.documentType} ${entry.birMetadata.documentNumber}` : '-';
    out += `${entry.date} | ${entry.voucherNumber.padEnd(13)} | ${entry.description.substring(0, 50)}\r\n`;

    for (const line of entry.lines) {
      totalDebit += line.debit;
      totalCredit += line.credit;
      const debitStr = line.debit > 0 ? line.debit.toLocaleString('en-PH', { minimumFractionDigits: 2 }) : '';
      const creditStr = line.credit > 0 ? line.credit.toLocaleString('en-PH', { minimumFractionDigits: 2 }) : '';

      out += `           |               | ${line.accountCode.padEnd(9)} | ${line.accountName.padEnd(38)} | ${debitStr.padStart(14)} | ${creditStr.padStart(14)} | ${docRef}\r\n`;
    }
    out += '----------------------------------------------------------------------------------------------------------------\r\n';
  }

  out += `TOTAL                                                                   | ${totalDebit.toLocaleString('en-PH', { minimumFractionDigits: 2 }).padStart(14)} | ${totalCredit.toLocaleString('en-PH', { minimumFractionDigits: 2 }).padStart(14)} |\r\n`;
  out += '========================================================================================\r\n';
  out += `Certified Correct by: ${company.authorizedSignatory} (${company.signatoryTitle})\r\n`;

  return out;
}

// Generate BIR-compliant General Ledger calculation per account
export interface AccountLedgerReport {
  account: Account;
  beginningBalance: number;
  totalDebits: number;
  totalCredits: number;
  endingBalance: number;
  transactions: {
    date: string;
    voucherNumber: string;
    description: string;
    docRef: string;
    debit: number;
    credit: number;
    runningBalance: number;
  }[];
}

export function computeGeneralLedgerByAccount(
  accounts: Account[],
  entries: JournalEntry[]
): Map<string, AccountLedgerReport> {
  const map = new Map<string, AccountLedgerReport>();

  for (const acc of accounts) {
    map.set(acc.id, {
      account: acc,
      beginningBalance: 0,
      totalDebits: 0,
      totalCredits: 0,
      endingBalance: 0,
      transactions: [],
    });
  }

  // Sort entries chronologically
  const sortedEntries = [...entries].sort((a, b) => a.date.localeCompare(b.date));

  for (const entry of sortedEntries) {
    if (!entry.isPosted || entry.isReversed) continue;
    const docRef = entry.birMetadata ? `${entry.birMetadata.documentType} ${entry.birMetadata.documentNumber}` : entry.voucherNumber;

    for (const line of entry.lines) {
      let report = map.get(line.accountId);
      if (!report) {
        // Find by code fallback
        const found = accounts.find((a) => a.code === line.accountCode);
        if (found) {
          report = map.get(found.id);
        }
      }
      if (!report) continue;

      report.totalDebits += line.debit;
      report.totalCredits += line.credit;

      const isDebitNormal = report.account.normalBalance === 'debit';
      const delta = isDebitNormal ? (line.debit - line.credit) : (line.credit - line.debit);
      const prevBal = report.transactions.length > 0
        ? report.transactions[report.transactions.length - 1].runningBalance
        : report.beginningBalance;

      report.transactions.push({
        date: entry.date,
        voucherNumber: entry.voucherNumber,
        description: line.memo || entry.description,
        docRef,
        debit: line.debit,
        credit: line.credit,
        runningBalance: prevBal + delta,
      });

      report.endingBalance = prevBal + delta;
    }
  }

  return map;
}

export function formatPHP(amount: number): string {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
