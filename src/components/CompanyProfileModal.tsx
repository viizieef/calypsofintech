import React, { useState, useEffect } from 'react';
import { 
  X, 
  ShieldCheck, 
  Check, 
  Save,
  RotateCcw,
  Building,
  FileText,
  BadgeCheck,
} from 'lucide-react';
import { CompanyProfile } from '../types/ledger';
import { DEFAULT_COMPANY_PROFILE } from '../lib/sampleData';

interface CompanyProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: CompanyProfile;
  onSaveProfile: (profile: CompanyProfile) => void;
}

export const CompanyProfileModal: React.FC<CompanyProfileModalProps> = ({
  isOpen,
  onClose,
  profile,
  onSaveProfile,
}) => {
  const [formData, setFormData] = useState<CompanyProfile>(profile);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'entity' | 'bir' | 'signatory'>('entity');

  useEffect(() => {
    setFormData(profile);
  }, [profile, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveProfile(formData);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 800);
  };

  const handleResetDefaults = () => {
    if (window.confirm('Reset company profile to official BIR default demo values?')) {
      setFormData(DEFAULT_COMPANY_PROFILE);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/45 backdrop-blur-md p-4 overflow-y-auto">
      <div className="spatial-elevated rounded-3xl max-w-2xl w-full shadow-2xl p-6 sm:p-7 space-y-4 my-8 text-zinc-800 border border-zinc-200/90 ring-1 ring-zinc-900/5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-200/80 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white shadow-xs">
              <ShieldCheck className="w-5 h-5 text-zinc-100" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
                <span>Edit Company & BIR Taxpayer Profile</span>
              </h2>
              <p className="text-xs text-zinc-500">
                Official entity details for BIR 2550 returns, Form 2307, General Ledger, and CAS compliance
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Taxpayer Header Preview Card */}
        <div className="spatial-card rounded-2xl p-3.5 bg-zinc-50/80 border border-zinc-200/80 text-center">
          <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest block mb-1">
            Live Official Header Preview (Appears on all Books, Returns & Excel Exports)
          </span>
          <h3 className="font-extrabold text-sm text-zinc-900 uppercase tracking-wide">
            {formData.businessName || 'YOUR REGISTERED BUSINESS NAME'}
          </h3>
          {formData.tradeName && (
            <p className="text-[11px] text-zinc-500 font-medium italic">
              Doing Business As: "{formData.tradeName}"
            </p>
          )}
          <p className="text-[11px] text-zinc-600 mt-1 font-mono">
            TIN: {formData.tin} &bull; RDO {formData.rdoCode} &bull; {formData.taxpayerType === 'VAT' ? 'VAT-Registered (12%)' : 'Non-VAT (3% PT)'}
          </p>
          <p className="text-[10px] text-zinc-600 mt-0.5 truncate">
            {formData.registeredAddress}
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex p-1 bg-zinc-100 rounded-xl space-x-1 border border-zinc-200">
          <button
            type="button"
            onClick={() => setActiveTab('entity')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'entity'
                ? 'bg-zinc-900 text-white shadow-xs'
                : 'text-zinc-600 hover:text-zinc-950'
            }`}
          >
            1. Entity & Registration
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('bir')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'bir'
                ? 'bg-zinc-900 text-white shadow-xs'
                : 'text-zinc-600 hover:text-zinc-950'
            }`}
          >
            2. BIR Tax & CAS Permits
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('signatory')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'signatory'
                ? 'bg-zinc-900 text-white shadow-xs'
                : 'text-zinc-600 hover:text-zinc-950'
            }`}
          >
            3. CPA & Signatory
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs pt-1">
          {activeTab === 'entity' && (
            <div className="space-y-3.5">
              <div>
                <label className="block text-zinc-700 font-semibold mb-1">
                  Registered Business Name (Per BIR Form 2303 Certificate of Registration)
                </label>
                <input
                  type="text"
                  required
                  value={formData.businessName}
                  onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                  placeholder="e.g. APEX CLOUD SOLUTIONS PHILIPPINES INC."
                  className="spatial-input w-full rounded-xl px-3 py-2 text-zinc-900 font-bold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-700 font-semibold mb-1">
                    Trade Name / Doing Business As (DBA)
                  </label>
                  <input
                    type="text"
                    value={formData.tradeName}
                    onChange={(e) => setFormData({ ...formData, tradeName: e.target.value })}
                    placeholder="e.g. Apex Cloud Innovations"
                    className="spatial-input w-full rounded-xl px-3 py-2 text-zinc-900"
                  />
                </div>

                <div>
                  <label className="block text-zinc-700 font-semibold mb-1">
                    Line of Business / PSIC Code
                  </label>
                  <input
                    type="text"
                    value={formData.lineOfBusiness}
                    onChange={(e) => setFormData({ ...formData, lineOfBusiness: e.target.value })}
                    placeholder="e.g. Information Technology Consulting (PSIC 6201)"
                    className="spatial-input w-full rounded-xl px-3 py-2 text-zinc-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-700 font-semibold mb-1">
                  Registered Principal Office Address
                </label>
                <textarea
                  rows={2}
                  required
                  value={formData.registeredAddress}
                  onChange={(e) => setFormData({ ...formData, registeredAddress: e.target.value })}
                  placeholder="Unit #, Building, Street, Barangay, City, Province, Zip Code"
                  className="spatial-input w-full rounded-xl px-3 py-2 text-zinc-900 resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-700 font-semibold mb-1">
                    Accounting Method
                  </label>
                  <select
                    value={formData.accountingMethod}
                    onChange={(e) => setFormData({ ...formData, accountingMethod: e.target.value as any })}
                    className="spatial-input w-full rounded-xl px-3 py-2 text-zinc-900"
                  >
                    <option value="ACCRUAL">Accrual Method (Standard PFRS / BIR)</option>
                    <option value="CASH">Cash Receipts & Disbursements Basis</option>
                  </select>
                </div>

                <div>
                  <label className="block text-zinc-700 font-semibold mb-1">
                    Fiscal Year End
                  </label>
                  <input
                    type="text"
                    value={formData.fiscalYearEnd}
                    onChange={(e) => setFormData({ ...formData, fiscalYearEnd: e.target.value })}
                    placeholder="December 31"
                    className="spatial-input w-full rounded-xl px-3 py-2 text-zinc-900"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'bir' && (
            <div className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-700 font-semibold mb-1">
                    Taxpayer Identification Number (TIN)
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.tin}
                    onChange={(e) => setFormData({ ...formData, tin: e.target.value })}
                    placeholder="000-000-000-000"
                    className="spatial-input w-full rounded-xl px-3 py-2 text-zinc-900 font-mono font-bold"
                  />
                  <p className="text-[10px] text-zinc-500 mt-0.5">Format: 9 or 12 digits (e.g. 009-881-234-000)</p>
                </div>

                <div>
                  <label className="block text-zinc-700 font-semibold mb-1">
                    Revenue District Office (RDO)
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.rdoCode}
                    onChange={(e) => setFormData({ ...formData, rdoCode: e.target.value })}
                    placeholder="e.g. 044 - Taguig / Pateros"
                    className="spatial-input w-full rounded-xl px-3 py-2 text-zinc-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-700 font-semibold mb-1">
                    Taxpayer VAT Classification
                  </label>
                  <select
                    value={formData.taxpayerType}
                    onChange={(e) => setFormData({ ...formData, taxpayerType: e.target.value as any })}
                    className="spatial-input w-full rounded-xl px-3 py-2 text-zinc-900 font-medium"
                  >
                    <option value="VAT">VAT-Registered (12% Rate - Form 2550M/Q)</option>
                    <option value="NON_VAT">Non-VAT Registered (3% Percentage Tax - Form 2551Q)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-zinc-700 font-semibold mb-1">
                    BIR CAS Permit / Loose-Leaf Ref
                  </label>
                  <input
                    type="text"
                    value={formData.casPermitNumber || ''}
                    onChange={(e) => setFormData({ ...formData, casPermitNumber: e.target.value })}
                    placeholder="CAS-PERMIT-2024-NCR-0994"
                    className="spatial-input w-full rounded-xl px-3 py-2 text-zinc-900 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-700 font-semibold mb-1">
                  BIR 2303 Certificate of Registration (COR) Number
                </label>
                <input
                  type="text"
                  value={formData.birRegistrationNumber}
                  onChange={(e) => setFormData({ ...formData, birRegistrationNumber: e.target.value })}
                  placeholder="BIR-COR-2303-044-8891002"
                  className="spatial-input w-full rounded-xl px-3 py-2 text-zinc-900 font-mono"
                />
              </div>
            </div>
          )}

          {activeTab === 'signatory' && (
            <div className="space-y-3.5">
              <div className="p-3 bg-zinc-50 rounded-2xl border border-zinc-200">
                <span className="text-[10px] uppercase font-bold text-zinc-600 block mb-1">
                  BIR CAS Compliance Note
                </span>
                <p className="text-[11px] text-zinc-600 leading-relaxed">
                  Per Revenue Regulations No. 9-2009 and 11-2004, Computerized Accounting Systems must clearly identify the licensed CPA or officer authorized to certify the books of accounts and sign BIR returns under penalty of perjury.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-700 font-semibold mb-1">
                    Authorized Signatory (CPA / CFO / Controller)
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.authorizedSignatory}
                    onChange={(e) => setFormData({ ...formData, authorizedSignatory: e.target.value })}
                    placeholder="e.g. Maria Clarissa Santos, CPA"
                    className="spatial-input w-full rounded-xl px-3 py-2 text-zinc-900 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-zinc-700 font-semibold mb-1">
                    Signatory Official Title
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.signatoryTitle}
                    onChange={(e) => setFormData({ ...formData, signatoryTitle: e.target.value })}
                    placeholder="e.g. Chief Financial Officer & Comptroller"
                    className="spatial-input w-full rounded-xl px-3 py-2 text-zinc-900 font-medium"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Modal Actions */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-2 pt-3 border-t border-zinc-200/80">
            <button
              type="button"
              onClick={handleResetDefaults}
              className="text-xs text-zinc-500 hover:text-zinc-800 flex items-center space-x-1 underline"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset to Sample BIR Profile</span>
            </button>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="spatial-button-secondary px-4 py-2 text-xs font-semibold rounded-xl text-zinc-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="spatial-button-primary px-5 py-2 text-xs font-bold rounded-xl flex items-center space-x-1.5"
              >
                {savedSuccess ? <Check className="w-4 h-4 text-emerald-400" /> : <Save className="w-4 h-4 text-white" />}
                <span>{savedSuccess ? 'Saved Successfully!' : 'Save Company Profile'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
