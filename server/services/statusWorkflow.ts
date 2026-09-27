import { RequestStatus } from '../models/index.js';

export const VALID_STATUS_TRANSITIONS: Record<RequestStatus, RequestStatus[]> = {
  SUBMITTED: ['UNDER_REVIEW', 'CANCELLED'],
  UNDER_REVIEW: ['DOCUMENT_VERIFICATION', 'REJECTED'],
  DOCUMENT_VERIFICATION: ['ADDITIONAL_DOCUMENT_REQUIRED', 'PROCESSING', 'REJECTED'],
  ADDITIONAL_DOCUMENT_REQUIRED: ['DOCUMENT_VERIFICATION', 'REJECTED', 'CANCELLED'],
  PROCESSING: ['APPROVED', 'REJECTED'],
  APPROVED: ['READY_FOR_DOWNLOAD', 'REJECTED'],
  READY_FOR_DOWNLOAD: ['COMPLETED'],
  COMPLETED: [],
  REJECTED: [],
  CANCELLED: []
};

export function isValidTransition(currentStatus: RequestStatus, nextStatus: RequestStatus): boolean {
  // Allow idempotency
  if (currentStatus === nextStatus) return true;
  const allowed = VALID_STATUS_TRANSITIONS[currentStatus] || [];
  return allowed.includes(nextStatus);
}

export function canCitizenCancel(status: RequestStatus): boolean {
  return status === 'SUBMITTED';
}
