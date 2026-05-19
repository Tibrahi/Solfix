// API Configuration
// This file centralizes all API endpoint configuration
// Update the API_BASE_URL to match your backend server

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const config = {
  API_BASE_URL,
  endpoints: {
    // Auth endpoints
    adminLogin: `${API_BASE_URL}/admin/login`,
    adminLogout: `${API_BASE_URL}/admin/logout`,
    adminVerify: `${API_BASE_URL}/admin/verify`,
    adminCredentials: `${API_BASE_URL}/admin/credentials`,
    
    // Applicants endpoints
    applicants: `${API_BASE_URL}/applicants`,
    applicant: (id) => `${API_BASE_URL}/applicants/${id}`,
    
    // Stats endpoint
    stats: `${API_BASE_URL}/admin/stats`,
    
    // Health check
    health: `${API_BASE_URL}/health`
  }
};

// Helper function for making API requests
export const apiRequest = async (endpoint, options = {}) => {
  const token = localStorage.getItem('adminToken');
  
  const defaultHeaders = {
    'Content-Type': 'application/json',
  };
  
  // Add authorization header if token exists
  if (token && options.requireAuth !== false) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }
  
  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...(options.headers || {})
    }
  };
  
  try {
    const response = await fetch(endpoint, config);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || `HTTP error! status: ${response.status}`);
    }
    
    return data;
  } catch (error) {
    console.error('API Request failed:', error);
    throw error;
  }
};

export default config;