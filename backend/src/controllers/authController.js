/**
 * AUTHENTICATION CONTROLLER
 * 
 * This controller handles user authentication (login).
 * Controllers contain the business logic for handling requests.
 * 
 * Security best practices implemented:
 * - Password hashing with bcrypt (never store plain text passwords!)
 * - JWT tokens for stateless authentication
 * - Input validation to prevent malicious data
 */

// Import the Prisma client singleton (single database connection)
const prisma = require('../db/prisma');

// JWT (JSON Web Token) - used to create secure authentication tokens
const jwt = require('jsonwebtoken');

// bcryptjs - library for hashing and comparing passwords securely
const bcrypt = require('bcryptjs');

/**
 * LOGIN HANDLER
 * 
 * This function handles POST /api/auth/login requests.
 * 
 * Flow:
 * 1. Validate input (email format, required fields)
 * 2. Find user in database by email
 * 3. Compare provided password with hashed password in database
 * 4. If valid, create JWT token and return it
 * 5. If invalid, return error
 * 
 * @param {Object} req - Express request object (contains req.body with email/password)
 * @param {Object} res - Express response object (used to send response back)
 */
const login = async (req, res) => {
  /**
   * EXTRACT DATA FROM REQUEST BODY
   * 
   * When client sends JSON like { email: "user@example.com", password: "secret" },
   * Express.json() middleware parses it and puts it in req.body
   */
  const { email, password } = req.body;

  /**
   * INPUT VALIDATION - ALWAYS VALIDATE USER INPUT!
   * 
   * Why validate?
   * - Prevents empty/invalid data from reaching database
   * - Better error messages for users
   * - Security: prevents injection attacks
   * 
   * HTTP Status Codes:
   * - 400 = Bad Request (client sent invalid data)
   * - 401 = Unauthorized (authentication failed)
   * - 500 = Internal Server Error (server problem)
   */
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  /**
   * EMAIL FORMAT VALIDATION
   * 
   * Regular expression (regex) checks if email has valid format:
   * - ^[^\s@]+ = one or more non-whitespace, non-@ characters (username)
   * - @ = literal @ symbol
   * - [^\s@]+ = one or more non-whitespace, non-@ characters (domain)
   * - \. = literal dot
   * - [^\s@]+$ = one or more characters at end (TLD like .com)
   * 
   * Example valid: "user@example.com"
   * Example invalid: "notanemail" or "user@"
   */
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: "Invalid email format" });
  }

  /**
   * CHECK JWT_SECRET IS CONFIGURED
   * 
   * We need JWT_SECRET to sign tokens. If it's missing, we can't create tokens.
   * This should never happen in production, but we check to fail gracefully.
   */
  if (!process.env.JWT_SECRET) {
    console.error("JWT_SECRET environment variable is not set!");
    return res.status(500).json({ error: "Server configuration error" });
  }

  /**
   * DATABASE QUERY AND AUTHENTICATION
   * 
   * We use try/catch because database operations can fail (network issues, etc.)
   */
  try {
    /**
     * FIND USER IN DATABASE
     * 
     * findUnique() finds one record matching the condition.
     * include: { organization: true } also fetches the related organization data.
     * 
     * This is a Prisma query - Prisma is an ORM (Object-Relational Mapping)
     * that makes database queries easier and safer.
     */
    const user = await prisma.user.findUnique({
      where: { email },
      include: { organization: true }
    });

    /**
     * CHECK IF USER EXISTS
     * 
     * If user doesn't exist, we return a generic "Invalid credentials" message.
     * We don't say "User not found" because that reveals information to attackers.
     * Same message for wrong password = attackers can't tell which is wrong.
     */
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    /**
     * PASSWORD VERIFICATION
     * 
     * CRITICAL SECURITY: We NEVER compare plain text passwords!
     * 
     * bcrypt.compare() does this:
     * 1. Takes the plain password from user input
     * 2. Takes the hashed password from database
     * 3. Hashes the plain password with the same salt from the stored hash
     * 4. Compares the two hashes
     * 
     * Why hash passwords?
     * - If database is compromised, attackers can't see real passwords
     * - bcrypt uses "salting" - adds random data to make hashes unique
     * - Even identical passwords have different hashes
     * 
     * This is async because hashing takes time (intentionally slow for security)
     */
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    /**
     * CREATE JWT TOKEN
     * 
     * JWT (JSON Web Token) is a standard way to securely transmit information.
     * 
     * jwt.sign() creates a token containing:
     * - Payload: { userId, orgId } - data we want to store in the token
     * - Secret: JWT_SECRET - used to sign the token (proves it came from our server)
     * - Options: { expiresIn: '24h' } - token expires after 24 hours
     * 
     * The token is a string that looks like: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
     * 
     * Client will send this token in future requests to prove they're logged in.
     * We can decode it (without database lookup!) to get userId and orgId.
     */
    const token = jwt.sign(
      { userId: user.id, orgId: user.organizationId },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    /**
     * SEND SUCCESS RESPONSE
     * 
     * res.json() automatically:
     * - Converts object to JSON
     * - Sets Content-Type header to application/json
     * - Sends response and ends the request
     * 
     * We return:
     * - token: Client stores this and sends it in Authorization header
     * - user: Basic user info (we don't send password or sensitive data!)
     */
    res.json({ token, user: { email: user.email, orgId: user.organizationId } });
  } catch (error) {
    /**
     * ERROR HANDLING
     * 
     * If anything goes wrong (database error, etc.), we:
     * 1. Log the error for debugging (server-side)
     * 2. Send generic error to client (don't expose internal details!)
     */
    console.error("Login error:", error);
    res.status(500).json({ error: "Server login error" });
  }
};

// Export the login function so server.js can use it
module.exports = { login };