import axios from 'axios';
import { mockProperties } from '../data/mockData';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const API_TIMEOUT = 5000;

const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: API_TIMEOUT,
});

export const fetchProperties = async () => {
    try {
        const response = await api.get('/api/properties');
        return response.data;
    } catch (error) {
        console.warn('API call failed for properties, using fallback data:', error.message);
        return mockProperties;
    }
};

export const submitDecision = async (payload) => {
    const response = await api.post('/api/submissions', payload);
    return response.data;
};
