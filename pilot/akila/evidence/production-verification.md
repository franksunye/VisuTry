# AKILA production verification

Verification date: 2026-08-11
Production origin: `https://www.visutry.com`
Merchant: `akila`
Merchant ID: `cmsos85wx0000goi856lvrqq4`

## Production data

The existing production-safe Delivery Factory importer was used:

```text
STORE_SEED_CONFIRM=yes NODE_ENV=production VERCEL_ENV=production npm run db:seed:pilot -- pilot/akila
```

Result: 18 catalog rows imported; 18 active MerchantFrames. No manual SQL and no AI provider call were used.

| Experience | Type | Status | Experience ID | Selected frames | Reference |
| --- | --- | --- | ---: | ---: | --- |
| default | STORE | ACTIVE | `cmsos8cua000lgoi8g01w1iow` | 18 | true |
| statement-frames | CAMPAIGN | ACTIVE | `cmsos8bt1000kgoi8rdk51y71` | 9 | true |
| current-edit | CAMPAIGN | ACTIVE | `cmsos8asj000lgoi86q7p2y3k` | 9 | true |

Required Experience migrations were confirmed in production as applied:

- `20260812100000_add_experiences`
- `20260812113000_harden_experience_tenant_foreign_keys`

The Prisma CLI `migrate status` command still reports an empty schema-engine error because production retains a historical rolled-back attempt for `20260605120000_add_face_analysis_task`; the same migration has a later successful row. The required Experience migrations are applied and the data-only seed did not modify migration state.

## Public route smoke

All routes returned HTTP 200 on desktop and mobile Playwright smoke. The rendered headline and frame count matched the Experience API profile:

- `/en/store/akila` → Store, 18 frames.
- `/en/c/akila/statement-frames` → Campaign, 9 frames.
- `/en/c/akila/current-edit` → Campaign, 9 frames.

All six route/viewport checks showed `REFERENCE PILOT · SIMULATION`, no Consumer Credits prompt, no application/page errors, and no non-Google-Analytics console errors. Routine smoke did not call real AI.

## Session and attribution smoke

Anonymous session creation returned HTTP 200 for all three routes. Production rows confirmed:

- Store session has the Store `experienceId`, source `visutry-reference-pilot`, campaign `akila`, and `referenceData=true`.
- Statement Frames session has the Campaign `experienceId`, source `visutry-reference-pilot`, campaign `akila-statement-frames`, and `referenceData=true`.
- Current Edit session has the Campaign `experienceId`, source `visutry-reference-pilot`, campaign `akila-current-edit`, and `referenceData=true`.

The public profile API returned the expected type/slug and active frame count for each route. Shared Experience tests cover recommendation, selection, Try-On/Compare authorization, intent, and cross-Experience frame boundaries without a real provider call.

## Admin workspace

Direct production workspace verification returned:

- Merchant Catalog: 18 active frames.
- Experiences: AKILA Store (18), Current Edit (9), Statement Frames (9).
- Metrics groups loaded for each Experience.
- `Legacy / Unassigned` remained present.
- Reference provenance remained true.
- Public paths resolved to the three expected routes.

Unauthenticated HTTP checks for the Experiences list and all three detail routes returned the expected Auth0 `307` redirect. A signed-in visual Admin screenshot was not captured because this environment has no merchant-admin Auth0 session; direct production workspace data and protected-route behavior were verified instead.
