# VisuTry Store D0 Production Verification — 2026-08-05

**Status:** Passed for controlled D0 POC demos; Gate A1 remains closed
**Owner:** Engineering / Product
**Verified:** 2026-08-05
**Production URL:** `https://www.visutry.com/en/store/luna-optical`
**Git commit:** `a36e9ae`
**Vercel deployment:** `dpl_5bEE3YUqDy3wF8HLHsZFCM5FiRhD`
**Storage mode:** `STORE_ASSET_ACCESS_MODE=public-poc`

---

## 1. Verification Decision

The Store D0 engineering implementation is ready for team-operated merchant demos
and controlled early validation.

This verification does **not** open Gate A1. Independent shopper traffic remains
closed while Store assets use temporary public Blob objects and while the remaining
external-traffic concurrency and browser Compare checks are incomplete.

---

## 2. Release Evidence

| Boundary | Result | Evidence |
| --- | --- | --- |
| Source | Passed | `main`, `origin/main`, and production build all use `a36e9ae`. |
| Build | Passed | Vercel build compiled, type-checked, generated 1,475 static pages, and reached `READY`. |
| Database | Passed | Production schema reported up to date; Store fenced-lease migration was already applied. |
| Seed | Passed | `Luna Optical` exists at slug `luna-optical` with 16 active frames. |
| Automated Store checks | Passed | 76 Store unit/integration tests passed locally. |
| Runtime error scan | Passed after smoke | No production errors were present in the final two-minute post-verification scan. |

The build still reports repository-wide pre-existing image optimization, Hook
dependency, and browser-data freshness warnings. None blocked this Store release.

---

## 3. End-to-End Story

Verified production flow:

```text
Store page
  → anonymous MerchantSession + capability cookie
  → temporary shopper-photo upload
  → capability-mediated photo preview
  → merchant-only recommendation shortlist
  → frame selection
  → Store-attributed Try-On submission
  → async poll to COMPLETED
  → capability-mediated result delivery
  → durable events and merchant usage ledger
```

### Observed results

| Boundary | Result |
| --- | --- |
| Merchant page | `200`; Luna Optical rendered with the Public POC notice and no browser console errors. |
| Session | `200`; server-issued `vt_store_cap` cookie received. |
| Photo upload | `200`; `StoreAsset.accessMode=PUBLIC_TEMPORARY`. |
| Photo delivery | Authenticated `200`; missing capability `401`; response `Cache-Control: private, no-store`. |
| Recommendation | `200`; four merchant frames returned. |
| Frame selection | `200`; selected merchant frame persisted. |
| Try-On | `200`; one Store Demo task moved from `PROCESSING` to `COMPLETED`. |
| Result delivery | Authenticated `200`; missing capability `401`; response `Cache-Control: private, no-store`. |
| Usage | `RENDER_ATTEMPT` and `RENDER_SUCCESS` recorded. |
| Task fencing | Dispatch and result-persistence leases were cleared after completion. |

The smoke used a repository-owned synthetic model image. No customer photo was used.
All smoke assets and tasks have explicit expiry metadata and remain subject to the
retention crons.

---

## 4. Public POC Security Assertions

The temporary Public POC mode passed these controls:

1. Public mode requires the exact explicit value `public-poc`.
2. Missing configuration defaults to private storage.
3. Invalid configuration fails closed.
4. Shopper photo paths use random identifiers and exclude the original file name.
5. Store APIs return application delivery routes, not provider Blob URLs.
6. Application delivery remains capability-authenticated.
7. Unauthenticated photo and result requests return `401`.
8. Merchant insights and Store events do not receive raw image URLs.
9. Photos, Try-On inputs, and generated results have explicit expiry and cleanup paths.

Public Blob URLs remain addressable if disclosed. Therefore this mode is appropriate
only for controlled POC use with synthetic, operator-owned, or explicitly authorized
photos.

---

## 5. Known Verification Observation

One malformed smoke request mixed incompatible HTTP client implementations and omitted
the multipart `Content-Type`. It produced a server-side form parsing `500` before the
Store upload application logic ran. The request was corrected to use one standards-
compatible multipart implementation; upload then passed, and the final runtime error
scan was clean.

This observation is not classified as a Store release defect. A future hardening task
may map malformed multipart parsing to a shopper-safe `400` response.

---

## 6. Gate A1 Remaining Work

Before independent non-team traffic:

1. connect Store to private object storage and set `STORE_ASSET_ACCESS_MODE=private`;
2. redeploy and repeat photo/input/result delivery verification;
3. run the deployed two-request takeover smoke and prove one fenced owner/version wins;
4. run takeover-versus-reconciler smoke;
5. run concurrent result-persistence polling against private storage;
6. complete browser E2E for 2-, 3-, and 4-frame Compare and partial failure behavior;
7. confirm expired Consumer provider URLs cannot enter Store `DELETE_BLOCKED` handling;
8. repeat the production error scan and update this record or create a dated successor.

Until then, team-operated screen-share demos and controlled early validation may
proceed under the D0 operator rules.
