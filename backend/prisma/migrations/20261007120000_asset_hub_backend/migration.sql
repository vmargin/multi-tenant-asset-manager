-- Forward-only, data-preserving expansion from the original single-tenant tables.
-- Existing Organization, User, Category, and Asset primary keys and records remain intact.
BEGIN;

ALTER TABLE "Organization" DROP CONSTRAINT IF EXISTS "Organization_name_key";
DROP INDEX IF EXISTS "Organization_name_key";
ALTER TABLE "Organization" ADD COLUMN "description" TEXT;
ALTER TABLE "Organization" ADD COLUMN "currency" TEXT NOT NULL DEFAULT 'PHP';
ALTER TABLE "Organization" ADD COLUMN "isDemo" BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE "Organization" ADD COLUMN "expiresAt" TIMESTAMP(3);

ALTER TABLE "User" ALTER COLUMN "organizationId" DROP NOT NULL;
ALTER TABLE "User" ADD COLUMN "name" TEXT NOT NULL DEFAULT '';
ALTER TABLE "User" ADD COLUMN "demoExpiresAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN "isDemoActor" BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE "User" ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
UPDATE "User" SET "name" = split_part("email", '@', 1) WHERE "name" = '';
ALTER TABLE "User" DROP CONSTRAINT IF EXISTS "User_organizationId_fkey";
ALTER TABLE "User" ADD CONSTRAINT "User_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "User_organizationId_idx" ON "User"("organizationId");

CREATE TABLE "Membership" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "userId" TEXT,
  "email" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "role" TEXT NOT NULL DEFAULT 'MEMBER',
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  "department" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Membership_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Membership_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Membership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "Membership" ("id", "organizationId", "userId", "email", "name", "role", "status")
SELECT gen_random_uuid()::text, u."organizationId", u."id", u."email", u."name",
       CASE upper(u."role") WHEN 'ADMIN' THEN 'OWNER' WHEN 'OWNER' THEN 'OWNER'
         WHEN 'MANAGER' THEN 'MANAGER' ELSE 'MEMBER' END,
       'ACTIVE'
FROM "User" u WHERE u."organizationId" IS NOT NULL;
CREATE UNIQUE INDEX "Membership_organizationId_id_key" ON "Membership"("organizationId", "id");
CREATE UNIQUE INDEX "Membership_organizationId_email_key" ON "Membership"("organizationId", "email");
CREATE INDEX "Membership_userId_status_idx" ON "Membership"("userId", "status");
CREATE INDEX "Membership_organizationId_role_status_idx" ON "Membership"("organizationId", "role", "status");

CREATE TABLE "Location" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "parentId" TEXT,
  "address" TEXT,
  CONSTRAINT "Location_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Location_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "Location_organizationId_id_key" ON "Location"("organizationId", "id");
CREATE INDEX "Location_organizationId_parentId_idx" ON "Location"("organizationId", "parentId");
ALTER TABLE "Location" ADD CONSTRAINT "Location_parent_tenant_fkey"
  FOREIGN KEY ("organizationId", "parentId") REFERENCES "Location"("organizationId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Category" ADD COLUMN "description" TEXT;
CREATE UNIQUE INDEX "Category_organizationId_id_key" ON "Category"("organizationId", "id");
ALTER TABLE "Category" DROP CONSTRAINT IF EXISTS "Category_organizationId_fkey";
ALTER TABLE "Category" ADD CONSTRAINT "Category_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Asset" DROP CONSTRAINT IF EXISTS "Asset_serialNumber_key";
DROP INDEX IF EXISTS "Asset_serialNumber_key";
ALTER TABLE "Asset" ALTER COLUMN "categoryId" DROP NOT NULL;
ALTER TABLE "Asset" ADD COLUMN "assetTag" TEXT;
ALTER TABLE "Asset" ADD COLUMN "locationId" TEXT;
ALTER TABLE "Asset" ADD COLUMN "assignedToId" TEXT;
ALTER TABLE "Asset" ADD COLUMN "model" TEXT;
ALTER TABLE "Asset" ADD COLUMN "purchaseDate" TIMESTAMP(3);
ALTER TABLE "Asset" ADD COLUMN "warrantyDate" TIMESTAMP(3);
ALTER TABLE "Asset" ADD COLUMN "purchaseCost" DECIMAL(12,2);
ALTER TABLE "Asset" ADD COLUMN "notes" TEXT;
ALTER TABLE "Asset" ADD COLUMN "imageKey" TEXT;
ALTER TABLE "Asset" ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Asset" DROP CONSTRAINT IF EXISTS "Asset_categoryId_fkey";
ALTER TABLE "Asset" DROP CONSTRAINT IF EXISTS "Asset_organizationId_fkey";
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
UPDATE "Asset" SET "status" = CASE lower("status")
  WHEN 'active' THEN 'AVAILABLE' WHEN 'available' THEN 'AVAILABLE'
  WHEN 'assigned' THEN 'ASSIGNED' WHEN 'maintenance' THEN 'MAINTENANCE'
  WHEN 'retired' THEN 'RETIRED' ELSE upper("status") END;
CREATE UNIQUE INDEX "Asset_organizationId_id_key" ON "Asset"("organizationId", "id");
CREATE UNIQUE INDEX "Asset_organizationId_assetTag_key" ON "Asset"("organizationId", "assetTag");
CREATE UNIQUE INDEX "Asset_organizationId_serialNumber_key" ON "Asset"("organizationId", "serialNumber");
CREATE INDEX "Asset_organizationId_status_idx" ON "Asset"("organizationId", "status");
CREATE INDEX "Asset_organizationId_categoryId_idx" ON "Asset"("organizationId", "categoryId");
CREATE INDEX "Asset_organizationId_locationId_idx" ON "Asset"("organizationId", "locationId");
CREATE INDEX "Asset_organizationId_assignedToId_idx" ON "Asset"("organizationId", "assignedToId");
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_category_tenant_fkey"
  FOREIGN KEY ("organizationId", "categoryId") REFERENCES "Category"("organizationId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_location_tenant_fkey"
  FOREIGN KEY ("organizationId", "locationId") REFERENCES "Location"("organizationId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_assignee_tenant_fkey"
  FOREIGN KEY ("organizationId", "assignedToId") REFERENCES "Membership"("organizationId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "Checkout" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "assetId" TEXT NOT NULL,
  "personId" TEXT NOT NULL,
  "checkoutDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expectedReturn" TIMESTAMP(3),
  "returnedAt" TIMESTAMP(3),
  "notes" TEXT,
  CONSTRAINT "Checkout_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Checkout_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Checkout_asset_tenant_fkey" FOREIGN KEY ("organizationId", "assetId") REFERENCES "Asset"("organizationId", "id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "Checkout_person_tenant_fkey" FOREIGN KEY ("organizationId", "personId") REFERENCES "Membership"("organizationId", "id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "Checkout_organizationId_id_key" ON "Checkout"("organizationId", "id");
CREATE INDEX "Checkout_organizationId_assetId_returnedAt_idx" ON "Checkout"("organizationId", "assetId", "returnedAt");
CREATE INDEX "Checkout_organizationId_personId_checkoutDate_idx" ON "Checkout"("organizationId", "personId", "checkoutDate");
CREATE UNIQUE INDEX "Checkout_one_open_per_asset" ON "Checkout"("organizationId", "assetId") WHERE "returnedAt" IS NULL;

CREATE TABLE "MaintenanceRequest" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "assetId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
  "status" TEXT NOT NULL DEFAULT 'OPEN',
  "requestedById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "MaintenanceRequest_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "MaintenanceRequest_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "MaintenanceRequest_asset_tenant_fkey" FOREIGN KEY ("organizationId", "assetId") REFERENCES "Asset"("organizationId", "id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "MaintenanceRequest_requester_tenant_fkey" FOREIGN KEY ("organizationId", "requestedById") REFERENCES "Membership"("organizationId", "id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "MaintenanceRequest_organizationId_id_key" ON "MaintenanceRequest"("organizationId", "id");
CREATE INDEX "MaintenanceRequest_organizationId_status_createdAt_idx" ON "MaintenanceRequest"("organizationId", "status", "createdAt");
CREATE INDEX "MaintenanceRequest_organizationId_assetId_idx" ON "MaintenanceRequest"("organizationId", "assetId");

-- Preserve legacy maintenance state as actionable work without inventing a cause.
INSERT INTO "MaintenanceRequest" (
  "id", "organizationId", "assetId", "title", "description", "priority", "status",
  "requestedById", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, a."organizationId", a."id", 'Existing maintenance',
       'Maintenance status preserved from the previous application.', 'MEDIUM', 'IN_PROGRESS',
       owner."id", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "Asset" a
CROSS JOIN LATERAL (
  SELECT m."id"
  FROM "Membership" m
  WHERE m."organizationId" = a."organizationId" AND m."role" = 'OWNER' AND m."status" = 'ACTIVE'
  ORDER BY m."createdAt", m."id"
  LIMIT 1
) owner
WHERE a."status" = 'MAINTENANCE';

DO $migration$
BEGIN
  IF EXISTS (
    SELECT 1 FROM "Asset" a
    WHERE a."status" = 'MAINTENANCE'
      AND NOT EXISTS (
        SELECT 1 FROM "MaintenanceRequest" r
        WHERE r."organizationId" = a."organizationId" AND r."assetId" = a."id"
          AND r."status" = 'IN_PROGRESS' AND r."title" = 'Existing maintenance'
      )
  ) THEN
    RAISE EXCEPTION 'Cannot preserve maintenance state without an active owner membership';
  END IF;
  END;
$migration$;

CREATE TABLE "Audit" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "locationId" TEXT,
  "status" TEXT NOT NULL DEFAULT 'IN_PROGRESS',
  "assetIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "verifiedAssetIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "version" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" TIMESTAMP(3),
  CONSTRAINT "Audit_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Audit_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Audit_location_tenant_fkey" FOREIGN KEY ("organizationId", "locationId") REFERENCES "Location"("organizationId", "id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "Audit_organizationId_id_key" ON "Audit"("organizationId", "id");
CREATE INDEX "Audit_organizationId_locationId_idx" ON "Audit"("organizationId", "locationId");
CREATE INDEX "Audit_organizationId_status_createdAt_idx" ON "Audit"("organizationId", "status", "createdAt");

CREATE TABLE "Activity" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "assetId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Activity_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Activity_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Activity_asset_tenant_fkey" FOREIGN KEY ("organizationId", "assetId") REFERENCES "Asset"("organizationId", "id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "Activity_organizationId_id_key" ON "Activity"("organizationId", "id");
CREATE INDEX "Activity_organizationId_createdAt_idx" ON "Activity"("organizationId", "createdAt");
CREATE INDEX "Activity_organizationId_assetId_idx" ON "Activity"("organizationId", "assetId");

CREATE TABLE "Invitation" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "membershipId" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "invitedById" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "acceptedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Invitation_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Invitation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Invitation_membership_tenant_fkey" FOREIGN KEY ("organizationId", "membershipId") REFERENCES "Membership"("organizationId", "id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Invitation_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "Invitation_tokenHash_key" ON "Invitation"("tokenHash");
CREATE INDEX "Invitation_organizationId_email_acceptedAt_idx" ON "Invitation"("organizationId", "email", "acceptedAt");
CREATE INDEX "Invitation_organizationId_membershipId_idx" ON "Invitation"("organizationId", "membershipId");
CREATE INDEX "Invitation_invitedById_idx" ON "Invitation"("invitedById");
CREATE INDEX "Invitation_expiresAt_idx" ON "Invitation"("expiresAt");

-- Restrict lifecycle values without changing their historical IDs or relationships.
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_status_check" CHECK ("status" IN ('AVAILABLE', 'ASSIGNED', 'MAINTENANCE', 'RETIRED'));
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_role_check" CHECK ("role" IN ('OWNER', 'MANAGER', 'MEMBER'));
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_status_check" CHECK ("status" IN ('ACTIVE', 'INVITED', 'SUSPENDED'));
ALTER TABLE "MaintenanceRequest" ADD CONSTRAINT "MaintenanceRequest_status_check" CHECK ("status" IN ('OPEN', 'IN_PROGRESS', 'RESOLVED'));
ALTER TABLE "MaintenanceRequest" ADD CONSTRAINT "MaintenanceRequest_priority_check" CHECK ("priority" IN ('LOW', 'MEDIUM', 'HIGH'));
ALTER TABLE "Audit" ADD CONSTRAINT "Audit_status_check" CHECK ("status" IN ('IN_PROGRESS', 'COMPLETED'));

COMMIT;
