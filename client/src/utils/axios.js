import axios from 'axios';

// Create axios instance with base URL
const instance = axios.create({
    baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000',
    headers: {
        'Content-Type': 'application/json'
    },
    maxContentLength: Infinity,
    maxBodyLength: Infinity,
    timeout: 60000 // 1 minute timeout
});

// Add request interceptor to include auth token
instance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        
        // Log request size for debugging
        if (config.data) {
            const size = new TextEncoder().encode(JSON.stringify(config.data)).length;
            console.log(`Request size: ${(size / 1024 / 1024).toFixed(2)} MB`);
        }
        
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add response interceptor for error handling
instance.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 413) {
            console.error('Request too large:', {
                url: error.config?.url,
                size: error.config?.data ? new TextEncoder().encode(JSON.stringify(error.config.data)).length : 'unknown'
            });
        }
        return Promise.reject(error);
    }
);

export default instance;
