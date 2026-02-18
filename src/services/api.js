import axios from 'axios';
import { mockProperties, mockDecisions, mockShapDrivers } from '../data/mockData';

// API configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
const API_TIMEOUT = 5000;

/**
 * Fetch all properties from API or fallback to mock data
 * @returns {Promise<Array>} Array of property objects
 */
export const fetchProperties = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/properties`, {
      timeout: API_TIMEOUT
    });
    return response.data;
  } catch (error) {
    console.warn('API call failed for properties, using fallback data:', error.message);
    return mockProperties;
  }
};

/**
 * Fetch decision data (user selections + AI predictions) from API or fallback to mock data
 * @returns {Promise<Array>} Array of decision objects
 */
export const fetchDecisions = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/decisions`, {
      timeout: API_TIMEOUT
    });
    return response.data;
  } catch (error) {
    console.warn('API call failed for decisions, using fallback data:', error.message);
    return mockDecisions;
  }
};

/**
 * Fetch SHAP driver data from API or fallback to mock data
 * @returns {Promise<Array>} Array of SHAP driver objects
 */
export const fetchShapDrivers = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/shap-drivers`, {
      timeout: API_TIMEOUT
    });
    return response.data;
  } catch (error) {
    console.warn('API call failed for SHAP drivers, using fallback data:', error.message);
    return mockShapDrivers;
  }
};
