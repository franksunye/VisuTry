---
description: How to process a new reseller or business inquiry
---

# Workflow: Process Partner Inquiry

Follow these steps to process a business lead from initial email to pilot proposal.

1. **Email Discovery**
   - Use `email-ops` to list latest unread emails.
   - Run: `npx tsx scripts/mail.ts list --unread --limit 10`

2. **KYC & Lead Filtering**
   - Identify if the inquiry is a "Center" (Hub) or a "Store/Counter" (Unit).
   - Verify if the partner has親自 (personally) tested the product on `visutry.com`.

3. **CRM Initialization**
   - Check if the lead exists in `.private/visutry-business/leads.md`.
   - If new, add a entry under "📊 客户台账" with status `🟡 待回复`.

4. **Staged Communication Strategy**
   - **Stage 1 (Discovery)**: Draft a short, founder-style email asking for legal entity name and business scale.
   - **Stage 2 (Pilot Proposal)**: If qualified, draft a minimalist proposal (e.g., Metadata-based bonus scheme).

5. **User Review & Approval**
   - PRESENT the email draft and the CRM update plan to the user.
   - **DO NOT SEND** until you receive the "GO" signal.

6. **Execution & Logging**
   - Send the approved email using `email-ops`.
   - Update the CRM status and "跟进详情记录" (Follow-up Details) immediately.
