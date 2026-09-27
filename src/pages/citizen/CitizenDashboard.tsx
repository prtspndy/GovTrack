import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';
import { requestService } from '../../services/requestService.js';
import { RequestItem } from '../../types/index.js';
import { Dashboard } from '../../components/Dashboard.js';
import {
  Building2,
  FilePlus,
  AlertTriangle,
  Download
} from 'lucide-react';

export const CitizenDashboard: React.FC = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadRequests = async () => {
    setLoading(true);
    const res = await requestService.getMyRequests({ limit: 50 });
    if (res.success && res.data) {
      setRequests(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const actionRequired = requests.filter((r) => r.status === 'ADDITIONAL_DOCUMENT_REQUIRED');
  const readyForDownload = requests.filter((r) => r.status === 'READY_FOR_DOWNLOAD');

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-700 uppercase tracking-wider mb-1">
              <Building2 className="w-4 h-4" />
              Citizen Services Portal
            </div>
            <h1 className="text-2xl font-bold text-slate-900">
              Welcome, {user?.firstName} {user?.lastName}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              UID/Email: {user?.email} · Manage your applications and track status updates in real-time.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/citizen/apply"
              className="px-4 py-2.5 rounded-lg text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 transition-colors flex items-center gap-2 shadow-xs"
            >
              <FilePlus className="w-4 h-4" />
              Apply for New Document
            </Link>
          </div>
        </div>

        {/* Priority Action Alerts */}
        {actionRequired.length > 0 && (
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
              <div className="text-xs">
                <p className="font-bold text-sm">Action Required on {actionRequired.length} Application(s)</p>
                <p className="text-amber-700">
                  Officer has requested additional verification documents for application{' '}
                  <span className="font-mono font-bold">{actionRequired[0].requestNumber}</span>.
                </p>
              </div>
            </div>
            <Link
              to={`/citizen/requests/${actionRequired[0]._id}`}
              className="px-3.5 py-1.5 rounded-md bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs transition-colors shrink-0"
            >
              Upload Document Now →
            </Link>
          </div>
        )}

        {readyForDownload.length > 0 && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <Download className="w-5 h-5 text-emerald-600 shrink-0" />
              <div className="text-xs">
                <p className="font-bold text-sm">Official Certificate Ready for Download!</p>
                <p className="text-emerald-700">
                  Your application{' '}
                  <span className="font-mono font-bold">{readyForDownload[0].requestNumber}</span> has been digitally signed and sanctioned.
                </p>
              </div>
            </div>
            <Link
              to={`/citizen/requests/${readyForDownload[0]._id}`}
              className="px-3.5 py-1.5 rounded-md bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs transition-colors shrink-0"
            >
              Download Certificate →
            </Link>
          </div>
        )}

        {/* Dedicated Request Summary Dashboard Component with Visual Status Cards (Pending, In Progress, Completed) */}
        <Dashboard
          requests={requests}
          loading={loading}
          onRefresh={loadRequests}
          showRecentList={true}
        />
      </div>
    </div>
  );
};
