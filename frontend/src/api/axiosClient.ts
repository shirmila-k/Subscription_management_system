import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

export const axiosClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Attach Authorization Bearer token to all outgoing requests
axiosClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('brightloop_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to unwrap unified ApiResponse payload
axiosClient.interceptors.response.use(
  (response) => {
    // If our backend response follows { success, message, data, meta }
    if (response.data && response.data.data !== undefined) {
      return response.data.data;
    }
    return response.data;
  },
  (error: AxiosError<{ message?: string }>) => {
    const errorMsg =
      error.response?.data?.message ||
      error.message ||
      'An unexpected error occurred during API request.';
    return Promise.reject(new Error(errorMsg));
  }
);

export default axiosClient;
