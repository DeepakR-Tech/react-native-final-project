import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Create axios instance
// Using your computer's IP address for physical device testing
// Make sure backend is running: cd backend && npm run dev
const API_URL = 'http://10.187.147.91:5000/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 10000,
});

// Request interceptor to add auth token
api.interceptors.request.use(
    async (config) => {
        try {
            const token = await AsyncStorage.getItem('token');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        } catch (error) {
            console.log('Error getting token:', error);
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor to handle errors
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response?.status === 401) {
            // Token expired or invalid
            try {
                await AsyncStorage.removeItem('token');
                await AsyncStorage.removeItem('user');
            } catch (e) {
                console.log('Error removing auth data:', e);
            }
        }
        return Promise.reject(error);
    }
);

export default api;
