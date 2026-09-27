import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { requestService } from '../../services/requestService.js';
import { RequestItem, Pagination as IPagination } from '../../types/index.js';
import { StatusBadge } from '../../components/StatusBadge.js';
import { Pagination } from '../../components/Pagination.js';
import {
  FileText,
  Search,
  Filter,
  Eye,
  Download,
  AlertCircle,
  FilePlus,
  Building2,
  Calendar
} from 'lucide-react';

export const MyRequestsPage: React.FC = () => {
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState<IPagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1
  });

  const loadRequests = async (page = 1) => {
    setLoading(true);
    const res = await requestService.getMyRequests({
      page,
      limit: 10,
      status: statusFilter,
      search: search.trim() || undefined
    });
    setLoading(false);

    if (res.success && res.data) {
      setRequests(res.data);
      if (res.pagination) {
        setPagination(res.pagination);
      }
    }
  };

  useEffect(() => {
    loadRequests(1);
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadRequests(1);
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-700 uppercase tracking-wider mb-1">
              <FileText className="w-4 h-4" />
              Citizen Registry
            </div>
            <h1 className="text-2xl font-bold text-slate-900">My Document Applications</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Complete archive of your requested certificates, status timelines, and downloadable official documents.
            </p>
          </div>

          <Link
            to="/citizen/apply"
            className="px-4 py-2.5 rounded-lg text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 transition-colors flex items-center gap-2 shadow-xs shrink-0"
          >
            <FilePlus className="w-4 h-4" />
            Apply for New Document
          </Link>
        </div>

        {/* Filters & Search */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Reference Number (e.g. GOV-2026-000001) or department..."
              className="w-full pl-9 pr-20 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="absolute right-1.5 top-1.5 px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded"
            >
              Search
            </button>
          </form>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="text-xs font-medium text-slate-500 shrink-0">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="UNDER_REVIEW">Under Review</option>
              <option value="DOCUMENT_VERIFICATION">Document Verification</option>
              <option value="ADDITIONAL_DOCUMENT_REQUIRED">Additional Document Required</option>
              <option value="PROCESSING">Processing</option>
              <option value="APPROVED">Approved</option>
              <option value="READY_FOR_DOWNLOAD">Ready for Download</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
        </div>

        {/* Requests Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-xs text-slate-500">Retrieving application records...</div>
          ) : requests.length === 0 ? (
            <div className="p-16 text-center">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-slate-800">No applications match your filter</h3>
              <p className="text-xs text-slate-500 mt-1">Try resetting the status filter or search query.</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="px-5 py-3.5">Reference #</th>
                      <th className="px-5 py-3.5">Document Type</th>
                      <th className="px-5 py-3.5">Department</th>
                      <th className="px-5 py-3.5">Submitted On</th>
                      <th className="px-5 py-3.5">Expected Delivery</th>
                      <th className="px-5 py-3.5">Current Status</th>
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
                        <td className="px-5 py-4 text-blue-900 font-medium">
                          {new Date(req.expectedCompletionDate).toLocaleDateString('en-US', {
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
                              className="px-2.5 py-1.5 rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-semibold flex items-center gap-1 transition-colors"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              View
                            </Link>

                            {['READY_FOR_DOWNLOAD', 'COMPLETED'].includes(req.status) && (
                              <a
                                href={`/api/requests/${req._id}/final-document/download`}
                                download
                                className="px-2.5 py-1.5 rounded-md bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-semibold flex items-center gap-1 transition-colors"
                              >
                                <Download className="w-3.5 h-3.5" />
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

              <Pagination
                page={pagination.page}
                totalPages={pagination.totalPages}
                total={pagination.total}
                limit={pagination.limit}
                onPageChange={(p) => loadRequests(p)}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
};
