import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { ShieldCheck, Mail, Phone, Save, CheckCircle, AlertCircle } from 'lucide-react';

export const AdminProfilePage: React.FC = () => {
  const { user, updateProfile } = useAuth();

  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    mobileNumber: user?.mobileNumber || ''
  });

  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    const res = await updateProfile(formData);
    setSaving(false);

    if (res.success) {
      setSuccessMsg('Officer credentials & contact details updated.');
    } else {
      setErrorMsg(res.message || 'Update failed.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Departmental Officer Profile</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Designated authority credentials used for digital signatures and audit histories.
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 sm:p-8">
          {successMsg && (
            <div className="mb-6 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="mb-6 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 mb-4">
              <strong>Administrative Role:</strong> Authorized Government Officer (Full Review & Sanction Powers)
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">First Name *</label>
                <input
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Last Name *</label>
                <input
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Officer Email (Read-Only)</label>
              <input
                type="email"
                disabled
                value={user?.email || ''}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-500 cursor-not-allowed font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Official Mobile *</label>
              <input
                type="tel"
                required
                value={formData.mobileNumber}
                onChange={(e) => setFormData({ ...formData, mobileNumber: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
              />
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 rounded-lg bg-blue-800 hover:bg-blue-900 text-white font-bold flex items-center gap-1.5 shadow-xs"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Updating...' : 'Save Officer Profile'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
