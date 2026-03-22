import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const api = axios.create({
    // 🚀 AQUI ESTÁ A MÁGICA: O IP do seu Ubuntu na rede Wi-Fi
    baseURL: process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.104:8080'
});

// Interceptor para anexar o Token JWT no Mobile
api.interceptors.request.use(async (config) => {
    try {
        const token = await AsyncStorage.getItem('grandport_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    } catch (error) {
        console.error("Erro ao buscar token no celular:", error);
    }
    return config;
});

export default api;