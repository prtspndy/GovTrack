import { apiRequest } from './api.js';
import { DocumentType } from '../types/index.js';

export const documentTypeService = {
  async getAll(includeInactive: boolean = false) {
    return apiRequest<DocumentType[]>(`/document-types?includeInactive=${includeInactive}`, {
      method: 'GET'
    });
  },

  async getById(id: string) {
    return apiRequest<DocumentType>(`/document-types/${id}`, {
      method: 'GET'
    });
  },

  async create(payload: Partial<DocumentType>) {
    return apiRequest<DocumentType>('/document-types', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  async update(id: string, payload: Partial<DocumentType>) {
    return apiRequest<DocumentType>(`/document-types/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
  },

  async toggleStatus(id: string) {
    return apiRequest<DocumentType>(`/document-types/${id}/status`, {
      method: 'PATCH'
    });
  }
};
