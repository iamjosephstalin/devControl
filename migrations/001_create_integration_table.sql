-- Create Integration table for secure storage of external service credentials
CREATE TABLE IF NOT EXISTS "Integration" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "type" VARCHAR(50) NOT NULL, -- 'github', 'gitlab', 'bitbucket', 'vercel', 'netlify', 'railway', 'render'
  "name" VARCHAR(255) NOT NULL, -- User-friendly name for the integration
  "encryptedConfig" TEXT NOT NULL, -- Encrypted JSON containing tokens and configuration
  "status" VARCHAR(20) NOT NULL DEFAULT 'connected', -- 'connected', 'error', 'disconnected'
  "lastSync" TIMESTAMP WITH TIME ZONE,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  -- Ensure one integration per user per type per name
  UNIQUE("userId", "type", "name")
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS "idx_integration_user_type" ON "Integration"("userId", "type");
CREATE INDEX IF NOT EXISTS "idx_integration_status" ON "Integration"("status");

-- Add comments for documentation
COMMENT ON TABLE "Integration" IS 'Stores encrypted credentials for external service integrations';
COMMENT ON COLUMN "Integration"."encryptedConfig" IS 'Encrypted JSON containing sensitive tokens and configuration';
COMMENT ON COLUMN "Integration"."type" IS 'Type of integration: github, gitlab, bitbucket, vercel, netlify, railway, render';
COMMENT ON COLUMN "Integration"."status" IS 'Connection status: connected, error, disconnected';