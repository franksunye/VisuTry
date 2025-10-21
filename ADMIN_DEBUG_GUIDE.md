# Admin Access Debug Guide

## Current Issue

User with role 'USER' can access `/admin/dashboard` even though middleware should block them.

## Diagnostic Steps

### Step 1: Check Session Information

While logged in with the Twitter account, visit:
```
https://www.visutry.com/api/check-session
```

This will show you:
- **jwtToken.role** - What the middleware sees
- **serverSession.user.role** - What server components see

**Expected for Twitter user:**
```json
{
  "success": true,
  "debug": {
    "jwtToken": {
      "email": "...",
      "role": "USER"  // ← Should be USER
    },
    "serverSession": {
      "user": {
        "email": "...",
        "role": "USER"  // ← Should be USER
      }
    }
  }
}
```

### Step 2: Check Vercel Logs

Go to Vercel dashboard → Logs and look for:

1. **Middleware invocation logs:**
   ```
   [Middleware] Invoked for path: /admin/dashboard
   ```
   - ❌ If you DON'T see this, middleware is not running at all
   - ✅ If you see this, middleware is running

2. **Admin middleware logs:**
   ```
   [Admin Middleware] Access attempt: { pathname: '/admin/dashboard', hasSession: true, userEmail: '...', userRole: 'USER' }
   [Admin Middleware] Access DENIED - User role: USER Email: ...
   ```
   - ❌ If you DON'T see these, the middleware code is not executing
   - ✅ If you see "Access DENIED", middleware is working correctly

3. **JWT callback logs:**
   ```
   [Auth JWT] First login - role set: { userId: '...', email: '...', role: 'USER' }
   ```
   - ✅ You already see this, so JWT is working

### Step 3: Test Different Paths

Try accessing these URLs and note which ones work:

1. `https://www.visutry.com/admin` - Should redirect
2. `https://www.visutry.com/admin/dashboard` - Should redirect
3. `https://www.visutry.com/admin/users` - Should redirect
4. `https://www.visutry.com/admin/orders` - Should redirect

For each one, check if you see the `[Middleware] Invoked for path:` log.

## Possible Issues and Solutions

### Issue 1: Middleware Not Running At All

**Symptoms:**
- No `[Middleware] Invoked for path:` logs in Vercel
- Can access admin pages without any logs

**Possible Causes:**
1. Middleware file not deployed to Vercel
2. Matcher configuration not working
3. Next.js version compatibility issue

**Solution:**
Check the deployed files in Vercel:
1. Go to Vercel dashboard
2. Click on the latest deployment
3. Check "Source" tab
4. Verify `middleware.ts` exists in the root

### Issue 2: Middleware Running But Not Blocking

**Symptoms:**
- See `[Middleware] Invoked for path:` logs
- See `[Admin Middleware] Access DENIED` logs
- But still can access the page

**Possible Causes:**
1. Redirect not working properly
2. Multiple middleware files conflicting
3. Client-side navigation bypassing middleware

**Solution:**
Try hard refresh (Ctrl+Shift+R) or open in incognito mode.

### Issue 3: Role Not Set in JWT

**Symptoms:**
- `/api/check-session` shows `role: null` or `role: undefined`
- Middleware logs show `userRole: undefined`

**Possible Causes:**
1. Database user doesn't have role set
2. JWT callback not syncing role
3. Old JWT token cached

**Solution:**
1. Check database: `SELECT email, role FROM "User" WHERE email = '...'`
2. Log out completely
3. Clear all cookies
4. Log in again

### Issue 4: Vercel Deployment Not Updated

**Symptoms:**
- Local development works fine
- Production still has old behavior

**Possible Causes:**
1. Deployment failed
2. Build cache not cleared
3. Edge functions not updated

**Solution:**
1. Go to Vercel dashboard
2. Trigger a new deployment
3. Check deployment logs for errors

## Quick Test Commands

### Check if middleware file exists in deployment:
```bash
# In Vercel dashboard, check Source tab for:
middleware.ts
```

### Check database role:
```sql
SELECT id, email, name, role FROM "User" ORDER BY "createdAt" DESC LIMIT 10;
```

### Force new deployment:
```bash
git commit --allow-empty -m "Force redeploy"
git push origin main
```

## Expected Behavior After Fix

### For USER role:
1. Visit `/admin/dashboard`
2. See logs:
   ```
   [Middleware] Invoked for path: /admin/dashboard
   [Admin Middleware] Access attempt: { ..., userRole: 'USER' }
   [Admin Middleware] Access DENIED - User role: USER
   ```
3. Get redirected to `/?error=Forbidden`

### For ADMIN role:
1. Visit `/admin/dashboard`
2. See logs:
   ```
   [Middleware] Invoked for path: /admin/dashboard
   [Admin Middleware] Access attempt: { ..., userRole: 'ADMIN' }
   [Admin Middleware] Access GRANTED - Admin user: franksunye@hotmail.com
   ```
3. See admin dashboard

## Next Steps

Please provide:
1. Output from `/api/check-session` (while logged in as Twitter user)
2. Vercel logs showing middleware invocation (or lack thereof)
3. Which admin URLs you can access

This will help identify the exact issue.

