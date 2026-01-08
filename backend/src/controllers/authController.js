const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const jwt = require('jsonwebtoken');

const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { organization: true }
    });

    if (!user || user.password !== password) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

   const token = jwt.sign(
  { userId: user.id, orgId: user.organizationId },
  process.env.JWT_SECRET || 'supersecret', // MUST MATCH MIDDLEWARE
  { expiresIn: '24h' }
);

    res.json({ token, user: { email: user.email, orgId: user.organizationId } });
  } catch (error) {
    res.status(500).json({ error: "Server login error" });
  }
};

module.exports = { login };