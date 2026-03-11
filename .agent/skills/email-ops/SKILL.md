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
The script will dynamically set the sender name (`Frank Sun` or `Support`) and look up the corresponding password based on the `from_email`.
Usage:
```bash
npx tsx .agent/skills/email-ops/scripts/send.ts <from_email> <to_email> <subject> "<body>" [in_reply_to_message_id]
```
Note: To keep the conversation context (threading), pass the original email's `Message-ID` as the 5th argument. This ensures clients like Gmail and Outlook group the reply in the correct conversation thread.
