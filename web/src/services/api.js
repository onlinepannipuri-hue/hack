import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for automatic token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refreshToken');

      if (refreshToken) {
        try {
          const res = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken });
          if (res.data?.success && res.data?.data?.accessToken) {
            const newAccessToken = res.data.data.accessToken;
            localStorage.setItem('accessToken', newAccessToken);
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            return api(originalRequest);
          }
        } catch (refreshErr) {
          // Token refresh failed, clean up and redirect to login
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const authApi = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  logout: (refreshToken) => api.post('/auth/logout', { refreshToken }),
  getMe: () => api.get('/auth/me'),
};

// Device APIs
export const deviceApi = {
  getDevices: () => api.get('/devices'),
  deleteDevice: (deviceId, deleteSms = false) =>
    api.delete(`/devices/${deviceId}?deleteSms=${deleteSms}`),
};

// SMS APIs
export const smsApi = {
  getConversations: (deviceId) =>
    api.get('/sms/conversations', { params: { deviceId } }),
  getConversationMessages: (sender, deviceId) =>
    api.get(`/sms/conversations/${encodeURIComponent(sender)}`, { params: { deviceId } }),
  search: (q, limit = 50) =>
    api.get('/sms/search', { params: { q, limit } }),
  getSms: (params) =>
    api.get('/sms', { params }),
  deleteSms: (params) =>
    api.delete('/sms', { params }),
};

export default api;
