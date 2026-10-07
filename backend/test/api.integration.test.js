const { test } = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const bcrypt = require("bcryptjs");
const prisma = require("../src/db/prisma");
const app = require("../src/server");

const enabled = process.env.RUN_DB_TESTS === "1";
const password = "Integration-Test-Pass-42!";

async function cleanupSyntheticOrganizations(
  organizationIds,
  explicitUserIds = [],
) {
  if (!organizationIds.length) return;
  const linkedMemberships = await prisma.membership.findMany({
    where: { organizationId: { in: organizationIds } },
    select: { userId: true },
  });
  const userIds = [
    ...new Set([
      ...explicitUserIds,
      ...linkedMemberships
        .map((membership) => membership.userId)
        .filter(Boolean),
    ]),
  ];
  await prisma.$transaction(async (tx) => {
    await tx.invitation.deleteMany({
      where: { organizationId: { in: organizationIds } },
    });
    await tx.audit.deleteMany({
      where: { organizationId: { in: organizationIds } },
    });
    await tx.activity.deleteMany({
      where: { organizationId: { in: organizationIds } },
    });
    await tx.maintenanceRequest.deleteMany({
      where: { organizationId: { in: organizationIds } },
    });
    await tx.checkout.deleteMany({
      where: { organizationId: { in: organizationIds } },
    });
    await tx.asset.deleteMany({
      where: { organizationId: { in: organizationIds } },
    });
    await tx.location.deleteMany({
      where: { organizationId: { in: organizationIds } },
    });
    await tx.category.deleteMany({
      where: { organizationId: { in: organizationIds } },
    });
    await tx.membership.deleteMany({
      where: { organizationId: { in: organizationIds } },
    });
    await tx.organization.deleteMany({
      where: { id: { in: organizationIds } },
    });
    if (userIds.length)
      await tx.user.deleteMany({ where: { id: { in: userIds } } });
  });
}

async function fixture(t) {
  const suffix = crypto.randomUUID();
  const organizationIds = [crypto.randomUUID(), crypto.randomUUID()];
  const ownerId = crypto.randomUUID();
  const memberId = crypto.randomUUID();
  const ownerMembershipId = crypto.randomUUID();
  const memberMembershipId = crypto.randomUUID();
  const foreignMembershipId = crypto.randomUUID();
  const foreignUserId = crypto.randomUUID();
  const categoryId = crypto.randomUUID();
  const foreignCategoryId = crypto.randomUUID();
  const locationId = crypto.randomUUID();
  const foreignLocationId = crypto.randomUUID();
  const assetId = crypto.randomUUID();
  const secondAssetId = crypto.randomUUID();
  const foreignAssetId = crypto.randomUUID();
  const emailStem = `api-test-${suffix}`;
  const foreignEmail = `${emailStem}-foreign@example.invalid`;
  const foreignPassword = "Existing-Account-Password-93!";
  const passwordHash = await bcrypt.hash(password, 4);
  const foreignPasswordHash = await bcrypt.hash(foreignPassword, 4);
  const createdUserIds = [ownerId, memberId, foreignUserId];
  const server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  const baseUrl = `http://127.0.0.1:${server.address().port}/api`;
  const orgA = {
    id: organizationIds[0],
    name: `Test A ${suffix}`,
    slug: `test-a-${suffix}`,
  };
  const orgB = {
    id: organizationIds[1],
    name: `Test B ${suffix}`,
    slug: `test-b-${suffix}`,
  };
  try {
    await prisma.$transaction(async (tx) => {
      await tx.organization.createMany({ data: [orgA, orgB] });
      await tx.user.createMany({
        data: [
          {
            id: ownerId,
            name: "Test Owner",
            email: `${emailStem}-owner@example.invalid`,
            password: passwordHash,
            organizationId: orgA.id,
            role: "OWNER",
          },
          {
            id: memberId,
            name: "Test Member",
            email: `${emailStem}-member@example.invalid`,
            password: passwordHash,
            organizationId: orgA.id,
            role: "MEMBER",
          },
          {
            id: foreignUserId,
            name: "Foreign Member",
            email: foreignEmail,
            password: foreignPasswordHash,
            organizationId: orgB.id,
            role: "MEMBER",
          },
        ],
      });
      await tx.membership.createMany({
        data: [
          {
            id: ownerMembershipId,
            organizationId: orgA.id,
            userId: ownerId,
            email: `${emailStem}-owner@example.invalid`,
            name: "Test Owner",
            role: "OWNER",
            status: "ACTIVE",
          },
          {
            id: memberMembershipId,
            organizationId: orgA.id,
            userId: memberId,
            email: `${emailStem}-member@example.invalid`,
            name: "Test Member",
            role: "MEMBER",
            status: "ACTIVE",
          },
        ],
      });
      await tx.membership.create({
        data: {
          id: foreignMembershipId,
          organizationId: orgB.id,
          userId: foreignUserId,
          email: foreignEmail,
          name: "Foreign Member",
          role: "MEMBER",
          status: "ACTIVE",
        },
      });
      await tx.category.createMany({
        data: [
          { id: categoryId, organizationId: orgA.id, name: "Test Hardware" },
          {
            id: foreignCategoryId,
            organizationId: orgB.id,
            name: "Foreign Hardware",
          },
        ],
      });
      await tx.location.create({
        data: { id: locationId, organizationId: orgA.id, name: "Test Room" },
      });
      await tx.location.create({
        data: {
          id: foreignLocationId,
          organizationId: orgB.id,
          name: "Foreign Room",
        },
      });
      await tx.asset.createMany({
        data: [
          {
            id: assetId,
            organizationId: orgA.id,
            name: "Test Laptop",
            serialNumber: `S-${suffix}-1`,
            categoryId,
            status: "AVAILABLE",
          },
          {
            id: secondAssetId,
            organizationId: orgA.id,
            name: "Test Monitor",
            serialNumber: `S-${suffix}-2`,
            categoryId,
            status: "AVAILABLE",
          },
          {
            id: foreignAssetId,
            organizationId: orgB.id,
            name: "Foreign Laptop",
            serialNumber: `S-${suffix}-3`,
            categoryId: foreignCategoryId,
            status: "AVAILABLE",
          },
        ],
      });
    });
  } catch (error) {
    await new Promise((resolve) => server.close(resolve));
    throw error;
  }
  t.after(async () => {
    await prisma.$transaction(async (tx) => {
      await tx.invitation.deleteMany({
        where: { organizationId: { in: organizationIds } },
      });
      await tx.audit.deleteMany({
        where: { organizationId: { in: organizationIds } },
      });
      await tx.activity.deleteMany({
        where: { organizationId: { in: organizationIds } },
      });
      await tx.maintenanceRequest.deleteMany({
        where: { organizationId: { in: organizationIds } },
      });
      await tx.checkout.deleteMany({
        where: { organizationId: { in: organizationIds } },
      });
      await tx.asset.deleteMany({
        where: { id: { in: [assetId, secondAssetId, foreignAssetId] } },
      });
      await tx.location.deleteMany({
        where: { organizationId: { in: organizationIds } },
      });
      await tx.category.deleteMany({
        where: { id: { in: [categoryId, foreignCategoryId] } },
      });
      await tx.membership.deleteMany({
        where: { organizationId: { in: organizationIds } },
      });
      await tx.organization.deleteMany({
        where: { id: { in: organizationIds } },
      });
      await tx.user.deleteMany({ where: { id: { in: createdUserIds } } });
    });
    await new Promise((resolve) => server.close(resolve));
  });

  async function request(
    path,
    { method = "GET", token, organizationId = orgA.id, body } = {},
  ) {
    const response = await fetch(`${baseUrl}${path}`, {
      method,
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(organizationId ? { "X-Organization-Id": organizationId } : {}),
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
    let data = null;
    try {
      data = await response.json();
    } catch {
      /* empty response */
    }
    return { status: response.status, data };
  }

  const ownerLogin = await request("/auth/login", {
    method: "POST",
    organizationId: null,
    body: { email: `${emailStem}-owner@example.invalid`, password },
  });
  const memberLogin = await request("/auth/login", {
    method: "POST",
    organizationId: null,
    body: { email: `${emailStem}-member@example.invalid`, password },
  });
  assert.equal(ownerLogin.status, 200);
  assert.equal(memberLogin.status, 200);
  return {
    request,
    owner: ownerLogin.data.token,
    member: memberLogin.data.token,
    orgA,
    orgB,
    ownerId,
    memberId,
    ownerMembershipId,
    memberMembershipId,
    foreignMembershipId,
    foreignUserId,
    foreignEmail,
    foreignPassword,
    categoryId,
    foreignCategoryId,
    locationId,
    foreignLocationId,
    assetId,
    secondAssetId,
    foreignAssetId,
    createdUserIds,
  };
}

test(
  "tenant boundaries and member permissions are enforced",
  { skip: !enabled },
  async (t) => {
    const f = await fixture(t);
    assert.equal((await f.request("/workspace")).status, 401);
    const truncatedPassword = await f.request("/auth/register", {
      method: "POST",
      organizationId: null,
      body: {
        name: "Long Password Fixture",
        email: `long-${crypto.randomUUID()}@example.invalid`,
        organizationName: "Never Created",
        password: "a".repeat(73),
      },
    });
    assert.equal(truncatedPassword.status, 400);
    const session = await f.request("/auth/me", {
      token: f.owner,
      organizationId: f.orgB.id,
    });
    assert.equal(session.status, 200);
    assert.equal(session.data.activeOrganizationId, f.orgA.id);
    assert.equal(session.data.organizations.length, 1);
    assert.equal(session.data.token, undefined);
    assert.equal(
      (
        await f.request("/workspace", {
          token: f.owner,
          organizationId: f.orgB.id,
        })
      ).status,
      403,
    );
    assert.equal((await f.request("/assets", { token: f.owner })).status, 200);
    assert.equal(
      (
        await f.request(`/assets/${f.foreignAssetId}`, {
          method: "PATCH",
          token: f.owner,
          body: { name: "cross-tenant" },
        })
      ).status,
      404,
    );
    assert.equal(
      (
        await f.request("/assets", {
          method: "POST",
          token: f.member,
          body: { name: "Denied", serialNumber: `DENY-${crypto.randomUUID()}` },
        })
      ).status,
      403,
    );
    assert.equal(
      (
        await f.request("/assets", {
          method: "POST",
          token: f.owner,
          body: {
            name: "Bad Relation",
            serialNumber: `BAD-${crypto.randomUUID()}`,
            categoryId: f.foreignCategoryId,
          },
        })
      ).status,
      404,
    );
    assert.equal(
      (
        await f.request("/assets", {
          method: "POST",
          token: f.owner,
          body: {
            name: "Bad Location",
            serialNumber: `BADLOC-${crypto.randomUUID()}`,
            locationId: f.foreignLocationId,
          },
        })
      ).status,
      404,
    );
    assert.equal(
      (
        await f.request(`/assets/${f.assetId}/checkout`, {
          method: "POST",
          token: f.owner,
          body: { personId: f.foreignMembershipId },
        })
      ).status,
      404,
    );
  },
);

test(
  "checkout compare-and-set allows one concurrent checkout and rejects invalid dates",
  { skip: !enabled },
  async (t) => {
    const f = await fixture(t);
    const attempts = await Promise.all([
      f.request(`/assets/${f.assetId}/checkout`, {
        method: "POST",
        token: f.owner,
        body: {
          personId: f.memberMembershipId,
          checkoutDate: "2026-10-01T10:00:00.000Z",
        },
      }),
      f.request(`/assets/${f.assetId}/checkout`, {
        method: "POST",
        token: f.owner,
        body: {
          personId: f.ownerMembershipId,
          checkoutDate: "2026-10-01T10:00:00.000Z",
        },
      }),
    ]);
    assert.equal(attempts.filter((result) => result.status === 201).length, 1);
    assert.equal(attempts.filter((result) => result.status === 409).length, 1);
    const invalid = await f.request(`/assets/${f.secondAssetId}/checkout`, {
      method: "POST",
      token: f.owner,
      body: {
        personId: f.memberMembershipId,
        checkoutDate: "2026-10-05T00:00:00Z",
        expectedReturn: "2026-10-04T00:00:00Z",
      },
    });
    assert.equal(invalid.status, 400);
  },
);

test(
  "maintenance transitions and audit completion follow saved lifecycle state",
  { skip: !enabled },
  async (t) => {
    const f = await fixture(t);
    const created = await f.request("/requests", {
      method: "POST",
      token: f.member,
      body: { assetId: f.assetId, title: "Keyboard fault", priority: "HIGH" },
    });
    assert.equal(created.status, 201);
    const started = await f.request(`/requests/${created.data.id}`, {
      method: "PATCH",
      token: f.owner,
      body: { status: "IN_PROGRESS" },
    });
    assert.equal(started.status, 200);
    assert.equal(
      (await prisma.asset.findUnique({ where: { id: f.assetId } })).status,
      "MAINTENANCE",
    );
    const resolved = await f.request(`/requests/${created.data.id}`, {
      method: "PATCH",
      token: f.owner,
      body: { status: "RESOLVED" },
    });
    assert.equal(resolved.status, 200);
    assert.equal(
      (await prisma.asset.findUnique({ where: { id: f.assetId } })).status,
      "AVAILABLE",
    );
    const audit = await f.request("/audits", {
      method: "POST",
      token: f.owner,
      body: { name: "Test stocktake" },
    });
    assert.equal(audit.status, 201);
    const incomplete = await f.request(`/audits/${audit.data.id}`, {
      method: "PATCH",
      token: f.owner,
      body: { expectedVersion: 0, status: "COMPLETED" },
    });
    assert.equal(incomplete.status, 409);
    const progress = await f.request(`/audits/${audit.data.id}`, {
      method: "PATCH",
      token: f.owner,
      body: {
        expectedVersion: 0,
        verifiedAssetIds: audit.data.assetIds.slice(0, 1),
      },
    });
    assert.equal(progress.status, 200);
    assert.equal(progress.data.version, 1);
    const stale = await f.request(`/audits/${audit.data.id}`, {
      method: "PATCH",
      token: f.owner,
      body: { expectedVersion: 0, verifiedAssetIds: [] },
    });
    assert.equal(stale.status, 409);
    assert.equal(stale.data.error, "Audit changed. Reload before saving.");
    const complete = await f.request(`/audits/${audit.data.id}`, {
      method: "PATCH",
      token: f.owner,
      body: {
        expectedVersion: 1,
        verifiedAssetIds: audit.data.assetIds,
        status: "COMPLETED",
      },
    });
    assert.equal(complete.status, 200);
    assert.equal(complete.data.status, "COMPLETED");
    assert.equal(complete.data.version, 2);
    const parent = await f.request("/locations", {
      method: "POST",
      token: f.owner,
      body: { name: "Parent Location" },
    });
    const child = await f.request("/locations", {
      method: "POST",
      token: f.owner,
      body: { name: "Child Location", parentId: parent.data.id },
    });
    const cycle = await f.request(`/locations/${parent.data.id}`, {
      method: "PATCH",
      token: f.owner,
      body: { parentId: child.data.id },
    });
    assert.equal(cycle.status, 400);
    const snapshot = await f.request("/workspace", { token: f.owner });
    assert.equal(snapshot.status, 200, snapshot.data.error);
    assert(
      snapshot.data.activity.some(
        (event) => event.action === "maintenance.reported",
      ),
    );
    assert(
      snapshot.data.activity.some(
        (event) => event.action === "maintenance.in_progress",
      ),
    );
    assert(
      snapshot.data.activity.some(
        (event) => event.action === "maintenance.resolved",
      ),
    );
    assert(
      snapshot.data.activity.some(
        (event) => event.action === "audit.completed",
      ),
    );
  },
);

test(
  "bulk import rolls back on duplicate rows and invitation can be accepted only once",
  { skip: !enabled },
  async (t) => {
    const f = await fixture(t);
    const serial = `IMPORT-${crypto.randomUUID()}`;
    const badImport = await f.request("/assets/import", {
      method: "POST",
      token: f.owner,
      body: {
        assets: [
          { name: "Import One", serialNumber: serial },
          { name: "Import Two", serialNumber: serial },
        ],
      },
    });
    assert.equal(badImport.status, 409);
    assert.equal(
      await prisma.asset.count({
        where: { organizationId: f.orgA.id, serialNumber: serial },
      }),
      0,
    );

    const invitedEmail = `invite-${crypto.randomUUID()}@example.invalid`;
    const invite = await f.request("/people", {
      method: "POST",
      token: f.owner,
      body: {
        name: "Invited Person",
        email: invitedEmail,
        role: "MEMBER",
        department: "QA",
      },
    });
    assert.equal(invite.status, 201);
    const token = new URL(
      invite.data.inviteUrl,
      "http://localhost",
    ).searchParams.get("invite");
    const accepted = await f.request("/auth/accept-invite", {
      method: "POST",
      organizationId: null,
      body: { token, name: "Invited Person", password },
    });
    assert.equal(accepted.status, 200);
    f.createdUserIds.push(accepted.data.user.id);
    const reused = await f.request("/auth/accept-invite", {
      method: "POST",
      organizationId: null,
      body: { token, name: "Invited Person", password },
    });
    assert.equal(reused.status, 400);
  },
);

test(
  "public demo provisions isolated synthetic workspaces with enforced 24-hour expiry",
  { skip: !enabled },
  async (t) => {
    const f = await fixture(t);
    const originalAsset = await prisma.asset.findUnique({
      where: { id: f.assetId },
      select: { id: true, status: true, organizationId: true },
    });
    const originalOrganizationIds = [f.orgA.id, f.orgB.id];
    const demo = await f.request("/auth/demo", {
      method: "POST",
      organizationId: null,
    });
    assert.equal(demo.status, 201, demo.data?.error);
    const demoOrganizationIds = demo.data.organizations.map((item) => item.id);
    t.after(() =>
      cleanupSyntheticOrganizations(demoOrganizationIds, [demo.data.user.id]),
    );

    assert.equal(demo.data.user.name, "Jordan Diaz");
    assert.equal(demo.data.organizations.length, 2);
    assert.deepEqual(demo.data.organizations.map((item) => item.name).sort(), [
      "Acme Corp",
      "Orbit Labs",
    ]);
    assert.equal(
      demoOrganizationIds.some((id) => originalOrganizationIds.includes(id)),
      false,
    );
    assert.equal(
      (
        await f.request("/workspace", {
          token: demo.data.token,
          organizationId: f.orgA.id,
        })
      ).status,
      403,
    );

    for (const organizationId of demoOrganizationIds) {
      const snapshot = await f.request("/workspace", {
        token: demo.data.token,
        organizationId,
      });
      assert.equal(snapshot.status, 200, snapshot.data?.error);
      assert.equal(snapshot.data.organization.isDemo, true);
      assert.match(
        snapshot.data.organization.description,
        /synthetic demo workspace/i,
      );
      assert(snapshot.data.organization.expiresAt);
      const remainingMs =
        new Date(snapshot.data.organization.expiresAt).getTime() - Date.now();
      assert(remainingMs <= 24 * 60 * 60 * 1000 + 60_000);
      assert(remainingMs > 23 * 60 * 60 * 1000);
      assert(
        snapshot.data.assets.length >= 20 && snapshot.data.assets.length <= 24,
      );
      assert.equal(snapshot.data.people.length, 5);
      assert(snapshot.data.locations.length >= 2);
      assert(snapshot.data.categories.length >= 4);
      assert(
        snapshot.data.requests.some((item) => item.status === "IN_PROGRESS"),
      );
      assert(snapshot.data.audits.length > 0);
      assert(snapshot.data.activity.length > 0);
      assert(snapshot.data.checkouts.some((item) => item.returnedAt === null));
    }

    const actor = await prisma.user.findUnique({
      where: { id: demo.data.user.id },
      select: { isDemoActor: true, demoExpiresAt: true },
    });
    assert.equal(actor.isDemoActor, true);
    assert(actor.demoExpiresAt > new Date());

    const unchangedOriginalAsset = await prisma.asset.findUnique({
      where: { id: f.assetId },
      select: { id: true, status: true, organizationId: true },
    });
    assert.deepEqual(unchangedOriginalAsset, originalAsset);
    assert.equal(
      await prisma.organization.count({
        where: { id: { in: originalOrganizationIds } },
      }),
      2,
    );

    await prisma.user.update({
      where: { id: demo.data.user.id },
      data: { demoExpiresAt: new Date(Date.now() - 1_000) },
    });
    assert.equal(
      (
        await f.request("/workspace", {
          token: demo.data.token,
          organizationId: demoOrganizationIds[0],
        })
      ).status,
      401,
    );
    assert.equal(
      (
        await f.request("/auth/me", {
          token: demo.data.token,
          organizationId: demoOrganizationIds[0],
        })
      ).status,
      401,
    );
  },
);

test(
  "existing-account invitation requires its current password and never resets it",
  { skip: !enabled },
  async (t) => {
    const f = await fixture(t);
    const before = await prisma.user.findUnique({
      where: { id: f.foreignUserId },
      select: { password: true },
    });
    const invitation = await f.request("/people", {
      method: "POST",
      token: f.owner,
      body: {
        name: "Foreign Member",
        email: f.foreignEmail,
        role: "MEMBER",
        department: "Engineering",
      },
    });
    assert.equal(invitation.status, 201, invitation.data?.error);
    const token = new URL(invitation.data.inviteUrl).searchParams.get("invite");
    assert(token);

    const rejectedPassword = await f.request("/auth/accept-invite", {
      method: "POST",
      organizationId: null,
      body: {
        token,
        name: "Foreign Member",
        password: password,
      },
    });
    assert.equal(rejectedPassword.status, 401);
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const stillUnused = await prisma.invitation.findUnique({
      where: { tokenHash },
      select: { acceptedAt: true },
    });
    assert.equal(stillUnused.acceptedAt, null);

    const accepted = await f.request("/auth/accept-invite", {
      method: "POST",
      organizationId: null,
      body: {
        token,
        name: "Foreign Member",
        password: f.foreignPassword,
      },
    });
    assert.equal(accepted.status, 200, accepted.data?.error);
    assert.equal(accepted.data.user.id, f.foreignUserId);
    assert(accepted.data.organizations.some((item) => item.id === f.orgA.id));
    assert(accepted.data.organizations.some((item) => item.id === f.orgB.id));
    const after = await prisma.user.findUnique({
      where: { id: f.foreignUserId },
      select: { password: true },
    });
    assert.equal(after.password, before.password);

    const originalPasswordLogin = await f.request("/auth/login", {
      method: "POST",
      organizationId: f.orgA.id,
      body: { email: f.foreignEmail, password: f.foreignPassword },
    });
    assert.equal(originalPasswordLogin.status, 200);
    const resetPasswordLogin = await f.request("/auth/login", {
      method: "POST",
      organizationId: f.orgA.id,
      body: { email: f.foreignEmail, password },
    });
    assert.equal(resetPasswordLogin.status, 401);

    const reusedToken = await f.request("/auth/accept-invite", {
      method: "POST",
      organizationId: null,
      body: {
        token,
        name: "Foreign Member",
        password: f.foreignPassword,
      },
    });
    assert.equal(reusedToken.status, 400);
  },
);

test(
  "the last active owner cannot be demoted or suspended",
  { skip: !enabled },
  async (t) => {
    const f = await fixture(t);
    const demote = await f.request(`/people/${f.ownerMembershipId}`, {
      method: "PATCH",
      token: f.owner,
      body: { role: "MEMBER" },
    });
    assert.equal(demote.status, 409);
    const suspend = await f.request(`/people/${f.ownerMembershipId}`, {
      method: "PATCH",
      token: f.owner,
      body: { status: "SUSPENDED" },
    });
    assert.equal(suspend.status, 409);
  },
);

test("the API starts without binding when imported", { skip: !enabled }, () => {
  assert.equal(typeof app, "function");
});

test.after(async () => {
  await prisma.$disconnect();
});
