const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getAssets = async (req, res) => {
  try {
    const assets = await prisma.asset.findMany({
      where: { organizationId: req.user.orgId },
      include: { category: true }
    });
    res.json(assets);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch assets" });
  }
};

const createAsset = async (req, res) => {
  const { name, serialNumber, status } = req.body;
  const orgId = req.user.orgId;

  try {
    let category = await prisma.category.findFirst({ where: { organizationId: orgId } });
    if (!category) {
      category = await prisma.category.create({
        data: { name: 'General', organizationId: orgId }
      });
    }

    const newAsset = await prisma.asset.create({
      data: {
        name,
        serialNumber,
        status: status || 'active',
        organizationId: orgId,
        categoryId: category.id
      }
    });
    res.status(201).json(newAsset);
  } catch (error) {
    console.error("Prisma Error:", error);
    res.status(500).json({ error: "Failed to create asset" });
  }
};

// CRITICAL: This must match the destructuring in server.js
module.exports = { getAssets, createAsset };