const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Starting Seed...');

  // 1. CLEANUP: Delete in REVERSE order of dependency
  // Assets depend on everything -> Categories/Users depend on Org
  console.log('🧹 Cleaning existing data...');
  await prisma.asset.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();
  await prisma.organization.deleteMany();
  console.log('✅ Database cleared.');

  // 2. CREATE TENANT 1: Acme Corp
  const acme = await prisma.organization.create({
    data: {
      name: 'Acme Corp',
      slug: 'acme-corp',
    },
  });

  const acmeCategory = await prisma.category.create({
    data: { name: 'Hardware', organizationId: acme.id }
  });

  await prisma.user.create({
    data: {
      email: 'admin@acme.com',
      password: 'password123', 
      role: 'ADMIN',
      organizationId: acme.id,
    },
  });

  // 3. CREATE TENANT 2: Globex Corp
  const globex = await prisma.organization.create({
    data: {
      name: 'Globex Corp',
      slug: 'globex',
    },
  });

  const globexCategory = await prisma.category.create({
    data: { name: 'General', organizationId: globex.id }
  });

  await prisma.user.create({
    data: {
      email: 'hank@globex.com',
      password: 'password123',
      role: 'ADMIN',
      organizationId: globex.id,
    },
  });

  console.log('✨ Seed Finished!');
  console.log('Acme User: admin@acme.com / password123');
  console.log('Globex User: hank@globex.com / password123');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });