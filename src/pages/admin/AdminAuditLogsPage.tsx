import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService.js';
import { AuditLogItem, Pagination as IPagination } from '../../types/index.js';
import { Pagination } from '../../components/Pagination.js';
import { History, Search, Shield, Clock, FileText } from 'lucide-react';

export const AdminAuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState<IPagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1
  });

  const loadLogs = async (page = 1) => {
    setLoading(true);
    const res = await adminService.getAuditLogs({
      page,
      limit: 20,
      search: search.trim() || undefined
    });
    setLoading(false);

    if (res.success && res.data) {
      setLogs(res.data);
      if (res.pagination) {
        setPagination(res.pagination);
      }
    }
  };

  useEffect(() => {
    loadLogs(1);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadLogs(1);
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-700 uppercase tracking-wider mb-1">
              <History className="w-4 h-4" />
              Statutory Compliance & Security
            </div>
            <h1 className="text-2xl font-bold text-slate-900">System Audit Trail</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Immutable ledger of all administrative logins, status transitions, proof validations, and certificate sanctions.
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs mb-6">
          <form onSubmit={handleSearchSubmit} className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search audit trail by Action (e.g. STATUS_UPDATED, DOCUMENT_VERIFIED) or description..."
              className="w-full pl-9 pr-24 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="absolute right-1.5 top-1.5 px-3 py-1 bg-blue-800 text-white font-semibold text-xs rounded hover:bg-blue-900"
            >
              Filter Logs
            </button>
          </form>
        </div>

        {/* Logs Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-xs text-slate-500">Loading immutable audit logs...</div>
          ) : logs.length === 0 ? (
            <div className="p-16 text-center text-xs text-slate-500">No audit events match query.</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="px-5 py-3.5">Timestamp</th>
                      <th className="px-5 py-3.5">Action Code</th>
                      <th className="px-5 py-3.5">Triggered By</th>
                      <th className="px-5 py-3.5">Description</th>
                      <th className="px-5 py-3.5">IP Address</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {logs.map((log) => {
                      const user = log.user as any;
                      return (
                        <tr key={log._id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-5 py-3.5 text-slate-500 whitespace-nowrap">
                            {new Date(log.timestamp).toLocaleString()}
                          </td>
                          <td className="px-5 py-3.5 font-bold text-blue-900 whitespace-nowrap">
                            <span className="bg-blue-50 border border-blue-200 px-2 py-0.5 rounded text-[11px]">
                              {log.action}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-slate-800 font-sans font-medium whitespace-nowrap">
                            {user?.firstName ? `${user.firstName} ${user.lastName || ''}` : 'System Agent'}
                          </td>
                          <td className="px-5 py-3.5 text-slate-700 font-sans">
                            {log.description}
                          </td>
                          <td className="px-5 py-3.5 text-slate-400">
                            {log.ipAddress || '127.0.0.1'}
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
                onPageChange={(p) => loadLogs(p)}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
};
