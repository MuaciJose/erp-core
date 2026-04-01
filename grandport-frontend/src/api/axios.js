import axios from 'axios';
import { clearSession, getStoredToken } from '../utils/authStorage';

const api = axios.create({
  // 🚀 A MÁGICA DO .ENV ENTRA AQUI!
  // Agora o sistema lê o arquivo .env automaticamente.
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080'
});

// Interceptor para anexar o Token JWT em cada requisição (MANTIDO INTACTO - TÁ PERFEITO!)
api.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    if ((status === 401 || status === 423) && !error?.config?.url?.includes('/auth/login')) {
      clearSession();
      delete api.defaults.headers.common.Authorization;
      window.dispatchEvent(new CustomEvent(status === 423 ? 'grandport:tenant-blocked' : 'grandport:session-expired', {
        detail: { message: error?.response?.data?.error }
      }));
    }
    return Promise.reject(error);
  }
);

export default api;
