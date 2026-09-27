import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { requestService } from '../../services/requestService.js';
import { RequestItem } from '../../types/index.js';
import { StatusBadge } from '../../components/StatusBadge.js';
import { TimelineView } from '../../components/TimelineView.js';
import { Modal } from '../../components/Modal.js';
import {
  FileText,
  Clock,
  Building2,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Download,
  Upload,
  Ban,
  FileCheck,
  ArrowLeft,
  XCircle,
  ShieldCheck,
  User
} from 'lucide-react';

export const RequestDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [request, setRequest] = useState<RequestItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Additional document upload state
  const [additionalFile, setAdditionalFile] = useState<File | null>(null);
  const [additionalDocName, setAdditionalDocName] = useState('');
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Cancellation modal state
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const fetchRequest = async () => {
    if (!id) return;
    setLoading(true);
    const res = await requestService.getRequestById(id);
    setLoading(false);

    if (res.success && res.data) {
      setRequest(res.data);
    } else {
      setError(res.message || 'Failed to retrieve application details.');
    }
  };

  useEffect(() => {
    fetchRequest();
  }, [id]);

  const handleUploadAdditional = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !additionalFile) return;

    setUploadingDoc(true);
    setUploadError(null);

    const formData = new FormData();
    formData.append('file', additionalFile);
    formData.append('documentType', additionalDocName || 'Requested Additional Document');

    const res = await requestService.uploadAdditionalDocument(id, formData);
    setUploadingDoc(false);

    if (res.success) {
      setAdditionalFile(null);
      setAdditionalDocName('');
      fetchRequest();
    } else {
      setUploadError(res.message || 'Upload failed.');
    }
  };

  const handleCancelRequest = async () => {
    if (!id) return;
    setCancelling(true);
    const res = await requestService.cancelRequest(id);
    setCancelling(false);
    setCancelModalOpen(false);

    if (res.success) {
      fetchRequest();
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-xs text-slate-500">Loading application details...</div>;
  }

  if (error || !request) {
    return (
      <div className="max-w-3xl mx-auto py-12 px-4 text-center">
        <AlertCircle className="w-10 h-10 text-red-600 mx-auto mb-3" />
        <h2 className="text-base font-bold text-slate-900">Application Error</h2>
        <p className="text-xs text-slate-600 mt-1">{error}</p>
        <Link
          to="/citizen/requests"
          className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-blue-700 text-white rounded-md text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Applications
        </Link>
      </div>
    );
  }

  const docType = request.documentType as any;
  const isActionRequired = request.status === 'ADDITIONAL_DOCUMENT_REQUIRED';
  const isReady = ['READY_FOR_DOWNLOAD', 'COMPLETED', 'APPROVED'].includes(request.status);
  const canCancel = request.status === 'SUBMITTED';

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Breadcrumb & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <Link
            to="/citizen/requests"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to My Applications
          </Link>

          {canCancel && (
            <button
              onClick={() => setCancelModalOpen(true)}
              className="px-3 py-1.5 rounded-lg border border-red-200 text-red-700 hover:bg-red-50 text-xs font-semibold flex items-center gap-1.5 transition-colors self-start sm:self-auto"
            >
              <Ban className="w-3.5 h-3.5" />
              Cancel Application
            </button>
          )}
        </div>

        {/* Header Summary Banner */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden mb-8">
          <div className="bg-slate-900 text-white p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-mono text-slate-400">Reference Number</span>
                <span className="text-xs font-bold text-amber-400 bg-amber-950 px-2 py-0.5 rounded font-mono">
                  {request.requestNumber}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                {docType?.name || 'Certificate Application'}
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Department: {request.currentDepartment} · Assigned Desk: {request.assignedOfficer || 'General Registry'}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <StatusBadge status={request.status} size="lg" />
            </div>
          </div>

          <div className="p-6 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs bg-slate-50/50 border-t border-slate-100">
            <div>
              <span className="text-slate-400 block mb-0.5">Submitted On</span>
              <span className="font-semibold text-slate-800">
                {new Date(request.submittedAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Estimated Delivery SLA</span>
              <span className="font-semibold text-blue-900">
                {new Date(request.expectedCompletionDate).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Last Status Update</span>
              <span className="font-semibold text-slate-800">
                {new Date(request.lastUpdatedAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Statutory Fee</span>
              <span className="font-bold text-slate-900">
                {docType?.fee === 0 ? 'Free' : `₹${docType?.fee || 50}`}
              </span>
            </div>
          </div>

          {/* Remarks Banner */}
          {request.remarks && (
            <div className="px-6 py-3 bg-blue-50/70 border-t border-blue-100 text-xs text-blue-900 flex items-start gap-2">
              <FileText className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">Departmental Note: </span>
                <span>{request.remarks}</span>
              </div>
            </div>
          )}
        </div>

        {/* Ready for Download Callout Card */}
        {isReady && (
          <div className="mb-8 p-6 rounded-xl bg-emerald-50 border border-emerald-300 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-7 h-7 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-emerald-950">Official Certificate Ready for Download</h3>
                <p className="text-xs text-emerald-700 mt-0.5">
                  Your certificate has been sanctioned with electronic signature. You may download and print the certified document.
                </p>
              </div>
            </div>

            <a
              href={`/api/requests/${request._id}/final-document/download`}
              download
              className="px-6 py-3 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-colors shrink-0"
            >
              <Download className="w-4 h-4" />
              Download Official Certificate
            </a>
          </div>
        )}

        {/* Action Required: Upload Additional Document Card */}
        {isActionRequired && (
          <div className="mb-8 p-6 rounded-xl bg-amber-50 border border-amber-300 shadow-xs">
            <div className="flex items-start gap-3 mb-4">
              <AlertCircle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-base font-bold text-amber-950">Action Required: Upload Additional Document</h3>
                <p className="text-xs text-amber-800 mt-1">
                  The reviewing officer requires supplementary records to verify your request. Please upload the requested file below to return your application to the active verification queue.
                </p>
                <div className="mt-2 p-3 bg-white/80 rounded border border-amber-200 text-xs text-slate-800">
                  <span className="font-semibold text-amber-900">Officer Instructions: </span>
                  <span>{request.remarks}</span>
                </div>
              </div>
            </div>

            {uploadError && (
              <div className="mb-4 p-3 rounded bg-red-50 border border-red-200 text-xs text-red-700">
                {uploadError}
              </div>
            )}

            <form onSubmit={handleUploadAdditional} className="flex flex-col sm:flex-row items-center gap-3">
              <input
                type="text"
                placeholder="Document Description (e.g. Latest Income Proof / Father's TC)"
                value={additionalDocName}
                onChange={(e) => setAdditionalDocName(e.target.value)}
                className="w-full sm:w-1/2 px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
              />
              <label className="w-full sm:w-auto cursor-pointer inline-flex items-center justify-center gap-2 px-4 py-2 border border-slate-300 rounded-lg bg-white text-slate-700 hover:bg-slate-50 text-xs font-medium">
                <Upload className="w-3.5 h-3.5 text-blue-700" />
                {additionalFile ? additionalFile.name : 'Choose Scanned File (PDF/Image)'}
                <input
                  type="file"
                  required
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="hidden"
                  onChange={(e) => setAdditionalFile(e.target.files?.[0] || null)}
                />
              </label>
              <button
                type="submit"
                disabled={uploadingDoc || !additionalFile}
                className="w-full sm:w-auto px-5 py-2 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold disabled:opacity-40 transition-colors shadow-xs"
              >
                {uploadingDoc ? 'Uploading...' : 'Submit Document to Officer'}
              </button>
            </form>
          </div>
        )}

        {/* Two Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Application Details & Enclosures */}
          <div className="lg:col-span-2 space-y-6">
            {/* Application Data */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
              <h2 className="text-sm font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-700" />
                Application Declaration Records
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                {Object.keys(request.applicationData || {}).map((key) => (
                  <div key={key} className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <span className="text-slate-400 capitalize block mb-0.5">
                      {key.replace(/([A-Z])/g, ' $1')}
                    </span>
                    <span className="font-semibold text-slate-800">
                      {String(request.applicationData[key])}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Uploaded Supporting Documents */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
              <h2 className="text-sm font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-blue-700" />
                Supporting Enclosures & Verification Status ({request.uploadedDocuments?.length || 0})
              </h2>

              {request.uploadedDocuments?.length === 0 ? (
                <p className="text-xs text-slate-500 italic">No files attached with this application.</p>
              ) : (
                <div className="space-y-3">
                  {request.uploadedDocuments?.map((doc, idx) => (
                    <div
                      key={doc._id || idx}
                      className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800">{doc.documentType}</span>
                          <span className="text-slate-400 font-mono text-[11px]">({doc.originalName})</span>
                        </div>
                        {doc.verificationRemarks && (
                          <p className="text-[11px] text-slate-500 mt-1 italic">
                            Officer remark: "{doc.verificationRemarks}"
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        <span
                          className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${
                            doc.verificationStatus === 'VERIFIED'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : doc.verificationStatus === 'REJECTED'
                              ? 'bg-red-50 text-red-700 border-red-200'
                              : 'bg-amber-50 text-amber-800 border-amber-200'
                          }`}
                        >
                          {doc.verificationStatus}
                        </span>

                        <a
                          href={`/api/requests/${request._id}/documents/${doc._id}/download`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1 rounded bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 font-medium text-xs flex items-center gap-1 shadow-2xs"
                        >
                          <Download className="w-3 h-3 text-slate-500" />
                          View
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Status Pipeline & Timeline History */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
              <h2 className="text-sm font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100">
                Application Timeline
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

      {/* Cancellation Modal */}
      <Modal
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        title="Confirm Application Cancellation"
      >
        <div className="space-y-4 text-xs text-slate-600">
          <p>
            Are you sure you want to cancel application{' '}
            <strong className="text-slate-900 font-mono">{request.requestNumber}</strong>?
          </p>
          <p className="p-3 rounded bg-amber-50 border border-amber-200 text-amber-800">
            <strong>Notice:</strong> Cancellation is irreversible. Once cancelled, your request will not be reviewed by the department and you will need to file a fresh submission if needed.
          </p>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setCancelModalOpen(false)}
              className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-50"
            >
              No, Keep Application
            </button>
            <button
              type="button"
              disabled={cancelling}
              onClick={handleCancelRequest}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg shadow-xs"
            >
              {cancelling ? 'Cancelling...' : 'Yes, Cancel Application'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
