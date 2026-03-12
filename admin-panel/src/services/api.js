import axios from 'axios';

const api = axios.create({
    baseURL: '/api/v1/admin',
    headers: {
        'Content-Type': 'application/json'
    }
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('adminToken');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    (response) => response.data,
    (error) => {
        // Only redirect if it's a 401 AND not the login request itself
        if (error.response?.status === 401 && !error.config.url.endsWith('/login')) {
            localStorage.removeItem('adminToken');
            localStorage.removeItem('adminUser');
            window.location.href = '/admin/login';
        }
        return Promise.reject(error.response?.data || error);
    }
);

export default api;
