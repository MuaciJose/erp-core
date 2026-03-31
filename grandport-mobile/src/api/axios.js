import axios from 'axios';
import { clearSession, getApiBaseUrl, getCleanToken } from './session';

const api = axios.create({
    baseURL: getApiBaseUrl(),
    timeout: 15000,
    headers: {
        Accept: 'application/json'
    }
});

// Interceptor para anexar o Token JWT no Mobile
api.interceptors.request.use(async (config) => {
    try {
        const token = await getCleanToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    } catch (error) {
        console.error("Erro ao buscar token no celular:", error);
    }
    return config;
});

api.interceptors.response.use(
    response => response,
    async (error) => {
        const status = error?.response?.status;

        if (status === 401) {
            try {
                await clearSession();
            } catch (clearError) {
                console.error('Erro ao limpar sessão mobile:', clearError);
            }
        }

        return Promise.reject(error);
    }
);

export default api;
