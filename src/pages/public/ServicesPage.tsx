import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { publicService } from '../../services/publicService.js';
import { DocumentType } from '../../types/index.js';
import { useAuth } from '../../context/AuthContext.js';
import {
  Search,
  Clock,
  IndianRupee,
  FileText,
  FileCheck,
  Building2,
  CheckCircle2,
  Filter,
  ArrowRight
} from 'lucide-react';

export const ServicesPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [docTypes, setDocTypes] = useState<DocumentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [selectedDocForDetails, setSelectedDocForDetails] = useState<DocumentType | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const res = await publicService.getPublicDocumentTypes();
      if (res.success && res.data) {
        setDocTypes(res.data);
      }
      setLoading(false);
    }
    load();
  }, []);

  const departments = ['ALL', ...Array.from(new Set(docTypes.map((d) => d.department)))];

  const filtered = docTypes.filter((d) => {
    const matchDept = selectedDept === 'ALL' || d.department === selectedDept;
    const matchSearch =
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.description.toLowerCase().includes(search.toLowerCase());
    return matchDept && matchSearch;
  });

  const handleApplyClick = (docId: string) => {
    if (!isAuthenticated) {
      navigate(`/login?redirect=/citizen/apply?docType=${docId}`);
    } else if (user?.role === 'admin') {
      navigate('/admin/dashboard');
    } else {
      navigate(`/citizen/apply?docType=${docId}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-700 uppercase tracking-wider mb-1">
            <Building2 className="w-4 h-4" />
            Citizen Directory
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            Available Government Certificates & Documents
          </h1>
          <p className="text-sm text-slate-600 mt-1 max-w-3xl">
            Browse through all statutory certificates issued across departments. Check eligibility, processing turn-around times, and required proofs before applying.
          </p>
        </div>

        {/* Search & Department Filters */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs mb-8 flex flex-col md:flex-row items-center gap-4">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by certificate name or keywords (e.g. Income, Caste, Birth)..."
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="text-xs font-medium text-slate-500 shrink-0">Department:</span>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept === 'ALL' ? 'All Departments' : dept}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Service Cards Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-64 rounded-xl bg-white border border-slate-200 animate-pulse p-6" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
            <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-slate-800">No matching certificates found</h3>
            <p className="text-xs text-slate-500 mt-1">Try clearing your search query or department filter.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((doc) => (
              <div
                key={doc._id}
                className="bg-white rounded-xl border border-slate-200 hover:border-slate-300 shadow-xs hover:shadow-md transition-all flex flex-col justify-between p-6"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-[11px] font-semibold text-blue-800 bg-blue-50 px-2 py-0.5 rounded">
                      {doc.department}
                    </span>
                    <span className="text-xs font-mono text-slate-500 flex items-center gap-1 shrink-0">
                      <Clock className="w-3.5 h-3.5" />
                      {doc.processingTime} Days
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 mt-1">{doc.name}</h3>
                  <p className="text-xs text-slate-600 mt-2 line-clamp-3 leading-relaxed">
                    {doc.description}
                  </p>

                  {/* Required Documents Checklist preview */}
                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <h4 className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
                      Required Enclosures ({doc.requiredDocuments?.length || 0}):
                    </h4>
                    <ul className="space-y-1">
                      {doc.requiredDocuments?.slice(0, 3).map((reqDoc, idx) => (
                        <li key={idx} className="flex items-center gap-1.5 text-xs text-slate-700 truncate">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span className="truncate">{reqDoc.name}</span>
                          {reqDoc.isRequired && (
                            <span className="text-[10px] text-red-600 font-bold">*</span>
                          )}
                        </li>
                      ))}
                      {(doc.requiredDocuments?.length || 0) > 3 && (
                        <li className="text-[11px] text-blue-600 font-medium pl-5">
                          +{(doc.requiredDocuments?.length || 0) - 3} more supporting proofs
                        </li>
                      )}
                    </ul>
                  </div>
                </div>

                <div className="pt-5 mt-4 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-medium">Statutory Fee</span>
                    <span className="text-sm font-bold text-slate-900">
                      {doc.fee === 0 ? 'Free (₹0)' : `₹${doc.fee}`}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleApplyClick(doc._id)}
                      className="px-4 py-2 rounded-lg text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 transition-colors flex items-center gap-1 shadow-xs"
                    >
                      Apply Online
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
