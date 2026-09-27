import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService.js';
import { User, Pagination as IPagination } from '../../types/index.js';
import { Pagination } from '../../components/Pagination.js';
import { Users, Search, Filter, ShieldCheck, User as UserIcon, CheckCircle, Ban } from 'lucide-react';

export const AdminUsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [pagination, setPagination] = useState<IPagination>({
    page: 1,
    limit: 15,
    total: 0,
    totalPages: 1
  });

  const loadUsers = async (page = 1) => {
    setLoading(true);
    const res = await adminService.getUsers({
      page,
      limit: 15,
      role: roleFilter,
      search: search.trim() || undefined
    });
    setLoading(false);

    if (res.success && res.data) {
      setUsers(res.data);
      if (res.pagination) {
        setPagination(res.pagination);
      }
    }
  };

  useEffect(() => {
    loadUsers(1);
  }, [roleFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadUsers(1);
  };

  const handleToggle = async (userId: string) => {
    const res = await adminService.toggleUserStatus(userId);
    if (res.success) {
      loadUsers(pagination.page);
    } else {
      alert(res.message || 'Operation failed');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-700 uppercase tracking-wider mb-1">
              <Users className="w-4 h-4" />
              Citizen & Staff Registry
            </div>
            <h1 className="text-2xl font-bold text-slate-900">User Management</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Directory of registered citizen accounts and departmental officers.
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Citizen Name, Email, or Mobile Number..."
              className="w-full pl-9 pr-24 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="absolute right-1.5 top-1.5 px-3 py-1 bg-blue-800 text-white font-semibold text-xs rounded hover:bg-blue-900"
            >
              Search
            </button>
          </form>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="text-xs font-medium text-slate-500 shrink-0">Role:</span>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700 focus:outline-none"
            >
              <option value="ALL">All Roles</option>
              <option value="citizen">Citizens</option>
              <option value="admin">Officers (Admins)</option>
            </select>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-xs text-slate-500">Loading user registry...</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="px-5 py-3.5">User</th>
                      <th className="px-5 py-3.5">Email</th>
                      <th className="px-5 py-3.5">Mobile</th>
                      <th className="px-5 py-3.5">Role</th>
                      <th className="px-5 py-3.5">Jurisdiction</th>
                      <th className="px-5 py-3.5">Status</th>
                      <th className="px-5 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {users.map((u) => (
                      <tr key={u._id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-5 py-4 font-bold text-slate-900">
                          {u.firstName} {u.lastName}
                        </td>
                        <td className="px-5 py-4 text-slate-600 font-mono">
                          {u.email}
                        </td>
                        <td className="px-5 py-4 text-slate-600 font-mono">
                          {u.mobileNumber}
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded ${
                              u.role === 'admin'
                                ? 'bg-amber-100 text-amber-900'
                                : 'bg-blue-100 text-blue-900'
                            }`}
                          >
                            {u.role === 'admin' ? <ShieldCheck className="w-3 h-3" /> : <UserIcon className="w-3 h-3" />}
                            {u.role.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-slate-600">
                          {u.city || u.district ? `${u.city || ''}, ${u.district || ''}` : 'General'}
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`text-xs font-semibold px-2 py-0.5 rounded ${
                              u.isActive
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-red-50 text-red-700'
                            }`}
                          >
                            {u.isActive ? 'Active' : 'Deactivated'}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <button
                            onClick={() => handleToggle(u._id)}
                            className={`px-2.5 py-1 rounded text-xs font-semibold border transition-colors ${
                              u.isActive
                                ? 'border-red-200 text-red-700 hover:bg-red-50'
                                : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                            }`}
                          >
                            {u.isActive ? 'Deactivate' : 'Activate'}
                          </button>
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
                onPageChange={(p) => loadUsers(p)}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
};
