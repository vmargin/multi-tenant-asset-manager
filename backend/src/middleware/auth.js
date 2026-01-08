const jwt = require('jsonwebtoken');

const authenticate = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    console.log("Auth Blocked: No token provided");
    return res.status(401).json({ error: "Access denied: No token" });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'supersecret', (err, user) => {
    if (err) {
      console.log("Auth Blocked: Invalid signature/token");
      return res.status(403).json({ error: "Invalid session" });
    }
    req.user = user; // userId and orgId are now safe to use
    next();
  });
};

module.exports = authenticate;