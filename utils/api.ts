import axios from 'axios';

// En mode développement (vite local), utiliser localhost:5000/api
// En production (déployé), utiliser /api pour que ce soit relatif au même domaine
const API_URL = (import.meta as any).env.PROD ? '/api' : 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_URL,
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;
