import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: `${API_BASE}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Auto-attach JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login' && window.location.pathname !== '/track') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
};

// Users
export const usersAPI = {
  getAll: () => api.get('/users'),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
};

// Offices
export const officesAPI = {
  getAll: () => api.get('/offices'),
  create: (data) => api.post('/offices', data),
  update: (id, data) => api.put(`/offices/${id}`, data),
  delete: (id) => api.delete(`/offices/${id}`),
};

// Documents
export const documentsAPI = {
  getAll: () => api.get('/documents'),
  get: (id) => api.get(`/documents/${id}`),
  create: (data) => api.post('/documents', data),
  update: (id, data) => api.put(`/documents/${id}`, data),
  delete: (id) => api.delete(`/documents/${id}`),
  upload: (id, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/documents/${id}/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  track: (trackingNumber) => api.get(`/documents/track/${trackingNumber}`),
};

// Document Types
export const documentTypesAPI = {
  getAll: () => api.get('/document-types'),
  create: (data) => api.post('/document-types', data),
  update: (id, data) => api.put(`/document-types/${id}`, data),
  delete: (id) => api.delete(`/document-types/${id}`),
};

// Transmissions
export const transmissionsAPI = {
  getAll: () => api.get('/transmissions'),
  create: (data) => api.post('/transmissions', data),
  receive: (id) => api.post(`/transmissions/${id}/receive`),
  delete: (id) => api.delete(`/transmissions/${id}`),
};

// Archives
export const archivesAPI = {
  getAll: () => api.get('/archives'),
  create: (data) => api.post('/archives', data),
  delete: (id) => api.delete(`/archives/${id}`),
};

// Reports
export const reportsAPI = {
  summary: () => api.get('/reports/summary'),
};

// WebSocket helper
export const createWebSocket = (officeId = null) => {
  const wsUrl = officeId
    ? `ws://localhost:8000/ws/notifications?office_id=${officeId}`
    : `ws://localhost:8000/ws/notifications`;
  return new WebSocket(wsUrl);
};

export default api;
