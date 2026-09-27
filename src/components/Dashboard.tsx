import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { RequestItem } from '../types/index.js';
import { requestService } from '../services/requestService.js';
import { StatusBadge } from './StatusBadge.js';
import {
  Clock,
  Cog,
  CheckCircle2,
  FileText,
  AlertCircle,
  Download,
  Eye,
  Calendar,
  ChevronRight,
  ShieldCheck,
  TrendingUp,
  Filter,
  FilePlus,
  RefreshCw
} from 'lucide-react';

export type StatusCategory = 'ALL' | 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';

export interface DashboardProps {
  requests?: RequestItem[];
  loading?: boolean;
  onRefresh?: () => void;
  className?: string;
  showRecentList?: boolean;
}

export const PENDING_STATUSES = ['SUBMITTED', 'ADDITIONAL_DOCUMENT_REQUIRED'];
export const IN_PROGRESS_STATUSES = ['UNDER_REVIEW', 'DOCUMENT_VERIFICATION', 'PROCESSING'];
export const COMPLETED_STATUSES = ['APPROVED', 'READY_FOR_DOWNLOAD', 'COMPLETED'];

export const Dashboard: React.FC<DashboardProps> = ({
  requests: externalRequests,
  loading: externalLoading,
  onRefresh,
  className = '',
  showRecentList = true
}) => {
  const [internalRequests, setInternalRequests] = useState<RequestItem[]>([]);
  const [internalLoading, setInternalLoading] = useState<boolean>(false);
  const [activeCategory, setActiveCategory] = useState<StatusCategory>('ALL');

  // If requests are not provided via props, fetch them directly
  useEffect(() => {
    if (externalRequests !== undefined) return;

    let isMounted = true;
    async function fetchRequests() {
      setInternalLoading(true);
      try {
        const res = await requestService.getMyRequests({ limit: 50 });
        if (isMounted && res.success && res.data) {
          setInternalRequests(res.data);
        }
      } catch (err) {
        console.error('Failed to load requests for Dashboard:', err);
      } finally {
        if (isMounted) setInternalLoading(false);
      }
    }

    fetchRequests();
    return () => {
      isMounted = false;
    };
  }, [externalRequests]);

  const requests = externalRequests ?? internalRequests;
  const isLoading = externalLoading ?? internalLoading;

  // Filter requests into the three key categories
  const pendingRequests = requests.filter((r) => PENDING_STATUSES.includes(r.status));
  const inProgressRequests = requests.filter((r) => IN_PROGRESS_STATUSES.includes(r.status));
  const completedRequests = requests.filter((r) => COMPLETED_STATUSES.includes(r.status));
  const rejectedOrCancelled = requests.filter((r) => ['REJECTED', 'CANCELLED'].includes(r.status));

  const totalActive = pendingRequests.length + inProgressRequests.length;
  const totalAll = requests.length;

  // Percentage calculations
  const pendingPercent = totalAll > 0 ? Math.round((pendingRequests.length / totalAll) * 100) : 0;
  const inProgressPercent = totalAll > 0 ? Math.round((inProgressRequests.length / totalAll) * 100) : 0;
  const completedPercent = totalAll > 0 ? Math.round((completedRequests.length / totalAll) * 100) : 0;

  // Filtered requests list based on selected category card
  const filteredList = requests.filter((r) => {
    if (activeCategory === 'PENDING') return PENDING_STATUSES.includes(r.status);
    if (activeCategory === 'IN_PROGRESS') return IN_PROGRESS_STATUSES.includes(r.status);
    if (activeCategory === 'COMPLETED') return COMPLETED_STATUSES.includes(r.status);
    return true;
  });

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Top Header with Quick Filter Indicators */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-700" />
            Active Document Requests Summary
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time status overview of your pending submissions, departmental verifications, and issued certificates.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 text-xs transition-colors flex items-center gap-1"
              title="Refresh request status"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          )}

          <Link
            to="/citizen/apply"
            className="px-3.5 py-1.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors shrink-0"
          >
            <FilePlus className="w-3.5 h-3.5" />
            New Application
          </Link>
        </div>
      </div>

      {/* Visual Status Cards Grid (Pending, In Progress, Completed) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* 1. Pending Status Card */}
        <div
          onClick={() => setActiveCategory(activeCategory === 'PENDING' ? 'ALL' : 'PENDING')}
          className={`relative p-5 rounded-xl border-2 transition-all cursor-pointer bg-white overflow-hidden group ${
            activeCategory === 'PENDING'
              ? 'border-amber-500 ring-2 ring-amber-100 shadow-md'
              : 'border-slate-200 hover:border-amber-300 hover:shadow-xs'
          }`}
        >
          {/* Subtle top accent bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 to-amber-500" />

          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="text-xs font-bold text-amber-700 uppercase tracking-wider block">
                Pending Submissions
              </span>
              <p className="text-3xl font-black text-slate-900 mt-2 tracking-tight">
                {isLoading ? '...' : pendingRequests.length}
              </p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Clock className="w-6 h-6 text-amber-600" />
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between text-xs text-slate-600 mb-1.5">
              <span>Awaiting Desk Assignment</span>
              <span className="font-semibold font-mono text-slate-700">{pendingPercent}%</span>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-amber-500 h-full transition-all duration-500"
                style={{ width: `${pendingPercent}%` }}
              />
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
            <span className="flex items-center gap-1 text-amber-800">
              <AlertCircle className="w-3 h-3 text-amber-600" />
              {pendingRequests.filter((r) => r.status === 'ADDITIONAL_DOCUMENT_REQUIRED').length} need your action
            </span>
            <span className="font-medium text-blue-700 flex items-center gap-0.5">
              {activeCategory === 'PENDING' ? 'Active Filter' : 'Filter by Pending'}
              <ChevronRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* 2. In Progress Status Card */}
        <div
          onClick={() => setActiveCategory(activeCategory === 'IN_PROGRESS' ? 'ALL' : 'IN_PROGRESS')}
          className={`relative p-5 rounded-xl border-2 transition-all cursor-pointer bg-white overflow-hidden group ${
            activeCategory === 'IN_PROGRESS'
              ? 'border-sky-500 ring-2 ring-sky-100 shadow-md'
              : 'border-slate-200 hover:border-sky-300 hover:shadow-xs'
          }`}
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-sky-400 to-blue-600" />

          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="text-xs font-bold text-sky-700 uppercase tracking-wider block">
                In Progress (Under Scrutiny)
              </span>
              <p className="text-3xl font-black text-slate-900 mt-2 tracking-tight">
                {isLoading ? '...' : inProgressRequests.length}
              </p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-sky-50 border border-sky-200 text-sky-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Cog className="w-6 h-6 text-sky-600 animate-spin-slow" />
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between text-xs text-slate-600 mb-1.5">
              <span>Verification & Field Inquiry</span>
              <span className="font-semibold font-mono text-slate-700">{inProgressPercent}%</span>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-sky-500 h-full transition-all duration-500"
                style={{ width: `${inProgressPercent}%` }}
              />
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
            <span className="text-slate-600">Active Departmental Queue</span>
            <span className="font-medium text-blue-700 flex items-center gap-0.5">
              {activeCategory === 'IN_PROGRESS' ? 'Active Filter' : 'Filter by In Progress'}
              <ChevronRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* 3. Completed Status Card */}
        <div
          onClick={() => setActiveCategory(activeCategory === 'COMPLETED' ? 'ALL' : 'COMPLETED')}
          className={`relative p-5 rounded-xl border-2 transition-all cursor-pointer bg-white overflow-hidden group ${
            activeCategory === 'COMPLETED'
              ? 'border-emerald-500 ring-2 ring-emerald-100 shadow-md'
              : 'border-slate-200 hover:border-emerald-300 hover:shadow-xs'
          }`}
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 to-teal-600" />

          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider block">
                Completed & Issued
              </span>
              <p className="text-3xl font-black text-slate-900 mt-2 tracking-tight">
                {isLoading ? '...' : completedRequests.length}
              </p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <CheckCircle2 className="w-6 h-6 text-emerald-600" />
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between text-xs text-slate-600 mb-1.5">
              <span>Sanctioned Certificates</span>
              <span className="font-semibold font-mono text-slate-700">{completedPercent}%</span>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-emerald-600 h-full transition-all duration-500"
                style={{ width: `${completedPercent}%` }}
              />
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
            <span className="flex items-center gap-1 text-emerald-800">
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              {completedRequests.filter((r) => r.status === 'READY_FOR_DOWNLOAD').length} ready for download
            </span>
            <span className="font-medium text-blue-700 flex items-center gap-0.5">
              {activeCategory === 'COMPLETED' ? 'Active Filter' : 'Filter by Completed'}
              <ChevronRight className="w-3 h-3" />
            </span>
          </div>
        </div>
      </div>

      {/* Dynamic Request List Table for the Selected Status Category */}
      {showRecentList && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <h3 className="text-sm font-bold text-slate-900">
                {activeCategory === 'ALL' && `All Applications (${requests.length})`}
                {activeCategory === 'PENDING' && `Pending Applications (${pendingRequests.length})`}
                {activeCategory === 'IN_PROGRESS' && `In Progress Applications (${inProgressRequests.length})`}
                {activeCategory === 'COMPLETED' && `Completed Certificates (${completedRequests.length})`}
              </h3>
              {activeCategory !== 'ALL' && (
                <button
                  onClick={() => setActiveCategory('ALL')}
                  className="text-[11px] text-blue-700 hover:underline font-semibold ml-2"
                >
                  Clear Filter
                </button>
              )}
            </div>

            <Link
              to="/citizen/requests"
              className="text-xs font-semibold text-blue-700 hover:text-blue-900 flex items-center gap-1"
            >
              View Full History Archive →
            </Link>
          </div>

          {isLoading ? (
            <div className="p-8 text-center text-xs text-slate-500">Loading requests...</div>
          ) : filteredList.length === 0 ? (
            <div className="p-10 text-center">
              <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs text-slate-600 font-medium">
                No applications found in the {activeCategory.toLowerCase().replace('_', ' ')} stage.
              </p>
              {activeCategory !== 'ALL' && (
                <button
                  onClick={() => setActiveCategory('ALL')}
                  className="mt-2 text-xs text-blue-700 hover:underline font-semibold"
                >
                  Show all applications
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-100">
                  <tr>
                    <th className="px-5 py-3">Reference #</th>
                    <th className="px-5 py-3">Certificate Type</th>
                    <th className="px-5 py-3">Department</th>
                    <th className="px-5 py-3">Target SLA Date</th>
                    <th className="px-5 py-3">Current Status</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredList.slice(0, 6).map((req) => (
                    <tr key={req._id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-5 py-3.5 font-mono font-bold text-slate-900">
                        {req.requestNumber}
                      </td>
                      <td className="px-5 py-3.5 font-medium text-slate-800">
                        {(req.documentType as any)?.name || 'Certificate'}
                      </td>
                      <td className="px-5 py-3.5 text-slate-600 truncate max-w-xs">
                        {req.currentDepartment}
                      </td>
                      <td className="px-5 py-3.5 text-blue-900 font-medium">
                        {new Date(req.expectedCompletionDate).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </td>
                      <td className="px-5 py-3.5">
                        <StatusBadge status={req.status} size="sm" />
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            to={`/citizen/requests/${req._id}`}
                            className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs flex items-center gap-1 transition-colors"
                          >
                            <Eye className="w-3 h-3 text-slate-500" />
                            Details
                          </Link>

                          {['READY_FOR_DOWNLOAD', 'COMPLETED'].includes(req.status) && (
                            <a
                              href={`/api/requests/${req._id}/final-document/download`}
                              download
                              className="px-2.5 py-1 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold text-xs flex items-center gap-1 transition-colors"
                            >
                              <Download className="w-3 h-3" />
                              Download
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
      )}
    </div>
  );
};
