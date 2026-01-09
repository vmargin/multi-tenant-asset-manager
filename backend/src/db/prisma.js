/**
 * PRISMA CLIENT SINGLETON
 * 
 * This file creates a single instance of Prisma Client that can be reused
 * throughout the application. This is important because:
 * 
 * 1. Prisma Client maintains connection pools - creating multiple instances
 *    wastes resources and can cause connection issues
 * 2. The singleton pattern ensures we only have ONE database connection manager
 * 3. This file is imported by all controllers instead of creating new instances
 */

const { PrismaClient } = require('@prisma/client');

/**
 * Create a single Prisma Client instance
 * 
 * Logging configuration:
 * - In development: Log all queries, errors, and warnings (helps with debugging)
 * - In production: Only log errors (reduces noise in logs)
 */
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

/**
 * GRACEFUL SHUTDOWN HANDLER
 * 
 * When the Node.js process is about to exit (e.g., server stops, Ctrl+C),
 * we need to properly close the database connection. This prevents:
 * - Database connection leaks
 * - Hanging processes
 * - "Connection pool exhausted" errors
 * 
 * $disconnect() closes all active database connections gracefully
 */
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

// Export the singleton instance so other files can import and use it
module.exports = prisma;
