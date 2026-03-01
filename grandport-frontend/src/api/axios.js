import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8080'
});

// Interceptor para anexar o Token JWT em cada requisição
api.interceptors.request.use((config) => {
  // Sincronizado com a chave usada no Login.jsx e App.jsx
  const token = localStorage.getItem('grandport_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
