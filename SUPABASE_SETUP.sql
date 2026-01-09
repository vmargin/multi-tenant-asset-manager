-- Complete schema setup for Supabase (matches current schema.prisma)
-- Run this in Supabase SQL Editor

-- Create Organization table with UUID
CREATE TABLE IF NOT EXISTS "Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- Create User table with UUID
CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'MEMBER',
    "organizationId" TEXT NOT NULL,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- Create Category table with UUID
CREATE TABLE IF NOT EXISTS "Category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- Create Asset table with UUID
CREATE TABLE IF NOT EXISTS "Asset" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "serialNumber" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    CONSTRAINT "Asset_pkey" PRIMARY KEY ("id")
);

-- Create unique indexes
CREATE UNIQUE INDEX IF NOT EXISTS "Organization_name_key" ON "Organization"("name");
CREATE UNIQUE INDEX IF NOT EXISTS "Organization_slug_key" ON "Organization"("slug");
CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX IF NOT EXISTS "Asset_serialNumber_key" ON "Asset"("serialNumber");

-- Add foreign keys
ALTER TABLE "User" 
    ADD CONSTRAINT "User_organizationId_fkey" 
    FOREIGN KEY ("organizationId") 
    REFERENCES "Organization"("id") 
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Category" 
    ADD CONSTRAINT "Category_organizationId_fkey" 
    FOREIGN KEY ("organizationId") 
    REFERENCES "Organization"("id") 
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Asset" 
    ADD CONSTRAINT "Asset_organizationId_fkey" 
    FOREIGN KEY ("organizationId") 
    REFERENCES "Organization"("id") 
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Asset" 
    ADD CONSTRAINT "Asset_categoryId_fkey" 
    FOREIGN KEY ("categoryId") 
    REFERENCES "Category"("id") 
    ON DELETE RESTRICT ON UPDATE CASCADE;
