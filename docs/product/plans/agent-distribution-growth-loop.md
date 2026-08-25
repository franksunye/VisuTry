# Agent Distribution Growth Loop

**Status:** Active pre-outreach execution loop  
**Started:** 2026-08-24  
**Last clarified:** 2026-08-25  
**Owner:** Product / Growth  
**Authority:** `docs/product/plans/product-advantage-gate.md`

## 1. Objective

The immediate company-level growth objective is to prove that VisuTry can
reliably attract genuine AI-assistant / agent referral traffic into the
**consumer-facing Store / Campaign experience of the B2B product** and convert
part of that traffic into meaningful eyewear shopping decision behavior.

This proof must exist before structured merchant outreach begins.

The primary operating hypothesis is:

```text
Excellent Store / Campaign Shopper Landing Experience
+ SEO / AEO / GEO
+ useful eyewear answer / discovery surfaces
+ visual / editorial assets
+ external promotion
        ↓
AI assistants discover / cite / recommend VisuTry Experiences
        ↓
genuine Agent referral traffic
        ↓
Store / Campaign Landing
        ↓
Product Exploration
        ↓
Recommendation / Try-On / Compare
        ↓
Product / Inquiry Intent
        ↓
proven natural distribution leverage
```

The goal is not simply more traffic. The goal is **qualified shopper decision
traffic into a merchant-grade Experience**.

## 2. Experience Boundary

In this execution loop, “2C experience” does **not** primarily mean VisuTry's
standalone Consumer product.

It means the consumer-facing part of the B2B product:

```text
PRIMARY
Store / Campaign Landing Experience

SUPPORTING CONVERSION CAPABILITIES
Recommendation / Advisor
Virtual Try-On
Compare
Face / fit intelligence where relevant

SUPPORTING ACQUISITION SURFACES
Standalone VisuTry Consumer tools
Educational / SEO pages
Visual SEO assets
Community / external content
```

The Store / Campaign landing experience is the main product surface. Embedded
AI decision capabilities are there to improve commerce decisions and intent.
Standalone Consumer tools can create discovery and reusable technology, but the
Growth Loop must not optimize them as an isolated end product at the expense of
the merchant shopper experience.

## Current Execution State — 2026-08-25

- **Bottleneck:** no genuine Agent referral is observed in the eligible
  Store/Campaign production stream, and the Consumer first-party stream cannot
  currently be queried because the available Axiom credential is ingest-only.
- **Measure:** the current PR head is deployed to a Vercel preview equivalent
  (`dpl_J4ej4zvstddDJB45V6aoZW2VvBto`). Production `visutry.com` Store/Campaign
  routes pass desktop/mobile read-only checks. The rolling 14-day Neon
  MerchantSession aggregate found 0 eligible Agent sessions; 77 Reference, 14
  Internal, and 16 Live/Luna-without-Experience sessions were excluded. The
  public `/en/discover`, Consumer answer pages, robots policy, and empty dynamic
  sitemap were also checked.
- **Improve:** this branch adds an anonymous browser-session ID and allowlisted
  Consumer decision events to /api/analytics/consumer-funnel, persisted via
  the existing Vercel/Axiom log stream. The server, not the browser, classifies
  test-session traffic. A read-only `report:agent-distribution` command now
  reports the Consumer stream and separately reuses the durable Store/Campaign
  source-action report without inventing a cross-system join.
- **Distribute:** public search diagnostics found VisuTry Consumer answer
  surfaces and an external SDK mention, but no checked Reddit/YouTube result.
  No Reddit, YouTube, or other external publishing was done in this pass.
- **Result:** A1/A2/A3 production-equivalent route verification did not
  regress. Technical attribution/reporting code is covered, but A4 L1/L2/L3
  remain unproven; the current production Store/Campaign evidence contains no
  eligible Agent referral.
- **Next iteration:** provision a query-capable Axiom credential, run the
  explicit rolling 14-day report, and choose one bounded discovery/distribution
  experiment only after the report identifies a dominant constraint.

## 3. Hard Success Condition

The active Product Advantage Gate requires Agent Natural Distribution L3 before
structured outreach can start.

Within a rolling 14-day window, the initial proof bar is:

- at least 10 genuine AI-assistant / agent referral sessions;
- the observed set includes ChatGPT / OpenAI traffic;
- at least 3 referred sessions perform a meaningful shopper decision action;
- source → session → Store / Campaign context → action is reproducibly
  inspectable where technically supported;
- internal QA, synthetic, replayed, crawler-only, and tagged test traffic is
  excluded.

The threshold proves repeatability and usefulness, not scale.

## 4. Primary Metrics

Track the following by date range and source class where technically supported:

| Layer | Primary evidence |
| --- | --- |
| Discovery | Search impressions/clicks, answer/page visibility, known AI referral sessions |
| Source | ChatGPT/OpenAI, Perplexity, Gemini, Copilot, Claude, organic search, generic referral, social, paid, direct |
| Experience entry | Store / Campaign landing session and landing context |
| Product exploration | Product views / selections / catalog exploration where supported |
| Decision action | Recommendation / Advisor, Try-On, Compare |
| Downstream intent | Product Click, Inquiry, High-Intent or other supported intent events |

Standalone Detector / Consumer-tool activity may be tracked as an acquisition
signal, but it does not replace Store / Campaign shopper evidence for Gate A.

Do not collapse genuine AI referrals into generic referral when the source can
be classified reliably.

## 5. Weekly Operating Loop

Each iteration should follow the same sequence.

### Measure

- inspect current Search / AI referral / referral-source evidence;
- identify which Store, Campaign, product-intent, answer, and acquisition
  surfaces attract qualified traffic;
- identify drop-offs from landing → product exploration → decision capability →
  intent;
- distinguish missing traffic from poor conversion of existing traffic;
- keep standalone Consumer-tool traffic separate from B2B shopper Experience
  evidence when interpreting Gate A.

### Diagnose

Classify the dominant constraint as one or more of:

- **Landing Experience:** Store / Campaign does not establish trust, merchant or
  campaign identity, product interest, or next action strongly enough;
- **Merchandising:** product imagery, context, selection, narrative, or product
  hierarchy is weak;
- **Decision Experience:** Recommendation / Try-On / Compare is disconnected,
  confusing, or fails to return the shopper toward product intent;
- **Indexability:** an intended public discovery surface is not discoverable as
  designed;
- **Answer quality:** supporting content does not answer the target eyewear
  question clearly;
- **Entity clarity:** search / agent systems cannot reliably understand VisuTry,
  the merchant / campaign context, products, or decision capability;
- **Distribution:** useful surfaces exist but have insufficient external
  exposure;
- **Attribution:** traffic exists but cannot be measured reliably;
- **Conversion:** referral traffic arrives but does not reach meaningful shopping
  behavior.

### Improve

Prioritize bounded work that can change the diagnosed constraint, including:

- Store / Campaign first-screen hierarchy and shopper value proposition;
- merchant / campaign identity, product imagery, catalog presentation,
  merchandising, and campaign-specific narrative;
- mobile / desktop landing quality;
- Recommendation / Try-On / Compare entry, state continuity, photo handoff,
  result handling, and return-to-product flow;
- product click / inquiry / other supported intent continuation;
- SEO / AEO / GEO metadata, structured data, canonical and content architecture;
- high-intent eyewear educational pages connected to useful Store / Campaign or
  decision experiences;
- Visual SEO assets that answer specific eyewear questions;
- current Store / Campaign product screenshots / visual assets where they
  improve trust or clarity;
- community / content distribution through Reddit, YouTube, and other
  appropriate channels;
- referral / source / funnel reporting needed to evaluate the result.

Do not create generic low-value pages, mass programmatic content, spammy
community posts, or backlinks solely to increase counts.

### Distribute

Distribution work should create real opportunities for discovery, not simulated
Agent traffic.

Examples include:

- useful Reddit participation around real eyewear and shopping questions;
- YouTube educational / demo content linked to the appropriate VisuTry
  Experience or decision path;
- visual assets designed for Google Images and other discovery surfaces;
- public answer pages that are genuinely useful to search and AI users and lead
  naturally into a relevant Store / Campaign or shopper decision flow;
- relevant external references or mentions earned through useful content.

All distribution work should be attributable where possible.

### Observe

After publishing or promoting changes:

- inspect genuine production referral sources;
- inspect Store / Campaign landing behavior;
- inspect product exploration, decision-action, and intent behavior;
- compare against the previous observation period;
- record whether the hypothesis improved, stayed flat, or regressed;
- use the result to select the next iteration.

Do not call an iteration successful merely because content was published.

## 6. Work Prioritization

Until the hard distribution gate passes:

### P0

- major Store / Campaign shopper landing issues on high-value entry paths;
- inability to measure genuine AI / Search traffic into a Store / Campaign
  Experience;
- inability to connect source → Experience → meaningful shopper decision action;
- broken Recommendation / Try-On / Compare continuation that damages the landing
  commerce journey;
- indexability / canonical / structured-data defects on intended public
  discovery surfaces.

### P1

- high-confidence landing / merchandising / campaign narrative improvements;
- embedded Recommendation / Try-On / Compare conversion improvements;
- AEO / GEO / content improvements for important shopper intents;
- Visual SEO improvement and placement;
- external distribution experiments with clear attribution;
- supporting standalone Consumer UX improvements only when they materially help
  acquisition or reusable B2B shopper capabilities.

### P2

- speculative new channels with no evidence path;
- standalone Consumer polish unrelated to B2B shopper conversion or discovery;
- content volume without identified user intent;
- platform expansion unrelated to Agent Distribution proof.

## 7. Current Resource Rule

Before Agent Natural Distribution L3 is proven:

- Gate A receives the primary incremental Product / Growth attention;
- within Gate A, **Store / Campaign shopper landing and distribution are the
  primary target**;
- embedded decision capabilities are optimized as conversion modules, not as the
  main product narrative;
- standalone Consumer tools are supporting acquisition / technology surfaces;
- Gate B remains at its agreed merchant / brand / agency-facing PASS bar rather
  than being polished indefinitely;
- Gate C should close genuine product / protocol blockers, but cross-client
  polish should not consume the main Growth loop unless it blocks the active
  gate;
- structured merchant outreach remains frozen;
- passive inbound merchant interest may be recorded and handled safely.

## 8. Evidence Log

Every meaningful iteration should record:

- hypothesis;
- change or distribution action;
- affected Store / Campaign / product / supporting page / channel;
- deployment / publication date;
- observation window;
- source / session counts;
- landing / product-exploration counts where available;
- meaningful decision-action counts;
- downstream intent counts where supported;
- result;
- next action.

The evidence should not require reconstructing ad-hoc logs each time.

### 2026-08-25 A4 deployment and evidence closure

| Field | Record |
| --- | --- |
| Hypothesis | Current public Consumer answer surfaces and the Reference shopper Experience can be reached cleanly, while durable source/action reporting makes genuine Agent distribution observable. |
| Action | Deployed PR head `62a9c7c` to Vercel preview `dpl_J4ej4zvstddDJB45V6aoZW2VvBto`; verified production `visutry.com` and preview Store/Campaign routes; added `report:agent-distribution`. |
| Affected surface/channel | `/en/store/ello-sunglasses`, `/en/c/ello-sunglasses/petite-fit`, `/en/discover`, Consumer answer surfaces, Axiom/Vercel consumer stream, MerchantSession Store/Campaign stream. |
| Observation window | 2026-08-11T02:47Z → 2026-08-25T02:47Z UTC. |
| Result | 0 eligible Store/Campaign Agent sessions observed. Consumer Axiom query was denied because the available token lacks `query:read`; Vercel runtime retention cannot cover 14 days. Reference/Internal/test traffic was not counted. |
| Next decision | Keep Gate A PARTIAL. Provision read-only Axiom query access, rerun the report, then select one evidence-backed external distribution action. |

## 9. Exit

This execution loop remains the primary pre-outreach Growth motion until the
Product Advantage Gate records Agent Natural Distribution L3 as PASS and Product
explicitly changes the Outreach Gate from `GATED` to `READY`.

After that transition, Agent Distribution does not stop. It becomes an ongoing
merchant value and acquisition metric while the company begins controlled
Founding Merchant outreach and the separate Post-Outreach Merchant Validation
loop.
