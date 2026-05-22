import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://bahirdar-tourism-api.onrender.com/api',
  withCredentials: true, // Include cookies in requests
});

// Request interceptor
API.interceptors.request.use((req) => {
  // Token is now sent via httpOnly cookie automatically
  return req;
});

// Response interceptor
API.interceptors.response.use(
  (res) => res,
  async (err) => {
    const originalRequest = err.config;

    // Handle token expiration
    if (err.response?.status === 401 && err.response?.data?.code === 'AUTH_004') {
      if (!originalRequest._retry) {
        originalRequest._retry = true;
        try {
          // Try to refresh token
          await API.post('/auth/refresh');
          // Retry original request
          return API(originalRequest);
        } catch (refreshErr) {
          // Refresh failed, redirect to login
          window.location.href = '/login';
          return Promise.reject(refreshErr);
        }
      }
    }

    // Handle other 401 errors
    if (err.response?.status === 401) {
      window.location.href = '/login';
    }

    // Handle rate limiting
    if (err.response?.status === 429) {
      const message = err.response?.data?.message || 'Too many requests. Please try again later.';
      console.warn('Rate limited:', message);
    }

    return Promise.reject(err);
  }
);

export default API;

