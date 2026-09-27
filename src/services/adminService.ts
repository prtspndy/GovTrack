import { apiRequest } from './api.js';
import { RequestItem, AdminDashboardData, User, AuditLogItem, RequestStatus } from '../types/index.js';

export const adminService = {
  async getDashboard() {
    return apiRequest<AdminDashboardData>('/admin/dashboard', {
      method: 'GET'
    });
  },

  async getAllRequests(params: {
    page?: number;
    limit?: number;
    status?: string;
    documentType?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  } = {}) {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set('page', String(params.page));
    if (params.limit) searchParams.set('limit', String(params.limit));
    if (params.status) searchParams.set('status', params.status);
    if (params.documentType) searchParams.set('documentType', params.documentType);
    if (params.search) searchParams.set('search', params.search);
    if (params.sortBy) searchParams.set('sortBy', params.sortBy);
    if (params.sortOrder) searchParams.set('sortOrder', params.sortOrder);

    return apiRequest<RequestItem[]>(`/admin/requests?${searchParams.toString()}`, {
      method: 'GET'
    });
  },

  async getRequestById(id: string) {
    return apiRequest<RequestItem>(`/admin/requests/${id}`, {
      method: 'GET'
    });
  },

  async updateRequestStatus(
    id: string,
    payload: { status: RequestStatus; remarks?: string; assignedOfficer?: string }
  ) {
    return apiRequest<RequestItem>(`/admin/requests/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(payload)
    });
  },

  async verifyDocument(
    requestId: string,
    documentId: string,
    payload: { status: 'VERIFIED' | 'REJECTED'; remarks?: string }
  ) {
    return apiRequest<RequestItem>(`/admin/requests/${requestId}/documents/${documentId}/verify`, {
      method: 'PATCH',
      body: JSON.stringify(payload)
    });
  },

  async requestAdditionalDocument(
    id: string,
    payload: { documentName: string; instructions: string }
  ) {
    return apiRequest<RequestItem>(`/admin/requests/${id}/additional-document`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  async uploadFinalDocument(id: string, formData: FormData) {
    return apiRequest<RequestItem>(`/admin/requests/${id}/final-document`, {
      method: 'POST',
      body: formData
    });
  },

  async getUsers(params: { page?: number; limit?: number; role?: string; search?: string } = {}) {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set('page', String(params.page));
    if (params.limit) searchParams.set('limit', String(params.limit));
    if (params.role) searchParams.set('role', params.role);
    if (params.search) searchParams.set('search', params.search);

    return apiRequest<User[]>(`/admin/users?${searchParams.toString()}`, {
      method: 'GET'
    });
  },

  async toggleUserStatus(id: string) {
    return apiRequest<User>(`/admin/users/${id}/status`, {
      method: 'PATCH'
    });
  },

  async getAuditLogs(params: { page?: number; limit?: number; search?: string } = {}) {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set('page', String(params.page));
    if (params.limit) searchParams.set('limit', String(params.limit));
    if (params.search) searchParams.set('search', params.search);

    return apiRequest<AuditLogItem[]>(`/admin/audit-logs?${searchParams.toString()}`, {
      method: 'GET'
    });
  }
};
