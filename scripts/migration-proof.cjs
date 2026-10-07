const path = require("node:path");
const fs = require("node:fs");
const crypto = require("node:crypto");
const { PrismaClient } = require("../backend/node_modules/@prisma/client");
require("../backend/node_modules/dotenv").config({
  path: path.join(__dirname, "../backend/.env"),
  quiet: true,
});

const destination = path.join(
  __dirname,
  "../.playwright-mcp/database-baseline.json",
);
const hash = (value) =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex");
const queries = {
  Organization: 'SELECT "id", "name", "slug" FROM "Organization" ORDER BY "id"',
  User: 'SELECT "id", "email", "password", "role", "organizationId" FROM "User" ORDER BY "id"',
  Category:
    'SELECT "id", "name", "organizationId" FROM "Category" ORDER BY "id"',
  Asset:
    'SELECT "id", "name", "serialNumber", "status", "organizationId", "categoryId" FROM "Asset" ORDER BY "id"',
};

async function main() {
  const client = new PrismaClient();
  const query = async (sql) => ({ rows: await client.$queryRawUnsafe(sql) });
  await client.$connect();
  try {
    const records = {};
    for (const [model, sql] of Object.entries(queries)) {
      const { rows } = await query(sql);
      records[model] = rows.map((row) => {
        if (model === "Asset") {
          row.status =
            row.status.toLowerCase() === "active"
              ? "AVAILABLE"
              : row.status.toUpperCase();
        }
        return { id: row.id, fingerprint: hash(row) };
      });
    }
    if (process.argv[2] === "record") {
      if (fs.existsSync(destination))
        throw new Error("Baseline already exists; refusing to overwrite it.");
      fs.mkdirSync(path.dirname(destination), { recursive: true });
      fs.writeFileSync(destination, JSON.stringify(records, null, 2));
      const indexes = await query(
        "SELECT indexname FROM pg_indexes WHERE schemaname = current_schema() ORDER BY indexname",
      );
      const migrations = await query(
        "SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = current_schema() AND table_name = '_prisma_migrations') AS present",
      );
      console.log(
        JSON.stringify({
          recorded: true,
          counts: Object.fromEntries(
            Object.entries(records).map(([model, rows]) => [
              model,
              rows.length,
            ]),
          ),
          migrationHistoryPresent: migrations.rows[0].present,
          uniqueIndexes: indexes.rows
            .map((row) => row.indexname)
            .filter((name) => /Organization_name|Asset_serial/.test(name)),
        }),
      );
    } else if (process.argv[2] === "check") {
      const baseline = JSON.parse(fs.readFileSync(destination, "utf8"));
      const preserved = {};
      for (const [model, rows] of Object.entries(baseline)) {
        const current = new Map(
          records[model].map((row) => [row.id, row.fingerprint]),
        );
        if (rows.some((row) => current.get(row.id) !== row.fingerprint))
          throw new Error(`Protected ${model} records changed or disappeared.`);
        preserved[model] = rows.length;
      }
      console.log(
        JSON.stringify({ originalRecordsPreserved: true, preserved }),
      );
    } else {
      throw new Error("Use record before migration or check after migration.");
    }
  } finally {
    await client.$disconnect();
  }
}

main().catch((error) => {
  console.error(
    JSON.stringify({
      migrationProof: "failed",
      code: error.code || "VALIDATION",
      message: error.code
        ? "Database operation failed; inspect connection configuration locally."
        : error.message,
    }),
  );
  process.exitCode = 1;
});
