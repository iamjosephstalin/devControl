# Quick Setup: Secure Integration System

## 🚀 Quick Start

### 1. Run Database Migration
```bash
# IMPORTANT: Use the fixed migration script due to schema compatibility
psql -d your_database_name -f scripts/setup-integrations-fixed.sql

# Or copy/paste the SQL from scripts/setup-integrations-fixed.sql into your database admin tool

# If you had issues with the original script, clean up first:
# psql -d your_database_name -f scripts/cleanup-integrations.sql
```

### 2. Set Encryption Key
```bash
# Add to your .env file:
ENCRYPTION_KEY=your-super-secret-32-character-key-here-change-this-in-prod

# Generate a secure key:
# openssl rand -hex 32
```

### 3. Restart Application
```bash
npm run dev
```

## ✅ Verify Setup

1. Navigate to `/version-control`
2. Click "Add Integration" 
3. Try adding a GitHub integration with a personal access token
4. Should save successfully and show your repositories

## 🔧 What Changed

### New Features
- **Secure Token Storage**: All API tokens encrypted in database
- **Multiple Accounts**: Connect multiple GitHub/GitLab/Vercel accounts
- **Persistent Connections**: Integration details persist until disconnected
- **Auto Token Management**: Tokens automatically retrieved for API calls

### Updated Pages
- **Version Control** (`/version-control`): Now uses secure integrations
- **Vercel** (`/vercel`): Now uses secure integrations
- **Future**: All deployment pages will use the same secure system

### New API Endpoints
- `GET /api/integrations` - List user's integrations
- `POST /api/integrations` - Create new integration
- `GET /api/integrations/[id]` - Get integration details
- `PUT /api/integrations/[id]` - Update integration
- `DELETE /api/integrations/[id]` - Delete integration

## 🔐 Security Benefits

1. **Encrypted Storage**: Tokens stored encrypted, not in plain text
2. **User Isolation**: Each user only sees their own integrations
3. **No Client-Side Tokens**: Sensitive data never exposed to frontend
4. **Secure APIs**: All integration APIs validate user sessions
5. **Token Testing**: Invalid tokens rejected before storage

## 📱 User Experience

### Before
- Enter token each session
- Lost tokens on page refresh
- Single account per service
- Tokens stored in browser memory

### After
- Connect once, stay connected
- Multiple accounts per service
- Persistent across sessions
- Secure server-side storage
- Easy management interface

## 🛠️ For Each Service

### GitHub
1. Go to https://github.com/settings/tokens
2. Generate token with `repo` scope
3. Add integration in app with token

### GitLab
1. Go to https://gitlab.com/-/profile/personal_access_tokens
2. Generate token with `read_repository` scope
3. Add integration (optionally specify custom GitLab URL)

### Vercel
1. Go to https://vercel.com/account/tokens
2. Generate API token
3. Add integration (optionally specify team ID)

### Other Services
- **Netlify**: Personal access tokens
- **Railway**: API tokens
- **Render**: API keys
- **Bitbucket**: App passwords with username

## 🚨 Important Notes

- **Change the encryption key** in production!
- **Use minimal token permissions** for each service
- **Regularly rotate tokens** for security
- **Remove unused integrations** to reduce attack surface

## 🐛 Troubleshooting

### "Integration test failed"
- Check token validity and permissions
- Verify network access to service
- Ensure correct token format

### "Integration not found"
- User doesn't own the integration
- Integration was deleted
- Check user session

### Build errors
- Run `npm install` to get new dependencies
- Restart development server
- Check for TypeScript errors

## 🔄 Migration Path

Existing users will need to:
1. Reconnect their integrations using the new system
2. Old temporary tokens will not be migrated
3. New secure tokens will persist across sessions

This provides better security and user experience!