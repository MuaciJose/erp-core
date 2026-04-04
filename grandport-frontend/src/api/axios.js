import axios from 'axios';
import { clearSession } from '../utils/authStorage';

const resolveApiBaseUrl = () => {
  const configured = import.meta.env.VITE_API_URL?.trim();
  if (configured) {
    return configured;
  }

  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }

  throw new Error('VITE_API_URL não configurada para o frontend.');
};

const api = axios.create({
  baseURL: resolveApiBaseUrl(),
  withCredentials: true
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    if ((status === 401 || status === 423) && !error?.config?.url?.includes('/auth/login')) {
      clearSession();
      window.dispatchEvent(new CustomEvent(status === 423 ? 'grandport:tenant-blocked' : 'grandport:session-expired', {
        detail: { message: error?.response?.data?.error }
      }));
    }
    return Promise.reject(error);
  }
);

export default api;
