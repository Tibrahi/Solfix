// ============================================================================
// API Configuration - Production-First Dynamic Resolution
// ============================================================================
// This file centralizes all API endpoint configuration with automatic
// environment detection for seamless production deployment.
//
// Environment Detection Priority:
// 1. VITE_API_URL environment variable (explicit production configuration)
// 2. Relative path '/api' for same-origin deployment (Vercel + Render with rewrites)
// 3. Fallback to localhost ONLY for local development
// ============================================================================

/**
 * Dynamically resolve the API base URL based on environment
 * 
 * Resolution logic:
 * - Production: Uses VITE_API_URL env var set during build (REQUIRED)
 * - Same-origin: Uses relative '/api' path if deployed together
 * - Development: Uses localhost:5000 (only when VITE_API_URL is not set)
 * 
 * IMPORTANT: In production, always set VITE_API_URL environment variable
 * to your production backend URL (e.g., https://solfix.onrender.com/api)
 */
const resolveApiBaseUrl = () => {
  // 1. Check for explicit environment variable (highest priority)
  // This is REQUIRED for production deployments
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl) {
    console.log('[API Config] Using configured API URL:', envUrl);
    return envUrl.replace(/\/$/, ''); // Remove trailing slash
  }

  // 2. For production deployment without explicit URL, use relative path
  // This works when frontend and backend are on the same domain
  // or when using reverse proxy/rewrites (e.g., Vercel, Render)
  if (import.meta.env.PROD) {
    const relativeUrl = '/api';
    console.warn('[API Config] Production mode without VITE_API_URL - using relative path:', relativeUrl);
    console.warn('[API Config] For best results, set VITE_API_URL to your production backend URL');
    return relativeUrl;
  }

  // 3. Development fallback (only when not in production and no env var)
  const devUrl = 'http://localhost:5000/api';
  console.log('[API Config] Development mode - using:', devUrl);
  return devUrl;
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
        console.log(`[API] Retry attempt ${attempt}/${maxRetries} for ${endpoint}`);
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
      if (error.message?.includes('Session expired') || response?.status === 401) {
        break;
      }
      
      // Don't retry on client errors (4xx except 401/408/429)
      if (response?.status >= 400 && response.status < 500 && 
          ![401, 408, 429].includes(response.status)) {
        break;
      }
      
      console.error(`[API] Request failed (attempt ${attempt + 1}/${maxRetries + 1}):`, error);
    }
  }
  
  console.error('[API] All retry attempts failed for:', endpoint);
  throw lastError;
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