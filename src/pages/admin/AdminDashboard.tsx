import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminService } from '../../services/adminService.js';
import { AdminDashboardData } from '../../types/index.js';
import { StatusBadge } from '../../components/StatusBadge.js';
import {
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  Award,
  AlertTriangle,
  Building2,
  Users,
  Eye,
  TrendingUp,
  BarChart3,
  Layers,
  ArrowRight
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';

const STATUS_COLORS: Record<string, string> = {
  'Submitted': '#3b82f6',
  'Under Review': '#6366f1',
  'Document Verification': '#f59e0b',
  'Action Document Needed': '#eab308',
  'Processing': '#0ea5e9',
  'Approved': '#10b981',
  'Rejected': '#ef4444',
  'Ready for Download': '#059669',
  'Completed': '#0d9488',
  'Cancelled': '#94a3b8'
};

const CHART_COLORS = ['#1e40af', '#0284c7', '#0d9488', '#d97706', '#dc2626', '#7c3aed', '#059669'];

export const AdminDashboard: React.FC = () => {
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const res = await adminService.getDashboard();
      if (res.success && res.data) {
        setData(res.data);
      }
      setLoading(false);
    }
    load();
  }, []);

  if (loading || !data) {
    return <div className="p-12 text-center text-xs text-slate-500">Loading government analytics dashboard...</div>;
  }

  const { summary, requestsByStatus, requestsByDocumentType, requestsPerMonth, recentRequests } = data;

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-700 uppercase tracking-wider mb-1">
              <Building2 className="w-4 h-4" />
              Executive Administrative Console
            </div>
            <h1 className="text-2xl font-bold text-slate-900">
              Departmental Verification & Processing Dashboard
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Live metrics across civil departments, application queues, and document issuance SLA.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/admin/requests"
              className="px-4 py-2.5 rounded-lg text-xs font-bold text-white bg-blue-800 hover:bg-blue-900 transition-colors flex items-center gap-2 shadow-xs"
            >
              <FileText className="w-4 h-4" />
              Open Processing Queue
            </Link>
          </div>
        </div>

        {/* Metric Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 mb-8">
          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
            <span className="text-[11px] text-slate-500 block mb-1">Total Received</span>
            <p className="text-2xl font-extrabold text-slate-900">{summary.total}</p>
            <span className="text-[10px] text-slate-400">Applications filed</span>
          </div>

          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
            <span className="text-[11px] text-blue-700 block mb-1 font-semibold">Under Review</span>
            <p className="text-2xl font-extrabold text-blue-900">{summary.underReview}</p>
            <span className="text-[10px] text-slate-400">Desk scrutiny</span>
          </div>

          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
            <span className="text-[11px] text-amber-700 block mb-1 font-semibold">Doc Verification</span>
            <p className="text-2xl font-extrabold text-amber-700">{summary.documentVerification}</p>
            <span className="text-[10px] text-slate-400">Proof validation</span>
          </div>

          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
            <span className="text-[11px] text-sky-700 block mb-1 font-semibold">Processing</span>
            <p className="text-2xl font-extrabold text-sky-700">{summary.processing}</p>
            <span className="text-[10px] text-slate-400">Draft clearance</span>
          </div>

          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
            <span className="text-[11px] text-emerald-700 block mb-1 font-semibold">Sanctioned</span>
            <p className="text-2xl font-extrabold text-emerald-700">{summary.approved + summary.readyForDownload}</p>
            <span className="text-[10px] text-slate-400">Approved / Ready</span>
          </div>

          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
            <span className="text-[11px] text-red-700 block mb-1 font-semibold">Rejected</span>
            <p className="text-2xl font-extrabold text-red-700">{summary.rejected}</p>
            <span className="text-[10px] text-slate-400">Failed statutory criteria</span>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Chart 1: Applications by Status */}
          <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-blue-700" />
                Requests by Workflow Stage
              </h3>
              <span className="text-xs text-slate-400 font-mono">Live DB records</span>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={requestsByStatus} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="name"
                    interval={0}
                    angle={-25}
                    textAnchor="end"
                    tick={{ fontSize: 10, fill: '#64748b' }}
                  />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '12px',
                      border: 'none'
                    }}
                  />
                  <Bar dataKey="count" fill="#2563eb" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Applications by Document Type */}
          <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-700" />
                Volume by Certificate Type
              </h3>
              <span className="text-xs text-slate-400 font-mono">Departmental load</span>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={requestsByDocumentType}
                  margin={{ top: 10, right: 20, left: 30, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 10, fill: '#334155' }}
                    width={110}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '12px',
                      border: 'none'
                    }}
                  />
                  <Bar dataKey="count" fill="#0d9488" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Priority Processing Queue Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Recent Applications Awaiting Review</h2>
              <p className="text-xs text-slate-500 mt-0.5">Click any request to examine citizen proofs and sanction status</p>
            </div>
            <Link
              to="/admin/requests"
              className="text-xs font-semibold text-blue-700 hover:text-blue-900 flex items-center gap-1"
            >
              View Full Queue ({summary.total}) →
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3.5">Reference #</th>
                  <th className="px-5 py-3.5">Applicant Name</th>
                  <th className="px-5 py-3.5">Document Type</th>
                  <th className="px-5 py-3.5">Submitted On</th>
                  <th className="px-5 py-3.5">Current Status</th>
                  <th className="px-5 py-3.5">Assigned Officer</th>
                  <th className="px-5 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentRequests.map((req) => {
                  const citizen = req.citizen as any;
                  return (
                    <tr key={req._id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-4 font-mono font-bold text-slate-900">
                        {req.requestNumber}
                      </td>
                      <td className="px-5 py-4 font-medium text-slate-800">
                        {citizen ? `${citizen.firstName} ${citizen.lastName || ''}` : 'Citizen'}
                        <div className="text-[10px] text-slate-400 font-mono">{citizen?.mobileNumber}</div>
                      </td>
                      <td className="px-5 py-4 text-slate-700">
                        {(req.documentType as any)?.name || 'Document'}
                      </td>
                      <td className="px-5 py-4 text-slate-500">
                        {new Date(req.submittedAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric'
                        })}
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge status={req.status} size="sm" />
                      </td>
                      <td className="px-5 py-4 text-slate-600 truncate max-w-xs">
                        {req.assignedOfficer || 'General Registry'}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <Link
                          to={`/admin/requests/${req._id}`}
                          className="px-3 py-1.5 rounded-md bg-blue-800 text-white font-semibold text-xs hover:bg-blue-900 inline-flex items-center gap-1 shadow-2xs transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Process Request
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
