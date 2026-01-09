/**
 * AUTHENTICATION MIDDLEWARE
 * 
 * This middleware protects routes by verifying JWT (JSON Web Token) tokens.
 * 
 * How it works:
 * 1. Client sends token in Authorization header: "Bearer <token>"
 * 2. Middleware extracts and verifies the token
 * 3. If valid, adds user info to req.user and calls next()
 * 4. If invalid, returns error and stops the request
 * 
 * This runs BEFORE the route handler, so protected routes automatically
 * have access to req.user (containing userId and orgId)
 */

const jwt = require('jsonwebtoken');

/**
 * AUTHENTICATION MIDDLEWARE FUNCTION
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Callback to continue to next middleware/route
 * 
 * Middleware pattern: (req, res, next) => { ... }
 * - Must call next() to continue, or send a response to stop
 */
const authenticate = (req, res, next) => {
  /**
   * EXTRACT TOKEN FROM REQUEST HEADER
   * 
   * Standard format: Authorization: "Bearer <token>"
   * We split by space and take the second part (index 1)
   * 
   * Example: "Bearer abc123xyz" -> ["Bearer", "abc123xyz"] -> "abc123xyz"
   */
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  // If no token provided, reject the request immediately
  if (!token) {
    return res.status(401).json({ error: "Access denied: No token" });
  }

  /**
   * VALIDATE JWT_SECRET EXISTS
   * 
   * JWT_SECRET is used to sign and verify tokens.
   * If it's missing, we can't verify tokens securely.
   * This is a critical security check!
   */
  if (!process.env.JWT_SECRET) {
    console.error("JWT_SECRET environment variable is not set!");
    return res.status(500).json({ error: "Server configuration error" });
  }

  /**
   * VERIFY THE JWT TOKEN
   * 
   * jwt.verify() checks:
   * 1. Token signature is valid (was signed with JWT_SECRET)
   * 2. Token hasn't expired
   * 3. Token format is correct
   * 
   * If valid, the callback receives the decoded payload (what we put in during login)
   * If invalid, err will contain the error reason
   */
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      // Token is invalid, expired, or tampered with
      return res.status(403).json({ error: "Invalid session" });
    }

    /**
     * TOKEN IS VALID - ATTACH USER INFO TO REQUEST
     * 
     * The 'user' object contains the payload we signed during login:
     * { userId: user.id, orgId: user.organizationId }
     * 
     * By attaching it to req.user, the route handler can access it:
     * const orgId = req.user.orgId;
     */
    req.user = user;

    // Call next() to continue to the route handler
    next();
  });
};

// Export the middleware function so server.js can use it
module.exports = authenticate;