const { PrismaClient } = require("@prisma/client");

// Each serverless instance shares one bounded pool; queries never log their arguments.
const options = {};
if (process.env.DATABASE_URL) {
  const database = new URL(process.env.DATABASE_URL);
  database.searchParams.set("connection_limit", "2");
  database.searchParams.set("pool_timeout", "15");
  options.datasourceUrl = database.toString();
}
module.exports = new PrismaClient(options);
