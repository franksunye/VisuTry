# Local Demo Runtime Contract

**Status:** Active Local QA contract
**Owner:** Merchant Platform
**Last updated:** 2026-10-01
**Scope:** Reusable, productized VisuTry Demo Optical capability for Merchant Demo, Kiosk Demo, White Paper/content production, Sales walkthroughs, and Store experience QA.
**Isolation:** Local PostgreSQL and Local mock auth only. Never use Preview or Production.

Canonical identity, the historical Canary boundary, public URL, and the
shared Local/Production `PREPARED_DEMO` parity contract are governed by the
[VisuTry Demo Environment Contract](../ops/visutry-demo-environment-contract.md).
Product ownership, upgrade obligations, and sales/marketing reuse are governed
by the [Productized Demo Capability](../product/specs/visutry-demo-capability.md).

## Operator loop

One-time or after a schema change:

```bash
npm run demo:local:bootstrap
```

Terminal A:

```bash
npm run demo:local:dev
```

Terminal B, while Terminal A remains running:

```bash
npm run demo:local:network:verify
```

Open the Store at <http://127.0.0.1:3001/en/store/visutry-demo-optical>. The
network verifier opens the same route, checks the ten image assets, and runs
the actual `analyzeFaceLandmarkFile` browser module against a generated
abstract canvas image. That probe initializes MediaPipe without a shopper
photo, Store session, upload, API mutation, screenshot, or Try-On request.

After a shopper rehearsal, stop Terminal A with Ctrl-C before resetting its
session data, then run:

```bash
npm run demo:local:reset-session
```

The reset checks `APP_ENV=local`, PrismaPg, loopback `127.0.0.1:5433/visutry_local`,
the `LOCAL` `EnvironmentMetadata` marker, mock auth, Stripe TEST mode, local
application URLs, and the exact `visutry-demo-optical` TEST/DEMO identity plus
its VisuTry Store/catalog provenance. It also refuses while port 3001 is
listening. In one bounded database transaction it removes that fixture's
shopper sessions and associated session-scoped assets, Store events, intents,
Try-On tasks/telemetry, Decision Results/shares, usage rows, abuse counters,
orphan blobs, and first-shopper milestone. It does not truncate tables or
change the Merchant, Store, ten catalog products, Store selections, or catalog
metadata. The command prints scoped before/after counts and verifies the
preserved fixture cardinalities before commit.

Re-run `npm run demo:local:seed` afterward to confirm the fixture seed remains
idempotent and the Store still contains ten products.

`demo:local:bootstrap` ensures the pinned MediaPipe runtime before printing
`LOCAL DEMO BOOTSTRAP: READY`. The checksum-verified cache is shared by all of
the current user's worktrees at
`${VISUTRY_LOCAL_CACHE_DIR:-${XDG_CACHE_HOME:-$HOME/.cache}/visutry}/mediapipe-assets/0.10.35`.
The default is outside the Git worktree; set `VISUTRY_LOCAL_CACHE_DIR` to an
absolute path to override it. Existing non-empty files are reused only when
their SHA-256 matches the pinned 0.10.35 manifest. Missing or invalid files
are downloaded to temporary files, verified, and atomically installed. No
runtime binaries are committed.

`demo:local:dev` verifies the same shared cache and fails with an actionable
`Run: npm run demo:local:bootstrap` message if it is unexpectedly incomplete.
It serves MediaPipe files on loopback port 4100 and runs Next on loopback port
3001 by default. If another worktree already owns 3001, set
`VISUTRY_LOCAL_DEMO_PORT=3002` for an isolated run; the Local reset guard uses
that same app port. The script owns and stops the asset server when Next exits.
The canonical journey E2E checks this cache before resetting shopper state, so
a missing runtime cannot cause a partial reset-first run.

`npm run demo:local:bootstrap` starts/reuses the guarded Local PostgreSQL,
reconciles its schema and LOCAL marker, seeds the deterministic demo fixture,
and runs database/runtime/provider preflights. It refuses non-loopback or
unexpected Local database targets. Regular Local Demo startup checks Prisma
schema parity and fails with the bootstrap command if the schema has drifted.

For repeatable no-provider Store → Face Intelligence → Recommendation → frame
selection → prepared result → Compare → Decision Result → QR/mobile browser
verification, run `npm run demo:local:journey:e2e`. It owns both local server
processes, defaults to app port 3001, and supports the explicit 3002 isolation
override when another VisuTry worktree owns 3001; it refuses any configured
app/media port if already occupied. It uses the same application contracts as
the canonical Production Demo. Only the asset
adapter differs: guarded Local resolves the checksum-verified, Lead-approved
prepared Demo result PNGs from this repo; Production reads the corresponding
approved private Blob assets through the bounded private-media adapter. The
older Local QA SVG fixtures remain separately classified as disclosure-only QA
graphics and are not selected by the canonical journey or served in
Production. Missing or mismatched Production assets fail closed rather than
falling back to Local files. The canonical
browser E2E verifies the approved PNG bytes during the journey and after an app
restart, then resets shopper state while preserving the Demo fixture.

The default Local execution mode is `PREPARED_DEMO`: deterministic, repeatable,
and zero-provider. It creates a source-typed prepared result reference in the
existing private Decision Result; it does not create TryOnTask,
GenerationRequest/Attempt, paid-usage, or provider/reliability telemetry. The
canonical E2E verifies this Compare / Decision Result / mobile continuation,
including exact served-image bytes and readability after an app restart. The
Local result image is a pre-approved Demo asset, not a live generation from
the current shopper session; no Provider telemetry or Try-On usage is created
by this path.

`LIVE_PROVIDER` is an explicit opt-in reserved for the existing authorized
Local GrsAI provider-smoke command below. It is not required for normal Local
Demo readiness. Gemini is never an implicit fallback. The no-provider journey
can run without a developer `.env.local` because it exports only the guarded
Local/test settings; normal `dev-local` still requires `.env.local`. Its test
token is held briefly in a mode-0600 file under ignored `.local/` and removed
on exit. This command does not call GrsAI or Gemini.

## Product evolution contract

The Local Demo is a maintained product regression/rehearsal surface, not a
frozen fixture from a single sales cycle. When a product change affects the
supported Demo journey, update the canonical Local journey, fixture, evidence,
or assertions as required by the Productized Demo Capability spec.

Keep Demo behavior on shared production application/domain contracts. Do not
solve parity drift by creating a second recommendation path, Compare flow,
Decision Result model, or merchant business-rule stack for Local Demo only.

For externally visible changes, Local is the preferred repeatable environment
for rehearsal and content capture; run a bounded Production smoke as well when
the changed behavior depends on Production routing, entitlement, private media,
or other Production-only boundaries.

## One-command real-provider smoke

After explicit owner authorization, the canonical real-provider validation is:

```bash
npm run demo:local:provider-smoke -- --authorized
```

Do not replace this with a desktop browser or an ad-hoc Playwright script. The
runner bootstraps and resets the Local Demo, starts the explicitly armed GrsAI
runtime, and drives the normal shopper UI with repository Playwright. It submits
**VT Rowan first and waits for a real completed result before VT Lane becomes
the second request**. The test never clicks retry; if Rowan fails, Lane is not
submitted.

The runner captures S01–S06 evidence under ignored
`.local/demo-evidence/provider-smoke-<run>/`, writes a browser state record,
checks PostgreSQL telemetry for exactly two GrsAI `GenerationRequest` rows and
exactly two provider `GenerationAttempt` rows, restarts the app with providers
blocked, verifies the same Decision Result media, and finishes with the scoped
shopper/session/media reset. Gemini fallback is not permitted.

This command is intentionally refused in CI, Vercel, Production, or without the
explicit `--authorized` argument.

## Runtime contract

| Concern | Local Demo behavior |
|---|---|
| Database | `APP_ENV=local`, PrismaPg, `127.0.0.1:5433/visutry_local`, with the LOCAL environment marker |
| Authentication | Existing TEST mock identity; demo fixture owner is the existing `mock-user-1` identity |
| Merchant/catalog | Real Merchant, Experience, MerchantFrame, and ExperienceFrame models; shared readiness/recommendation logic |
| MediaPipe | Real browser inference, pinned 0.10.35 WASM/model hosted from `127.0.0.1:4100`; loopback configuration disables CDN/GCS fallback |
| Recommendation | Existing deterministic production application/domain path |
| Store / Compare / Result | Existing Store application routes and persisted Local PostgreSQL state |
| Try-On | Canonical Demo defaults to shared `PREPARED_DEMO` in Local and Production; Local selects checksum-verified approved result PNGs, while older QA SVGs remain separately classified and are not selected by the canonical journey. Production selects the approved private result assets and still fails closed on missing/mismatched media. `LIVE_PROVIDER` is restricted to the existing explicitly authorized Local GrsAI provider-smoke command; Gemini is never a fallback |
| Stripe | Local mock path and TEST mode only; no checkout is needed for the demo journey |
| Analytics | `APP_ENV=local` suppresses Production GA/Axiom destinations |
| Store photo/result bytes | Filesystem-backed `APP_ENV=local` mock Blob adapter under ignored `.local/mock-blob/`, isolated from Vercel Blob and durable across Next process restarts |
| Production / Preview | Never used |

The canonical ten-frame catalog manifest, approved Demo Shopper, contact sheet,
and asset provenance live in [`docs/assets/local-demo`](../assets/local-demo/).
The catalog is synthetic, first-party demo inventory and is not offered for
sale.

## Previously observed full-journey gaps — Gate 2 disposition

The bounded 2026-09-28 shopper run completed Face Intelligence, deterministic
recommendation, selection, two approved GrsAI Try-On jobs, and Compare. Result
image reads then returned HTTP 404 because the previous process-memory mock
Blob did not survive route/process boundaries. Gate 2 replaces this with the
filesystem-backed Local adapter and tests object resolution after creating a
new adapter instance and restarting the application.

At 1024×768, the same run also found no visible normal shopper route from
Try-On/Compare to Decision Result. Gate 2 adds a continuation link to the
existing result token/href and exercises it in the browser journey. Store
publishing behavior is unchanged.

The Local Demo provider gate now defaults to blocked even when provider keys
are present. The Try-On application boundary rejects before Merchant/session
reads, usage reservations, generation task creation, telemetry, or provider
dispatch. Explicitly arming `--arm-grsai` validates a dedicated GrsAI key and
approved HTTPS origin; it never enables Gemini fallback. Preflight makes no
provider calls. `ENABLE_MOCKS=true` alone remains unrelated to provider
authorization.

## Provider environment resolution

Next local development loads the standard development env-file layers after
the shell environment, with shell-exported values taking precedence. The
Local Demo launcher explicitly exports `APP_ENV`, local URLs, Stripe TEST
mode, both MediaPipe loopback URLs, and the blocked-by-default provider mode
before starting Next; it does not inject provider keys.

Outside Local Demo, legacy provider resolution remains:

```text
API key: GRSAI_API_KEY || GEMINI_API_KEY
Base URL: GRSAI_BASE_URL || GEMINI_API_BASE_URL || https://grsaiapi.com
```

In Local Demo, these fallback variables do not arm generation. The separate
`--arm-grsai` mode requires explicit `GRSAI_API_KEY` and `GRSAI_BASE_URL` on
the approved HTTPS origin; no credential value is printed. `--arm-grsai` does
not itself make a request. A subsequent explicit shopper Try-On is the only
provider dispatch point. Do not use Gemini as an implicit substitute.

## Network verification

`npm run demo:local:network:verify` uses repository Playwright tooling. It
records requests, categorizes only the two allowed origins (`127.0.0.1:3001`
app and `127.0.0.1:4100` MediaPipe), and aborts any other HTTP(S) request
before it leaves the browser. A blocked external request is still reported as
unexpected and fails verification. It reports browser console/page errors and
does not save screenshots. WebSocket destinations are reported separately;
the expected Next development socket is loopback port 3001.

The MediaPipe probe uses the real application `face-landmark-client` bundle
and a generated in-memory abstract image. It asserts model/WASM initialization
through local files without creating a MerchantSession or attaching photo
data. The verifier must report zero GrsAI, Gemini, Vercel Blob, analytics, or
other external requests.

## Phase 2C walkthrough runbook — plan only, not executed

The following remains a separate real-provider rehearsal. Do not begin it
until the Lead approves the GrsAI credential/account and authorizes
shopper-photo handling and the two provider generations. Local mock Blob bytes
now persist across app restarts; a single process is no longer a storage
requirement, though the operator should still avoid resetting data during an
active journey.

| Step | Route / expected state | Expected Local data write | External provider | Screenshot candidate / observation |
|---|---|---|---|---|
| 1. Open Store | `/en/store/visutry-demo-optical`, public collection visible | Read-only Merchant/Store/catalog reads; no session until shopper explicitly continues | None | Store landing; confirm 10 products, demo disclosure, no false price/sale claims |
| 2. Upload Demo Shopper v1 | Same Store; explicit privacy continuation then photo selection | `POST /api/store/sessions` creates MerchantSession, page-view event, usage row, and first-shopper activation milestone; `POST /api/store/sessions/photo` stores mock Blob bytes under `.local/mock-blob/`, creates StoreAsset, attaches it to session, records photo-upload event | None for upload; local app only | Photo-ready state; verify privacy copy and local-only transfer |
| 3. Face Intelligence | Happens in browser as part of the image/recommendation action | Browser-only inference; no face landmarks or raw image uploaded for MediaPipe | Local WASM/model only (`127.0.0.1:4100`) | Face analysis result/state; observe no CDN/GCS requests |
| 4. Inspect recommendations | Store recommendation state after upload | `POST /api/store/sessions/recommend`; server records recommendation activity and creates/updates the Decision Result record | None; deterministic local ranking | Recommendation list and explanation; confirm only eligible demo catalog frames |
| 5. Select VT Rowan | Select Rowan in recommendation list | Client selection is transient until confirmed; confirmation uses `POST /api/store/sessions/select-frames`, persisting selection/event state | None | Selected Rowan and continuation affordance |
| 6. Real Try-On #1 | Try-On panel for VT Rowan | `POST /api/store/sessions/try-on` creates TryOnTask; filesystem mock Blob persists temporary source/result bytes and task state locally | One approved GrsAI generation and result poll | Queued/running/completed result; record latency and image fidelity |
| 7. Select VT Lane | Add Lane as second comparison frame | Selection state updated through the same select-frames boundary if required | None | Two visibly distinct selected frames |
| 8. Real Try-On #2 | Try-On panel for VT Lane | Second TryOnTask and Local mock Blob/result state | One approved GrsAI generation and result poll | Second result; compare alignment, crop, and visible defects |
| 9. Compare | Compare action after two completed looks | `POST /api/store/sessions/compare` records comparison event and Decision Result state | None | Compare view; evaluate scanability and fair side-by-side presentation |
| 10. Favorite/select | Save favorite or supported decision action | `POST /api/store/sessions/intent` records MerchantIntent (FAVORITE) and event | None | Selected/favorited state; verify feedback and reversible behavior |
| 11. Decision Result | `/en/result/{token}` | Read persisted DecisionResult and associated Local task state | None | Result page; verify recommendation, selected frames, completed images, and privacy copy |
| 12. QR/mobile continuation | Result/Store continuation link in mobile viewport | Read-only link navigation; any new Store session only after explicit shopper continuation | None | Mobile-emulated QR/continuation; verify target route and retained result context |
| 13. Reset / new shopper | Use the explicit kiosk New shopper/reset action only if testing kiosk mode | `POST /api/store/sessions/kiosk-reset` performs the canonical Local reset for kiosk session state | None | Clean start state; confirm prior shopper content is not visible |

Exact consent/session UI and whether Compare Result links expose a QR are to be
confirmed in the walkthrough; do not fabricate a QR or force kiosk mode.

## Phase 2C-R1 — targeted shopper UX rehearsal

The Store recommendation ranker remains unchanged. “Recommended for you” stays
first; “Explore all frames” lazily reveals the other active Store-selected
frames without duplicating the ranked choices. Selection remains shared across
both lists and capped by the existing two-frame policy. A missing product
price is omitted rather than labeled unavailable or represented as zero, and
recommendation rationale is headed “Why we recommend it.”

The bounded Local browser rehearsal uses the repository-owned Demo Shopper v1
image and real browser MediaPipe, then reaches the existing deterministic
recommendation API. Verify the original six-frame order, reveal all ten Store
frames, select Rowan and Lane, and confirm “Selected 2 of 2.” Stop before
confirming the selection or submitting Try-On; this phase makes no GrsAI or
Gemini request. Afterward stop the dev server and run the guarded reset above.

The earlier Store landing observation is deliberately deferred: at 1024×768
the full page is approximately 2291px tall and requires scrolling before the
interactive journey. Phase 2C-R1 records but does not redesign that landing
experience. One previously observed malformed-looking loopback request could
not be tied to a URL/source from the available local logs; investigate only if
it is reproducible, without broadening the Local network boundary.

## Fixture safety and repeatability

Seed the dedicated fixture with:

```bash
npm run demo:local:seed
```

The seed only manages `visutry-demo-optical`, preserves the existing Merchant
and Store IDs, is idempotent, uses the existing Local owner identity, and
refuses non-Local DB/environment markers. It never deletes rows or calls
providers. Re-run it to reconcile the exact ten manifest SKUs/selections.

Do not reset or reuse the six-frame canary Merchant. Never attach the final
Demo Shopper or start the real 2C journey as part of seed/preflight/network
verification.
