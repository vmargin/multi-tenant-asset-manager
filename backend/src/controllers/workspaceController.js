const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const QRCode = require("qrcode");
const prisma = require("../db/prisma");
const {
  ApiError,
  ensure,
  asObject,
  text,
  email,
  date,
  enumValue,
  decimal,
  publicAppOrigin,
  recordActivity,
  publicAsset,
  publicPerson,
} = require("../lib/api");

const MANAGERS = ["OWNER", "MANAGER"];
const ROLES = ["OWNER", "MANAGER", "MEMBER"];
const MEMBERSHIP_STATUSES = ["ACTIVE", "SUSPENDED"];
const ASSET_STATUSES = ["AVAILABLE", "ASSIGNED", "MAINTENANCE", "RETIRED"];
const REQUEST_STATUSES = ["OPEN", "IN_PROGRESS", "RESOLVED"];
const PRIORITIES = ["LOW", "MEDIUM", "HIGH"];

async function owned(model, where, label = "Record") {
  const result = await model.findFirst({ where });
  ensure(result, 404, `${label} not found`);
  return result;
}

function assetInput(body, partial = false) {
  const input = asObject(body);
  const allowed = [
    "name",
    "assetTag",
    "serialNumber",
    "categoryId",
    "locationId",
    "model",
    "purchaseDate",
    "warrantyDate",
    "purchaseCost",
    "notes",
    "imageKey",
  ];
  for (const key of Object.keys(input))
    ensure(allowed.includes(key), 400, `${key} cannot be changed here`);
  const data = {};
  if (!partial || Object.hasOwn(input, "name"))
    data.name = text(input.name, "name", { required: true, max: 160 });
  if (!partial || Object.hasOwn(input, "serialNumber"))
    data.serialNumber = text(input.serialNumber, "serialNumber", {
      required: true,
      max: 160,
    });
  for (const field of ["assetTag", "model", "notes", "imageKey"]) {
    if (Object.hasOwn(input, field))
      data[field] =
        text(input[field], field, { max: field === "notes" ? 4000 : 500 }) ??
        null;
  }
  for (const field of ["categoryId", "locationId"]) {
    if (Object.hasOwn(input, field))
      data[field] = text(input[field], field, { max: 100 }) ?? null;
  }
  for (const field of ["purchaseDate", "warrantyDate"]) {
    if (Object.hasOwn(input, field))
      data[field] = date(input[field], field, { optional: true });
  }
  if (Object.hasOwn(input, "purchaseCost"))
    data.purchaseCost = decimal(input.purchaseCost, "purchaseCost");
  if (data.purchaseDate && data.warrantyDate)
    ensure(
      data.warrantyDate >= data.purchaseDate,
      400,
      "warrantyDate must be on or after purchaseDate",
    );
  return data;
}

async function validateAssetRelations(tx, organizationId, data) {
  if (data.categoryId)
    await owned(
      tx.category,
      { id: data.categoryId, organizationId },
      "Category",
    );
  if (data.locationId)
    await owned(
      tx.location,
      { id: data.locationId, organizationId },
      "Location",
    );
}

async function getWorkspace(req, res) {
  const organizationId = req.organizationId;
  const [
    assets,
    categories,
    locations,
    people,
    requests,
    audits,
    activity,
    checkouts,
  ] = await Promise.all([
    prisma.asset.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
    }),
    prisma.category.findMany({
      where: { organizationId },
      orderBy: { name: "asc" },
    }),
    prisma.location.findMany({
      where: { organizationId },
      orderBy: { name: "asc" },
    }),
    prisma.membership.findMany({
      where: { organizationId },
      orderBy: { createdAt: "asc" },
    }),
    prisma.maintenanceRequest.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
    }),
    prisma.audit.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
    }),
    prisma.activity.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
    }),
    prisma.checkout.findMany({
      where: { organizationId },
      orderBy: { checkoutDate: "desc" },
    }),
  ]);
  const openCheckouts = checkouts.filter((item) => item.returnedAt === null);
  const expectedReturns = new Map(
    openCheckouts.map((item) => [item.assetId, item.expectedReturn]),
  );
  res.json({
    organization: {
      id: req.organization.id,
      name: req.organization.name,
      slug: req.organization.slug,
      description: req.organization.description,
      currency: req.organization.currency,
      isDemo: req.organization.isDemo,
      expiresAt: req.organization.expiresAt,
    },
    role: req.membership.role,
    assets: assets.map((asset) =>
      publicAsset(asset, expectedReturns.get(asset.id) || null),
    ),
    categories: categories.map(({ id, name, description }) => ({
      id,
      name,
      description,
    })),
    locations: locations.map(({ id, name, parentId, address }) => ({
      id,
      name,
      parentId,
      address,
    })),
    people: people.map(publicPerson),
    requests: requests.map(
      ({
        id,
        assetId,
        title,
        description,
        priority,
        status,
        requestedById,
        createdAt,
        updatedAt,
      }) => ({
        id,
        assetId,
        title,
        description,
        priority,
        status,
        requestedById,
        createdAt,
        updatedAt,
      }),
    ),
    audits: audits.map(
      ({
        id,
        name,
        locationId,
        status,
        assetIds,
        verifiedAssetIds,
        version,
        createdAt,
        completedAt,
      }) => ({
        id,
        name,
        locationId,
        status,
        assetIds,
        verifiedAssetIds,
        version,
        createdAt,
        completedAt,
      }),
    ),
    activity: activity.map(
      ({ id, action, title, description, assetId, createdAt }) => ({
        id,
        action,
        title,
        description,
        assetId,
        createdAt,
      }),
    ),
    checkouts: checkouts.map(
      ({
        id,
        assetId,
        personId,
        checkoutDate,
        expectedReturn,
        returnedAt,
        notes,
      }) => ({
        id,
        assetId,
        personId,
        checkoutDate,
        expectedReturn,
        returnedAt,
        notes,
      }),
    ),
  });
}

async function listAssets(req, res) {
  const [assets, checkouts] = await Promise.all([
    prisma.asset.findMany({
      where: { organizationId: req.organizationId },
      orderBy: { createdAt: "desc" },
    }),
    prisma.checkout.findMany({
      where: { organizationId: req.organizationId, returnedAt: null },
      select: { assetId: true, expectedReturn: true },
    }),
  ]);
  const due = new Map(
    checkouts.map((item) => [item.assetId, item.expectedReturn]),
  );
  res.json(
    assets.map((asset) => publicAsset(asset, due.get(asset.id) || null)),
  );
}

async function createAsset(req, res) {
  const data = assetInput(req.body);
  const created = await prisma.$transaction(async (tx) => {
    await validateAssetRelations(tx, req.organizationId, data);
    const asset = await tx.asset.create({
      data: {
        ...data,
        organizationId: req.organizationId,
        status: "AVAILABLE",
      },
    });
    await recordActivity(
      tx,
      req.organizationId,
      "asset.created",
      `${asset.name} added`,
      `Asset ${asset.assetTag || asset.serialNumber} was added.`,
      asset.id,
    );
    return asset;
  });
  res.status(201).json(publicAsset(created));
}

async function updateAsset(req, res) {
  const data = assetInput(req.body, true);
  ensure(
    Object.keys(data).length > 0,
    400,
    "At least one descriptive field is required",
  );
  const updated = await prisma.$transaction(async (tx) => {
    const current = await owned(
      tx.asset,
      { id: req.params.id, organizationId: req.organizationId },
      "Asset",
    );
    await validateAssetRelations(tx, req.organizationId, data);
    const purchaseDate = Object.hasOwn(data, "purchaseDate")
      ? data.purchaseDate
      : current.purchaseDate;
    const warrantyDate = Object.hasOwn(data, "warrantyDate")
      ? data.warrantyDate
      : current.warrantyDate;
    ensure(
      !purchaseDate || !warrantyDate || warrantyDate >= purchaseDate,
      400,
      "warrantyDate must be on or after purchaseDate",
    );
    await tx.asset.update({ where: { id: current.id }, data });
    const result = await tx.asset.findUnique({ where: { id: current.id } });
    await recordActivity(
      tx,
      req.organizationId,
      "asset.updated",
      `${result.name} updated`,
      "Asset details were updated.",
      result.id,
    );
    return result;
  });
  res.json(publicAsset(updated));
}

async function importAssets(req, res) {
  const body = asObject(req.body);
  ensure(
    Array.isArray(body.assets) &&
      body.assets.length > 0 &&
      body.assets.length <= 250,
    400,
    "assets must contain 1 to 250 rows",
  );
  const data = body.assets.map((row) => assetInput(row));
  const serials = data.map((item) => item.serialNumber.toLowerCase());
  ensure(
    new Set(serials).size === serials.length,
    409,
    "Import contains duplicate serial numbers",
  );
  const tags = data.map((item) => item.assetTag?.toLowerCase()).filter(Boolean);
  ensure(
    new Set(tags).size === tags.length,
    409,
    "Import contains duplicate asset tags",
  );
  await prisma.$transaction(async (tx) => {
    for (const row of data)
      await validateAssetRelations(tx, req.organizationId, row);
    const existing = await tx.asset.findMany({
      where: {
        organizationId: req.organizationId,
        OR: [
          { serialNumber: { in: data.map((item) => item.serialNumber) } },
          ...(tags.length ? [{ assetTag: { in: tags } }] : []),
        ],
      },
      select: { id: true },
      take: 1,
    });
    ensure(
      existing.length === 0,
      409,
      "Import contains an existing serial number or asset tag",
    );
    await tx.asset.createMany({
      data: data.map((item) => ({
        ...item,
        organizationId: req.organizationId,
        status: "AVAILABLE",
      })),
    });
    await recordActivity(
      tx,
      req.organizationId,
      "asset.imported",
      `${data.length} assets imported`,
      "An asset import completed atomically.",
    );
  });
  res.status(201).json({ count: data.length });
}

async function checkoutAsset(req, res) {
  const body = asObject(req.body);
  const personId = text(body.personId, "personId", {
    required: true,
    max: 100,
  });
  const checkoutDate =
    body.checkoutDate === undefined
      ? new Date()
      : date(body.checkoutDate, "checkoutDate");
  const expectedReturn = date(body.expectedReturn, "expectedReturn", {
    optional: true,
  });
  const notes = text(body.notes, "notes", { max: 1000 }) || null;
  ensure(
    !expectedReturn || expectedReturn > checkoutDate,
    400,
    "expectedReturn must be after checkoutDate",
  );
  const result = await prisma.$transaction(async (tx) => {
    await owned(
      tx.membership,
      { id: personId, organizationId: req.organizationId, status: "ACTIVE" },
      "Person",
    );
    const current = await owned(
      tx.asset,
      { id: req.params.id, organizationId: req.organizationId },
      "Asset",
    );
    ensure(
      current.status === "AVAILABLE",
      409,
      "Asset is not available for checkout",
    );
    const changed = await tx.asset.updateMany({
      where: {
        id: current.id,
        organizationId: req.organizationId,
        status: "AVAILABLE",
      },
      data: { status: "ASSIGNED", assignedToId: personId },
    });
    ensure(changed.count === 1, 409, "Asset is no longer available");
    const checkout = await tx.checkout.create({
      data: {
        organizationId: req.organizationId,
        assetId: current.id,
        personId,
        checkoutDate,
        expectedReturn,
        notes,
      },
    });
    await recordActivity(
      tx,
      req.organizationId,
      "asset.checked_out",
      `${current.name} checked out`,
      `Asset assigned to ${personId}.`,
      current.id,
      checkoutDate,
    );
    return checkout;
  });
  res.status(201).json(result);
}

async function checkinAsset(req, res) {
  const body = asObject(req.body || {});
  const notes = text(body.notes, "notes", { max: 1000 }) || null;
  const returnedAt = new Date();
  const result = await prisma.$transaction(async (tx) => {
    const asset = await owned(
      tx.asset,
      { id: req.params.id, organizationId: req.organizationId },
      "Asset",
    );
    const open = await tx.checkout.findFirst({
      where: {
        organizationId: req.organizationId,
        assetId: asset.id,
        returnedAt: null,
      },
      orderBy: { checkoutDate: "desc" },
    });
    ensure(
      open && asset.status === "ASSIGNED",
      409,
      "Asset has no open checkout",
    );
    const returnNotes = notes
      ? [open.notes, `Return note: ${notes}`].filter(Boolean).join("\n")
      : open.notes;
    const closed = await tx.checkout.updateMany({
      where: {
        id: open.id,
        organizationId: req.organizationId,
        returnedAt: null,
      },
      data: { returnedAt, notes: returnNotes },
    });
    ensure(closed.count === 1, 409, "Checkout was already returned");
    const changed = await tx.asset.updateMany({
      where: {
        id: asset.id,
        organizationId: req.organizationId,
        status: "ASSIGNED",
        assignedToId: open.personId,
      },
      data: { status: "AVAILABLE", assignedToId: null },
    });
    ensure(changed.count === 1, 409, "Asset state changed during return");
    await recordActivity(
      tx,
      req.organizationId,
      "asset.checked_in",
      `${asset.name} returned`,
      "Asset was returned to available inventory.",
      asset.id,
      returnedAt,
    );
    return tx.checkout.findUnique({ where: { id: open.id } });
  });
  res.json(result);
}

async function transferAsset(req, res) {
  const body = asObject(req.body);
  const locationId = text(body.locationId, "locationId", {
    required: true,
    max: 100,
  });
  const result = await prisma.$transaction(async (tx) => {
    await owned(
      tx.location,
      { id: locationId, organizationId: req.organizationId },
      "Location",
    );
    const asset = await owned(
      tx.asset,
      { id: req.params.id, organizationId: req.organizationId },
      "Asset",
    );
    ensure(
      asset.status !== "RETIRED",
      409,
      "Retired assets cannot be transferred",
    );
    const updated = await tx.asset.update({
      where: { id: asset.id },
      data: { locationId },
    });
    await recordActivity(
      tx,
      req.organizationId,
      "asset.transferred",
      `${asset.name} transferred`,
      "Asset location changed.",
      asset.id,
    );
    return updated;
  });
  res.json(publicAsset(result));
}

async function retireAsset(req, res) {
  const result = await prisma.$transaction(async (tx) => {
    const asset = await owned(
      tx.asset,
      { id: req.params.id, organizationId: req.organizationId },
      "Asset",
    );
    const [openCheckout, activeRepair] = await Promise.all([
      tx.checkout.findFirst({
        where: {
          organizationId: req.organizationId,
          assetId: asset.id,
          returnedAt: null,
        },
        select: { id: true },
      }),
      tx.maintenanceRequest.findFirst({
        where: {
          organizationId: req.organizationId,
          assetId: asset.id,
          status: "IN_PROGRESS",
        },
        select: { id: true },
      }),
    ]);
    ensure(
      !openCheckout && !activeRepair && asset.status === "AVAILABLE",
      409,
      "Return or resolve this asset before retiring it",
    );
    const changed = await tx.asset.updateMany({
      where: {
        id: asset.id,
        organizationId: req.organizationId,
        status: "AVAILABLE",
      },
      data: { status: "RETIRED", assignedToId: null },
    });
    ensure(changed.count === 1, 409, "Asset state changed");
    await recordActivity(
      tx,
      req.organizationId,
      "asset.retired",
      `${asset.name} retired`,
      "Asset was retired from active inventory.",
      asset.id,
    );
    return tx.asset.findUnique({ where: { id: asset.id } });
  });
  res.json(publicAsset(result));
}

async function assetLabel(req, res) {
  const asset = await owned(
    prisma.asset,
    { id: req.params.id, organizationId: req.organizationId },
    "Asset",
  );
  const dataUrl = await QRCode.toDataURL(
    `${publicAppOrigin(req)}/#assets/${encodeURIComponent(asset.id)}`,
    { errorCorrectionLevel: "M", margin: 1, width: 256 },
  );
  res.json({ dataUrl });
}

async function createCategory(req, res) {
  const body = asObject(req.body);
  const name = text(body.name, "name", { required: true, max: 120 });
  const description =
    text(body.description, "description", { max: 1000 }) || null;
  const category = await prisma.$transaction(async (tx) => {
    const created = await tx.category.create({
      data: { organizationId: req.organizationId, name, description },
    });
    await recordActivity(
      tx,
      req.organizationId,
      "category.created",
      `${name} category created`,
      "A category was added.",
    );
    return created;
  });
  res
    .status(201)
    .json({
      id: category.id,
      name: category.name,
      description: category.description,
    });
}

async function updateCategory(req, res) {
  const body = asObject(req.body);
  const data = {};
  if (Object.hasOwn(body, "name"))
    data.name = text(body.name, "name", { required: true, max: 120 });
  if (Object.hasOwn(body, "description"))
    data.description =
      text(body.description, "description", { max: 1000 }) || null;
  ensure(
    Object.keys(data).length > 0,
    400,
    "At least one category field is required",
  );
  const category = await prisma.$transaction(async (tx) => {
    const current = await owned(
      tx.category,
      { id: req.params.id, organizationId: req.organizationId },
      "Category",
    );
    const changed = await tx.category.update({
      where: { id: current.id },
      data,
    });
    await recordActivity(
      tx,
      req.organizationId,
      "category.updated",
      `${changed.name} category updated`,
      "A category was updated.",
    );
    return changed;
  });
  res.json({
    id: category.id,
    name: category.name,
    description: category.description,
  });
}

async function validateParent(tx, organizationId, currentId, parentId) {
  if (!parentId) return;
  let cursor = await owned(
    tx.location,
    { id: parentId, organizationId },
    "Parent location",
  );
  const seen = new Set();
  while (cursor) {
    ensure(
      cursor.id !== currentId,
      400,
      "Location cannot be placed under itself or a descendant",
    );
    ensure(!seen.has(cursor.id), 409, "Existing location hierarchy is invalid");
    seen.add(cursor.id);
    if (!cursor.parentId) break;
    cursor = await owned(
      tx.location,
      { id: cursor.parentId, organizationId },
      "Parent location",
    );
  }
}

async function createLocation(req, res) {
  const body = asObject(req.body);
  const name = text(body.name, "name", { required: true, max: 120 });
  const parentId = text(body.parentId, "parentId", { max: 100 }) || null;
  const address = text(body.address, "address", { max: 500 }) || null;
  const location = await prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT "id" FROM "Organization" WHERE "id" = ${req.organizationId} FOR UPDATE`;
    await validateParent(tx, req.organizationId, null, parentId);
    const created = await tx.location.create({
      data: { organizationId: req.organizationId, name, parentId, address },
    });
    await recordActivity(
      tx,
      req.organizationId,
      "location.created",
      `${name} location created`,
      "A location was added.",
    );
    return created;
  });
  res
    .status(201)
    .json({
      id: location.id,
      name: location.name,
      parentId: location.parentId,
      address: location.address,
    });
}

async function updateLocation(req, res) {
  const body = asObject(req.body);
  const data = {};
  if (Object.hasOwn(body, "name"))
    data.name = text(body.name, "name", { required: true, max: 120 });
  if (Object.hasOwn(body, "parentId"))
    data.parentId = text(body.parentId, "parentId", { max: 100 }) || null;
  if (Object.hasOwn(body, "address"))
    data.address = text(body.address, "address", { max: 500 }) || null;
  ensure(
    Object.keys(data).length > 0,
    400,
    "At least one location field is required",
  );
  const location = await prisma.$transaction(async (tx) => {
    if (Object.hasOwn(data, "parentId")) {
      await tx.$queryRaw`SELECT "id" FROM "Organization" WHERE "id" = ${req.organizationId} FOR UPDATE`;
    }
    const current = await owned(
      tx.location,
      { id: req.params.id, organizationId: req.organizationId },
      "Location",
    );
    if (Object.hasOwn(data, "parentId"))
      await validateParent(tx, req.organizationId, current.id, data.parentId);
    const changed = await tx.location.update({
      where: { id: current.id },
      data,
    });
    await recordActivity(
      tx,
      req.organizationId,
      "location.updated",
      `${changed.name} location updated`,
      "A location was updated.",
    );
    return changed;
  });
  res.json({
    id: location.id,
    name: location.name,
    parentId: location.parentId,
    address: location.address,
  });
}

async function createPerson(req, res) {
  const body = asObject(req.body);
  const name = text(body.name, "name", { required: true, max: 120 });
  const personEmail = email(body.email);
  const role = enumValue(body.role, "role", ["MANAGER", "MEMBER"]);
  const department = text(body.department, "department", { max: 120 }) || null;
  const rawToken = crypto.randomBytes(32).toString("base64url");
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const membership = await prisma.$transaction(async (tx) => {
    let member = await tx.membership.findFirst({
      where: { organizationId: req.organizationId, email: personEmail },
    });
    if (member) {
      ensure(
        member.status !== "ACTIVE",
        409,
        "This person is already active in the workspace",
      );
      await tx.invitation.updateMany({
        where: { membershipId: member.id, acceptedAt: null },
        data: { expiresAt: new Date() },
      });
      member = await tx.membership.update({
        where: { id: member.id },
        data: { name, role, department, status: "INVITED", userId: null },
      });
    } else {
      member = await tx.membership.create({
        data: {
          organizationId: req.organizationId,
          email: personEmail,
          name,
          role,
          department,
          status: "INVITED",
        },
      });
    }
    await tx.invitation.create({
      data: {
        organizationId: req.organizationId,
        membershipId: member.id,
        email: personEmail,
        tokenHash,
        invitedById: req.user.id,
        expiresAt,
      },
    });
    await recordActivity(
      tx,
      req.organizationId,
      "person.invited",
      `${name} invited`,
      `An invitation was created for ${personEmail}.`,
    );
    return member;
  });
  const origin = publicAppOrigin(req);
  res
    .status(201)
    .json({
      person: publicPerson(membership),
      inviteUrl: `${origin}/?invite=${encodeURIComponent(rawToken)}`,
    });
}

async function updatePerson(req, res) {
  const body = asObject(req.body);
  const data = {};
  if (Object.hasOwn(body, "role"))
    data.role = enumValue(body.role, "role", ROLES);
  if (Object.hasOwn(body, "department"))
    data.department = text(body.department, "department", { max: 120 }) || null;
  if (Object.hasOwn(body, "status"))
    data.status = enumValue(body.status, "status", MEMBERSHIP_STATUSES);
  ensure(
    Object.keys(data).length > 0,
    400,
    "At least one person field is required",
  );
  const person = await prisma.$transaction(async (tx) => {
    const current = await owned(
      tx.membership,
      { id: req.params.id, organizationId: req.organizationId },
      "Person",
    );
    const becomesOwner =
      data.role === "OWNER" &&
      current.role !== "OWNER" &&
      current.status === "ACTIVE";
    const losesOwner =
      current.role === "OWNER" &&
      current.status === "ACTIVE" &&
      ((data.role && data.role !== "OWNER") ||
        (data.status && data.status !== "ACTIVE"));
    if (losesOwner) {
      await tx.$queryRaw`SELECT "id" FROM "Organization" WHERE "id" = ${req.organizationId} FOR UPDATE`;
      const owners = await tx.membership.count({
        where: {
          organizationId: req.organizationId,
          role: "OWNER",
          status: "ACTIVE",
        },
      });
      ensure(
        owners > 1,
        409,
        "The workspace must keep at least one active owner",
      );
    }
    if (data.status === "ACTIVE")
      ensure(
        current.userId !== null,
        409,
        "This invitation must be accepted before activation",
      );
    if (becomesOwner) data.status = "ACTIVE";
    const changed = await tx.membership.update({
      where: { id: current.id },
      data,
    });
    await recordActivity(
      tx,
      req.organizationId,
      "person.updated",
      `${changed.name} membership updated`,
      "A member role or status was changed.",
    );
    return changed;
  });
  res.json(publicPerson(person));
}

async function createRequest(req, res) {
  const body = asObject(req.body);
  const assetId = text(body.assetId, "assetId", { required: true, max: 100 });
  const title = text(body.title, "title", { required: true, max: 180 });
  const description =
    text(body.description, "description", { max: 3000 }) || null;
  const priority = enumValue(body.priority || "MEDIUM", "priority", PRIORITIES);
  const request = await prisma.$transaction(async (tx) => {
    const asset = await owned(
      tx.asset,
      { id: assetId, organizationId: req.organizationId },
      "Asset",
    );
    ensure(
      asset.status !== "RETIRED",
      409,
      "Retired assets cannot receive maintenance requests",
    );
    const created = await tx.maintenanceRequest.create({
      data: {
        organizationId: req.organizationId,
        assetId,
        title,
        description,
        priority,
        status: "OPEN",
        requestedById: req.membership.id,
      },
    });
    await recordActivity(
      tx,
      req.organizationId,
      "maintenance.reported",
      `${title} reported`,
      `A maintenance request was filed for ${asset.name}.`,
      asset.id,
    );
    return created;
  });
  res.status(201).json(request);
}

async function updateRequest(req, res) {
  const body = asObject(req.body);
  const status = enumValue(body.status, "status", REQUEST_STATUSES);
  ensure(
    Object.keys(body).length === 1,
    400,
    "Only request status can be changed",
  );
  const request = await prisma.$transaction(async (tx) => {
    const current = await owned(
      tx.maintenanceRequest,
      { id: req.params.id, organizationId: req.organizationId },
      "Request",
    );
    if (status === current.status) return current;
    const asset = await owned(
      tx.asset,
      { id: current.assetId, organizationId: req.organizationId },
      "Asset",
    );
    if (status === "IN_PROGRESS") {
      ensure(
        current.status === "OPEN",
        409,
        "Only open requests can enter maintenance",
      );
      const openCheckout = await tx.checkout.findFirst({
        where: {
          organizationId: req.organizationId,
          assetId: asset.id,
          returnedAt: null,
        },
        select: { id: true },
      });
      ensure(
        !openCheckout && asset.status === "AVAILABLE",
        409,
        "Return the asset before starting maintenance",
      );
      const changedAsset = await tx.asset.updateMany({
        where: {
          id: asset.id,
          organizationId: req.organizationId,
          status: "AVAILABLE",
        },
        data: { status: "MAINTENANCE" },
      });
      ensure(changedAsset.count === 1, 409, "Asset is no longer available");
    } else if (status === "RESOLVED") {
      ensure(
        current.status === "IN_PROGRESS" && asset.status === "MAINTENANCE",
        409,
        "Only active maintenance can be resolved",
      );
      const changedAsset = await tx.asset.updateMany({
        where: {
          id: asset.id,
          organizationId: req.organizationId,
          status: "MAINTENANCE",
        },
        data: { status: "AVAILABLE" },
      });
      ensure(changedAsset.count === 1, 409, "Asset state changed");
    } else {
      ensure(
        current.status === "OPEN",
        409,
        "Only in-progress requests can be resolved",
      );
    }
    const changed = await tx.maintenanceRequest.updateMany({
      where: {
        id: current.id,
        organizationId: req.organizationId,
        status: current.status,
      },
      data: { status },
    });
    ensure(changed.count === 1, 409, "Request state changed");
    await recordActivity(
      tx,
      req.organizationId,
      `maintenance.${status.toLowerCase()}`,
      `${current.title} ${status.toLowerCase().replace("_", " ")}`,
      `Maintenance status changed to ${status}.`,
      asset.id,
    );
    return tx.maintenanceRequest.findUnique({ where: { id: current.id } });
  });
  res.json(request);
}

async function createAudit(req, res) {
  const body = asObject(req.body);
  const name = text(body.name, "name", { required: true, max: 160 });
  const locationId = text(body.locationId, "locationId", { max: 100 }) || null;
  const audit = await prisma.$transaction(async (tx) => {
    if (locationId)
      await owned(
        tx.location,
        { id: locationId, organizationId: req.organizationId },
        "Location",
      );
    const assets = await tx.asset.findMany({
      where: {
        organizationId: req.organizationId,
        status: { not: "RETIRED" },
        ...(locationId ? { locationId } : {}),
      },
      select: { id: true },
      orderBy: { id: "asc" },
    });
    const created = await tx.audit.create({
      data: {
        organizationId: req.organizationId,
        name,
        locationId,
        assetIds: assets.map((asset) => asset.id),
        verifiedAssetIds: [],
        status: "IN_PROGRESS",
      },
    });
    await recordActivity(
      tx,
      req.organizationId,
      "audit.started",
      `${name} started`,
      `Inventory snapshot includes ${assets.length} assets.`,
    );
    return created;
  });
  res.status(201).json(audit);
}

async function updateAudit(req, res) {
  const body = asObject(req.body);
  const allowed = ["expectedVersion", "verifiedAssetIds", "status"];
  for (const key of Object.keys(body))
    ensure(allowed.includes(key), 400, `${key} cannot be changed`);
  ensure(
    Number.isInteger(body.expectedVersion) && body.expectedVersion >= 0,
    400,
    "expectedVersion must be a non-negative integer",
  );
  const audit = await prisma.$transaction(async (tx) => {
    const current = await owned(
      tx.audit,
      { id: req.params.id, organizationId: req.organizationId },
      "Audit",
    );
    ensure(
      current.status === "IN_PROGRESS",
      409,
      "Completed audits are read-only",
    );
    ensure(
      current.version === body.expectedVersion,
      409,
      "Audit changed. Reload before saving.",
    );
    let verified = current.verifiedAssetIds;
    if (Object.hasOwn(body, "verifiedAssetIds")) {
      ensure(
        Array.isArray(body.verifiedAssetIds) &&
          body.verifiedAssetIds.every((id) => typeof id === "string"),
        400,
        "verifiedAssetIds must be a list of asset IDs",
      );
      verified = [...new Set(body.verifiedAssetIds)];
      ensure(
        verified.every((id) => current.assetIds.includes(id)),
        400,
        "An asset is outside this audit snapshot",
      );
    }
    const status = enumValue(body.status || "IN_PROGRESS", "status", [
      "IN_PROGRESS",
      "COMPLETED",
    ]);
    if (status === "COMPLETED")
      ensure(
        current.assetIds.every((id) => verified.includes(id)),
        409,
        "Verify every snapshotted asset before completing the audit",
      );
    const changed = await tx.audit.updateMany({
      where: {
        id: current.id,
        organizationId: req.organizationId,
        status: "IN_PROGRESS",
        version: body.expectedVersion,
      },
      data: {
        verifiedAssetIds: verified,
        status,
        version: { increment: 1 },
        ...(status === "COMPLETED" ? { completedAt: new Date() } : {}),
      },
    });
    ensure(changed.count === 1, 409, "Audit changed. Reload before saving.");
    await recordActivity(
      tx,
      req.organizationId,
      status === "COMPLETED" ? "audit.completed" : "audit.updated",
      `${current.name} ${status === "COMPLETED" ? "completed" : "updated"}`,
      `Verified ${verified.length} of ${current.assetIds.length} assets.`,
    );
    return tx.audit.findUnique({ where: { id: current.id } });
  });
  res.json(audit);
}

async function updateOrganization(req, res) {
  const body = asObject(req.body);
  const data = {};
  if (Object.hasOwn(body, "name"))
    data.name = text(body.name, "name", { required: true, max: 120 });
  if (Object.hasOwn(body, "description"))
    data.description =
      text(body.description, "description", { max: 1000 }) || null;
  if (Object.hasOwn(body, "currency")) {
    const currency = text(body.currency, "currency", {
      required: true,
      max: 3,
    }).toUpperCase();
    ensure(
      /^[A-Z]{3}$/.test(currency),
      400,
      "currency must be a three-letter code",
    );
    data.currency = currency;
  }
  ensure(
    Object.keys(data).length > 0,
    400,
    "At least one organization field is required",
  );
  const organization = await prisma.$transaction(async (tx) => {
    const changed = await tx.organization.update({
      where: { id: req.organizationId },
      data,
    });
    await recordActivity(
      tx,
      req.organizationId,
      "organization.updated",
      `${changed.name} workspace updated`,
      "Workspace settings were updated.",
    );
    return changed;
  });
  res.json({
    id: organization.id,
    name: organization.name,
    slug: organization.slug,
    description: organization.description,
    currency: organization.currency,
  });
}

module.exports = {
  getWorkspace,
  listAssets,
  createAsset,
  updateAsset,
  importAssets,
  checkoutAsset,
  checkinAsset,
  transferAsset,
  retireAsset,
  assetLabel,
  createCategory,
  updateCategory,
  createLocation,
  updateLocation,
  createPerson,
  updatePerson,
  createRequest,
  updateRequest,
  createAudit,
  updateAudit,
  updateOrganization,
};
