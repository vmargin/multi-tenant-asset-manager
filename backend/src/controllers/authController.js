const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const prisma = require("../db/prisma");
const {
  ApiError,
  ensure,
  asObject,
  text,
  email,
  enumValue,
  uniqueSlug,
  recordActivity,
} = require("../lib/api");

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const DEMO_TTL_MS = 24 * 60 * 60 * 1000;
const PASSWORD_MIN = 10;

function checkPassword(password) {
  ensure(
    typeof password === "string" &&
      password.length >= PASSWORD_MIN &&
      password.length <= 128 &&
      !bcrypt.truncates(password),
    400,
    `Password must have at least ${PASSWORD_MIN} characters and fit within 72 bytes`,
  );
}

async function buildSession(userId, organizationId = null) {
  ensure(process.env.JWT_SECRET, 500, "Authentication is unavailable");
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, demoExpiresAt: true },
  });
  ensure(
    user && (!user.demoExpiresAt || user.demoExpiresAt > new Date()),
    401,
    "Session expired",
  );
  const memberships = await prisma.membership.findMany({
    where: {
      userId,
      status: "ACTIVE",
      organization: {
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
    },
    include: { organization: { select: { id: true, name: true, slug: true } } },
    orderBy: [{ createdAt: "asc" }, { organization: { name: "asc" } }],
  });
  ensure(memberships.length > 0, 403, "No active workspace membership");
  const activeId = organizationId || memberships[0].organizationId;
  ensure(
    memberships.some((membership) => membership.organizationId === activeId),
    403,
    "Active workspace membership required",
  );
  const organizations = memberships.map((membership) => ({
    id: membership.organization.id,
    name: membership.organization.name,
    slug: membership.organization.slug,
    role: membership.role,
  }));
  const token = jwt.sign({ sub: user.id }, process.env.JWT_SECRET, {
    algorithm: "HS256",
    expiresIn: "24h",
  });
  return {
    token,
    user: { id: user.id, name: user.name, email: user.email },
    organizations,
    activeOrganizationId: activeId,
  };
}

async function login(req, res) {
  const body = asObject(req.body);
  const userEmail = email(body.email);
  ensure(
    typeof body.password === "string" && body.password.length <= 128,
    400,
    "Password is required",
  );
  const user = await prisma.user.findUnique({ where: { email: userEmail } });
  if (!user || !(await bcrypt.compare(body.password, user.password))) {
    throw new ApiError(401, "Invalid email or password");
  }
  ensure(
    !user.demoExpiresAt || user.demoExpiresAt > new Date(),
    401,
    "Demo access has expired",
  );
  const requestedOrg = req.get("x-organization-id") || null;
  res.json(await buildSession(user.id, requestedOrg));
}

async function register(req, res) {
  const body = asObject(req.body);
  const name = text(body.name, "name", { required: true, max: 120 });
  const userEmail = email(body.email);
  const organizationName = text(body.organizationName, "organizationName", {
    required: true,
    max: 120,
  });
  checkPassword(body.password);
  const password = await bcrypt.hash(body.password, 12);
  const user = await prisma.$transaction(async (tx) => {
    const organization = await tx.organization.create({
      data: {
        name: organizationName,
        slug: await uniqueSlug(tx, organizationName),
      },
    });
    const created = await tx.user.create({
      data: {
        name,
        email: userEmail,
        password,
        organizationId: organization.id,
        role: "OWNER",
      },
    });
    await tx.membership.create({
      data: {
        organizationId: organization.id,
        userId: created.id,
        email: userEmail,
        name,
        role: "OWNER",
        status: "ACTIVE",
      },
    });
    await tx.category.create({
      data: { organizationId: organization.id, name: "General" },
    });
    await recordActivity(
      tx,
      organization.id,
      "organization.created",
      "Workspace created",
      `${organizationName} was created.`,
    );
    return created;
  });
  res.status(201).json(await buildSession(user.id));
}

function sampleAssets(workspaceName) {
  const devices = [
    ["MacBook Pro 14-inch", "Laptops", "Apple", 1899],
    ["ThinkPad X1 Carbon", "Laptops", "Lenovo", 1649],
    ["Dell Latitude 7450", "Laptops", "Dell", 1439],
    ["MacBook Air 15-inch", "Laptops", "Apple", 1499],
    ["HP EliteBook 840", "Laptops", "HP", 1299],
    ["Surface Laptop 6", "Laptops", "Microsoft", 1399],
    ["Dell UltraSharp 27", "Displays", "Dell", 579],
    ["Studio Display", "Displays", "Apple", 1599],
    ["LG UltraFine 32", "Displays", "LG", 699],
    ["iPhone 16 Pro", "Mobile", "Apple", 999],
    ["Pixel 9 Pro", "Mobile", "Google", 999],
    ["iPad Air", "Mobile", "Apple", 799],
    ["Sony WH-1000XM5", "Peripherals", "Sony", 399],
    ["Logitech MX Keys", "Peripherals", "Logitech", 119],
    ["CalDigit TS4 Dock", "Peripherals", "CalDigit", 379],
    ["MacBook Pro 16-inch", "Laptops", "Apple", 2499],
    ["Dell Latitude 7440", "Laptops", "Dell", 1399],
    ["ThinkPad T14s", "Laptops", "Lenovo", 1549],
    ["Cisco Webex Desk Camera", "Peripherals", "Cisco", 149],
    ["Epson EcoTank Pro", "Office", "Epson", 699],
    ["Synology DS923+", "Network", "Synology", 599],
    ["Ubiquiti UniFi Switch", "Network", "Ubiquiti", 379],
    ["BenQ 4K Projector", "Displays", "BenQ", 1299],
  ];
  return devices.map(([name, categoryName, model, cost], index) => ({
    name: `${name}${workspaceName === "Orbit Labs" && index < 4 ? " Studio" : ""}`,
    categoryName,
    model,
    cost,
    index,
  }));
}

async function createDemoWorkspace(tx, options) {
  const {
    organizationName,
    organization,
    actor,
    expiresAt,
    fakeUsers,
    currency,
  } = options;
  const categories = new Map();
  for (const name of [
    "Laptops",
    "Displays",
    "Mobile",
    "Peripherals",
    "Office",
    "Network",
  ]) {
    categories.set(
      name,
      await tx.category.create({
        data: { organizationId: organization.id, name },
      }),
    );
  }
  const locations = [];
  locations.push(
    await tx.location.create({
      data: {
        organizationId: organization.id,
        name: "Headquarters",
        address: "100 Market Street",
      },
    }),
  );
  locations.push(
    await tx.location.create({
      data: {
        organizationId: organization.id,
        name: "Engineering",
        parentId: locations[0].id,
      },
    }),
  );
  locations.push(
    await tx.location.create({
      data: {
        organizationId: organization.id,
        name: "Operations",
        parentId: locations[0].id,
      },
    }),
  );

  const members = [
    await tx.membership.create({
      data: {
        organizationId: organization.id,
        userId: actor.id,
        email: actor.email,
        name: actor.name,
        role: "OWNER",
        status: "ACTIVE",
        department: "Operations",
      },
    }),
  ];
  for (const person of fakeUsers) {
    const fake = await tx.user.create({
      data: {
        name: person.name,
        email: person.email,
        password: person.password,
        demoExpiresAt: expiresAt,
      },
    });
    members.push(
      await tx.membership.create({
        data: {
          organizationId: organization.id,
          userId: fake.id,
          email: fake.email,
          name: fake.name,
          role: "MEMBER",
          status: "ACTIVE",
          department: person.department,
        },
      }),
    );
  }

  const createdAssets = [];
  const startDate = new Date(Date.now() - 370 * 24 * 60 * 60 * 1000);
  const devices = sampleAssets(organizationName);
  for (const device of devices) {
    const serialNumber = `${organizationName.startsWith("Acme") ? "AC" : "OR"}-${String(device.index + 1).padStart(4, "0")}`;
    const assigned = device.index >= 15 && device.index <= 17;
    const maintenance = device.index === 18;
    const retired = device.index === 19;
    const assignedTo = assigned ? members[1 + (device.index % 4)] : null;
    const purchased = new Date(
      startDate.getTime() + device.index * 6 * 24 * 60 * 60 * 1000,
    );
    const asset = await tx.asset.create({
      data: {
        organizationId: organization.id,
        name: device.name,
        assetTag: `AS-${String(device.index + 1).padStart(4, "0")}`,
        serialNumber,
        model: device.model,
        status: assigned
          ? "ASSIGNED"
          : maintenance
            ? "MAINTENANCE"
            : retired
              ? "RETIRED"
              : "AVAILABLE",
        categoryId: categories.get(device.categoryName).id,
        locationId: locations[device.index % locations.length].id,
        assignedToId: assignedTo?.id || null,
        purchaseDate: purchased,
        warrantyDate: new Date(purchased.getTime() + 365 * 24 * 60 * 60 * 1000),
        purchaseCost: device.cost * 56,
        notes: `Synthetic demo inventory for ${organizationName}.`,
        createdAt: purchased,
      },
    });
    createdAssets.push(asset);
    if (assigned && assignedTo) {
      await tx.checkout.create({
        data: {
          organizationId: organization.id,
          assetId: asset.id,
          personId: assignedTo.id,
          checkoutDate: new Date(
            Date.now() - (25 - device.index) * 24 * 60 * 60 * 1000,
          ),
          expectedReturn: new Date(
            Date.now() + (device.index - 12) * 7 * 24 * 60 * 60 * 1000,
          ),
          notes: "Issued during the synthetic workspace setup.",
        },
      });
    }
    if (maintenance) {
      await tx.maintenanceRequest.create({
        data: {
          organizationId: organization.id,
          assetId: asset.id,
          title: "Intermittent display connection",
          description:
            "USB-C display output disconnects under load. Adapter inspection is in progress.",
          priority: "HIGH",
          status: "IN_PROGRESS",
          requestedById: members[2].id,
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        },
      });
    }
    const eventAt = assigned
      ? new Date(Date.now() - (25 - device.index) * 24 * 60 * 60 * 1000)
      : maintenance
        ? new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
        : retired
          ? new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)
          : purchased;
    await recordActivity(
      tx,
      organization.id,
      assigned
        ? "asset.checked_out"
        : retired
          ? "asset.retired"
          : maintenance
            ? "asset.maintenance"
            : "asset.added",
      assigned
        ? `${asset.name} checked out`
        : retired
          ? `${asset.name} retired`
          : maintenance
            ? `${asset.name} reported for repair`
            : `${asset.name} added`,
      `Synthetic inventory activity in ${organizationName}.`,
      asset.id,
      eventAt,
    );
  }
  await tx.audit.create({
    data: {
      organizationId: organization.id,
      name: "Q3 Equipment Verification",
      locationId: locations[0].id,
      status: "IN_PROGRESS",
      assetIds: createdAssets
        .filter(
          (asset) =>
            asset.status !== "RETIRED" && asset.locationId === locations[0].id,
        )
        .map((asset) => asset.id),
      verifiedAssetIds: createdAssets
        .filter(
          (asset) =>
            asset.status === "AVAILABLE" &&
            asset.locationId === locations[0].id,
        )
        .slice(0, 12)
        .map((asset) => asset.id),
      createdAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000),
    },
  });
  for (let i = 0; i < 8; i += 1) {
    await recordActivity(
      tx,
      organization.id,
      "workspace.activity",
      "Inventory review completed",
      `A routine review was recorded for ${organizationName}.`,
      null,
      new Date(Date.now() - (10 + i * 3) * 24 * 60 * 60 * 1000),
    );
  }
  return {
    organization: { ...organization, currency },
    assetCount: createdAssets.length,
  };
}

async function demo(req, res) {
  ensure(process.env.JWT_SECRET, 500, "Authentication is unavailable");
  const now = new Date();
  const recentLimit = new Date(now.getTime() - 60 * 60 * 1000);
  const quickCount = await prisma.user.count({
    where: { isDemoActor: true, createdAt: { gt: recentLimit } },
  });
  if (quickCount >= 100) {
    res.set("Retry-After", "3600");
    throw new ApiError(
      429,
      "Demo access is temporarily busy. Please try again shortly.",
    );
  }
  const expiresAt = new Date(now.getTime() + DEMO_TTL_MS);
  const actorPassword = await bcrypt.hash(
    crypto.randomBytes(32).toString("base64url"),
    10,
  );
  const actor = {
    id: crypto.randomUUID(),
    name: "Jordan Diaz",
    email: `demo-${crypto.randomUUID()}@example.invalid`,
    password: actorPassword,
  };
  const fakeNames = [
    ["Maya Chen", "maya"],
    ["Ethan Brooks", "ethan"],
    ["Sofia Patel", "sofia"],
    ["Noah Williams", "noah"],
    ["Lena Garcia", "lena"],
    ["Oliver Kim", "oliver"],
    ["Amara Johnson", "amara"],
    ["Theo Martin", "theo"],
  ];
  const fakeUsers = fakeNames.map(([name, handle]) => ({
    name,
    email: `demo-${crypto.randomUUID()}-${handle}@example.invalid`,
    department: ["Engineering", "Operations", "Design", "Finance"][
      fakeNames.findIndex((entry) => entry[0] === name) % 4
    ],
  }));
  for (const user of fakeUsers)
    user.password = await bcrypt.hash(
      crypto.randomBytes(32).toString("base64url"),
      10,
    );

  const provisioning = await prisma.$transaction(
    async (tx) => {
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(17017, 1001)::text`;
      const recentDemos = await tx.user.count({
        where: { isDemoActor: true, createdAt: { gt: recentLimit } },
      });
      if (recentDemos >= 100) return { limited: true };
      await tx.user.create({
        data: { ...actor, demoExpiresAt: expiresAt, isDemoActor: true },
      });
      for (const workspace of [
        { name: "Acme Corp", currency: "PHP" },
        { name: "Orbit Labs", currency: "PHP" },
      ]) {
        const organization = await tx.organization.create({
          data: {
            name: workspace.name,
            slug: await uniqueSlug(tx, `demo-${workspace.name}`),
            description:
              "Synthetic demo workspace. All sample people, equipment and activity are invented.",
            currency: workspace.currency,
            isDemo: true,
            expiresAt,
          },
        });
        await createDemoWorkspace(tx, {
          organizationName: workspace.name,
          organization,
          actor,
          expiresAt,
          fakeUsers: fakeUsers.slice(
            workspace.name === "Acme Corp" ? 0 : 4,
            workspace.name === "Acme Corp" ? 4 : 8,
          ),
          currency: workspace.currency,
        });
      }
      return { limited: false };
    },
    { timeout: 30000, maxWait: 5000 },
  );
  if (provisioning.limited) {
    res.set("Retry-After", "3600");
    throw new ApiError(
      429,
      "Demo access is temporarily busy. Please try again shortly.",
    );
  }
  res.status(201).json(await buildSession(actor.id));
}

async function acceptInvite(req, res) {
  const body = asObject(req.body);
  const token = text(body.token, "token", { required: true, max: 300 });
  const name = text(body.name, "name", { required: true, max: 120 });
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const invitation = await prisma.invitation.findUnique({
    where: { tokenHash },
    include: { membership: true },
  });
  ensure(
    invitation &&
      !invitation.acceptedAt &&
      invitation.expiresAt > new Date() &&
      invitation.membership.status === "INVITED",
    400,
    "Invitation is invalid or expired",
  );
  const userEmail = email(invitation.email);
  const existing = await prisma.user.findUnique({
    where: { email: userEmail },
  });
  let userPassword = null;
  if (existing) {
    ensure(
      typeof body.password === "string" && body.password.length <= 128,
      400,
      "Password is required",
    );
    ensure(
      await bcrypt.compare(body.password, existing.password),
      401,
      "Use the existing account password to accept this invitation",
    );
  } else {
    checkPassword(body.password);
    userPassword = await bcrypt.hash(body.password, 12);
  }
  const userId = await prisma.$transaction(async (tx) => {
    const claimed = await tx.invitation.updateMany({
      where: {
        id: invitation.id,
        tokenHash,
        acceptedAt: null,
        expiresAt: { gt: new Date() },
      },
      data: { acceptedAt: new Date() },
    });
    ensure(claimed.count === 1, 400, "Invitation is invalid or expired");
    let acceptedUser = existing;
    if (!acceptedUser) {
      acceptedUser = await tx.user.create({
        data: { name, email: userEmail, password: userPassword },
      });
    }
    await tx.membership.update({
      where: { id: invitation.membershipId },
      data: {
        userId: acceptedUser.id,
        name: existing ? existing.name : name,
        status: "ACTIVE",
      },
    });
    return acceptedUser.id;
  });
  res.json(await buildSession(userId, invitation.organizationId));
}

async function me(req, res) {
  const session = await buildSession(req.auth.userId);
  delete session.token;
  res.json(session);
}

module.exports = { login, register, demo, acceptInvite, me, buildSession };
