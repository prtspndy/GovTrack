import React from 'react';
import { RequestStatusHistory, RequestStatus } from '../types/index.js';
import { Check, Clock, AlertCircle, X, ShieldAlert, Award, FileText } from 'lucide-react';

interface TimelineViewProps {
  currentStatus: RequestStatus;
  statusHistory?: RequestStatusHistory[];
  expectedDate?: string;
}

export const STAGE_STEPS: { key: RequestStatus; label: string; desc: string }[] = [
  { key: 'SUBMITTED', label: 'Application Submitted', desc: 'Application received and registered in portal' },
  { key: 'UNDER_REVIEW', label: 'Under Review', desc: 'Departmental desk assigned for preliminary scrutiny' },
  { key: 'DOCUMENT_VERIFICATION', label: 'Document Verification', desc: 'UIDAI & statutory certificates cross-verified' },
  { key: 'PROCESSING', label: 'Processing', desc: 'Field report clearance and draft certificate preparation' },
  { key: 'APPROVED', label: 'Approved', desc: 'Sanctioned by competent revenue / authorized officer' },
  { key: 'READY_FOR_DOWNLOAD', label: 'Ready for Download', desc: 'Digitally signed electronic certificate generated' }
];

export const TimelineView: React.FC<TimelineViewProps> = ({ currentStatus, statusHistory = [] }) => {
  const isTerminalNegative = currentStatus === 'REJECTED' || currentStatus === 'CANCELLED';

  // Map recorded events for quick lookup
  const historyMap = new Map<string, RequestStatusHistory>();
  statusHistory.forEach((h) => {
    historyMap.set(h.newStatus, h);
  });

  const getStepState = (stepKey: RequestStatus, index: number) => {
    if (isTerminalNegative) {
      if (historyMap.has(stepKey)) return 'completed';
      return 'skipped';
    }

    const currentIdx = STAGE_STEPS.findIndex((s) => s.key === currentStatus);
    if (currentStatus === 'COMPLETED' || (currentStatus === 'READY_FOR_DOWNLOAD' && stepKey === 'READY_FOR_DOWNLOAD')) {
      return 'completed';
    }
    if (currentIdx === -1) {
      // Could be ADDITIONAL_DOCUMENT_REQUIRED
      if (currentStatus === 'ADDITIONAL_DOCUMENT_REQUIRED' && stepKey === 'DOCUMENT_VERIFICATION') {
        return 'warning';
      }
      return historyMap.has(stepKey) ? 'completed' : 'pending';
    }

    if (index < currentIdx) return 'completed';
    if (index === currentIdx) return 'current';
    return 'pending';
  };

  return (
    <div className="space-y-6">
      {/* Visual Stepper Bar */}
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
          Statutory Lifecycle Pipeline
        </h3>

        <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-3 sm:before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
          {STAGE_STEPS.map((step, idx) => {
            const state = getStepState(step.key, idx);
            const historyEntry = historyMap.get(step.key);

            let nodeIcon = <Clock className="w-3.5 h-3.5 text-slate-400" />;
            let nodeBg = 'bg-white border-2 border-slate-300 text-slate-400';
            let labelClass = 'text-slate-500';

            if (state === 'completed') {
              nodeIcon = <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />;
              nodeBg = 'bg-emerald-600 border-2 border-emerald-600 text-white';
              labelClass = 'text-slate-900 font-semibold';
            } else if (state === 'current') {
              nodeIcon = <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />;
              nodeBg = 'bg-blue-50 border-2 border-blue-600 text-blue-600';
              labelClass = 'text-blue-900 font-bold';
            } else if (state === 'warning') {
              nodeIcon = <AlertCircle className="w-3.5 h-3.5 text-amber-600" />;
              nodeBg = 'bg-amber-100 border-2 border-amber-500 text-amber-700';
              labelClass = 'text-amber-900 font-semibold';
            }

            return (
              <div key={step.key} className="relative flex items-start group">
                <div
                  className={`absolute -left-6 sm:-left-8 top-0.5 flex items-center justify-center w-6 h-6 rounded-full transition-colors ${nodeBg}`}
                >
                  {nodeIcon}
                </div>
                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                    <span className={`text-sm ${labelClass}`}>{step.label}</span>
                    {historyEntry && (
                      <span className="text-xs text-slate-500 font-mono">
                        {new Date(historyEntry.timestamp).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{step.desc}</p>

                  {/* Officer Remarks snippet */}
                  {historyEntry && historyEntry.remarks && (
                    <div className="mt-2 p-2.5 rounded bg-white border border-slate-200 text-xs text-slate-700">
                      <div className="flex items-center gap-1.5 font-medium text-slate-800 mb-0.5">
                        <FileText className="w-3.5 h-3.5 text-slate-400" />
                        <span>Action Remark:</span>
                      </div>
                      <p className="text-slate-600 italic">"{historyEntry.remarks}"</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Conditional Negative Branch Alert */}
          {isTerminalNegative && (
            <div className="relative flex items-start group">
              <div className="absolute -left-6 sm:-left-8 top-0.5 flex items-center justify-center w-6 h-6 rounded-full bg-red-600 border-2 border-red-600 text-white">
                <X className="w-3.5 h-3.5 text-white" strokeWidth={3} />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-red-700">
                    {currentStatus === 'REJECTED' ? 'Application Rejected' : 'Application Cancelled'}
                  </span>
                </div>
                <p className="text-xs text-red-600 mt-0.5">
                  Process terminated. Consult the remarks log below for official reason or appeal guidance.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Complete Audit & Status Transition History Log */}
      <div>
        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
          Chronological Audit Log ({statusHistory.length} events)
        </h4>

        {statusHistory.length === 0 ? (
          <p className="text-sm text-slate-500 italic">No transition history recorded yet.</p>
        ) : (
          <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden bg-white">
            {statusHistory.map((item, idx) => (
              <div key={item._id || idx} className="p-3.5 hover:bg-slate-50 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded font-mono">
                      {item.newStatus.replace(/_/g, ' ')}
                    </span>
                    <span className="text-xs text-slate-500">
                      by{' '}
                      <strong className="text-slate-700 capitalize">
                        {(item.changedBy as any)?.firstName
                          ? `${(item.changedBy as any).firstName} ${(item.changedBy as any).lastName || ''}`
                          : item.changedByRole || 'Official'}
                      </strong>
                    </span>
                  </div>
                  <span className="text-xs text-slate-400 font-mono">
                    {new Date(item.timestamp).toLocaleString()}
                  </span>
                </div>
                {item.remarks && (
                  <p className="text-xs text-slate-600 pl-2 border-l-2 border-slate-200 mt-1.5">
                    {item.remarks}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
