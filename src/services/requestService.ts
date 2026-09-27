import { apiRequest } from './api.js';
import { RequestItem, Pagination } from '../types/index.js';

export const requestService = {
  async submitRequest(formData: FormData) {
    return apiRequest<RequestItem>('/requests', {
      method: 'POST',
      body: formData
    });
  },

  async getMyRequests(params: { page?: number; limit?: number; status?: string; search?: string } = {}) {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set('page', String(params.page));
    if (params.limit) searchParams.set('limit', String(params.limit));
    if (params.status) searchParams.set('status', params.status);
    if (params.search) searchParams.set('search', params.search);

    return apiRequest<RequestItem[]>(`/requests/my?${searchParams.toString()}`, {
      method: 'GET'
    });
  },

  async getRequestById(id: string) {
    return apiRequest<RequestItem>(`/requests/${id}`, {
      method: 'GET'
    });
  },

  async cancelRequest(id: string) {
    return apiRequest<RequestItem>(`/requests/${id}/cancel`, {
      method: 'PATCH'
    });
  },

  async uploadAdditionalDocument(id: string, formData: FormData) {
    return apiRequest<RequestItem>(`/requests/${id}/documents`, {
      method: 'POST',
      body: formData
    });
  },

  getDownloadUrl(requestId: string, documentId: string) {
    return `/api/requests/${requestId}/documents/${documentId}/download`;
  },

  getFinalCertificateUrl(requestId: string) {
    return `/api/requests/${requestId}/final-document/download`;
  }
};
