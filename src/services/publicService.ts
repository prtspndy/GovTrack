import { apiRequest } from './api.js';
import { DocumentType } from '../types/index.js';

export interface PublicTrackResponse {
  _id: string;
  requestNumber: string;
  applicantInitials: string;
  documentType: {
    name: string;
    department: string;
    processingTime: number;
  };
  currentStatus: string;
  currentDepartment: string;
  assignedOfficer: string;
  submittedAt: string;
  lastUpdatedAt: string;
  expectedCompletionDate: string;
  remarks?: string;
  finalDocumentAvailable: boolean;
  timeline: {
    stage: string;
    label: string;
    timestamp: string;
    remarks?: string;
    role: string;
  }[];
}

export const publicService = {
  async trackRequest(requestNumber: string) {
    return apiRequest<PublicTrackResponse>(`/public/track/${encodeURIComponent(requestNumber)}`, {
      method: 'GET'
    });
  },

  async getPublicDocumentTypes() {
    return apiRequest<DocumentType[]>('/public/document-types', {
      method: 'GET'
    });
  }
};
