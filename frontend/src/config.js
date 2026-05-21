// ============================================================================
// API Configuration - Production-Safe Dynamic Resolution
// ============================================================================
// This file centralizes all API endpoint configuration with automatic
// environment detection for seamless local/production switching.
//
// Environment Detection Priority:
// 1. VITE_API_URL environment variable (explicit configuration)
// 2. Relative path '/api' for same-origin deployment (Vercel + Render with rewrites)
// 3. Fallback to localhost for development
// ============================================================================

/**
 * Dynamically resolve the API base URL based on environment
 * 
 * Resolution logic:
 * - VITE_API_URL env var (highest priority) - used in production
 * - Window config (for runtime injection via index.html)
 * - Development: Uses localhost:5000
 * 
 * IMPORTANT: For Render deployment, VITE_API_URL MUST be set in Render dashboard
 * as an environment variable. The relative '/api' fallback is REMOVED because
 * frontend (solfix-1.onrender.com) and backend (solfix.onrender.com) are on different domains.
 */
const resolveApiBaseUrl = () => {
  // 1. Check for explicit environment variable (highest priority)
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl) {
    return envUrl.replace(/\/$/, ''); // Remove trailing slash
  }

  // 2. Check for window config (runtime injection fallback)
  // This allows setting API URL via index.html script injection
  if (typeof window !== 'undefined' && window.APP_CONFIG && window.APP_CONFIG.API_URL) {
    const windowUrl = window.APP_CONFIG.API_URL;
    return windowUrl.replace(/\/$/, '');
  }

  // 3. Development fallback (only for local development)
  return 'http://localhost:5000/api';
};

const API_BASE_URL = resolveApiBaseUrl();

// ============================================================================
// API Endpoints Configuration
// ============================================================================

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
  },

  // Helper to check if using relative API path
  isRelativeApi: API_BASE_URL === '/api',
  
  // Helper to get full URL for a given endpoint
  getFullUrl: (endpoint) => {
    if (API_BASE_URL.startsWith('/')) {
      return `${window.location.origin}${API_BASE_URL}${endpoint}`;
    }
    return `${API_BASE_URL}${endpoint}`;
  }
};

// ============================================================================
// Enhanced API Request Handler with Retry Logic
// ============================================================================

/**
 * Enhanced API request handler with:
 * - Automatic JWT token injection
 * - Retry logic for failed requests
 * - Proper error handling
 * - Request/response logging for debugging
 */
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
  
  // Add credentials for cookie-based auth if needed
  if (!config.credentials) {
    config.credentials = 'same-origin';
  }
  
  let lastError = null;
  const maxRetries = options.retries ?? 1;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 100));
      }
      
      const response = await fetch(endpoint, config);
      
      // Handle unauthorized responses
      if (response.status === 401) {
        // Clear invalid token
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        
        // Redirect to login if not already there
        if (!window.location.pathname.includes('/admin/login')) {
          window.location.href = '/admin/login';
        }
        
        throw new Error('Session expired. Please login again.');
      }
      
      // Try to parse JSON response
      let data;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = { message: await response.text() };
      }
      
      if (!response.ok) {
        throw new Error(data.error || data.message || `HTTP error! status: ${response.status}`);
      }
      
      return data;
      
    } catch (error) {
      lastError = error;
      
      // Don't retry on authentication errors
      if (error.message?.includes('Session expired')) {
        break;
      }
      
      // Don't retry on client errors (4xx except 401/408/429)
      if (error instanceof Error && error.message?.includes('HTTP error! status:')) {
        const statusMatch = error.message.match(/status: (\d+)/);
        if (statusMatch) {
          const status = parseInt(statusMatch[1]);
          if (status >= 400 && status < 500 && ![401, 408, 429].includes(status)) {
            break;
          }
        }
      }
      
      // Log error without exposing sensitive endpoint details in production
      if (import.meta.env.DEV) {
        console.error(`[API] Request failed (attempt ${attempt + 1}/${maxRetries + 1}):`, error);
      }
    }
  }
  
  // Only throw detailed error in development
  if (import.meta.env.DEV) {
    throw lastError;
  }
  throw new Error('API request failed. Please try again.');
};

// ============================================================================
// API Health Check Utility
// ============================================================================

/**
 * Check if the API is reachable
 * Useful for diagnosing connection issues
 */
export const checkApiHealth = async () => {
  try {
    const response = await fetch(config.endpoints.health, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (response.ok) {
      const data = await response.json();
      return {
        healthy: true,
        data,
        apiUrl: API_BASE_URL
      };
    }
    
    return {
      healthy: false,
      error: `Health check failed with status ${response.status}`,
      apiUrl: API_BASE_URL
    };
  } catch (error) {
    return {
      healthy: false,
      error: error.message,
      apiUrl: API_BASE_URL
    };
  }
};

// ============================================================================
// Export for use in components
// ============================================================================

export default config;