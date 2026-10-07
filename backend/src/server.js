require("dotenv").config();

const express = require("express");
const cors = require("cors");
const prisma = require("./db/prisma");
const auth = require("./controllers/authController");
const workspace = require("./controllers/workspaceController");
const { ApiError } = require("./lib/api");
const {
  authenticate,
  requireMembership,
  allowRoles,
} = require("./middleware/auth");

const app = express();
const api = express.Router();

app.disable("x-powered-by");
app.use(
  cors({
    origin(origin, callback) {
      const allowed = process.env.FRONTEND_URL;
      if (!origin || !allowed || origin === allowed)
        return callback(null, true);
      return callback(new Error("Origin not allowed"));
    },
    methods: ["GET", "POST", "PATCH", "OPTIONS"],
    allowedHeaders: ["Authorization", "Content-Type", "X-Organization-Id"],
    credentials: false,
    maxAge: 600,
  }),
);
app.use(express.json({ limit: "1mb", strict: true }));

app.get("/health", (_req, res) => res.json({ status: "ok" }));
app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

api.post("/auth/login", auth.login);
api.post("/auth/demo", auth.demo);
api.post("/auth/register", auth.register);
api.post("/auth/accept-invite", auth.acceptInvite);
api.get("/auth/me", authenticate, auth.me);

api.use(authenticate, requireMembership);
api.get("/workspace", workspace.getWorkspace);
api.get("/assets", workspace.listAssets);
api.post(
  "/assets/import",
  allowRoles(...["OWNER", "MANAGER"]),
  workspace.importAssets,
);
api.post("/assets", allowRoles("OWNER", "MANAGER"), workspace.createAsset);
api.patch("/assets/:id", allowRoles("OWNER", "MANAGER"), workspace.updateAsset);
api.post(
  "/assets/:id/checkout",
  allowRoles("OWNER", "MANAGER"),
  workspace.checkoutAsset,
);
api.post(
  "/assets/:id/checkin",
  allowRoles("OWNER", "MANAGER"),
  workspace.checkinAsset,
);
api.post(
  "/assets/:id/transfer",
  allowRoles("OWNER", "MANAGER"),
  workspace.transferAsset,
);
api.post(
  "/assets/:id/retire",
  allowRoles("OWNER", "MANAGER"),
  workspace.retireAsset,
);
api.get("/assets/:id/label", workspace.assetLabel);
api.post(
  "/categories",
  allowRoles("OWNER", "MANAGER"),
  workspace.createCategory,
);
api.patch(
  "/categories/:id",
  allowRoles("OWNER", "MANAGER"),
  workspace.updateCategory,
);
api.post(
  "/locations",
  allowRoles("OWNER", "MANAGER"),
  workspace.createLocation,
);
api.patch(
  "/locations/:id",
  allowRoles("OWNER", "MANAGER"),
  workspace.updateLocation,
);
api.post("/people", allowRoles("OWNER"), workspace.createPerson);
api.patch("/people/:id", allowRoles("OWNER"), workspace.updatePerson);
api.post("/requests", workspace.createRequest);
api.patch(
  "/requests/:id",
  allowRoles("OWNER", "MANAGER"),
  workspace.updateRequest,
);
api.post("/audits", allowRoles("OWNER", "MANAGER"), workspace.createAudit);
api.patch("/audits/:id", allowRoles("OWNER", "MANAGER"), workspace.updateAudit);
api.patch("/organization", allowRoles("OWNER"), workspace.updateOrganization);

app.use("/api", api);

app.use((req, _res, next) => next(new ApiError(404, "Not found")));
app.use((error, _req, res, _next) => {
  if (res.headersSent) return;
  if (error instanceof ApiError)
    return res.status(error.status).json({ error: error.message });
  if (error && error.type === "entity.parse.failed")
    return res.status(400).json({ error: "Invalid JSON body" });
  if (error && error.code === "P2002")
    return res
      .status(409)
      .json({ error: "A conflicting record already exists" });
  if (error && error.code === "P2003")
    return res.status(404).json({ error: "Related record not found" });
  if (error && error.code === "P2025")
    return res.status(404).json({ error: "Record not found" });
  if (error && error.code === "P2004")
    return res
      .status(409)
      .json({ error: "The requested change conflicts with current state" });
  if (error && error.code) console.error("API request failed:", error.code);
  else console.error("API request failed:", error?.name || "Error");
  return res.status(500).json({ error: "Request could not be completed" });
});

if (require.main === module) {
  const port = Number(process.env.PORT || 5000);
  const host = process.env.HOST || "0.0.0.0";
  const server = app.listen(port, host, () =>
    console.log(`AssetHub API listening on ${port}`),
  );
  const shutdown = () =>
    server.close(() => prisma.$disconnect().finally(() => process.exit(0)));
  process.once("SIGTERM", shutdown);
  process.once("SIGINT", shutdown);
}

module.exports = app;
