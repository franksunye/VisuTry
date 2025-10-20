# Auth0 Quick Start Guide

## 5-Minute Setup

### Step 1: Create Auth0 Account
1. Go to https://auth0.com
2. Sign up for free account
3. Create a new tenant

### Step 2: Create Application
1. Dashboard → Applications → Create Application
2. Name: `VisuTry`
3. Type: `Regular Web Application`
4. Create

### Step 3: Get Credentials
In Application Settings, copy:
- **Domain**: `your-domain.auth0.com`
- **Client ID**: `xxxxx`
- **Client Secret**: `xxxxx`

### Step 4: Configure Callback URLs
In Application Settings, set:

**Allowed Callback URLs:**
```
http://localhost:3000/api/auth/callback/auth0
https://yourdomain.com/api/auth/callback/auth0
```

**Allowed Logout URLs:**
```
http://localhost:3000
https://yourdomain.com
```

**Allowed Web Origins:**
```
http://localhost:3000
https://yourdomain.com
```

### Step 5: Add Environment Variables
Create `.env.local`:

```env
AUTH0_ID=your-client-id
AUTH0_SECRET=your-client-secret
AUTH0_ISSUER_BASE_URL=https://your-domain.auth0.com
```

### Step 6: Test
```bash
npm run dev
# Visit http://localhost:3000/auth/signin
# Click "Sign in with Auth0"
```

## Troubleshooting

### "Invalid callback URL"
- Check Auth0 Dashboard settings
- Ensure URL matches exactly (including protocol and port)
- Restart dev server

### "Auth0 provider not found"
- Verify `.env.local` has all three variables
- Check variable names are exact (case-sensitive)
- Restart dev server

### "User not created"
- Check database connection
- Verify Prisma is running
- Check logs for database errors

## Testing

### Unit Tests
```bash
npm run test:unit -- tests/unit/lib/auth0-config.test.ts
npm run test:unit -- tests/unit/components/LoginButton.auth0.test.tsx
```

### Manual Test Flow
1. Start dev server: `npm run dev`
2. Go to http://localhost:3000
3. Click "Sign In"
4. Click "Sign in with Auth0"
5. Complete Auth0 login
6. Should redirect to dashboard

## What's Included

✅ Auth0 provider configured in NextAuth.js
✅ Multi-provider support (Twitter + Auth0)
✅ Automatic user creation
✅ Profile mapping
✅ JWT session management
✅ Comprehensive tests
✅ Full documentation

## Next Steps

1. **Production Setup**
   - Update callback URLs for production domain
   - Use production Auth0 tenant
   - Set strong NEXTAUTH_SECRET

2. **Customization**
   - Add Auth0 rules/actions for custom logic
   - Customize login page
   - Add additional scopes if needed

3. **Monitoring**
   - Check Auth0 logs for issues
   - Monitor user creation
   - Track authentication metrics

## Support

- Auth0 Docs: https://auth0.com/docs
- NextAuth.js: https://next-auth.js.org
- Project Issues: https://github.com/franksunye/VisuTry/issues

## Environment Variables Reference

| Variable | Required | Example |
|----------|----------|---------|
| `AUTH0_ID` | Yes | `abc123xyz` |
| `AUTH0_SECRET` | Yes | `secret_key_here` |
| `AUTH0_ISSUER_BASE_URL` | Yes | `https://example.auth0.com` |
| `NEXTAUTH_SECRET` | Yes | `random_secret_key` |

## File Changes

- `src/lib/auth.ts` - Auth0 provider configuration
- `src/components/auth/LoginButton.tsx` - Multi-provider UI
- `src/app/auth/signin/page.tsx` - Sign-in page
- `.env.example` - Environment variables template
- `tests/unit/lib/auth0-config.test.ts` - Configuration tests
- `tests/unit/components/LoginButton.auth0.test.tsx` - UI tests
- `docs/AUTH0_INTEGRATION.md` - Full documentation

