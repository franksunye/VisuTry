---
name: Storage and Retention Management
description: Tools and procedures for managing data retention, cleaning up expired tasks, and releasing storage.
---

# Storage and Retention Management

This skill documents the automated and manual processes for managing VisuTry's data retention policy and cleaning up Vercel Blob storage.

## Retention Policy

The platform follows a tiered retention policy defined in `src/config/retention.ts`:

- **Free Users**: 7 days
- **Credits Users**: 90 days
- **Premium Users**: 365 days (1 year)

## Key Components

### 1. Database Field
`TryOnTask.expiresAt` (DateTime?): Stores the pre-calculated expiration date.

### 2. Comprehensive Cleanup Script (`scripts/comprehensive-cleanup.ts`)
A powerful, safe, and configurable script for manual "deep cleaning".
- **Dynamic Recalculation**: Adjusts expiry dates if a user's subscription status has changed (e.g., downgraded from Premium to Free).
- **Physical Deletion**: Deletes files from Vercel Blob storage using the `BLOB_READ_WRITE_TOKEN`.
- **User Notification**: Sends professional emails via Exmail SMTP (`support@visutry.com`).
- **Safety Features**: Support for `--dry-run`, `--limit`, and `--free-days` overrides.

#### Usage:
```bash
# Preview first (Dry Run)
npx tsx scripts/comprehensive-cleanup.ts --free-days=30 --limit=100

# Execute Live (Permanent Deletion)
npx tsx scripts/comprehensive-cleanup.ts --free-days=30 --limit=100 --dry-run=false
```

### 3. Vercel Cron Job (`src/app/api/cron/cleanup-expired-tasks/route.ts`)
Automated daily cleanup configured in `vercel.json`.
- **Schedule**: `0 2 * * *` (Daily at 02:00 UTC)

### 4. Email Notification Logic
Located in `src/templates/deletion-email.ts`, providing HTML and text templates for notification emails.

## Maintenance Procedures

### Periodic Manual Cleanup
When storage usage spikes (e.g., > 1GB on Vercel), it is recommended to run the comprehensive cleanup script with a conservative limit (e.g., 100-200 tasks) and a grace period (e.g., 30 days for free users) to ensure smooth operation and user notification.
