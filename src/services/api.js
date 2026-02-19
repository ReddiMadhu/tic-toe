import axios from 'axios';
import { mockProperties, mockDecisions, mockShapDrivers, mockResultsNew } from '../data/mockData';

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

export const fetchDecisions = async () => {
  try {
    const response = await api.get('/api/decisions');
    return response.data;
  } catch (error) {
    console.warn('API call failed for decisions, using fallback data:', error.message);
    return mockDecisions;
  }
};

export const fetchShapDrivers = async () => {
  try {
    const response = await api.get('/api/shap-drivers');
    return response.data;
  } catch (error) {
    console.warn('API call failed for SHAP drivers, using fallback data:', error.message);
    return mockShapDrivers;
  }
};

export const pollSubmission = async () => {
  try {
    const response = await api.get('/api/submissions/latest');
    return response.data;
  } catch (error) {
    console.warn('Polling failed:', error.message);
    return null;
  }
};

export const submitDecision = async (payload) => {
  const response = await api.post('/api/submissions', payload);
  return response.data;
};

export const triggerProcess = async (submissionId) => {
  const response = await api.post('/api/process', { submissionId });
  return response.data;
};

export const fetchResults = async (submissionId) => {
  try {
    const response = await api.get(`/api/results/${submissionId}`);
    return response.data;
  } catch (error) {
    console.warn('API call failed for results, using fallback data:', error.message);
    return mockResultsNew;
  }
};
