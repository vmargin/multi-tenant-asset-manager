/**
 * LOGIN COMPONENT
 * 
 * This component handles user authentication.
 * It displays a login form and handles the login API call.
 * 
 * Features:
 * - Email and password input fields
 * - Client-side validation
 * - API call to backend
 * - Token storage in localStorage
 * - Callback to parent component on success
 */

import { useState } from 'react';
import api from '../api/axios';

/**
 * LOGIN COMPONENT FUNCTION
 * 
 * @param {Object} props - Component props
 * @param {Function} props.onLoginSuccess - Callback function called when login succeeds
 * 
 * Props are data passed from parent component (App.jsx).
 * This component is "controlled" - parent manages auth state.
 */
const Login = ({ onLoginSuccess }) => {
  /**
   * FORM STATE MANAGEMENT
   * 
   * useState() creates state variables for form inputs.
   * 
   * Controlled Components Pattern:
   * - Input value is controlled by React state
   * - onChange updates the state
   * - State change triggers re-render with new value
   * 
   * Default values are pre-filled for development/testing:
   * - email: 'admin@acme.com'
   * - password: 'password123'
   * 
   * In production, you'd start with empty strings: useState('')
   */
  const [email, setEmail] = useState('admin@acme.com');
  const [password, setPassword] = useState('password123');

  /**
   * LOGIN FORM SUBMISSION HANDLER
   * 
   * This function runs when user submits the form (clicks Login or presses Enter).
   * 
   * @param {Event} e - Form submission event
   * 
   * async/await syntax:
   * - async = this function can use await
   * - await = wait for promise to resolve before continuing
   * - Makes asynchronous code look like synchronous code
   */
  const handleLogin = async (e) => {
    /**
     * PREVENT DEFAULT FORM BEHAVIOR
     * 
     * By default, form submission reloads the page.
     * e.preventDefault() stops that, so we can handle it with JavaScript.
     */
    e.preventDefault();
    
    /**
     * CLIENT-SIDE VALIDATION - LAYER 1: Required Fields
     * 
     * Validate before making API call to:
     * - Give immediate feedback to user
     * - Save unnecessary API calls
     * - Improve user experience
     */
    if (!email || !password) {
      alert("Please enter both email and password");
      return; // Stop execution if validation fails
    }

    /**
     * CLIENT-SIDE VALIDATION - LAYER 2: Email Format
     * 
     * Regular expression validates email format.
     * Same regex as backend for consistency.
     * 
     * test() returns true if email matches pattern, false otherwise.
     */
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      alert("Please enter a valid email address");
      return;
    }

    /**
     * API CALL TO BACKEND
     * 
     * try/catch handles errors gracefully.
     * If API call fails, we catch the error and show a message.
     */
    try {
      /**
       * MAKE POST REQUEST TO LOGIN ENDPOINT
       * 
       * api.post() is from our configured axios instance.
       * It automatically:
       * - Adds baseURL (http://localhost:5000/api)
       * - Sends JSON data in request body
       * - Returns a promise
       * 
       * await waits for the response before continuing.
       * 
       * Destructuring: const { data } = response
       * Extracts the 'data' property from the response object.
       */
      const { data } = await api.post('/auth/login', { email, password });

      /**
       * STORE AUTHENTICATION DATA
       * 
       * localStorage persists data in browser storage.
       * It survives page refreshes and browser restarts.
       * 
       * We store:
       * - token: JWT token for authenticated requests
       * - orgId: Organization ID for multi-tenant filtering
       * 
       * Note: localStorage is accessible to JavaScript, so don't store sensitive data!
       * JWT tokens are okay because they expire and are signed.
       */
      localStorage.setItem('token', data.token);
      localStorage.setItem('orgId', data.user.orgId);

      /**
       * NOTIFY PARENT COMPONENT
       * 
       * Call the callback function passed from parent (App.jsx).
       * This updates App's state, causing it to re-render and show Dashboard.
       * 
       * This is the "callback prop" pattern - child notifies parent of events.
       */
      onLoginSuccess(); 
    } catch (err) {
      /**
       * ERROR HANDLING
       * 
       * If API call fails, err contains error information.
       * 
       * Optional chaining (?.) safely accesses nested properties:
       * - err.response?.data?.error = error message from backend (if exists)
       * - || "..." = fallback message if backend error doesn't exist
       * 
       * Common error scenarios:
       * - Network error (backend not running)
       * - 401 Unauthorized (wrong credentials)
       * - 500 Server Error (backend problem)
       */
      const errorMessage = err.response?.data?.error || "Login failed. Check if backend is running on port 5000";
      alert(errorMessage);
    }
  };

  /**
   * JSX RENDER
   * 
   * Returns the login form UI.
   * JSX is like HTML but with JavaScript expressions in {}.
   */
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      {/* Login Card Container */}
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 border border-gray-100">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-8">Tenant Login</h2>
        
        {/* Login Form */}
        {/* 
          onSubmit={handleLogin} - when form is submitted, run handleLogin
          className="space-y-6" - vertical spacing between form elements
        */}
        <form onSubmit={handleLogin} className="space-y-6">
          {/* Email Input Field */}
          {/* 
            Controlled component pattern:
            - value={email} - input shows current state value
            - onChange={e => setEmail(e.target.value)} - update state on change
            - When user types, onChange fires, state updates, component re-renders
          */}
          <input 
            className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            value={email} 
            onChange={e => setEmail(e.target.value)} 
            placeholder="Email" 
          />
          
          {/* Password Input Field */}
          {/* 
            type="password" - hides input with dots/asterisks
            Same controlled component pattern as email
          */}
          <input 
            className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            type="password" 
            value={password} 
            onChange={e => setPassword(e.target.value)} 
            placeholder="Password" 
          />
          
          {/* Submit Button */}
          {/* 
            type="submit" - clicking this submits the form
            className includes hover effects for better UX
          */}
          <button type="submit" className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md transition-colors">
            Login
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;