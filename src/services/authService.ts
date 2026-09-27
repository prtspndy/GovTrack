import { apiRequest } from './api.js';
import { User } from '../types/index.js';

export const authService = {
  async register(payload: {
    firstName: string;
    lastName: string;
    email: string;
    mobileNumber: string;
    password: string;
    address?: string;
    city?: string;
    district?: string;
    state?: string;
    pincode?: string;
  }) {
    return apiRequest<{ user: User; token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  async login(payload: { email: string; password: string }) {
    return apiRequest<{ user: User; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  async getMe() {
    return apiRequest<User>('/auth/me', {
      method: 'GET'
    });
  },

  async updateProfile(payload: Partial<User>) {
    return apiRequest<User>('/auth/profile', {
      method: 'PATCH',
      body: JSON.stringify(payload)
    });
  },

  async logout() {
    return apiRequest('/auth/logout', {
      method: 'POST'
    });
  }
};
