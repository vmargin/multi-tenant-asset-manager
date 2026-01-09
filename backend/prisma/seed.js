/**
 * DATABASE SEED SCRIPT
 * 
 * This script populates the database with initial test data.
 * It's run with: npx prisma db seed
 * 
 * Purpose:
 * - Creates sample organizations (tenants)
 * - Creates sample users with hashed passwords
 * - Creates sample categories
 * - Useful for development and testing
 * 
 * Multi-tenant setup:
 * - Creates 2 organizations (Acme Corp and Globex Corp)
 * - Each has its own users and categories
 * - Demonstrates data isolation between tenants
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

/**
 * MAIN SEED FUNCTION
 * 
 * This async function runs all the seed operations.
 * It's async because database operations are asynchronous.
 */
async function main() {
  console.log('🚀 Starting Seed...');

  /**
   * STEP 1: CLEANUP - DELETE EXISTING DATA
   * 
   * IMPORTANT: Delete in REVERSE order of dependencies!
   * 
   * Database relationships (foreign keys):
   * - Assets depend on Categories and Organizations
   * - Categories depend on Organizations
   * - Users depend on Organizations
   * 
   * If we try to delete Organizations first, it fails because
   * Assets/Categories/Users still reference them.
   * 
   * Order: Assets → Categories → Users → Organizations
   */
  console.log('🧹 Cleaning existing data...');
  await prisma.asset.deleteMany();      // Delete all assets first
  await prisma.category.deleteMany();   // Then categories
  await prisma.user.deleteMany();       // Then users
  await prisma.organization.deleteMany(); // Finally organizations
  console.log('✅ Database cleared.');

  /**
   * STEP 2: CREATE TENANT 1 - ACME CORP
   * 
   * This demonstrates the multi-tenant architecture.
   * Each organization is a separate tenant with isolated data.
   */
  
  // Create the organization (tenant)
  const acme = await prisma.organization.create({
    data: {
      name: 'Acme Corp',
      slug: 'acme-corp', // URL-friendly identifier
    },
  });

  // Create a category for this organization
  // Categories are organization-specific (multi-tenant)
  const acmeCategory = await prisma.category.create({
    data: { name: 'Hardware', organizationId: acme.id }
  });

  /**
   * CREATE USER WITH HASHED PASSWORD
   * 
   * CRITICAL: Always hash passwords before storing!
   * 
   * bcrypt.hash(password, saltRounds):
   * - password: The plain text password
   * - 10: Salt rounds (how many times to hash - higher = more secure but slower)
   * - Returns: Hashed password string
   * 
   * Why hash?
   * - If database is compromised, attackers can't see real passwords
   * - bcrypt is one-way (can't reverse the hash)
   * - Each hash is unique (even for same password, due to salt)
   */
  const hashedPassword1 = await bcrypt.hash('password123', 10);
  
  // Create user for Acme Corp
  await prisma.user.create({
    data: {
      email: 'admin@acme.com',
      password: hashedPassword1, // Store hashed password, NOT plain text!
      role: 'ADMIN',
      organizationId: acme.id, // Link user to organization
    },
  });

  /**
   * STEP 3: CREATE TENANT 2 - GLOBEX CORP
   * 
   * Second organization to demonstrate multi-tenancy.
   * This organization's data is completely separate from Acme Corp.
   */
  
  // Create second organization
  const globex = await prisma.organization.create({
    data: {
      name: 'Globex Corp',
      slug: 'globex',
    },
  });

  // Create category for Globex
  const globexCategory = await prisma.category.create({
    data: { name: 'General', organizationId: globex.id }
  });

  // Hash password for Globex user
  const hashedPassword2 = await bcrypt.hash('password123', 10);
  
  // Create user for Globex Corp
  await prisma.user.create({
    data: {
      email: 'hank@globex.com',
      password: hashedPassword2,
      role: 'ADMIN',
      organizationId: globex.id,
    },
  });

  /**
   * SEED COMPLETE
   * 
   * Print login credentials for testing.
   * These are the same passwords that were hashed above.
   */
  console.log('✨ Seed Finished!');
  console.log('Acme User: admin@acme.com / password123');
  console.log('Globex User: hank@globex.com / password123');
}

/**
 * EXECUTE SEED FUNCTION
 * 
 * Run the main function and handle errors/cleanup.
 * 
 * .catch() - If main() throws an error, catch it and exit with error code
 * .finally() - Always runs, even if error occurred
 *   - Disconnects Prisma client to close database connections
 *   - Prevents "connection pool exhausted" errors
 */
main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1); // Exit with error code (1 = failure)
  })
  .finally(async () => {
    await prisma.$disconnect(); // Close database connection
  });