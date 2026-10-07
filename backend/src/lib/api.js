const crypto = require("crypto");

class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function ensure(condition, status, message) {
  if (!condition) throw new ApiError(status, message);
}

function asObject(value) {
  ensure(
    value && typeof value === "object" && !Array.isArray(value),
    400,
    "A JSON object is required",
  );
  return value;
}

function text(value, field, { required = false, max = 500 } = {}) {
  if (value === undefined || value === null) {
    ensure(!required, 400, `${field} is required`);
    return undefined;
  }
  ensure(typeof value === "string", 400, `${field} must be text`);
  const result = value.trim();
  ensure(
    (!required || result.length > 0) && result.length <= max,
    400,
    `${field} is invalid`,
  );
  return result || undefined;
}

function email(value) {
  const result = text(value, "email", {
    required: true,
    max: 254,
  }).toLowerCase();
  ensure(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(result), 400, "Email is invalid");
  return result;
}

function date(value, field, { optional = false } = {}) {
  if (value === undefined || value === null || value === "") {
    ensure(optional, 400, `${field} is required`);
    return null;
  }
  ensure(
    typeof value === "string" || value instanceof Date,
    400,
    `${field} must be a date`,
  );
  if (typeof value === "string") {
    const calendar = /^(\d{4})-(\d{2})-(\d{2})(?:T.*)?$/.exec(value);
    if (calendar) {
      const year = Number(calendar[1]);
      const month = Number(calendar[2]);
      const day = Number(calendar[3]);
      const daysInMonth =
        month >= 1 && month <= 12
          ? new Date(Date.UTC(year, month, 0)).getUTCDate()
          : 0;
      ensure(
        day >= 1 && day <= daysInMonth,
        400,
        `${field} must be a valid calendar date`,
      );
    }
  }
  const parsed = new Date(value);
  ensure(
    Number.isFinite(parsed.getTime()),
    400,
    `${field} must be a valid date`,
  );
  return parsed;
}

function enumValue(value, field, values, { optional = false } = {}) {
  if (value === undefined && optional) return undefined;
  ensure(
    typeof value === "string" && values.includes(value),
    400,
    `${field} must be one of ${values.join(", ")}`,
  );
  return value;
}

function decimal(value, field) {
  if (value === undefined || value === null || value === "") return null;
  const result = Number(value);
  ensure(
    Number.isFinite(result) && result >= 0 && result <= 9999999999.99,
    400,
    `${field} must be a non-negative amount`,
  );
  return result.toFixed(2);
}

function slugBase(value) {
  return (
    value
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 40) || "workspace"
  );
}

async function uniqueSlug(tx, name) {
  const base = slugBase(name);
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const slug = `${base}-${crypto.randomBytes(4).toString("hex")}`;
    const exists = await tx.organization.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!exists) return slug;
  }
  throw new ApiError(500, "Could not create workspace");
}

function publicAppOrigin(req) {
  const candidate =
    process.env.APP_URL ||
    process.env.PUBLIC_ORIGIN ||
    process.env.FRONTEND_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : null) ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
    (process.env.RAILWAY_PUBLIC_DOMAIN
      ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
      : null);
  if (candidate) {
    try {
      const parsed = new URL(candidate);
      ensure(
        ["http:", "https:"].includes(parsed.protocol) &&
          !parsed.username &&
          !parsed.password,
        500,
        "Public application URL is invalid",
      );
      return parsed.origin;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, "Public application URL is invalid");
    }
  }
  if (process.env.NODE_ENV !== "production") return "http://localhost:5173";
  throw new ApiError(503, "Public application URL is not configured");
}

function recordActivity(
  tx,
  organizationId,
  action,
  title,
  description,
  assetId = null,
  createdAt,
) {
  return tx.activity.create({
    data: {
      organizationId,
      action,
      title,
      description: description || null,
      assetId,
      ...(createdAt ? { createdAt } : {}),
    },
  });
}

function publicAsset(asset, expectedReturn = null) {
  return {
    ...asset,
    purchaseCost:
      asset.purchaseCost === null ? null : Number(asset.purchaseCost),
    expectedReturn,
  };
}

function publicPerson(membership) {
  return {
    id: membership.id,
    userId: membership.userId,
    name: membership.name,
    email: membership.email,
    role: membership.role,
    department: membership.department,
    status: membership.status,
  };
}

module.exports = {
  ApiError,
  ensure,
  asObject,
  text,
  email,
  date,
  enumValue,
  decimal,
  uniqueSlug,
  publicAppOrigin,
  recordActivity,
  publicAsset,
  publicPerson,
};
