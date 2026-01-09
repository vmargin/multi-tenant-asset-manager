-- Seed data for Multi-Tenant Asset Manager
-- Run this in Supabase SQL Editor after running SUPABASE_SETUP.sql
-- This creates test organizations, users, and categories

-- Clear existing data (optional - uncomment if you want to reset)
-- DELETE FROM "Asset";
-- DELETE FROM "Category";
-- DELETE FROM "User";
-- DELETE FROM "Organization";

-- ============================================
-- TENANT 1: ACME CORP
-- ============================================

-- Create Acme Corp organization
-- Using gen_random_uuid() for UUID generation (PostgreSQL built-in function)
WITH acme_org AS (
    INSERT INTO "Organization" ("id", "name", "slug")
    VALUES (gen_random_uuid(), 'Acme Corp', 'acme-corp')
    ON CONFLICT ("slug") DO UPDATE SET "name" = EXCLUDED."name"
    RETURNING "id"
)
-- Create Hardware category for Acme
INSERT INTO "Category" ("id", "name", "organizationId")
SELECT 
    gen_random_uuid(),
    'Hardware',
    acme_org.id
FROM acme_org
ON CONFLICT DO NOTHING;

-- Create Acme user with hashed password
-- Password: password123
-- Hash generated with bcrypt (salt rounds: 10)
WITH acme_org AS (
    SELECT "id" FROM "Organization" WHERE "slug" = 'acme-corp'
)
INSERT INTO "User" ("id", "email", "password", "role", "organizationId")
SELECT 
    gen_random_uuid(),
    'admin@acme.com',
    '$2b$10$7SEmXD6a5fu8avHF3MN.Q.x9qtBiWGwKKOfY9rJoGC6caghKq49.i', -- password123
    'ADMIN',
    acme_org.id
FROM acme_org
ON CONFLICT ("email") DO NOTHING;

-- ============================================
-- TENANT 2: GLOBEX CORP
-- ============================================

-- Create Globex Corp organization
WITH globex_org AS (
    INSERT INTO "Organization" ("id", "name", "slug")
    VALUES (gen_random_uuid(), 'Globex Corp', 'globex')
    ON CONFLICT ("slug") DO UPDATE SET "name" = EXCLUDED."name"
    RETURNING "id"
)
-- Create General category for Globex
INSERT INTO "Category" ("id", "name", "organizationId")
SELECT 
    gen_random_uuid(),
    'General',
    globex_org.id
FROM globex_org
ON CONFLICT DO NOTHING;

-- Create Globex user with hashed password
-- Password: password123
-- Hash generated with bcrypt (salt rounds: 10)
WITH globex_org AS (
    SELECT "id" FROM "Organization" WHERE "slug" = 'globex'
)
INSERT INTO "User" ("id", "email", "password", "role", "organizationId")
SELECT 
    gen_random_uuid(),
    'hank@globex.com',
    '$2b$10$xUfE1Ppd9.jU.xclFp/g4.Z4pWdWEoi/OG8eLWOn4HDMwqWBNIL8y', -- password123
    'ADMIN',
    globex_org.id
FROM globex_org
ON CONFLICT ("email") DO NOTHING;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check what was created
SELECT 'Organizations' as table_name, COUNT(*) as count FROM "Organization"
UNION ALL
SELECT 'Users', COUNT(*) FROM "User"
UNION ALL
SELECT 'Categories', COUNT(*) FROM "Category";

-- View created data
SELECT 'Acme Corp Users' as info, email, role FROM "User" u
JOIN "Organization" o ON u."organizationId" = o.id
WHERE o.slug = 'acme-corp'
UNION ALL
SELECT 'Globex Corp Users', email, role FROM "User" u
JOIN "Organization" o ON u."organizationId" = o.id
WHERE o.slug = 'globex';

-- ============================================
-- LOGIN CREDENTIALS FOR TESTING
-- ============================================
-- Acme Corp: admin@acme.com / password123
-- Globex Corp: hank@globex.com / password123
