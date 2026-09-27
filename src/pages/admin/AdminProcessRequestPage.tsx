import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { adminService } from '../../services/adminService.js';
import { RequestItem, RequestStatus } from '../../types/index.js';
import { StatusBadge } from '../../components/StatusBadge.js';
import { TimelineView } from '../../components/TimelineView.js';
import { Modal } from '../../components/Modal.js';
import { VALID_STATUS_TRANSITIONS } from '../../../server/services/statusWorkflow.js';
import {
  FileText,
  User,
  Building2,
  Calendar,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Upload,
  Download,
  ArrowLeft,
  FileCheck,
  ShieldCheck,
  Send,
  MessageSquare
} from 'lucide-react';

export const AdminProcessRequestPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [request, setRequest] = useState<RequestItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Status update state
  const [targetStatus, setTargetStatus] = useState<RequestStatus | ''>('');
  const [remarks, setRemarks] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);

  // Document verification modal state
  const [verifyModalOpen, setVerifyModalOpen] = useState(false);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [verifyAction, setVerifyAction] = useState<'VERIFIED' | 'REJECTED'>('VERIFIED');
  const [verifyRemarks, setVerifyRemarks] = useState('');
  const [verifyingDoc, setVerifyingDoc] = useState(false);

  // Additional document request modal state
  const [additionalModalOpen, setAdditionalModalOpen] = useState(false);
  const [addDocName, setAddDocName] = useState('');
  const [addDocInstructions, setAddDocInstructions] = useState('');
  const [requestingAddDoc, setRequestingAddDoc] = useState(false);

  // Final document upload modal state
  const [finalDocModalOpen, setFinalDocModalOpen] = useState(false);
  const [finalFile, setFinalFile] = useState<File | null>(null);
  const [uploadingFinalDoc, setUploadingFinalDoc] = useState(false);

  const fetchRequest = async () => {
    if (!id) return;
    setLoading(true);
    const res = await adminService.getRequestById(id);
    setLoading(false);

    if (res.success && res.data) {
      setRequest(res.data);
      // Auto-populate first valid next status
      const validNext = VALID_STATUS_TRANSITIONS[res.data.status] || [];
      if (validNext.length > 0) {
        setTargetStatus(validNext[0]);
      } else {
        setTargetStatus('');
      }
    } else {
      setError(res.message || 'Failed to load request.');
    }
  };

  useEffect(() => {
    fetchRequest();
  }, [id]);

  const handleStatusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !targetStatus) return;

    setUpdatingStatus(true);
    setStatusError(null);

    const res = await adminService.updateRequestStatus(id, {
      status: targetStatus as RequestStatus,
      remarks: remarks.trim() || undefined
    });
    setUpdatingStatus(false);

    if (res.success) {
      setRemarks('');
      fetchRequest();
    } else {
      setStatusError(res.message || 'Status transition failed.');
    }
  };

  const handleVerifySubmit = async () => {
    if (!id || !selectedDocId) return;

    if (verifyAction === 'REJECTED' && !verifyRemarks.trim()) {
      alert('Remarks are mandatory when rejecting a supporting document.');
      return;
    }

    setVerifyingDoc(true);
    const res = await adminService.verifyDocument(id, selectedDocId, {
      status: verifyAction,
      remarks: verifyRemarks.trim()
    });
    setVerifyingDoc(false);
    setVerifyModalOpen(false);

    if (res.success) {
      fetchRequest();
    }
  };

  const handleRequestAdditional = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !addDocName.trim() || !addDocInstructions.trim()) return;

    setRequestingAddDoc(true);
    const res = await adminService.requestAdditionalDocument(id, {
      documentName: addDocName.trim(),
      instructions: addDocInstructions.trim()
    });
    setRequestingAddDoc(false);
    setAdditionalModalOpen(false);

    if (res.success) {
      setAddDocName('');
      setAddDocInstructions('');
      fetchRequest();
    }
  };

  const handleUploadFinal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    setUploadingFinalDoc(true);
    const formData = new FormData();
    if (finalFile) {
      formData.append('file', finalFile);
    }

    const res = await adminService.uploadFinalDocument(id, formData);
    setUploadingFinalDoc(false);
    setFinalDocModalOpen(false);

    if (res.success) {
      setFinalFile(null);
      fetchRequest();
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-xs text-slate-500">Loading request workspace...</div>;
  }

  if (error || !request) {
    return (
      <div className="max-w-3xl mx-auto py-12 px-4 text-center">
        <AlertTriangle className="w-10 h-10 text-red-600 mx-auto mb-3" />
        <h2 className="text-base font-bold text-slate-900">Request Not Found</h2>
        <p className="text-xs text-slate-600 mt-1">{error}</p>
        <Link
          to="/admin/requests"
          className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-blue-800 text-white rounded-md text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Queue
        </Link>
      </div>
    );
  }

  const citizen = request.citizen as any;
  const docType = request.documentType as any;
  const validTransitions = VALID_STATUS_TRANSITIONS[request.status] || [];

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Back Navigation */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            to="/admin/requests"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Application Queue
          </Link>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setAdditionalModalOpen(true)}
              className="px-3 py-1.5 rounded-lg border border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100 text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
              Request Additional Document
            </button>
            <button
              onClick={() => setFinalDocModalOpen(true)}
              className="px-3 py-1.5 rounded-lg border border-emerald-300 bg-emerald-50 text-emerald-900 hover:bg-emerald-100 text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
              Issue Final Digital Certificate
            </button>
          </div>
        </div>

        {/* Master Header */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden mb-8">
          <div className="bg-slate-900 text-white p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-mono text-slate-400">APPLICATION NO.</span>
                <span className="text-sm font-black text-amber-400 bg-amber-950 px-2 py-0.5 rounded font-mono">
                  {request.requestNumber}
                </span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-white">
                {docType?.name || 'Certificate'}
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Department: {request.currentDepartment} · Assigned Officer: {request.assignedOfficer || 'General Registry'}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <StatusBadge status={request.status} size="lg" />
            </div>
          </div>

          <div className="p-6 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs bg-slate-50/50 border-t border-slate-100">
            <div>
              <span className="text-slate-400 block mb-0.5">Citizen Applicant</span>
              <span className="font-bold text-slate-900 text-sm">
                {citizen?.firstName} {citizen?.lastName}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Submitted Date</span>
              <span className="font-semibold text-slate-800">
                {new Date(request.submittedAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Target SLA Date</span>
              <span className="font-semibold text-blue-900">
                {new Date(request.expectedCompletionDate).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Statutory Fee</span>
              <span className="font-bold text-slate-900">
                {docType?.fee === 0 ? 'Free (₹0)' : `₹${docType?.fee || 50}`}
              </span>
            </div>
          </div>
        </div>

        {/* Two-Column Workspace Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* LEFT COLUMN: Citizen Identity, Application Data & Uploaded Documents (7 Cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Citizen Identity */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
              <h2 className="text-sm font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
                <User className="w-4 h-4 text-blue-700" />
                Citizen Applicant Dossier
              </h2>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block">Full Name:</span>
                  <span className="font-semibold text-slate-800">{citizen?.firstName} {citizen?.lastName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Mobile:</span>
                  <span className="font-semibold text-slate-800 font-mono">{citizen?.mobileNumber}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Email:</span>
                  <span className="font-semibold text-slate-800">{citizen?.email}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Jurisdiction / District:</span>
                  <span className="font-semibold text-slate-800">{citizen?.district || 'Suburban'}, {citizen?.state || 'MH'}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-400 block">Permanent Address:</span>
                  <span className="text-slate-700">{citizen?.address || 'Not specified'}, {citizen?.city} - {citizen?.pincode}</span>
                </div>
              </div>
            </div>

            {/* Application Data */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
              <h2 className="text-sm font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-700" />
                Declared Application Information
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {Object.keys(request.applicationData || {}).map((key) => (
                  <div key={key} className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <span className="text-slate-400 capitalize block mb-0.5">
                      {key.replace(/([A-Z])/g, ' $1')}:
                    </span>
                    <span className="font-semibold text-slate-800">
                      {String(request.applicationData[key])}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Uploaded Supporting Documents with Verification Actions */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-blue-700" />
                  Uploaded Supporting Enclosures ({request.uploadedDocuments?.length || 0})
                </h2>
                <span className="text-[11px] text-slate-500 font-mono">UIDAI & Statutory Proofs</span>
              </div>

              {request.uploadedDocuments?.length === 0 ? (
                <p className="text-xs text-slate-500 italic">No files attached to this request.</p>
              ) : (
                <div className="space-y-3">
                  {request.uploadedDocuments?.map((doc) => (
                    <div
                      key={doc._id}
                      className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{doc.documentType}</span>
                          <span className="text-slate-400 font-mono text-[11px]">({doc.originalName})</span>
                        </div>
                        {doc.verificationRemarks && (
                          <p className="text-[11px] text-slate-500 mt-1 italic">
                            Officer remark: "{doc.verificationRemarks}"
                          </p>
                        )}
                        <div className="mt-1">
                          <span
                            className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded border ${
                              doc.verificationStatus === 'VERIFIED'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                : doc.verificationStatus === 'REJECTED'
                                ? 'bg-red-50 text-red-800 border-red-300'
                                : 'bg-amber-50 text-amber-800 border-amber-300'
                            }`}
                          >
                            STATUS: {doc.verificationStatus}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <a
                          href={`/api/requests/${request._id}/documents/${doc._id}/download`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1.5 rounded bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 font-medium text-xs flex items-center gap-1 shadow-2xs"
                        >
                          <Download className="w-3.5 h-3.5" />
                          View File
                        </a>

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedDocId(doc._id);
                            setVerifyAction('VERIFIED');
                            setVerifyRemarks('UIDAI signature and document integrity validated.');
                            setVerifyModalOpen(true);
                          }}
                          className="px-2.5 py-1.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs flex items-center gap-1 shadow-2xs"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          Verify
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedDocId(doc._id);
                            setVerifyAction('REJECTED');
                            setVerifyRemarks('');
                            setVerifyModalOpen(true);
                          }}
                          className="px-2.5 py-1.5 rounded bg-red-600 hover:bg-red-700 text-white font-medium text-xs flex items-center gap-1 shadow-2xs"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: Officer Status Transition Controls & Timeline (5 Cols) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Status Update Card */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
              <h2 className="text-sm font-bold text-slate-900 mb-3 pb-2 border-b border-slate-100 flex items-center gap-2">
                <Send className="w-4 h-4 text-blue-700" />
                Transition Application Stage
              </h2>

              {statusError && (
                <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800">
                  {statusError}
                </div>
              )}

              {validTransitions.length === 0 ? (
                <div className="p-4 bg-slate-50 rounded-lg text-xs text-slate-600 border border-slate-200">
                  This application is in a terminal status (<strong className="text-slate-900">{request.status}</strong>). No further stage transitions are permitted.
                </div>
              ) : (
                <form onSubmit={handleStatusSubmit} className="space-y-4 text-xs">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      Target Status (Allowed Transitions) *
                    </label>
                    <select
                      value={targetStatus}
                      onChange={(e) => setTargetStatus(e.target.value as RequestStatus)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-800 font-medium"
                    >
                      {validTransitions.map((st) => (
                        <option key={st} value={st}>
                          {st.replace(/_/g, ' ')}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      Departmental Scrutiny Remarks
                    </label>
                    <textarea
                      rows={3}
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      placeholder="Add official remarks, verification notes, or sanctioning instructions (visible to citizen)..."
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={updatingStatus || !targetStatus}
                    className="w-full py-2.5 rounded-lg bg-blue-800 hover:bg-blue-900 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors"
                  >
                    {updatingStatus ? 'Updating Stage...' : 'Apply Status Update & Notify Citizen'}
                  </button>
                </form>
              )}
            </div>

            {/* Timeline View */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
              <h2 className="text-sm font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100">
                Official Status History Log
              </h2>

              <TimelineView
                currentStatus={request.status}
                statusHistory={request.statusHistory}
                expectedDate={request.expectedCompletionDate}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Verify/Reject Document Modal */}
      <Modal
        isOpen={verifyModalOpen}
        onClose={() => setVerifyModalOpen(false)}
        title={verifyAction === 'VERIFIED' ? 'Mark Document as Verified' : 'Reject Supporting Document'}
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-600">
            {verifyAction === 'VERIFIED'
              ? 'Confirm that this document has been cross-referenced with official records and satisfies statutory scrutiny.'
              : 'Please state the explicit reason for rejecting this document so the citizen can provide an acceptable alternative.'}
          </p>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Verification Remarks {verifyAction === 'REJECTED' && '*'}
            </label>
            <textarea
              rows={3}
              value={verifyRemarks}
              onChange={(e) => setVerifyRemarks(e.target.value)}
              placeholder={verifyAction === 'VERIFIED' ? 'e.g. Validated against UIDAI ledger' : 'e.g. Illegible scan; address does not match declared jurisdiction'}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setVerifyModalOpen(false)}
              className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={verifyingDoc}
              onClick={handleVerifySubmit}
              className={`px-4 py-2 text-white font-bold rounded-lg ${
                verifyAction === 'VERIFIED' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              {verifyingDoc ? 'Saving...' : `Confirm ${verifyAction}`}
            </button>
          </div>
        </div>
      </Modal>

      {/* Request Additional Document Modal */}
      <Modal
        isOpen={additionalModalOpen}
        onClose={() => setAdditionalModalOpen(false)}
        title="Request Additional Document from Applicant"
      >
        <form onSubmit={handleRequestAdditional} className="space-y-4 text-xs">
          <p className="text-slate-600">
            This will transition application <strong className="font-mono">{request.requestNumber}</strong> to{' '}
            <strong className="text-amber-700">ADDITIONAL_DOCUMENT_REQUIRED</strong> and dispatch an instant notification to the citizen.
          </p>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Required Document Name *
            </label>
            <input
              type="text"
              required
              value={addDocName}
              onChange={(e) => setAddDocName(e.target.value)}
              placeholder="e.g. Father's 1967 School Leaving Certificate / Latest Form 16"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Specific Instructions to Citizen *
            </label>
            <textarea
              rows={3}
              required
              value={addDocInstructions}
              onChange={(e) => setAddDocInstructions(e.target.value)}
              placeholder="Explain clearly why this document is required and what format is acceptable..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setAdditionalModalOpen(false)}
              className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={requestingAddDoc}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg shadow-xs"
            >
              {requestingAddDoc ? 'Dispatching...' : 'Dispatch Request to Citizen'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Upload Final Digital Document Modal */}
      <Modal
        isOpen={finalDocModalOpen}
        onClose={() => setFinalDocModalOpen(false)}
        title="Issue Official Final Certificate"
      >
        <form onSubmit={handleUploadFinal} className="space-y-4 text-xs">
          <p className="text-slate-600">
            Upload the officially signed digital certificate or let the system generate the cryptographic demo certificate. This will mark the application as{' '}
            <strong className="text-emerald-700">READY_FOR_DOWNLOAD</strong> and enable instant download on the citizen portal.
          </p>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Attach Signed Certificate PDF (Optional — system auto-generates if omitted)
            </label>
            <input
              type="file"
              accept=".pdf,.png,.jpg"
              onChange={(e) => setFinalFile(e.target.files?.[0] || null)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setFinalDocModalOpen(false)}
              className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploadingFinalDoc}
              className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg shadow-xs"
            >
              {uploadingFinalDoc ? 'Issuing...' : 'Issue & Mark Ready for Download'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
