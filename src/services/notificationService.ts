import { apiRequest } from './api.js';
import { NotificationItem } from '../types/index.js';

export const notificationService = {
  async getAll() {
    return apiRequest<NotificationItem[]>('/notifications', {
      method: 'GET'
    });
  },

  async markAsRead(id: string) {
    return apiRequest<NotificationItem>(`/notifications/${id}/read`, {
      method: 'PATCH'
    });
  },

  async markAllAsRead() {
    return apiRequest('/notifications/read-all', {
      method: 'PATCH'
    });
  }
};
