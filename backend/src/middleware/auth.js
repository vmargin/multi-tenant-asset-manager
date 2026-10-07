const jwt = require("jsonwebtoken");
const prisma = require("../db/prisma");

function reject(res, status, message) {
  return res.status(status).json({ error: message });
}

function authenticate(req, res, next) {
  const header = req.get("authorization") || "";
  const match = /^Bearer\s+(.+)$/i.exec(header);
  if (!match) return reject(res, 401, "Authentication required");
  if (!process.env.JWT_SECRET)
    return reject(res, 500, "Authentication is unavailable");
  try {
    const claims = jwt.verify(match[1], process.env.JWT_SECRET, {
      algorithms: ["HS256"],
    });
    if (!claims || typeof claims.sub !== "string")
      return reject(res, 401, "Invalid session");
    req.auth = { userId: claims.sub };
    next();
  } catch {
    return reject(res, 401, "Invalid session");
  }
}

async function requireMembership(req, res, next) {
  const organizationId = req.get("x-organization-id");
  if (!organizationId) return reject(res, 400, "X-Organization-Id is required");
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.auth.userId },
      select: { id: true, name: true, email: true, demoExpiresAt: true },
    });
    if (!user || (user.demoExpiresAt && user.demoExpiresAt <= new Date())) {
      return reject(res, 401, "Session expired");
    }
    const membership = await prisma.membership.findFirst({
      where: { organizationId, userId: user.id, status: "ACTIVE" },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            currency: true,
            isDemo: true,
            expiresAt: true,
          },
        },
      },
    });
    if (
      !membership ||
      (membership.organization.expiresAt &&
        membership.organization.expiresAt <= new Date())
    ) {
      return reject(res, 403, "Active organization membership required");
    }
    req.user = user;
    req.membership = membership;
    req.organization = membership.organization;
    req.organizationId = organizationId;
    next();
  } catch (error) {
    next(error);
  }
}

function allowRoles(...roles) {
  return (req, res, next) => {
    if (!req.membership || !roles.includes(req.membership.role)) {
      return reject(res, 403, "Insufficient permission");
    }
    next();
  };
}

module.exports = { authenticate, requireMembership, allowRoles };
