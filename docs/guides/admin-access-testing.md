# Admin Access Testing Guide

## Problem Fixed

Fixed a critical security issue where user roles were not properly set in JWT tokens on first login, potentially allowing unauthorized admin access.

## Changes Made

### 1. JWT Token Role Assignment (src/lib/auth.ts)
- **Added**: `token.role = user.role` on first login
- **Added**: Debug logging for role assignment
- **Why**: Previously, role was only set during database sync, which could fail or be delayed

### 2. Middleware Logging (middleware.ts)
- **Added**: Comprehensive logging for all admin access attempts
- **Logs**: User email, role, and access decision
- **Why**: Helps diagnose authorization issues

## Testing Steps

### Step 1: Clear All Sessions
1. Log out from the website completely
2. Clear browser cookies for `visutry.com`
3. Close all browser tabs for the site

### Step 2: Test Admin User (franksunye@hotmail.com)
1. Go to https://www.visutry.com
2. Log in with `franksunye@hotmail.com`
3. Try to access https://www.visutry.com/admin
4. **Expected**: Should be able to access admin panel
5. Check Vercel logs for:
   ```
   [Auth JWT] First login - role set: { userId: '...', email: 'franksunye@hotmail.com', role: 'ADMIN' }
   [Admin Middleware] Access GRANTED - Admin user: franksunye@hotmail.com
   ```

### Step 3: Test Regular User (Twitter Login)
1. Log out completely
2. Clear browser cookies again
3. Log in with Twitter
4. Try to access https://www.visutry.com/admin
5. **Expected**: Should be redirected to homepage with error=Forbidden
6. Check Vercel logs for:
   ```
   [Auth JWT] First login - role set: { userId: '...', email: '...', role: 'USER' }
   [Admin Middleware] Access DENIED - User role: USER Email: ...
   ```

### Step 4: Verify Database Roles
You can verify user roles in the database using Prisma Studio or SQL:

```sql
SELECT id, email, name, role FROM "User";
```

Expected results:
- `franksunye@hotmail.com` → role: `ADMIN`
- All other users → role: `USER`

## Checking Logs in Vercel

1. Go to https://vercel.com/franksunye/visutry
2. Click on "Logs" tab
3. Filter by "Runtime Logs"
4. Search for `[Admin Middleware]` or `[Auth JWT]`
5. You should see detailed logs of access attempts

## What to Look For

### ✅ Good Signs
- Admin users see: `Access GRANTED`
- Regular users see: `Access DENIED`
- Role is logged correctly for each user
- No undefined or null roles

### ❌ Bad Signs
- Regular users see: `Access GRANTED`
- Role is `undefined` or `null`
- No logs appearing (might indicate middleware not running)

## If Issues Persist

If a regular user can still access admin after these fixes:

1. **Check the logs** - What role is being logged?
2. **Verify database** - What is the actual role in the database?
3. **Clear JWT tokens** - The user might have an old JWT token cached
   - Log out
   - Clear all cookies
   - Wait 5 minutes (JWT might be cached server-side)
   - Log in again

## Manual Role Update

If you need to manually update a user's role in the database:

```sql
-- Make a user ADMIN
UPDATE "User" SET role = 'ADMIN' WHERE email = 'user@example.com';

-- Make a user regular USER
UPDATE "User" SET role = 'USER' WHERE email = 'user@example.com';
```

After updating the database:
1. User must log out
2. Clear cookies
3. Log in again (this will sync the new role to JWT)

## Security Notes

- JWT tokens cache the role for up to 5 minutes
- After role changes in database, users need to re-login to get new role
- Middleware checks happen on every request
- Role is synced from database on:
  - First login
  - Every 5 minutes
  - Manual session update trigger

