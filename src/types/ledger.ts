export type AccountType = 'asset' | 'liability' | 'equity' | 'revenue' | 'cost_of_sales' | 'expense';

export interface Account {
  id: string;
  code: string; // e.g. "1010", "4010"
  name: string;
  type: AccountType;
  description?: string;
  normalBalance: 'debit' | 'credit';
  isBirStandard?: boolean;
}

export type BIRTaxType = 'VAT_12' | 'VAT_EXEMPT' | 'VAT_ZERO_RATED' | 'NON_VAT';

export type BIRWithholdingTaxRate = 0 | 0.01 | 0.02 | 0.05 | 0.10 | 0.15; // 0%, 1% (goods), 2% (services), 5% (rent), 10%/15% (prof fees)

export interface BIRMetadata {
  documentType: 'Sales Invoice' | 'Official Receipt' | 'Billing Statement' | 'Disbursement Voucher' | 'Journal Voucher' | 'Collection Receipt';
  documentNumber: string; // SI #, OR #, CV #, etc.
  entityName: string; // Customer or Vendor Name
  entityTin: string; // e.g. "123-456-789-000"
  entityAddress?: string;
  taxType: BIRTaxType;
  netAmount: number; // Base amount before VAT
  vatAmount: number; // 12% Output or Input VAT
  ewtRate: BIRWithholdingTaxRate;
  ewtAmount: number; // Form 2307 Creditable Withholding Tax
  atcCode?: string; // BIR Alphanumeric Tax Code (e.g. WI010, WC100, WC158)
  form2307Ref?: string;
}

export interface JournalLine {
  id: string;
  accountId: string;
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
  memo?: string;
}

export interface JournalEntry {
  id: string;
  voucherNumber: string; // e.g. "JV-2026-0001", "CRV-2026-0001", "CDV-2026-0001"
  date: string; // YYYY-MM-DD
  description: string;
  lines: JournalLine[];
  birMetadata?: BIRMetadata;
  bookType: 'GENERAL_JOURNAL' | 'CASH_RECEIPTS' | 'CASH_DISBURSEMENTS';
  isPosted: boolean;
  isReversed?: boolean;
  reversalOfId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CompanyProfile {
  businessName: string;
  tradeName: string;
  tin: string; // Format: 000-000-000-000
  rdoCode: string; // Revenue District Office, e.g. "044"
  registeredAddress: string;
  lineOfBusiness: string;
  taxpayerType: 'VAT' | 'NON_VAT';
  accountingMethod: 'ACCRUAL' | 'CASH';
  fiscalYearEnd: string; // e.g. "December 31"
  birRegistrationNumber: string; // BIR 2303 Certificate of Registration #
  casPermitNumber?: string; // Computerized Accounting System Permit or Loose-Leaf
  authorizedSignatory: string;
  signatoryTitle: string;
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  isConnected: boolean;
  tableName: string;
  autoSync: boolean;
  lastSyncedAt?: string;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'Lead CPA / Controller' | 'Senior Bookkeeper' | 'Staff Accountant' | 'BIR Examiner / Auditor';
  accessLevel: 'admin' | 'editor' | 'viewer';
  lastActive: string;
  status: 'active' | 'inactive';
}
