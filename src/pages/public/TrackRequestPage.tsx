import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { publicService, PublicTrackResponse } from '../../services/publicService.js';
import { StatusBadge } from '../../components/StatusBadge.js';
import { TimelineView } from '../../components/TimelineView.js';
import { useAuth } from '../../context/AuthContext.js';
import {
  Search,
  Building2,
  Calendar,
  Clock,
  User,
  ShieldCheck,
  Download,
  AlertCircle,
  FileText,
  ArrowRight
} from 'lucide-react';

export const TrackRequestPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialRef = searchParams.get('ref') || '';
  const { isAuthenticated } = useAuth();

  const [requestNumber, setRequestNumber] = useState(initialRef);
  const [data, setData] = useState<PublicTrackResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = async (ref: string) => {
    if (!ref.trim()) return;
    setLoading(true);
    setError(null);
    setData(null);

    const res = await publicService.trackRequest(ref.trim());
    setLoading(false);

    if (res.success && res.data) {
      setData(res.data);
    } else {
      setError(res.message || 'No application found with this request number.');
    }
  };

  useEffect(() => {
    if (initialRef) {
      fetchStatus(initialRef);
    }
  }, [initialRef]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (requestNumber.trim()) {
      setSearchParams({ ref: requestNumber.trim() });
      fetchStatus(requestNumber.trim());
    }
  };

  const handleChipClick = (num: string) => {
    setRequestNumber(num);
    setSearchParams({ ref: num });
    fetchStatus(num);
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-semibold mb-2">
            <Search className="w-3.5 h-3.5" />
            Citizen Self-Service Portal
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Track Application Status
          </h1>
          <p className="text-sm text-slate-600 mt-2 max-w-xl mx-auto">
            Check live departmental verification status, scrutinizer remarks, and expected delivery date without visiting the office.
          </p>
        </div>

        {/* Search Card */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs mb-8">
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                value={requestNumber}
                onChange={(e) => setRequestNumber(e.target.value)}
                placeholder="Enter Application Reference Number (e.g. GOV-2026-000001)"
                className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-lg text-sm uppercase font-mono font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-inner"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !requestNumber.trim()}
              className="w-full sm:w-auto px-6 py-3 rounded-lg text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0 shadow-xs"
            >
              {loading ? 'Searching Registry...' : 'Search Record'}
            </button>
          </form>

          {/* Quick Demo Reference Chips */}
          <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span className="font-medium text-slate-600">Quick Test Cases:</span>
            <button
              type="button"
              onClick={() => handleChipClick('GOV-2026-000001')}
              className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono text-xs transition-colors border border-slate-200"
            >
              GOV-2026-000001 (Approved/Ready)
            </button>
            <button
              type="button"
              onClick={() => handleChipClick('GOV-2026-000002')}
              className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono text-xs transition-colors border border-slate-200"
            >
              GOV-2026-000002 (Verification)
            </button>
            <button
              type="button"
              onClick={() => handleChipClick('GOV-2026-000003')}
              className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono text-xs transition-colors border border-slate-200"
            >
              GOV-2026-000003 (Doc Needed)
            </button>
            <button
              type="button"
              onClick={() => handleChipClick('GOV-2026-000006')}
              className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono text-xs transition-colors border border-slate-200"
            >
              GOV-2026-000006 (Rejected)
            </button>
          </div>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm flex items-start gap-3 mb-8">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Application Reference Not Found</p>
              <p className="text-xs text-red-700 mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Tracking Details View */}
        {data && (
          <div className="space-y-6">
            {/* Top Summary Card */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="bg-slate-900 text-white px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[11px] font-mono text-slate-400 block uppercase">Official Reference</span>
                  <span className="text-lg font-black font-mono tracking-wider text-amber-400">
                    {data.requestNumber}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={data.currentStatus} size="lg" />
                </div>
              </div>

              <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs border-b border-slate-100">
                <div>
                  <span className="text-slate-400 block mb-0.5">Certificate Type</span>
                  <span className="font-bold text-slate-900 text-sm">{data.documentType.name}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Applicant</span>
                  <span className="font-semibold text-slate-800">{data.applicantInitials}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Department</span>
                  <span className="font-semibold text-slate-800">{data.currentDepartment}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Assigned Officer</span>
                  <span className="font-semibold text-slate-800">{data.assignedOfficer}</span>
                </div>
              </div>

              <div className="p-6 bg-slate-50/50 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <span className="text-slate-500 block mb-0.5">Submitted On</span>
                  <span className="font-medium text-slate-800">
                    {new Date(data.submittedAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block mb-0.5">Estimated Completion Date</span>
                  <span className="font-medium text-blue-900">
                    {new Date(data.expectedCompletionDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block mb-0.5">Last System Update</span>
                  <span className="font-medium text-slate-800">
                    {new Date(data.lastUpdatedAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              </div>

              {/* Remarks Banner */}
              {data.remarks && (
                <div className="px-6 py-3 bg-blue-50/70 border-t border-blue-100 text-xs text-blue-900 flex items-start gap-2">
                  <FileText className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold">Official Departmental Note: </span>
                    <span>{data.remarks}</span>
                  </div>
                </div>
              )}

              {/* Ready for download callout */}
              {data.finalDocumentAvailable && (
                <div className="p-4 bg-emerald-50 border-t border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-emerald-900 text-xs">
                    <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                    <div>
                      <p className="font-bold text-sm">Official Certificate Is Ready!</p>
                      <p className="text-emerald-700">Digital signature and seal are verified.</p>
                    </div>
                  </div>
                  {isAuthenticated ? (
                    <Link
                      to={`/citizen/requests/${data._id}`}
                      className="px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs transition-colors shrink-0"
                    >
                      <Download className="w-4 h-4" />
                      Download Certificate
                    </Link>
                  ) : (
                    <Link
                      to={`/login?redirect=/citizen/requests/${data._id}`}
                      className="px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs transition-colors shrink-0"
                    >
                      Sign In to Download Certificate →
                    </Link>
                  )}
                </div>
              )}
            </div>

            {/* Vertical Timeline Card */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
              <h3 className="text-base font-bold text-slate-900 mb-6">
                Real-Time Verification Timeline
              </h3>

              <TimelineView
                currentStatus={data.currentStatus as any}
                statusHistory={data.timeline as any}
                expectedDate={data.expectedCompletionDate}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
