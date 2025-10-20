# Auth0 Migration Guide

## Overview

VisuTry has migrated from direct Twitter OAuth to Auth0-only authentication. All social logins (Twitter, Google, etc.) are now configured through Auth0 connections.

## What Changed

### Before
- Direct Twitter OAuth integration in NextAuth.js
- Twitter-specific environment variables
- Multiple provider configurations in code

### After
- Single Auth0 provider in NextAuth.js
- Only Auth0 environment variables needed
- Social connections configured in Auth0 Dashboard

## Migration Steps

### Step 1: Update Environment Variables

**Remove:**
```env
TWITTER_CLIENT_ID=...
TWITTER_CLIENT_SECRET=...
```

**Keep/Add:**
```env
AUTH0_ID=your-auth0-client-id
AUTH0_SECRET=your-auth0-client-secret
AUTH0_ISSUER_BASE_URL=https://your-domain.auth0.com
```

### Step 2: Configure Twitter in Auth0

1. Go to Auth0 Dashboard
2. Navigate to **Connections → Social**
3. Click **Twitter** and enable it
4. Enter your Twitter API credentials:
   - API Key (Consumer Key)
   - API Secret (Consumer Secret)
5. Save changes

### Step 3: Update Callback URLs

In Auth0 Application Settings:

**Allowed Callback URLs:**
```
https://yourdomain.com/api/auth/callback/auth0
```

**Allowed Logout URLs:**
```
https://yourdomain.com
```

### Step 4: Test Login Flow

1. Visit your application
2. Click "Sign in with Auth0"
3. Choose Twitter from the connection options
4. Complete Twitter authentication
5. Verify redirect to dashboard

## For Existing Users

### Automatic Migration
If users have the same email in both systems:
1. User signs in with Twitter through Auth0
2. Auth0 automatically links accounts by email
3. Existing user data is preserved

### Manual Migration (if needed)
If email addresses don't match:
1. Update user records in database
2. Ensure emails match for linking
3. Users can then sign in with either method

## Supported Social Connections

Through Auth0, you can now support:
- ✅ Twitter
- ✅ Google
- ✅ GitHub
- ✅ Facebook
- ✅ LinkedIn
- ✅ And many more...

Enable any connection in Auth0 Dashboard without code changes.

## Troubleshooting

### "Invalid callback URL"
- Verify Auth0 Application Settings
- Ensure callback URL matches exactly
- Check for trailing slashes

### "Twitter connection not showing"
- Verify Twitter connection is enabled in Auth0
- Check Twitter API credentials are correct
- Refresh browser cache

### "User not created"
- Check database connection
- Verify Prisma is running
- Check Auth0 logs for errors

## Code Changes

### NextAuth Configuration
```typescript
// Before
providers: [
  TwitterProvider({...}),
  Auth0Provider({...}),
]

// After
providers: [
  Auth0Provider({...}),
]
```

### Login Button
```typescript
// Before
<button onClick={() => signIn("twitter")}>Sign in with Twitter</button>
<button onClick={() => signIn("auth0")}>Sign in with Auth0</button>

// After
<button onClick={() => signIn("auth0")}>Sign in with Auth0</button>
```

## Benefits

1. **Simplified Maintenance**
   - Single provider to manage
   - No need to update code for new social connections

2. **Better User Experience**
   - Unified login interface
   - Account linking by email
   - Support for more social providers

3. **Centralized Management**
   - All authentication in Auth0 Dashboard
   - Easier to manage connections
   - Better security controls

4. **Scalability**
   - Easy to add new social providers
   - No application redeployment needed
   - Flexible authentication options

## Rollback Plan

If you need to revert to direct Twitter OAuth:

1. Checkout previous commit
2. Restore Twitter environment variables
3. Redeploy application

However, we recommend staying with Auth0 for better long-term maintainability.

## Support

For issues or questions:
1. Check `docs/AUTH0_INTEGRATION.md`
2. Check `docs/AUTH0_QUICKSTART.md`
3. Review Auth0 documentation: https://auth0.com/docs
4. Check project issues on GitHub

## Next Steps

1. **Deploy Changes**
   - Merge feature branch to main
   - Deploy to production

2. **Monitor**
   - Check Auth0 logs
   - Monitor user creation
   - Track authentication metrics

3. **Communicate**
   - Inform users about new login method
   - Provide support documentation
   - Monitor feedback

## Timeline

- **Immediate**: Update environment variables
- **Day 1**: Configure Twitter in Auth0
- **Day 1**: Test login flow
- **Day 2**: Deploy to production
- **Ongoing**: Monitor and support users

---

**Status**: Migration Complete
**Date**: 2025-10-20
**Breaking Change**: Yes - Direct Twitter OAuth removed

