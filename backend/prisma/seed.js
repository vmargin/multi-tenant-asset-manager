const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const prisma = new PrismaClient();

const workspaceSlug = "asset-hub-local-seed";
const ownerEmail = "asset-hub-local-owner@example.invalid";
const marker =
  "Additive local development seed. Safe to preserve or remove by its exact IDs.";

async function main() {
  if (
    process.env.NODE_ENV === "production" ||
    process.env.ALLOW_DEVELOPMENT_SEED !== "1"
  ) {
    console.log(
      "Seed skipped. Set ALLOW_DEVELOPMENT_SEED=1 in a non-production environment to add local fixtures.",
    );
    return;
  }
  const seedPassword = process.env.SEED_PASSWORD;
  if (!seedPassword || seedPassword.length < 10)
    throw new Error("SEED_PASSWORD must be set to at least 10 characters.");
  const existing = await prisma.organization.findUnique({
    where: { slug: workspaceSlug },
  });
  if (existing) {
    if (existing.isDemo && existing.description === marker) {
      console.log("Local seed workspace already exists; no changes made.");
      return;
    }
    throw new Error(
      "The reserved local seed slug is already in use; no changes made.",
    );
  }
  const existingOwner = await prisma.user.findUnique({
    where: { email: ownerEmail },
  });
  if (existingOwner)
    throw new Error(
      "The reserved local seed account already exists; no changes made.",
    );

  const password = await bcrypt.hash(seedPassword, 12);
  await prisma.$transaction(async (tx) => {
    const organization = await tx.organization.create({
      data: {
        name: "AssetHub Local Seed",
        slug: workspaceSlug,
        description: marker,
        currency: "PHP",
        isDemo: true,
      },
    });
    const user = await tx.user.create({
      data: {
        name: "Local Seed Owner",
        email: ownerEmail,
        password,
        organizationId: organization.id,
        role: "OWNER",
      },
    });
    await tx.membership.create({
      data: {
        organizationId: organization.id,
        userId: user.id,
        email: ownerEmail,
        name: user.name,
        role: "OWNER",
        status: "ACTIVE",
      },
    });
    const category = await tx.category.create({
      data: {
        organizationId: organization.id,
        name: "Computers",
        description: "Local development fixtures",
      },
    });
    const location = await tx.location.create({
      data: {
        organizationId: organization.id,
        name: "Main Office",
        address: "Local development fixture",
      },
    });
    await tx.asset.create({
      data: {
        organizationId: organization.id,
        name: "Development Laptop",
        assetTag: "LOCAL-001",
        serialNumber: "LOCAL-SEED-001",
        status: "AVAILABLE",
        categoryId: category.id,
        locationId: location.id,
        model: "Synthetic fixture",
        purchaseCost: 65000,
        notes: marker,
      },
    });
    await tx.activity.create({
      data: {
        organizationId: organization.id,
        action: "workspace.seeded",
        title: "Local seed workspace created",
        description: marker,
      },
    });
  });
  console.log(
    "Added local synthetic fixtures. The configured password was not displayed.",
  );
}

main()
  .catch((error) => {
    console.error("Local development seed failed safely:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
