# Auth0 Integration Guide

## Overview

VisuTry uses Auth0 as the primary authentication provider. All login methods (Twitter, Google, etc.) are configured through Auth0 connections, providing a unified and secure authentication experience.

## Features

- ✅ Unified authentication through Auth0
- ✅ Support for Twitter, Google, and other social providers (via Auth0 connections)
- ✅ Seamless user profile mapping
- ✅ Automatic user creation on first login
- ✅ JWT-based session management
- ✅ Simplified configuration and maintenance

## Setup Instructions

### 1. Create Auth0 Application

1. Go to [Auth0 Dashboard](https://manage.auth0.com)
2. Create a new application:
   - Name: `VisuTry`
   - Type: `Regular Web Application`
3. Go to **Settings** tab and note:
   - **Domain** (e.g., `your-domain.auth0.com`)
   - **Client ID**
   - **Client Secret**

### 2. Configure Auth0 Application

1. In Auth0 Dashboard, go to your application settings
2. Set **Allowed Callback URLs**:
   ```
   http://localhost:3000/api/auth/callback/auth0
   https://yourdomain.com/api/auth/callback/auth0
   ```
3. Set **Allowed Logout URLs**:
   ```
   http://localhost:3000
   https://yourdomain.com
   ```
4. Set **Allowed Web Origins**:
   ```
   http://localhost:3000
   https://yourdomain.com
   ```

### 3. Environment Variables

Add to your `.env.local`:

```env
# Auth0 Configuration
AUTH0_ID=your-auth0-client-id
AUTH0_SECRET=your-auth0-client-secret
AUTH0_ISSUER_BASE_URL=https://your-domain.auth0.com
```

### 4. Verify Installation

The package `@auth0/nextjs-auth0` is already installed. Verify:

```bash
npm list @auth0/nextjs-auth0
```

## How It Works

### Authentication Flow

1. User clicks "Sign in with Auth0" button
2. Redirected to Auth0 login page
3. User authenticates with Auth0
4. Auth0 redirects back to `/api/auth/callback/auth0`
5. NextAuth.js processes the callback
6. User profile is mapped and stored in database
7. JWT session is created
8. User is redirected to dashboard

### Profile Mapping

Auth0 profile fields are mapped as follows:

| Auth0 Field | VisuTry Field | Fallback |
|-------------|---------------|----------|
| `sub` | `id` | - |
| `nickname` | `username` | `name` |
| `name` | `name` | - |
| `email` | `email` | - |
| `picture` | `image` | - |

### Database Schema

No schema changes required. Auth0 users are stored in the same `User` table with:
- `id`: Auth0 unique identifier (e.g., `auth0|123456`)
- `email`: User's email
- `name`: User's full name
- `username`: User's nickname/username
- `image`: User's profile picture

## Multiple Connection Support

Auth0 supports multiple social connections that users can choose from:

1. Twitter (via Auth0 Twitter connection)
2. Google (via Auth0 Google connection)
3. GitHub (via Auth0 GitHub connection)
4. And many more...

Users can link multiple connections to the same account by signing in with different methods using the same email address.

## Testing

### Unit Tests

Run Auth0-specific tests:

```bash
npm run test:unit -- tests/unit/lib/auth0-config.test.ts
npm run test:unit -- tests/unit/components/LoginButton.auth0.test.tsx
```

### Manual Testing

1. Start development server:
   ```bash
   npm run dev
   ```

2. Navigate to `http://localhost:3000/auth/signin`

3. Click "Sign in with Auth0"

4. Complete Auth0 authentication

5. Verify redirect to dashboard

## Troubleshooting

### "Auth0 provider not found"

**Cause**: Environment variables not set

**Solution**:
```bash
# Check .env.local has Auth0 variables
cat .env.local | grep AUTH0

# Restart dev server
npm run dev
```

### "Invalid callback URL"

**Cause**: Callback URL not configured in Auth0 Dashboard

**Solution**:
1. Go to Auth0 Dashboard
2. Application Settings
3. Add your callback URL to "Allowed Callback URLs"
4. Save changes

### "User profile not mapping correctly"

**Cause**: Auth0 profile structure differs from expected

**Solution**:
1. Check Auth0 profile in JWT callback logs
2. Update profile mapping in `src/lib/auth.ts` if needed
3. Verify Auth0 application scopes include `profile` and `email`

## Configuration Reference

### NextAuth.js Configuration

Auth0 provider is configured in `src/lib/auth.ts`:

```typescript
Auth0Provider({
  clientId: process.env.AUTH0_ID,
  clientSecret: process.env.AUTH0_SECRET,
  issuer: process.env.AUTH0_ISSUER_BASE_URL,
})
```

### Single Provider Configuration

Auth0 is the only provider configured in NextAuth.js:

```typescript
Auth0Provider({
  clientId: process.env.AUTH0_ID,
  clientSecret: process.env.AUTH0_SECRET,
  issuer: process.env.AUTH0_ISSUER_BASE_URL,
})
```

All social connections (Twitter, Google, etc.) are configured in the Auth0 Dashboard, not in the application code.

## Security Considerations

- ✅ Client secrets are never exposed to frontend
- ✅ All OAuth flows use secure HTTPS
- ✅ JWT tokens are signed and verified
- ✅ User data is stored securely in database
- ✅ Session tokens have expiration

## Migration Guide

### For Existing Twitter Users

If you have existing users who signed in with Twitter:

1. **Option 1: Manual Migration**
   - Users sign in with Twitter through Auth0
   - Auth0 automatically links accounts by email
   - Existing user data is preserved

2. **Option 2: Database Migration**
   - Update user records to use Auth0 IDs
   - Ensure email addresses match for linking

### For New Users

New users sign in through Auth0 and can choose from available connections (Twitter, Google, etc.).

## Support

For issues or questions:
1. Check Auth0 documentation: https://auth0.com/docs
2. Review NextAuth.js docs: https://next-auth.js.org
3. Check project issues: https://github.com/franksunye/VisuTry/issues

## Related Files

- `src/lib/auth.ts` - NextAuth configuration
- `src/components/auth/LoginButton.tsx` - Login UI
- `src/app/auth/signin/page.tsx` - Sign-in page
- `.env.example` - Environment variables template
- `tests/unit/lib/auth0-config.test.ts` - Auth0 tests

