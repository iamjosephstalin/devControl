# Secure Integration System

This document explains the secure integration system implemented for storing external service credentials like GitHub, GitLab, Vercel, etc.

## Overview

The integration system provides secure storage and management of external service credentials with the following features:

- **Encrypted Storage**: All sensitive tokens and credentials are encrypted before storage
- **Per-User Isolation**: Each user can only access their own integrations
- **Multiple Accounts**: Support for multiple accounts per service (e.g., multiple GitHub accounts)
- **Persistent Sessions**: Integration details persist until explicitly disconnected
- **Automatic Token Management**: Tokens are automatically retrieved and used for API calls

## Security Features

### Encryption
- All sensitive data is encrypted using AES encryption via the `lib/encryption.ts` module
- Encryption key should be set via `ENCRYPTION_KEY` environment variable
- **Important**: Change the default encryption key in production!

### Database Security
- Foreign key constraints ensure data integrity
- Unique constraints prevent duplicate integrations
- Indexes for optimal query performance
- Proper column types and constraints

### API Security
- Session validation required for all operations
- User isolation - users can only access their own integrations
- Input validation and sanitization
- Error handling without exposing sensitive data

## Database Schema

```sql
CREATE TABLE "Integration" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "type" VARCHAR(50) NOT NULL,
  "name" VARCHAR(255) NOT NULL,
  "encryptedConfig" TEXT NOT NULL,
  "status" VARCHAR(20) NOT NULL DEFAULT 'connected',
  "lastSync" TIMESTAMP WITH TIME ZONE,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  UNIQUE("userId", "type", "name")
);
```

## Supported Integrations

### Version Control
- **GitHub**: Personal Access Tokens
- **GitLab**: Access Tokens (supports custom GitLab instances)
- **Bitbucket**: App Passwords with username

### Deployment Platforms
- **Vercel**: API Tokens (supports team accounts)
- **Netlify**: Personal Access Tokens
- **Railway**: API Tokens
- **Render**: API Keys

## API Endpoints

### List Integrations
```
GET /api/integrations
```
Returns all integrations for the authenticated user (without sensitive tokens).

### Create Integration
```
POST /api/integrations
{
  "type": "github",
  "name": "My GitHub Account",
  "token": "ghp_xxxxxxxxxxxx",
  "config": {
    "baseUrl": "https://github.com" // optional for GitLab
  }
}
```

### Get Integration Details
```
GET /api/integrations/[id]
```
Returns integration details including the decrypted token (for authenticated API calls).

### Update Integration
```
PUT /api/integrations/[id]
{
  "name": "Updated Name",
  "token": "new_token", // optional
  "config": {}, // optional
  "status": "connected" // optional
}
```

### Delete Integration
```
DELETE /api/integrations/[id]
```

## Usage Examples

### Adding a GitHub Integration

1. Navigate to Version Control page
2. Click "Add Integration"
3. Select "GitHub"
4. Enter a name (e.g., "Personal GitHub")
5. Paste your Personal Access Token
6. Click "Create Integration"

The system will test the integration before saving it.

### Using Integration Data

The pages automatically fetch and use integration credentials:

```typescript
// Fetch all GitHub integrations
const githubIntegrations = integrations.filter(i => 
  i.type === 'github' && i.status === 'connected'
)

// Fetch repositories from all connected accounts
const { data: repos } = useQuery({
  queryKey: ["github-repos", githubIntegrations.map(i => i.id)],
  queryFn: async () => {
    const allRepos = []
    for (const integration of githubIntegrations) {
      const token = await getIntegrationToken(integration.id)
      const repos = await fetchGitHubRepos(token)
      allRepos.push(...repos.map(repo => ({ ...repo, integration: integration.name })))
    }
    return allRepos
  },
  enabled: githubIntegrations.length > 0,
})
```

## Components

### IntegrationCard
Displays integration status and provides management actions:
- Test connection
- Edit integration name
- Delete integration
- Link to provider's token management page

### CreateIntegrationDialog
Modal dialog for adding new integrations:
- Service selection
- Dynamic form based on integration type
- Token validation before saving
- Links to token creation pages

## Environment Variables

```bash
# Required: Encryption key for sensitive data (change in production!)
ENCRYPTION_KEY=your-32-character-encryption-key-here

# Database connection (already configured)
DATABASE_URL=your-database-url
```

## Migration

To set up the integration system:

1. Run the migration script:
   ```bash
   psql -d your_database -f scripts/setup-integrations.sql
   ```

2. Ensure encryption key is set in environment variables

3. Restart your application

## Best Practices

### For Users
- Use descriptive names for integrations (e.g., "Work GitHub", "Personal GitLab")
- Regularly rotate API tokens
- Remove unused integrations
- Use minimal required permissions for tokens

### For Developers
- Always validate integration status before making API calls
- Handle API rate limits gracefully
- Log integration errors without exposing tokens
- Test token validity before saving integrations
- Use the `getIntegrationToken()` helper for secure token retrieval

## Troubleshooting

### Common Issues

**Integration test fails during creation:**
- Verify token is valid and not expired
- Check token permissions/scopes
- Ensure network connectivity to the service

**"Integration not found" errors:**
- User might not own the integration
- Integration might have been deleted
- Database connection issues

**Decryption errors:**
- Encryption key might have changed
- Database corruption
- Invalid encrypted data

### Debug Mode

Enable debug logging by setting:
```bash
DEBUG=integrations:*
```

## Security Considerations

1. **Never log or expose tokens** in client-side code or logs
2. **Rotate encryption keys** periodically in production
3. **Use HTTPS** for all API communications
4. **Validate token permissions** when creating integrations
5. **Monitor for suspicious activity** on integration usage
6. **Regular security audits** of stored integrations

## Future Enhancements

- OAuth2 flow support for services that support it
- Token auto-refresh for supported services
- Integration health monitoring and alerts
- Bulk operations for managing multiple integrations
- Integration usage analytics and insights