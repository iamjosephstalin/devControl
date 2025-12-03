-- Migration: Convert user-based permissions to role-based permissions
-- Run these queries in your database to update the schema

-- Step 1: Add the role column to the Permission table
ALTER TABLE "Permission" ADD COLUMN "role" VARCHAR(50);

-- Step 1.5: Make userId nullable temporarily for migration
ALTER TABLE "Permission" ALTER COLUMN "userId" DROP NOT NULL;

-- Step 2: Update existing permissions to use roles based on user roles
-- This maps existing user permissions to their roles
UPDATE "Permission" SET "role" = (
  SELECT "User"."role" 
  FROM "User" 
  WHERE "User"."id" = "Permission"."userId"
);

-- Step 3: Remove any permissions where we couldn't map the user role
DELETE FROM "Permission" WHERE "role" IS NULL;

-- Step 4: Make role column required (not null)
ALTER TABLE "Permission" ALTER COLUMN "role" SET NOT NULL;

-- Step 5: Remove duplicate permissions (same role + resource + action)
-- Create a temporary table with unique role-based permissions
CREATE TEMP TABLE temp_permissions AS 
SELECT DISTINCT "role", "resource", "action", 
       MIN("id") as "id", 
       MIN("createdAt") as "createdAt",
       MAX("updatedAt") as "updatedAt"
FROM "Permission" 
WHERE "role" IS NOT NULL
GROUP BY "role", "resource", "action";

-- Delete all permissions
DELETE FROM "Permission";

-- Insert the deduplicated permissions back (without userId)
INSERT INTO "Permission" ("id", "role", "resource", "action", "createdAt", "updatedAt")
SELECT "id", "role", "resource", "action", "createdAt", "updatedAt" 
FROM temp_permissions;

-- Step 6: Drop the old userId column (now that we're using roles)
-- Uncomment the line below if you want to completely remove userId
-- ALTER TABLE "Permission" DROP COLUMN "userId";

-- Step 7: Drop the old unique constraint (if it exists)
ALTER TABLE "Permission" DROP CONSTRAINT IF EXISTS "Permission_userId_resource_action_key";

-- Step 8: Create new unique constraint for role-based permissions
ALTER TABLE "Permission" ADD CONSTRAINT "Permission_role_resource_action_key" 
UNIQUE ("role", "resource", "action");

-- Step 9: Create index for better query performance
CREATE INDEX IF NOT EXISTS "Permission_role_idx" ON "Permission"("role");
CREATE INDEX IF NOT EXISTS "Permission_resource_idx" ON "Permission"("resource");

-- Step 10: Insert default admin permissions (full access)
INSERT INTO "Permission" ("id", "role", "resource", "action", "createdAt", "updatedAt") VALUES
-- Projects
(gen_random_uuid(), 'admin', 'projects', 'read', NOW(), NOW()),
(gen_random_uuid(), 'admin', 'projects', 'write', NOW(), NOW()),
(gen_random_uuid(), 'admin', 'projects', 'delete', NOW(), NOW()),
(gen_random_uuid(), 'admin', 'projects', 'manage', NOW(), NOW()),

-- Tasks
(gen_random_uuid(), 'admin', 'tasks', 'read', NOW(), NOW()),
(gen_random_uuid(), 'admin', 'tasks', 'write', NOW(), NOW()),
(gen_random_uuid(), 'admin', 'tasks', 'delete', NOW(), NOW()),
(gen_random_uuid(), 'admin', 'tasks', 'manage', NOW(), NOW()),

-- Secrets
(gen_random_uuid(), 'admin', 'secrets', 'read', NOW(), NOW()),
(gen_random_uuid(), 'admin', 'secrets', 'write', NOW(), NOW()),
(gen_random_uuid(), 'admin', 'secrets', 'delete', NOW(), NOW()),
(gen_random_uuid(), 'admin', 'secrets', 'manage', NOW(), NOW()),

-- Servers
(gen_random_uuid(), 'admin', 'servers', 'read', NOW(), NOW()),
(gen_random_uuid(), 'admin', 'servers', 'write', NOW(), NOW()),
(gen_random_uuid(), 'admin', 'servers', 'delete', NOW(), NOW()),
(gen_random_uuid(), 'admin', 'servers', 'manage', NOW(), NOW()),

-- Notes
(gen_random_uuid(), 'admin', 'notes', 'read', NOW(), NOW()),
(gen_random_uuid(), 'admin', 'notes', 'write', NOW(), NOW()),
(gen_random_uuid(), 'admin', 'notes', 'delete', NOW(), NOW()),
(gen_random_uuid(), 'admin', 'notes', 'manage', NOW(), NOW()),

-- Integrations
(gen_random_uuid(), 'admin', 'integrations', 'read', NOW(), NOW()),
(gen_random_uuid(), 'admin', 'integrations', 'write', NOW(), NOW()),
(gen_random_uuid(), 'admin', 'integrations', 'delete', NOW(), NOW()),
(gen_random_uuid(), 'admin', 'integrations', 'manage', NOW(), NOW()),

-- Deployments
(gen_random_uuid(), 'admin', 'deployments', 'read', NOW(), NOW()),
(gen_random_uuid(), 'admin', 'deployments', 'write', NOW(), NOW()),
(gen_random_uuid(), 'admin', 'deployments', 'delete', NOW(), NOW()),
(gen_random_uuid(), 'admin', 'deployments', 'manage', NOW(), NOW()),

-- Users
(gen_random_uuid(), 'admin', 'users', 'read', NOW(), NOW()),
(gen_random_uuid(), 'admin', 'users', 'write', NOW(), NOW()),
(gen_random_uuid(), 'admin', 'users', 'delete', NOW(), NOW()),
(gen_random_uuid(), 'admin', 'users', 'manage', NOW(), NOW())

ON CONFLICT ("role", "resource", "action") DO NOTHING;

-- Step 11: Insert default client permissions (limited access)
INSERT INTO "Permission" ("id", "role", "resource", "action", "createdAt", "updatedAt") VALUES
-- Projects (read/write only)
(gen_random_uuid(), 'client', 'projects', 'read', NOW(), NOW()),
(gen_random_uuid(), 'client', 'projects', 'write', NOW(), NOW()),

-- Tasks (read/write/delete)
(gen_random_uuid(), 'client', 'tasks', 'read', NOW(), NOW()),
(gen_random_uuid(), 'client', 'tasks', 'write', NOW(), NOW()),
(gen_random_uuid(), 'client', 'tasks', 'delete', NOW(), NOW()),

-- Secrets (read only)
(gen_random_uuid(), 'client', 'secrets', 'read', NOW(), NOW()),

-- Notes (read/write)
(gen_random_uuid(), 'client', 'notes', 'read', NOW(), NOW()),
(gen_random_uuid(), 'client', 'notes', 'write', NOW(), NOW()),

-- Integrations (read only)
(gen_random_uuid(), 'client', 'integrations', 'read', NOW(), NOW()),

-- Deployments (read only)
(gen_random_uuid(), 'client', 'deployments', 'read', NOW(), NOW())

ON CONFLICT ("role", "resource", "action") DO NOTHING;

-- Verification queries to check the migration
SELECT 'Admin permissions:' as info, COUNT(*) as count FROM "Permission" WHERE "role" = 'admin'
UNION ALL
SELECT 'Client permissions:' as info, COUNT(*) as count FROM "Permission" WHERE "role" = 'client'
UNION ALL
SELECT 'Total permissions:' as info, COUNT(*) as count FROM "Permission";

-- Show the new structure
SELECT "role", "resource", "action" FROM "Permission" ORDER BY "role", "resource", "action";