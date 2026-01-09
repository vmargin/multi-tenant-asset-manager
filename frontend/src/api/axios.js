/**
 * AXIOS API CONFIGURATION
 * 
 * This file sets up a configured Axios instance for making HTTP requests.
 * Axios is a popular library for making API calls from JavaScript.
 * 
 * Benefits of creating a custom instance:
 * - Base URL configured once (no need to repeat it)
 * - Request interceptors automatically add auth token
 * - Consistent configuration across the app
 */

import axios from 'axios';

/**
 * CREATE AXIOS INSTANCE
 * 
 * axios.create() creates a new Axios instance with custom configuration.
 * This is better than using axios directly because:
 * - We can set default baseURL (all requests go to same server)
 * - We can add interceptors (middleware for requests/responses)
 * - We can have multiple instances for different APIs
 */
const api = axios.create({
  // Base URL for all requests - this gets prepended to every request path
  // Example: api.get('/assets') becomes GET http://localhost:5000/api/assets
  baseURL: 'http://localhost:5000/api',
});

/**
 * REQUEST INTERCEPTOR
 * 
 * Interceptors are functions that run before requests are sent.
 * This one automatically adds the authentication token to every request.
 * 
 * How it works:
 * 1. Every time we call api.get(), api.post(), etc., this runs first
 * 2. It gets the token from localStorage (where we stored it after login)
 * 3. If token exists, adds it to Authorization header
 * 4. Returns the modified config, which Axios uses to make the request
 * 
 * Why use interceptors?
 * - Don't have to manually add token to every request
 * - Centralized authentication logic
 * - If token format changes, only update here
 */
api.interceptors.request.use((config) => {
  /**
   * GET TOKEN FROM LOCAL STORAGE
   * 
   * localStorage is browser storage that persists across page refreshes.
   * We store the JWT token here after successful login.
   * 
   * localStorage.getItem('token') returns:
   * - The token string if it exists
   * - null if it doesn't exist
   */
  const token = localStorage.getItem('token');

  /**
   * ADD TOKEN TO REQUEST HEADER
   * 
   * If token exists, add it to the Authorization header.
   * Format: "Bearer <token>"
   * 
   * The backend expects this format in auth middleware.
   * Example: Authorization: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   */
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  /**
   * RETURN CONFIG
   * 
   * Must return the config object (modified or not).
   * Axios uses this to make the actual HTTP request.
   */
  return config;
});

// Export the configured API instance
// Other components import this and use: api.get(), api.post(), etc.
export default api;