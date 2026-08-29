# Consumer Journey Hardening — Production Final Verification — 2026-08-29

**Status:** CLOSED — Production Pilot ready (guest-first Store/Campaign)  
**Owner:** Engineering / Product  
**Verified:** 2026-08-29  
**PR:** [#167](https://github.com/franksunye/VisuTry/pull/167) (merged)  
**Production URL:** `https://www.visutry.com`  
**Git commit:** `f7b75ff93088a9da273cd04585a4049fbcd9267c`  
**Vercel Production deployment:** `dpl_B1vAWRyFhfg6DPXnZEhet5rK1X7w`

This record is immutable historical evidence. Do not treat it as an instruction to open Round 3 or to change Production code.

---

## 1. Acceptance model

VisuTry Store/Campaign is **guest-first**. A merchant shopper can:

```text
discover → upload → recommendation → Try-On → restore result → merchant conversion CTA
```

without signing in. Authenticated consumer continuation is an **optional enhancement**, not a Founding Merchant / Production Pilot blocker.

| Gate | Result |
| --- | --- |
| CODE MERGE READY | YES |
| MERGED | YES |
| PRODUCTION DEPLOYED | YES |
| REAL GUEST HAPPY PATH | PASS |
| GUEST CONTINUATION | PASS |
| MEDIAPIPE_WWW_CORS | VERIFIED |
| AUTH CONTINUATION | NOT VERIFIED / NON-BLOCKING |
| PRODUCTION PILOT READY | YES |
| SCALE READY | NO |
| CONSUMER JOURNEY HARDENING | CLOSED |

---

## 2. Production identity

| Item | Value |
| --- | --- |
| SHA | `f7b75ff93088a9da273cd04585a4049fbcd9267c` |
| Deployment | `dpl_B1vAWRyFhfg6DPXnZEhet5rK1X7w` |
| Unique URL | `https://visutry-ceqchjsn9-sunye.vercel.app` |
| Alias | `www.visutry.com` (and `visutry.com`) serving this deployment |
| Merge | PR #167 merge commit into `main` at `2026-08-29T13:59:00Z` |

---

## 3. Transient Neon Production incident (not an app regression)

The first Production deploy of `f7b75ff9` failed:

| Item | Value |
| --- | --- |
| Failed deployment | `dpl_HddZGVUvuSbh7WhtZHAnnvj2grJB` |
| Vercel `errorCode` | `db_unreachable` |
| Prisma | P1001 against Neon Production |
| Extra signal | brief `neondb_owner` auth failure during stale-lock cleanup |

Classification: **TRANSIENT VERCEL ↔ NEON PRODUCTION CONNECTIVITY**.

A later Production rebuild of an older SHA against the same database succeeded, which ruled out a schema/app-code lock.

Successful Production rebuild of the merged SHA:

```text
npx vercel redeploy dpl_HddZGVUvuSbh7WhtZHAnnvj2grJB --target production
→ dpl_B1vAWRyFhfg6DPXnZEhet5rK1X7w READY
```

Migration on the successful rebuild: no stale advisory locks; schema up to date; `next build` completed. No P1001 repeat.

Until that rebuild was aliased to www, Production was still serving older SHA `4837421e`. Final verification was run only after www served `dpl_B1vAWRyFhfg6DPXnZEhet5rK1X7w`.

---

## 4. Core Production gates (www)

Verified on `www.visutry.com` against SHA `f7b75ff9`.

| Gate | Result |
| --- | --- |
| Store first load (`/en/store/ello-sunglasses`) | PASS |
| Campaign first load (`/en/c/ello-sunglasses/petite-fit`) | PASS |
| `/api/auth/session` on first load | 0 |
| Analytics bootstrap | 1 (`gtag.js?id=G-6J4ZXNNL4F`) |
| First-screen MediaPipe | 0 |
| Hydration | PASS |
| Private blob upload | PASS |
| Face Profile | PASS |
| Recommendation | PASS |
| Sponsored 1-frame selection | PASS |
| Real provider Try-On COMPLETED | PASS |
| Try-On submit count | 1 |
| Duplicate generation | none |
| SESSION_EXPIRED / session-restart copy | PASS (not sponsored entitlement) |
| MediaPipe www WASM/CORS | VERIFIED (`assets.visutry.com`, `Access-Control-Allow-Origin: *`, detector initialized) |

Guest happy-path IDs (first Production run, Cursor IDE browser):

- merchant: `ello-sunglasses`
- experience: `petite-fit`
- `merchantSessionId`: `cmtehp5tc000504jr7c4p1h0v`
- `frameId`: `cmsoerfmu0001n5fy1hwl7gfp`
- `taskId`: `cmtehrfyb000304kz5vvm7srg`

---

## 5. Cursor IDE browser continuation false negative

After a `merchantContinuation` return in the **Cursor IDE browser**, poll/result/assets returned **401 `SESSION_UNAUTHORIZED`**. Client runtime state (same `taskId`) had restored.

That environment did not deliver the HttpOnly `vt_store_cap` cookie on subsequent same-origin requests (photo/result assets broken). JavaScript cannot read `vt_store_cap`; that is expected. A normal browser must still **send** it.

**Classification: TEST ENVIRONMENT ISSUE** — not an application, session-ownership, or cookie-attribute defect.

---

## 6. Persistent Chrome guest continuation (authoritative)

Re-tested in Chrome **151.0.7922.174**, persistent non-incognito profile, same tab, hostname **only** `www.visutry.com`.

One additional sponsored guest generation (prior Cursor-browser session could not be reused):

- `merchantSessionId`: `cmtei9njl000904kvu757bb5j`
- `frameId`: `cmsoerfmu0001n5fy1hwl7gfp`
- `taskId`: `cmteif8qp000304ldwz0rtutp`

Cookie metadata only (token never recorded):

| Attribute | `vt_store_cap` |
| --- | --- |
| Present before / after continuation | YES / YES |
| Domain | `www.visutry.com` |
| Path | `/` |
| Secure | true |
| HttpOnly | true |
| SameSite | Lax |
| Changed or disappeared | NO |

Request proof after continuation:

| Request | HTTP | `VT_STORE_CAP_SENT` |
| --- | --- | --- |
| `POST /api/store/sessions/try-on/poll` | 200 (`COMPLETED`) | YES |
| `GET /api/store/sessions/try-on/<taskId>/result` | 200 (`image/jpeg`) | YES |
| session asset GET | 200 | YES |

Also confirmed: same `merchantSessionId`, same `taskId`, completed image restored, no `POST /api/store/sessions` on return, no additional Try-On POST, no additional provider generation.

**GUEST CONTINUATION = PASS**

---

## 7. Authenticated continuation

**NOT VERIFIED — NON-BLOCKING**

No authorized QA consumer credentials were used. Do not create a Production account solely for this closure. Track as a later QA follow-up on [Issue #168](https://github.com/franksunye/VisuTry/issues/168), not as a P0/P1 and not as a Pilot blocker.

---

## 8. Findings

**P0:** none  
**P1:** none

**P2 (non-blocking; not a Consumer Journey Hardening coding round):** tracked on [Issue #168](https://github.com/franksunye/VisuTry/issues/168)

- `recordFrameSelections` guest-context difference
- HTTP 402 fallback
- `guestCompareUnlocked` continuation UI (“Selected 1 of 2” after resume)
- Authenticated continuation Production QA (requires an authorized QA consumer account)

---

## 9. What this does not close

- Scale readiness
- Product Advantage Gate A4 / Agent Natural Distribution
- Structured merchant outreach (still gated by Product Advantage Gate)
- Authenticated shopper continuation QA ([Issue #168](https://github.com/franksunye/VisuTry/issues/168))
