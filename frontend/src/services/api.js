import axios from 'axios';

export const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 45000,
  headers: {
    'Content-Type': 'application/json',
  },
});

const savedToken = localStorage.getItem('agrosathi_token');
if (savedToken) {
  api.defaults.headers.common.Authorization = `Bearer ${savedToken}`;
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

export const checkBackendHealth = async () => {
  try {
    const response = await api.get('/health', { timeout: 5000 });
    return { online: true, ...response.data };
  } catch {
    return { online: false, llm_configured: false, rag_enabled: false };
  }
};

export default api;
