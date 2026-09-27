import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminService } from '../../services/adminService.js';
import { publicService } from '../../services/publicService.js';
import { RequestItem, DocumentType, Pagination as IPagination } from '../../types/index.js';
import { StatusBadge } from '../../components/StatusBadge.js';
import { Pagination } from '../../components/Pagination.js';
import {
  FileText,
  Search,
  Filter,
  Eye,
  ArrowUpDown,
  Building2,
  Calendar,
  UserCheck
} from 'lucide-react';

export const AdminRequestsPage: React.FC = () => {
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [docTypes, setDocTypes] = useState<DocumentType[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [docTypeFilter, setDocTypeFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('submittedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const [pagination, setPagination] = useState<IPagination>({
    page: 1,
    limit: 15,
    total: 0,
    totalPages: 1
  });

  const loadRequests = async (page = 1) => {
    setLoading(true);
    const res = await adminService.getAllRequests({
      page,
      limit: 15,
      status: statusFilter,
      documentType: docTypeFilter,
      search: search.trim() || undefined,
      sortBy,
      sortOrder
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
    async function loadDocTypes() {
      const res = await publicService.getPublicDocumentTypes();
      if (res.success && res.data) {
        setDocTypes(res.data);
      }
    }
    loadDocTypes();
  }, []);

  useEffect(() => {
    loadRequests(1);
  }, [statusFilter, docTypeFilter, sortBy, sortOrder]);

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
              <Building2 className="w-4 h-4" />
              Administrative Operations
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Application Processing Queue</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Review citizen requests, inspect uploaded identity documents, and transition statutory workflow stages.
            </p>
          </div>
        </div>

        {/* Filters Card */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs mb-6 space-y-4">
          <form onSubmit={handleSearchSubmit} className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Request Number (GOV-2026-...), Citizen Name, Email, or Mobile..."
              className="w-full pl-9 pr-24 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="absolute right-1.5 top-1.5 px-3 py-1 bg-blue-800 hover:bg-blue-900 text-white text-xs font-semibold rounded shadow-2xs transition-colors"
            >
              Search
            </button>
          </form>

          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 text-xs">
            {/* Status Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 font-medium">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-slate-200 rounded-md px-2.5 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="ALL">All Stages</option>
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

            {/* Document Type Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 font-medium">Certificate:</span>
              <select
                value={docTypeFilter}
                onChange={(e) => setDocTypeFilter(e.target.value)}
                className="border border-slate-200 rounded-md px-2.5 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="ALL">All Types</option>
                {docTypes.map((dt) => (
                  <option key={dt._id} value={dt._id}>
                    {dt.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Filter */}
            <div className="flex items-center gap-1.5 ml-auto">
              <span className="text-slate-500 font-medium">Sort By:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="border border-slate-200 rounded-md px-2.5 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="submittedAt">Submission Date</option>
                <option value="lastUpdatedAt">Last Update</option>
                <option value="expectedCompletionDate">Target SLA Date</option>
                <option value="status">Status</option>
              </select>
              <button
                type="button"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="p-1.5 border border-slate-200 rounded-md hover:bg-slate-50 text-slate-600"
                title={`Order: ${sortOrder.toUpperCase()}`}
              >
                <ArrowUpDown className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Requests Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-xs text-slate-500">Retrieving application registry...</div>
          ) : requests.length === 0 ? (
            <div className="p-16 text-center">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-slate-800">No requests match criteria</h3>
              <p className="text-xs text-slate-500 mt-1">Try clearing search terms or resetting filters.</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="px-5 py-3.5">Reference #</th>
                      <th className="px-5 py-3.5">Applicant Citizen</th>
                      <th className="px-5 py-3.5">Document Type</th>
                      <th className="px-5 py-3.5">Department</th>
                      <th className="px-5 py-3.5">Submitted On</th>
                      <th className="px-5 py-3.5">Target SLA</th>
                      <th className="px-5 py-3.5">Current Stage</th>
                      <th className="px-5 py-3.5 text-right">Process Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {requests.map((req) => {
                      const citizen = req.citizen as any;
                      return (
                        <tr key={req._id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-5 py-4 font-mono font-bold text-slate-900">
                            {req.requestNumber}
                          </td>
                          <td className="px-5 py-4 font-medium text-slate-900">
                            <div>
                              {citizen ? `${citizen.firstName} ${citizen.lastName || ''}` : 'Citizen'}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              {citizen?.email} · {citizen?.mobileNumber}
                            </div>
                          </td>
                          <td className="px-5 py-4 text-slate-800 font-medium">
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
                            <Link
                              to={`/admin/requests/${req._id}`}
                              className="px-3 py-1.5 rounded-md bg-blue-800 text-white font-semibold text-xs hover:bg-blue-900 inline-flex items-center gap-1 shadow-2xs transition-colors"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              Process
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
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
