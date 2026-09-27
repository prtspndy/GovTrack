import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';
import { requestService } from '../../services/requestService.js';
import { RequestItem } from '../../types/index.js';
import { StatusBadge } from '../../components/StatusBadge.js';
import {
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  Award,
  AlertTriangle,
  Download,
  FilePlus,
  ArrowRight,
  Search,
  Eye,
  Building2
} from 'lucide-react';

export const CitizenDashboard: React.FC = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadRequests() {
      setLoading(true);
      const res = await requestService.getMyRequests({ limit: 10 });
      if (res.success && res.data) {
        setRequests(res.data);
      }
      setLoading(false);
    }
    loadRequests();
  }, []);

  const total = requests.length;
  const pending = requests.filter((r) =>
    ['SUBMITTED', 'UNDER_REVIEW', 'DOCUMENT_VERIFICATION', 'ADDITIONAL_DOCUMENT_REQUIRED', 'PROCESSING'].includes(
      r.status
    )
  ).length;
  const approved = requests.filter((r) =>
    ['APPROVED', 'READY_FOR_DOWNLOAD', 'COMPLETED'].includes(r.status)
  ).length;
  const rejected = requests.filter((r) => r.status === 'REJECTED').length;
  const actionRequired = requests.filter((r) => r.status === 'ADDITIONAL_DOCUMENT_REQUIRED');
  const readyForDownload = requests.filter((r) => r.status === 'READY_FOR_DOWNLOAD');

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
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
          <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
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
          <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
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

        {/* Metric Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-medium">Total Applications</span>
              <FileText className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-slate-900">{total}</p>
            <span className="text-[11px] text-slate-400">All submitted requests</span>
          </div>

          <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-medium">Under Processing</span>
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
            <p className="text-2xl font-bold text-amber-700">{pending}</p>
            <span className="text-[11px] text-slate-400">Under review / verification</span>
          </div>

          <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-medium">Approved / Ready</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-2xl font-bold text-emerald-700">{approved}</p>
            <span className="text-[11px] text-slate-400">Sanctioned certificates</span>
          </div>

          <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-medium">Rejected</span>
              <XCircle className="w-4 h-4 text-red-600" />
            </div>
            <p className="text-2xl font-bold text-red-700">{rejected}</p>
            <span className="text-[11px] text-slate-400">Ineligible / cancelled</span>
          </div>
        </div>

        {/* Recent Applications Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Your Recent Applications</h2>
              <p className="text-xs text-slate-500 mt-0.5">Track live progress and access issued certificates</p>
            </div>
            <Link
              to="/citizen/requests"
              className="text-xs font-semibold text-blue-700 hover:text-blue-800 flex items-center gap-1"
            >
              View all ({total}) →
            </Link>
          </div>

          {loading ? (
            <div className="p-8 text-center text-xs text-slate-500">Loading your applications...</div>
          ) : requests.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-slate-800">No applications submitted yet</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                You haven't requested any government certificates yet. Submit your first request online in under 3 minutes.
              </p>
              <Link
                to="/citizen/apply"
                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-700 text-white text-xs font-semibold hover:bg-blue-800 transition-colors shadow-xs"
              >
                <FilePlus className="w-4 h-4" />
                Apply for Document Now
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3.5">Reference #</th>
                    <th className="px-5 py-3.5">Document Type</th>
                    <th className="px-5 py-3.5">Department</th>
                    <th className="px-5 py-3.5">Submitted On</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {requests.map((req) => (
                    <tr key={req._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-4 font-mono font-bold text-slate-900">
                        {req.requestNumber}
                      </td>
                      <td className="px-5 py-4 font-medium text-slate-800">
                        {(req.documentType as any)?.name || 'Certificate'}
                      </td>
                      <td className="px-5 py-4 text-slate-600 truncate max-w-xs">
                        {req.currentDepartment}
                      </td>
                      <td className="px-5 py-4 text-slate-500">
                        {new Date(req.submittedAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge status={req.status} size="sm" />
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            to={`/citizen/requests/${req._id}`}
                            className="p-1.5 text-blue-700 hover:text-blue-900 hover:bg-blue-50 rounded transition-colors"
                            title="View Details & Timeline"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          {['READY_FOR_DOWNLOAD', 'COMPLETED'].includes(req.status) && (
                            <a
                              href={`/api/requests/${req._id}/final-document/download`}
                              download
                              className="p-1.5 text-emerald-700 hover:text-emerald-900 hover:bg-emerald-50 rounded transition-colors"
                              title="Download Certificate"
                            >
                              <Download className="w-4 h-4" />
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
