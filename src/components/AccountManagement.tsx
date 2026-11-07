import React, { useState, useMemo } from 'react';
import { 
  Building2, 
  FolderPlus, 
  FileSpreadsheet, 
  Search, 
  Filter, 
  Plus, 
  Edit3, 
  Trash2, 
  Users, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  Sliders, 
  Lock, 
  UserCheck, 
  Building,
  CreditCard,
  Layers,
  ArrowUpDown,
  BookOpen,
  X,
} from 'lucide-react';
import { Account, AccountType, CompanyProfile, JournalEntry, TeamMember } from '../types/ledger';
import { computeGeneralLedgerByAccount, formatPHP } from '../lib/birCompliance';
import { exportChartOfAccountsToExcel } from '../lib/excelExport';

interface AccountManagementProps {
  accounts: Account[];
  onUpdateAccounts: (accounts: Account[]) => void;
  entries: JournalEntry[];
  company: CompanyProfile;
  onOpenCompanyModal: () => void;
}

const DEFAULT_TEAM_MEMBERS: TeamMember[] = [
  {
    id: 'user-1',
    name: 'Maria Clarissa Santos, CPA',
    email: 'm.santos@apexcloud.ph',
    role: 'Lead CPA / Controller',
    accessLevel: 'admin',
    lastActive: 'Active now',
    status: 'active'
  },
  {
    id: 'user-2',
    name: 'Eduardo Reyes',
    email: 'e.reyes@apexcloud.ph',
    role: 'Senior Bookkeeper',
    accessLevel: 'editor',
    lastActive: '2 hours ago',
    status: 'active'
  },
  {
    id: 'user-3',
    name: 'Atty. Victorina Ramos',
    email: 'v.ramos@bir-audit.gov.ph',
    role: 'BIR Examiner / Auditor',
    accessLevel: 'viewer',
    lastActive: 'Yesterday',
    status: 'active'
  }
];

export const AccountManagement: React.FC<AccountManagementProps> = ({
  accounts,
  onUpdateAccounts,
  entries,
  company,
  onOpenCompanyModal,
}) => {
  const [activeTab, setActiveTab] = useState<'coa' | 'team'>('coa');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('all');

  // Chart of Accounts Modal States
  const [isAddAccountModalOpen, setIsAddAccountModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);

  // Form state for creating / editing account
  const [accountCode, setAccountCode] = useState('');
  const [accountName, setAccountName] = useState('');
  const [accountType, setAccountType] = useState<AccountType>('expense');
  const [normalBalance, setNormalBalance] = useState<'debit' | 'credit'>('debit');
  const [accountDescription, setAccountDescription] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Team management state
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(() => {
    try {
      const stored = localStorage.getItem('calypso_team_members_v1');
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.warn('Error reading stored team members:', e);
    }
    return DEFAULT_TEAM_MEMBERS;
  });

  const [isAddTeamModalOpen, setIsAddTeamModalOpen] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<TeamMember['role']>('Staff Accountant');
  const [newUserAccess, setNewUserAccess] = useState<TeamMember['accessLevel']>('editor');

  // Compute ending balances for all accounts
  const ledgerMap = useMemo(() => {
    return computeGeneralLedgerByAccount(accounts, entries);
  }, [accounts, entries]);

  // Statistics
  const stats = useMemo(() => {
    const assets = accounts.filter(a => a.type === 'asset').length;
    const liabilities = accounts.filter(a => a.type === 'liability').length;
    const equity = accounts.filter(a => a.type === 'equity').length;
    const revenue = accounts.filter(a => a.type === 'revenue').length;
    const costOfSales = accounts.filter(a => a.type === 'cost_of_sales').length;
    const expenses = accounts.filter(a => a.type === 'expense').length;
    return { total: accounts.length, assets, liabilities, equity, revenue, costOfSales, expenses };
  }, [accounts]);

  // Filtered accounts
  const filteredAccounts = useMemo(() => {
    return accounts.filter((acc) => {
      const matchesSearch = 
        acc.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        acc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (acc.description && acc.description.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesType = 
        selectedTypeFilter === 'all' || acc.type === selectedTypeFilter;

      return matchesSearch && matchesType;
    });
  }, [accounts, searchQuery, selectedTypeFilter]);

  // Suggest default normal balance based on account type
  const handleTypeChange = (type: AccountType) => {
    setAccountType(type);
    if (type === 'asset' || type === 'cost_of_sales' || type === 'expense') {
      setNormalBalance('debit');
    } else {
      setNormalBalance('credit');
    }

    // Suggest default code prefix
    if (!accountCode || ['1', '2', '3', '4', '5', '6'].includes(accountCode[0])) {
      const prefixMap: Record<AccountType, string> = {
        asset: '1090',
        liability: '2090',
        equity: '3090',
        revenue: '4090',
        cost_of_sales: '5090',
        expense: '6090'
      };
      setAccountCode(prefixMap[type]);
    }
  };

  const handleOpenAddModal = () => {
    setEditingAccount(null);
    setAccountCode('6090');
    setAccountName('');
    setAccountType('expense');
    setNormalBalance('debit');
    setAccountDescription('');
    setFormError(null);
    setIsAddAccountModalOpen(true);
  };

  const handleOpenEditModal = (acc: Account) => {
    setEditingAccount(acc);
    setAccountCode(acc.code);
    setAccountName(acc.name);
    setAccountType(acc.type);
    setNormalBalance(acc.normalBalance);
    setAccountDescription(acc.description || '');
    setFormError(null);
    setIsAddAccountModalOpen(true);
  };

  const handleSaveAccount = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const trimmedCode = accountCode.trim();
    const trimmedName = accountName.trim();

    if (!trimmedCode || !trimmedName) {
      setFormError('Account code and account name are required.');
      return;
    }

    // Check duplicate code
    const isDuplicate = accounts.some(
      a => a.code === trimmedCode && (!editingAccount || a.id !== editingAccount.id)
    );
    if (isDuplicate) {
      setFormError(`An account with code "${trimmedCode}" already exists.`);
      return;
    }

    if (editingAccount) {
      // Update existing
      const updated = accounts.map(a => {
        if (a.id === editingAccount.id) {
          return {
            ...a,
            code: trimmedCode,
            name: trimmedName,
            type: accountType,
            normalBalance,
            description: accountDescription.trim() || undefined,
          };
        }
        return a;
      });
      onUpdateAccounts(updated);
    } else {
      // Create new
      const newAcc: Account = {
        id: `acc-${Date.now()}`,
        code: trimmedCode,
        name: trimmedName,
        type: accountType,
        normalBalance,
        description: accountDescription.trim() || undefined,
        isBirStandard: false,
      };
      onUpdateAccounts([...accounts, newAcc].sort((a, b) => a.code.localeCompare(b.code)));
    }

    setIsAddAccountModalOpen(false);
  };

  const handleDeleteAccount = (acc: Account) => {
    // Check if account has any transactions in entries
    const hasTransactions = entries.some(entry =>
      entry.lines.some(l => l.accountId === acc.id || l.accountCode === acc.code)
    );

    if (hasTransactions) {
      alert(`Cannot delete account "${acc.code} - ${acc.name}" because it contains posted entries in the BIR General Ledger. To protect audit integrity, accounts with transaction history cannot be deleted.`);
      return;
    }

    if (acc.isBirStandard) {
      if (!window.confirm(`"${acc.name}" is a standard BIR Chart of Accounts line. Are you sure you want to remove it?`)) {
        return;
      }
    } else {
      if (!window.confirm(`Delete account "${acc.code} - ${acc.name}"?`)) {
        return;
      }
    }

    const updated = accounts.filter(a => a.id !== acc.id);
    onUpdateAccounts(updated);
  };

  const handleExportExcel = () => {
    exportChartOfAccountsToExcel(accounts, ledgerMap, company);
  };

  // Team Member Functions
  const handleSaveTeamMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserEmail.trim()) return;

    const newMember: TeamMember = {
      id: `user-${Date.now()}`,
      name: newUserName.trim(),
      email: newUserEmail.trim(),
      role: newUserRole,
      accessLevel: newUserAccess,
      lastActive: 'Just added',
      status: 'active'
    };

    const updated = [...teamMembers, newMember];
    setTeamMembers(updated);
    try {
      localStorage.setItem('calypso_team_members_v1', JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to persist team member:', e);
    }

    setNewUserName('');
    setNewUserEmail('');
    setIsAddTeamModalOpen(false);
  };

  const handleDeleteTeamMember = (id: string) => {
    if (!window.confirm('Remove this authorized user from Calypso?')) return;
    const updated = teamMembers.filter(m => m.id !== id);
    setTeamMembers(updated);
    try {
      localStorage.setItem('calypso_team_members_v1', JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to persist team member:', e);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Company Profile & Account Header Command Plate */}
      <div className="spatial-glass rounded-3xl p-5 sm:p-6 border border-zinc-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="space-y-1.5">
          <div className="flex items-center space-x-2">
            <span className="font-extrabold text-xl tracking-tight text-zinc-900">
              Account & Profile Management
            </span>
            <span className="px-2.5 py-0.5 text-[10px] font-semibold bg-zinc-100 text-zinc-700 border border-zinc-200 rounded-md font-mono">
              CAS COMPLIANT
            </span>
          </div>
          <p className="text-xs text-zinc-500 max-w-2xl leading-relaxed">
            Manage your BIR-certified General Ledger Chart of Accounts (COA), authorized accountant access credentials, and live taxpayer registration data.
          </p>
        </div>

        <div className="flex items-center space-x-2.5 flex-wrap">
          <button
            onClick={onOpenCompanyModal}
            className="spatial-button-primary px-3.5 py-2 text-xs font-semibold rounded-xl flex items-center space-x-1.5"
            title="Edit Registered Company Profile & BIR Tax Details"
          >
            <Sliders className="w-3.5 h-3.5 text-zinc-300" />
            <span>Edit Company Profile</span>
          </button>

          <button
            onClick={handleExportExcel}
            className="spatial-button-secondary px-3.5 py-2 text-xs font-semibold rounded-xl text-zinc-800 flex items-center space-x-1.5"
            title="Download Chart of Accounts Masterlist to Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-zinc-600" />
            <span>Export COA (.xlsx)</span>
          </button>
        </div>
      </div>

      {/* Taxpayer Entity Quick Plate */}
      <div className="spatial-card rounded-2xl p-4 border border-zinc-200/80 bg-white/70 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center space-x-3.5">
          <div className="w-10 h-10 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white shrink-0 shadow-xs">
            <Building className="w-5 h-5 text-zinc-100" />
          </div>
          <div>
            <div className="flex items-center space-x-2 flex-wrap">
              <h3 className="font-bold text-sm text-zinc-900">
                {company.businessName}
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded-md font-mono font-semibold bg-zinc-100 border border-zinc-200 text-zinc-700">
                TIN: {company.tin}
              </span>
            </div>
            <p className="text-xs text-zinc-500 mt-0.5">
              RDO {company.rdoCode} &bull; {company.taxpayerType === 'VAT' ? '12% VAT Registered' : 'Non-VAT 3% PT'} &bull; CAS: {company.casPermitNumber || 'Standard'} &bull; Signatory: {company.authorizedSignatory}
            </p>
          </div>
        </div>

        <button
          onClick={onOpenCompanyModal}
          className="text-xs text-zinc-900 hover:text-black font-semibold flex items-center space-x-1 underline shrink-0"
        >
          <Edit3 className="w-3 h-3" />
          <span>Update Company Info</span>
        </button>
      </div>

      {/* Segmented Mode Switcher: Chart of Accounts vs Team Members */}
      <div className="flex p-1 bg-zinc-100/90 rounded-2xl border border-zinc-200/80 space-x-1 max-w-md">
        <button
          type="button"
          onClick={() => setActiveTab('coa')}
          className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all flex items-center justify-center space-x-1.5 ${
            activeTab === 'coa'
              ? 'bg-white text-zinc-950 font-bold shadow-xs border border-zinc-200/70'
              : 'text-zinc-600 hover:text-zinc-900'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Chart of Accounts ({accounts.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('team')}
          className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all flex items-center justify-center space-x-1.5 ${
            activeTab === 'team'
              ? 'bg-white text-zinc-950 font-bold shadow-xs border border-zinc-200/70'
              : 'text-zinc-600 hover:text-zinc-900'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Accountant & Team Roles ({teamMembers.length})</span>
        </button>
      </div>

      {/* TAB 1: CHART OF ACCOUNTS */}
      {activeTab === 'coa' && (
        <div className="space-y-5">
          {/* Summary Metric Tiles */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="spatial-card rounded-2xl p-3.5 bg-white/70 border border-zinc-200/80 shadow-xs">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">1. Assets</span>
              <div className="text-xl font-black text-zinc-900 mt-1 font-mono">{stats.assets}</div>
              <span className="text-[10px] text-zinc-500">Debit Normal</span>
            </div>

            <div className="spatial-card rounded-2xl p-3.5 bg-white/70 border border-zinc-200/80 shadow-xs">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">2. Liabilities</span>
              <div className="text-xl font-black text-zinc-900 mt-1 font-mono">{stats.liabilities}</div>
              <span className="text-[10px] text-zinc-500">Credit Normal</span>
            </div>

            <div className="spatial-card rounded-2xl p-3.5 bg-white/70 border border-zinc-200/80 shadow-xs">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">3. Equity</span>
              <div className="text-xl font-black text-zinc-900 mt-1 font-mono">{stats.equity}</div>
              <span className="text-[10px] text-zinc-500">Credit Normal</span>
            </div>

            <div className="spatial-card rounded-2xl p-3.5 bg-white/70 border border-zinc-200/80 shadow-xs">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">4. Revenue</span>
              <div className="text-xl font-black text-zinc-900 mt-1 font-mono">{stats.revenue}</div>
              <span className="text-[10px] text-zinc-500">Credit Normal</span>
            </div>

            <div className="spatial-card rounded-2xl p-3.5 bg-white/70 border border-zinc-200/80 shadow-xs">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">5. Cost of Sales</span>
              <div className="text-xl font-black text-zinc-900 mt-1 font-mono">{stats.costOfSales}</div>
              <span className="text-[10px] text-zinc-500">Debit Normal</span>
            </div>

            <div className="spatial-card rounded-2xl p-3.5 bg-white/70 border border-zinc-200/80 shadow-xs">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">6. Expenses</span>
              <div className="text-xl font-black text-zinc-900 mt-1 font-mono">{stats.expenses}</div>
              <span className="text-[10px] text-zinc-500">Debit Normal</span>
            </div>
          </div>

          {/* Search, Filter & Add Button Bar */}
          <div className="spatial-glass rounded-2xl p-3 sm:p-4 border border-zinc-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-2 flex-1 max-w-md">
              <div className="relative w-full">
                <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by code (e.g. 1020), account title, or keyword..."
                  className="spatial-input w-full pl-8 pr-3 py-1.5 text-xs rounded-xl"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2 flex-wrap">
              <div className="flex items-center space-x-1 text-xs">
                <Filter className="w-3 h-3 text-zinc-400" />
                <select
                  value={selectedTypeFilter}
                  onChange={(e) => setSelectedTypeFilter(e.target.value)}
                  className="spatial-input py-1 px-2.5 rounded-xl text-xs text-zinc-800"
                >
                  <option value="all">All Categories ({accounts.length})</option>
                  <option value="asset">Assets (1xxx)</option>
                  <option value="liability">Liabilities (2xxx)</option>
                  <option value="equity">Equity (3xxx)</option>
                  <option value="revenue">Revenues (4xxx)</option>
                  <option value="cost_of_sales">Cost of Sales (5xxx)</option>
                  <option value="expense">Operating Expenses (6xxx)</option>
                </select>
              </div>

              <button
                onClick={handleOpenAddModal}
                className="spatial-button-primary px-3.5 py-1.5 text-xs font-semibold rounded-xl flex items-center space-x-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add GL Account</span>
              </button>
            </div>
          </div>

          {/* Accounts Interactive Table */}
          <div className="spatial-elevated rounded-3xl overflow-hidden border border-zinc-200/80 shadow-md">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-zinc-200 bg-zinc-50/90 text-zinc-700 font-semibold">
                    <th className="py-3 px-4">Account Code</th>
                    <th className="py-3 px-4">Account Title / Name</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4 text-center">Normal Balance</th>
                    <th className="py-3 px-4 text-right">Real-Time Ending Balance</th>
                    <th className="py-3 px-4 text-center">BIR Classification</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 bg-white/70">
                  {filteredAccounts.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-zinc-400 italic">
                        No accounts match your query "{searchQuery}".
                      </td>
                    </tr>
                  ) : (
                    filteredAccounts.map((acc) => {
                      const rep = ledgerMap.get(acc.id);
                      const balance = rep?.endingBalance || 0;
                      return (
                        <tr key={acc.id} className="hover:bg-zinc-50/80 transition text-zinc-800">
                          <td className="py-3 px-4 font-mono font-bold text-zinc-900">
                            {acc.code}
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-semibold text-zinc-900 block">{acc.name}</span>
                            {acc.description && (
                              <span className="text-[10px] text-zinc-500 block truncate max-w-xs">{acc.description}</span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-zinc-100 text-zinc-700 border border-zinc-200 uppercase">
                              {acc.type.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center font-mono uppercase text-[11px] font-medium text-zinc-600">
                            {acc.normalBalance}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold tabular-nums text-zinc-900">
                            {formatPHP(balance)}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {acc.isBirStandard ? (
                              <span className="inline-flex items-center space-x-1 text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>BIR Standard</span>
                              </span>
                            ) : (
                              <span className="text-[10px] font-medium text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded-md border border-zinc-200">
                                Custom Enterprise
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center space-x-1.5">
                              <button
                                onClick={() => handleOpenEditModal(acc)}
                                title="Edit Account"
                                className="p-1 rounded-lg text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 transition"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteAccount(acc)}
                                title="Delete Account"
                                className="p-1 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 transition"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: USER ACCOUNTS & TEAM ROLES */}
      {activeTab === 'team' && (
        <div className="space-y-5">
          <div className="spatial-glass rounded-2xl p-4 border border-zinc-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-sm text-zinc-900">
                Authorized Personnel & Accountant Access
              </h3>
              <p className="text-xs text-zinc-500">
                Manage roles and permission levels for staff accountants, bookkeepers, and external BIR audit examiners.
              </p>
            </div>

            <button
              onClick={() => setIsAddTeamModalOpen(true)}
              className="spatial-button-primary px-3.5 py-1.5 text-xs font-semibold rounded-xl flex items-center space-x-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Personnel Account</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {teamMembers.map((member) => (
              <div key={member.id} className="spatial-card rounded-2xl p-4 bg-white/80 border border-zinc-200/80 shadow-xs space-y-3 relative">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-xl bg-zinc-900 border border-zinc-800 text-white flex items-center justify-center font-bold text-xs font-mono">
                      {member.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-zinc-900">{member.name}</h4>
                      <p className="text-[10px] text-zinc-500 font-mono">{member.email}</p>
                    </div>
                  </div>
                  {member.accessLevel !== 'admin' && (
                    <button
                      onClick={() => handleDeleteTeamMember(member.id)}
                      className="text-zinc-300 hover:text-rose-600 transition p-1"
                      title="Remove Account"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="pt-2 border-t border-zinc-100 flex items-center justify-between text-[11px]">
                  <div>
                    <span className="text-[10px] text-zinc-400 block uppercase font-medium">Designation:</span>
                    <span className="font-semibold text-zinc-800">{member.role}</span>
                  </div>

                  <span className={`px-2 py-0.5 rounded-md font-semibold text-[10px] uppercase ${
                    member.accessLevel === 'admin'
                      ? 'bg-zinc-900 text-white'
                      : member.accessLevel === 'editor'
                      ? 'bg-zinc-100 text-zinc-800 border border-zinc-200'
                      : 'bg-zinc-100 text-zinc-600 border border-zinc-200'
                  }`}>
                    {member.accessLevel}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[10px] text-zinc-400 pt-1">
                  <span>Status: <strong className="text-emerald-700">{member.status}</strong></span>
                  <span>{member.lastActive}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal: Add / Edit GL Account */}
      {isAddAccountModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/45 backdrop-blur-md p-4 overflow-y-auto">
          <div className="spatial-elevated rounded-3xl max-w-lg w-full shadow-2xl p-6 space-y-4 my-8 text-zinc-800 border border-zinc-200/90 ring-1 ring-zinc-900/5">
            <div className="flex items-center justify-between border-b border-zinc-200/80 pb-3">
              <h3 className="font-bold text-base text-zinc-900 flex items-center gap-2">
                <FolderPlus className="w-5 h-5 text-zinc-900" />
                <span>{editingAccount ? 'Edit General Ledger Account' : 'Add New General Ledger Account'}</span>
              </h3>
              <button
                onClick={() => setIsAddAccountModalOpen(false)}
                className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveAccount} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-700 font-semibold mb-1">
                    Account Classification / Type
                  </label>
                  <select
                    value={accountType}
                    onChange={(e) => handleTypeChange(e.target.value as AccountType)}
                    className="spatial-input w-full rounded-xl px-3 py-2 text-zinc-900 font-medium"
                  >
                    <option value="asset">1. Asset (Debit)</option>
                    <option value="liability">2. Liability (Credit)</option>
                    <option value="equity">3. Equity (Credit)</option>
                    <option value="revenue">4. Revenue (Credit)</option>
                    <option value="cost_of_sales">5. Cost of Sales (Debit)</option>
                    <option value="expense">6. Operating Expense (Debit)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-zinc-700 font-semibold mb-1">
                    Account Code (e.g. 1010, 6090)
                  </label>
                  <input
                    type="text"
                    required
                    value={accountCode}
                    onChange={(e) => setAccountCode(e.target.value)}
                    placeholder="e.g. 6050"
                    className="spatial-input w-full font-mono font-bold rounded-xl px-3 py-2 text-zinc-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-700 font-semibold mb-1">
                  Account Title / Full Name
                </label>
                <input
                  type="text"
                  required
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  placeholder="e.g. Cloud Hosting & Server Infrastructure Expense"
                  className="spatial-input w-full rounded-xl px-3 py-2 text-zinc-900 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-700 font-semibold mb-1">
                    Normal Balance
                  </label>
                  <select
                    value={normalBalance}
                    onChange={(e) => setNormalBalance(e.target.value as any)}
                    className="spatial-input w-full rounded-xl px-3 py-2 text-zinc-900"
                  >
                    <option value="debit">Debit (Dr)</option>
                    <option value="credit">Credit (Cr)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-zinc-700 font-semibold mb-1">
                    BIR Compliance Tag
                  </label>
                  <input
                    type="text"
                    disabled
                    value="Enterprise CAS Extension"
                    className="spatial-input w-full rounded-xl px-3 py-2 text-zinc-500 bg-zinc-50 font-mono text-[11px]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-700 font-semibold mb-1">
                  Description / Tax Notes (Optional)
                </label>
                <input
                  type="text"
                  value={accountDescription}
                  onChange={(e) => setAccountDescription(e.target.value)}
                  placeholder="e.g. Deductible business expenses under NIRC Section 34"
                  className="spatial-input w-full rounded-xl px-3 py-2 text-zinc-900"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-zinc-200">
                <button
                  type="button"
                  onClick={() => setIsAddAccountModalOpen(false)}
                  className="spatial-button-secondary px-4 py-2 text-xs font-semibold rounded-xl text-zinc-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="spatial-button-primary px-5 py-2 text-xs font-bold rounded-xl"
                >
                  {editingAccount ? 'Update Account' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Team Member */}
      {isAddTeamModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/45 backdrop-blur-md p-4 overflow-y-auto">
          <div className="spatial-elevated rounded-3xl max-w-md w-full shadow-2xl p-6 space-y-4 my-8 text-zinc-800 border border-zinc-200/90 ring-1 ring-zinc-900/5">
            <div className="flex items-center justify-between border-b border-zinc-200/80 pb-3">
              <h3 className="font-bold text-base text-zinc-900 flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-zinc-900" />
                <span>Add Accountant / User Account</span>
              </h3>
              <button
                onClick={() => setIsAddTeamModalOpen(false)}
                className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTeamMember} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-zinc-700 font-semibold mb-1">
                  Full Name & Title
                </label>
                <input
                  type="text"
                  required
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="e.g. Juan dela Cruz, CPA"
                  className="spatial-input w-full rounded-xl px-3 py-2 text-zinc-900 font-medium"
                />
              </div>

              <div>
                <label className="block text-zinc-700 font-semibold mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  placeholder="e.g. j.delacruz@company.ph"
                  className="spatial-input w-full rounded-xl px-3 py-2 text-zinc-900 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-700 font-semibold mb-1">
                    Designation Role
                  </label>
                  <select
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value as any)}
                    className="spatial-input w-full rounded-xl px-3 py-2 text-zinc-900"
                  >
                    <option value="Lead CPA / Controller">Lead CPA / Controller</option>
                    <option value="Senior Bookkeeper">Senior Bookkeeper</option>
                    <option value="Staff Accountant">Staff Accountant</option>
                    <option value="BIR Examiner / Auditor">BIR Examiner / Auditor</option>
                  </select>
                </div>

                <div>
                  <label className="block text-zinc-700 font-semibold mb-1">
                    Access Permission
                  </label>
                  <select
                    value={newUserAccess}
                    onChange={(e) => setNewUserAccess(e.target.value as any)}
                    className="spatial-input w-full rounded-xl px-3 py-2 text-zinc-900"
                  >
                    <option value="admin">Admin (Full Control)</option>
                    <option value="editor">Editor (Post & Edit)</option>
                    <option value="viewer">Viewer (Read-Only CAS)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-zinc-200">
                <button
                  type="button"
                  onClick={() => setIsAddTeamModalOpen(false)}
                  className="spatial-button-secondary px-4 py-2 text-xs font-semibold rounded-xl text-zinc-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="spatial-button-primary px-5 py-2 text-xs font-bold rounded-xl"
                >
                  Save User Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
