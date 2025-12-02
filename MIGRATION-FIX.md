# Integration Table Schema Fix

## Issue
The original migration script used `UUID` data types, but your existing `User` table uses `TEXT` for the `id` column, causing a foreign key constraint error:

```
ERROR: 42804: foreign key constraint "Integration_userId_fkey" cannot be implemented
DETAIL: Key columns "userId" and "id" are of incompatible types: uuid and text.
```

## Solution

### Option 1: Use Fixed Migration Script (Recommended)
```bash
# Run the corrected migration
psql -d your_database_name -f scripts/setup-integrations-fixed.sql
```

### Option 2: If Table Already Exists with Wrong Schema
```bash
# Clean up the existing table first
psql -d your_database_name -f scripts/cleanup-integrations.sql

# Then run the fixed migration
psql -d your_database_name -f scripts/setup-integrations-fixed.sql
```

## What Changed

### Before (Incorrect)
```sql
CREATE TABLE "Integration" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL,
  -- ... other columns
);
```

### After (Fixed)
```sql
CREATE TABLE "Integration" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL,
  -- ... other columns
);
```

## Verification

After running the migration, verify it worked:

```sql
-- Check table structure
\d "Integration"

-- Verify foreign key constraint exists
SELECT constraint_name, table_name, column_name 
FROM information_schema.key_column_usage 
WHERE table_name = 'Integration' 
  AND constraint_name LIKE '%fkey%';

-- Test inserting a record (replace 'your-user-id' with actual user ID)
INSERT INTO "Integration" ("userId", "type", "name", "encryptedConfig") 
VALUES ('your-user-id', 'github', 'Test Integration', 'encrypted-config-here');

-- Clean up test record
DELETE FROM "Integration" WHERE "name" = 'Test Integration';
```

## Files Involved

- `scripts/setup-integrations-fixed.sql` - Corrected migration script
- `scripts/cleanup-integrations.sql` - Cleanup script if needed
- `scripts/setup-integrations.sql` - Original (incorrect) script - **Do not use**

## Next Steps

1. Run the fixed migration script
2. Set your encryption key in `.env`
3. Restart your application
4. Test adding an integration via the UI

The application should now work correctly with the proper schema matching your existing database structure.