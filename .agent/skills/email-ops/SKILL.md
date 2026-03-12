---
name: Email Operations
description: Tools for interacting with the company's Tencent Exmail (support/sun@visutry.com)
---

# Email Operations (Exmail)

This skill provides utilities to fetch and send emails using the authenticated company account `sun@visutry.com`.

## Environment Variables
Ensure the following variables are set in `.env`:
`EXMAIL_USER` and `EXMAIL_PASS`

## Scripts

### 1. Fetch Latest Inquiries (`scripts/fetch.ts`)
Connects to IMAP server `imap.exmail.qq.com` via Port 993, retrieves unread messages from INBOX, and displays/parses them.
Usage:
```bash
npx tsx .agent/skills/email-ops/scripts/fetch.ts
```

### 2. Send Email (`scripts/send.ts`)
Connects to SMTP server `smtp.exmail.qq.com` via Port 465, sends emails safely.
- **Support Account**: Can send as `VisuTry Support <support@visutry.com>` using the primary Exmail credentials.
- **Threading**: To keep the conversation context, pass the original email's `Message-ID` as the 5th argument.

### 3. Cleanup Notifications
Usage of the professional HTML template in `src/templates/deletion-email.ts` for automated system notices.
