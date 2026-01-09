/**
 * EXPRESS SERVER SETUP
 * 
 * This is the main entry point for the backend API server.
 * It sets up Express, configures middleware, and defines all API routes.
 */

// Load environment variables from .env file into process.env
// This allows us to use secrets like JWT_SECRET, DATABASE_URL, etc.
require('dotenv').config();

// Import Express framework - the most popular Node.js web framework
const express = require('express');

// CORS (Cross-Origin Resource Sharing) - allows frontend to make requests
// Without this, browsers block requests from different origins (ports/domains)
const cors = require('cors');

// Import route handlers (controllers) - these contain the business logic
const { login } = require('./controllers/authController');
const { getAssets, createAsset, deleteAsset, updateAsset } = require('./controllers/assetController');

// Import authentication middleware - runs before protected routes
const authenticate = require('./middleware/auth');

/**
 * CREATE EXPRESS APPLICATION
 * 
 * The app object is our Express application instance.
 * We'll configure it with middleware and routes.
 */
const app = express();

/**
 * MIDDLEWARE SETUP
 * 
 * Middleware functions run in order for every request.
 * They can modify the request/response or end the request early.
 */

// CORS middleware - configure allowed origins
app.use(cors({
  origin: process.env.FRONTEND_URL || '*', // Allow all in dev, restrict in production
  credentials: true
}));

// JSON parser middleware - automatically parses JSON request bodies
// Without this, req.body would be undefined for JSON requests
app.use(express.json());

/**
 * ROUTE DEFINITIONS
 * 
 * Routes define what happens when a client makes a request to a specific URL.
 * Format: app.METHOD(path, middleware..., handler)
 * 
 * Routes are checked in order - first match wins!
 */

// ========== PUBLIC ROUTES (No authentication required) ==========
// POST /api/auth/login - User login endpoint
// Anyone can try to log in, so no authentication middleware needed
app.post('/api/auth/login', login);

// ========== PROTECTED ROUTES (Authentication required) ==========
// The 'authenticate' middleware runs BEFORE the controller function
// If authentication fails, the request stops and never reaches the controller

// GET /api/assets - Fetch all assets for the logged-in user's organization
app.get('/api/assets', authenticate, getAssets);

// POST /api/assets - Create a new asset
app.post('/api/assets', authenticate, createAsset);

// PATCH /api/assets/:id - Update an asset by ID
// PATCH is used for partial updates (update only provided fields)
// The :id is a route parameter - accessible via req.params.id
app.patch('/api/assets/:id', authenticate, updateAsset);

// DELETE /api/assets/:id - Delete an asset by ID
// The :id is a route parameter - accessible via req.params.id
app.delete('/api/assets/:id', authenticate, deleteAsset);

/**
 * START THE SERVER
 * 
 * process.env.PORT comes from environment variables (or .env file)
 * The || 5000 is a fallback - if PORT isn't set, use port 5000
 * 
 * The callback runs when the server successfully starts listening
 */
// Railway and other platforms auto-assign PORT, fallback to 5000 for local dev
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  if (process.env.NODE_ENV !== 'production') {
    console.log(`   Local: http://localhost:${PORT}`);
  }
});