-- Align the persisted defaults and tenant-scoped uniqueness with the client schema.
BEGIN;
ALTER TABLE "Asset" ALTER COLUMN "status" SET DEFAULT 'AVAILABLE';
CREATE UNIQUE INDEX "Category_organizationId_name_key" ON "Category"("organizationId", "name");
CREATE UNIQUE INDEX "Location_organizationId_name_key" ON "Location"("organizationId", "name");
COMMIT;
