import React, { useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  Check, 
  Save 
} from 'lucide-react';
import { CompanyProfile } from '../types/ledger';

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/45 backdrop-blur-md p-4 overflow-y-auto">
      <div className="spatial-elevated rounded-3xl max-w-xl w-full shadow-2xl p-6 sm:p-8 space-y-4 my-8 text-zinc-800 border border-zinc-200/90 ring-1 ring-zinc-900/5">
        <div className="flex items-center justify-between border-b border-zinc-200/80 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white shadow-xs">
              <ShieldCheck className="w-5 h-5 text-zinc-100" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-900">
                BIR Taxpayer Profile & Registration
              </h2>
              <p className="text-xs text-zinc-500">
                Official entity details for BIR 2550 returns, Form 2307, and CAS books
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

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block text-zinc-700 font-semibold mb-1">
              Registered Business Name (Per BIR Form 2303 COR)
            </label>
            <input
              type="text"
              required
              value={formData.businessName}
              onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
              className="spatial-input w-full rounded-xl px-3 py-2 text-zinc-900 font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-zinc-700 font-semibold mb-1">
                Taxpayer TIN (Format: 000-000-000-000)
              </label>
              <input
                type="text"
                required
                value={formData.tin}
                onChange={(e) => setFormData({ ...formData, tin: e.target.value })}
                className="spatial-input w-full rounded-xl px-3 py-2 text-zinc-900 font-mono"
              />
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
                className="spatial-input w-full rounded-xl px-3 py-2 text-zinc-900 placeholder:text-zinc-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-zinc-700 font-semibold mb-1">
              Registered Principal Office Address
            </label>
            <input
              type="text"
              required
              value={formData.registeredAddress}
              onChange={(e) => setFormData({ ...formData, registeredAddress: e.target.value })}
              className="spatial-input w-full rounded-xl px-3 py-2 text-zinc-900"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-zinc-700 font-semibold mb-1">
                Taxpayer VAT Classification
              </label>
              <select
                value={formData.taxpayerType}
                onChange={(e) => setFormData({ ...formData, taxpayerType: e.target.value as any })}
                className="spatial-input w-full rounded-xl px-3 py-2 text-zinc-900"
              >
                <option value="VAT">VAT-Registered (12% Rate)</option>
                <option value="NON_VAT">Non-VAT Registered</option>
              </select>
            </div>

            <div>
              <label className="block text-zinc-700 font-semibold mb-1">
                Accounting Method
              </label>
              <select
                value={formData.accountingMethod}
                onChange={(e) => setFormData({ ...formData, accountingMethod: e.target.value as any })}
                className="spatial-input w-full rounded-xl px-3 py-2 text-zinc-900"
              >
                <option value="ACCRUAL">Accrual Method (Standard)</option>
                <option value="CASH">Cash Receipts Basis</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-zinc-700 font-semibold mb-1">
                BIR CAS Permit / Loose-Leaf Ref
              </label>
              <input
                type="text"
                value={formData.casPermitNumber || ''}
                onChange={(e) => setFormData({ ...formData, casPermitNumber: e.target.value })}
                placeholder="CAS-PERMIT-2024-NCR-0994"
                className="spatial-input w-full rounded-xl px-3 py-2 text-zinc-900 font-mono placeholder:text-zinc-400"
              />
            </div>

            <div>
              <label className="block text-zinc-700 font-semibold mb-1">
                BIR 2303 Certificate No.
              </label>
              <input
                type="text"
                value={formData.birRegistrationNumber}
                onChange={(e) => setFormData({ ...formData, birRegistrationNumber: e.target.value })}
                placeholder="BIR-COR-2303-044-8891002"
                className="spatial-input w-full rounded-xl px-3 py-2 text-zinc-900 font-mono placeholder:text-zinc-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1 border-t border-zinc-200/80">
            <div>
              <label className="block text-zinc-700 font-semibold mb-1">
                Authorized Signatory (CPA / CFO)
              </label>
              <input
                type="text"
                required
                value={formData.authorizedSignatory}
                onChange={(e) => setFormData({ ...formData, authorizedSignatory: e.target.value })}
                className="spatial-input w-full rounded-xl px-3 py-2 text-zinc-900"
              />
            </div>

            <div>
              <label className="block text-zinc-700 font-semibold mb-1">
                Signatory Title
              </label>
              <input
                type="text"
                required
                value={formData.signatoryTitle}
                onChange={(e) => setFormData({ ...formData, signatoryTitle: e.target.value })}
                className="spatial-input w-full rounded-xl px-3 py-2 text-zinc-900"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-3 border-t border-zinc-200/80">
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
              <span>{savedSuccess ? 'Saved!' : 'Save Company Details'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
