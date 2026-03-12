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

### 1. Unified Mail CLI (`/scripts/mail.ts`)
Primary entry point for routine inbox and reply operations.
Usage:
```bash
npx tsx scripts/mail.ts list --unread --limit 20
npx tsx scripts/mail.ts thread --from someone@example.com
npx tsx scripts/mail.ts reply --message-id '<...>' --body-file tmp/reply.txt
npx tsx scripts/mail.ts reply --message-id '<...>' --body-file tmp/reply.txt --quote
npx tsx scripts/mail.ts send --from-email sun@visutry.com --to someone@example.com --subject "..." --body-file tmp/mail.txt
```

### 2. Compatibility wrappers (`.agent/skills/email-ops/scripts/*.ts`)
Legacy wrappers kept for backward compatibility. They now delegate to `scripts/mail.ts`.
- **Support Account**: Can send as `VisuTry Support <support@visutry.com>` using the primary Exmail credentials.
- **Threading**: To keep the conversation context, pass the original email's `Message-ID` as the 5th argument.

## Guardrails

- Do not create one-off mail scripts with hard-coded recipients, subjects, or passwords.
- For manual outbound mail, always use `scripts/mail.ts` with `--body-file` or `--dry-run` first.
- If a task needs automation from application code, keep it in product scripts or libs; do not add ad-hoc copies under `scripts/`.
- For external human recipients, do not send the email immediately after drafting. First present the final draft to the user and send only after explicit confirmation.

## Common Commands

- Latest unread inquiries:
```bash
npx tsx scripts/mail.ts list --unread --limit 10
```

- Full thread by sender:
```bash
npx tsx scripts/mail.ts thread --from mohammed.alg.991@gmail.com --limit 20
```

- Draft a safe outbound email first:
```bash
npx tsx scripts/mail.ts send --from-email sun@visutry.com --to someone@example.com --subject "..." --body-file /tmp/mail.txt --dry-run
```

- Reply in-thread by `Message-ID`:
```bash
npx tsx scripts/mail.ts reply --message-id '<...>' --body-file /tmp/reply.txt
```

- Reply in-thread and include quoted history:
```bash
npx tsx scripts/mail.ts reply --message-id '<...>' --body-file /tmp/reply.txt --quote
```

### 3. Cleanup Notifications
Usage of the professional HTML template in `src/templates/deletion-email.ts` for automated system notices.
