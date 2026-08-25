# Gate A Shopper Experience Benchmark Audit

**Audit date:** 2026-08-25
**Branch:** `codex/product-advantage-gate-baseline-2026-08-24`
**Starting SHA:** `4c71d061f992fea6a7a32b876bd0b0de5a174997`
**Scope:** B2B consumer-facing Store / Campaign shopper experience

This audit uses the active contract in
`docs/product/plans/gate-a-shopper-experience-benchmark.md`. It does not use
synthetic or replayed Agent traffic as distribution evidence.

## Evidence method

- Read-only Chrome inspection of the production Reference Store
  `/en/store/ello-sunglasses` and Reference Campaigns
  `/en/c/ello-sunglasses/petite-fit` and `/en/c/akila/statement-frames`.
- Desktop inspection at the normal 1353 × 704 viewport.
- Mobile Store inspection at 390 × 844 with zero horizontal overflow.
- Existing Store/Campaign Playwright coverage at desktop and mobile viewports.
- Controlled Playwright shopper fixture for the full recommendation → Try-On →
  Compare → Product Click path. The fixture is explicitly test traffic and is
  not counted as Gate A4 evidence.
- Public benchmark review of current [Warby Parker](https://www.warbyparker.com/)
  and [Zenni Virtual Try-On](https://www.zennioptical.com/tryon) flows.

## Executive verdict

| Layer | Verdict | Reason |
| --- | --- | --- |
| A1 — Landing Experience | **PASS after the CTA fix in this change** | Store and Campaign are commerce-first, product-visible, mobile-safe, and distinct. The hero CTA now targets the product collection instead of skipping to Try-On. |
| A2 — Embedded Decision | **PASS in controlled browser proof** | The Store/Campaign fixture completes product selection, recommendation, Try-On, Compare, and Product Click with the configured Experience context. |
| A3 — Agent Commerce Readiness | **PASS technical readiness** | Deep links resolve, relevance and products are explicit, Experience/source handoff fields are retained where the current runtime supports them, and Reference surfaces follow the intentional noindex policy. |
| A4 — Observed Agent Distribution | **PARTIAL** | No genuine production Agent-referral observation window is available in this audit. |

Gate A remains **PARTIAL** because A4 is an external evidence gate. A1–A3
technical readiness does not substitute for genuine production Agent traffic.

## A1 — Landing Experience

### Store benchmark

Mature eyewear commerce keeps brand, product category, product visibility, and
the next shopping action legible before AI assistance takes over. Warby Parker
shows shopping categories, quiz/advisor entry, product names, prices, and
try-on-oriented product actions on its public commerce surface.

### Store evidence

- `/en/store/ello-sunglasses` returned successfully with `PRODUCT_FIRST`.
- The first experience section identifies `ello sunglasses`, explains the
  petite-fit collection, and exposes `Explore the collection`.
- The collection exposes Bali, Bar Harbor, Half Moon Bay, Outer Banks, Pebble
  Beach, and South Beach with product images, shape/material/color/width facts,
  prices, and `View product` destinations.
- The page exposes `Try these frames on your photo`, the privacy/session
  explanation, `Reference pilot · simulation`, and `Powered by VisuTry`.
- At 390 × 844, the layout had `scrollWidth === innerWidth === 390`; the
  primary action remained visible and product content continued in the next
  section without horizontal overflow.

### Store gap and fix

**P1 fixed:** the hero `Explore the collection` link in
`src/components/store/ExperienceDiscoveryContent.tsx` previously targeted
`#interactive-shopping`, which sent a shopper past the collection to the
bottom Try-On launcher. It now targets `#featured-frames`, matching its label
and the commerce-first benchmark. `tests/e2e/store-pilot.spec.ts` asserts the
contract.

### Store verdict

**PASS after this change.** No P0 remains. No material P1 landing blocker
remains in the inspected Reference Store.

## A1 — Campaign benchmark

### Campaign benchmark

Zenni connects Try-On to shopping intent, fit confirmation, and an order-
oriented next action. A Campaign therefore needs a focused reason to arrive,
a selected product story, and a clear path into the merchant product
destination or Store.

### Campaign evidence

- `/en/c/ello-sunglasses/petite-fit` rendered `Find frames for smaller faces`,
  `Petite Fit Reference Experience`, and a petite-proportion description.
- `/en/c/akila/statement-frames` rendered `Discover frames with a point of
  view`, a style-specific description, `Statement Frames`, and a distinct
  selected-frame set.
- Both Campaigns expose real product names, images, prices, attributes, and
  product links. The product links preserve `surface=campaign`, a
  Campaign-specific campaign value, and `utm_content=product`; merchant links
  preserve `utm_content=merchant`.
- Both Campaigns expose the Try-On launcher and the full Store continuation
  where applicable. The Campaign copy and selected catalog are not a renamed
  generic Store label.
- The hero images loaded successfully after the normal image settle period;
  the observed mobile/Playwright coverage has no horizontal overflow.
- The disclosure footer makes the Reference / simulation status explicit. This
  is appropriate controlled evidence and is not presented as real merchant
  acceptance.

### Campaign gaps

- **P2 / product-boundary limitation:** VisuTry does not provide a merchant
  checkout, shipping/returns policy, or purchase flow inside the Reference
  Experience. Product destinations remain merchant-owned by design and are
  explicit in the card CTA. This is outside the active landing/decision-layer
  scope and is not a Gate A P0.
- **P1 observability follow-up:** a shopper who clicks a static `View product`
  card before opening the interactive runtime receives the tracked outbound
  URL, but does not create a `MerchantSession` first-party action record. The
  runtime Try-On/Compare product action does create `PRODUCT_CLICK`. This is a
  reporting precision gap, not a broken shopper handoff, and is retained as
  non-blocking follow-up.

### Campaign verdict

**PASS for the controlled Reference/Campaign landing bar.** No P0 remains.
The static-card first-party join is P1 reporting work, not a visual or
shopper-flow blocker.

## A2 — Embedded Decision Experience

### Benchmark

Warby Parker frames Advisor and Virtual Try-On as shopping assistance. Zenni
connects virtual try-on to fit confirmation and ordering. The VisuTry standard
is therefore not “AI output appeared”; it is preserved product context plus a
measurable next action.

### Tested path

The controlled Reference Store Playwright path now proves:

```text
Store Landing
→ product-visible collection
→ Try-on launcher and privacy boundary
→ photo fixture upload
→ catalog-scoped Recommendation
→ select two frames
→ save selection
→ Try-On completion fixture
→ Compare completion
→ Product Click intent
```

The same component/data contracts are exercised for Store and Campaign because
`experienceSlug`, `experienceType`, merchant session identity, product URL,
price, and frame identity are passed into `StoreTryOnComparePanel`.

### A2 gap and fix

The prior Store/Campaign suite stopped after frame selection and therefore did
not prove the complete shopper decision sequence. This change adds deterministic
test-safe responses for Try-On submission/polling, Compare, and Product Click
intent, then asserts each boundary in the browser. No provider output, real
shopper photo, or production traffic is used.

### Context preservation

- Campaign-to-Store continuation retains the allowlisted source/medium/campaign
  query fields.
- Recommendation data is returned from the current merchant catalog and keeps
  merchant frame IDs, product URLs, prices, and attributes.
- Try-On and Compare Product Click actions use the same merchant session and
  Experience context to build the outbound URL.
- The interactive surface is a modal with an explicit Close action, so the
  shopper can return to the landing without restarting discovery.

### Mobile

Store mobile inspection and the existing mobile Playwright assertion show no
horizontal overflow and preserve the core launcher/collection hierarchy. The
interactive runtime uses single-column responsive cards at mobile widths; the
controlled desktop path is the evidence for the provider-independent decision
sequence.

### A2 verdict

**PASS in controlled browser proof.** The browser path reaches a supported
Product Click intent after Recommendation, Try-On, and Compare. Test fixtures
are clearly labelled test traffic and do not satisfy A4.

## A3 — Agent Commerce Readiness

### Deep-link behavior

The simulated deep link
`/en/c/akila/statement-frames?utm_source=chatgpt.com&utm_medium=referral&utm_campaign=agent-eyewear`
resolved to the Campaign, retained the Campaign-specific H1, rendered nine
products, exposed product and merchant destinations, and showed the intended
`noindex, follow` metadata for this Reference surface.

The canonical URL correctly strips acquisition query parameters. Product and
merchant handoffs retain the VisuTry source, Campaign surface, Campaign
identity, and link role (`product` or `merchant`) in the outbound query.

### Source/context persistence

`captureStoreAcquisition()` reads allowlisted source, medium, campaign,
surface, UTM, referrer, landing URL, and known AI-agent hints when the
interactive runtime starts. The session API persists that acquisition context
for the MerchantSession. Existing source/context tests cover Campaign → Store
continuation and outbound link construction.

The remaining P1 reporting precision boundary is explicit: a static product
card click does not create a first-party MerchantSession before leaving the
page. It is still a correctly attributed merchant outbound handoff; it is not
counted as a durable VisuTry Product Click in the source-action report unless
the shopper enters the interactive runtime.

### Machine/human clarity

The landing HTML contains a clear H1, merchant identity, Campaign identity,
product names, image alt text, prices, shape/material/color/width attributes,
merchant destination, product destinations, JSON-LD, and canonical metadata.
The Reference noindex policy is intentional; paid/private/draft surfaces are
not added to the dynamic sitemap merely to increase page count.

### A3 verdict

**PASS technical readiness.** The static-card first-party join remains P1
follow-up because the supported deep-link, product relevance, and tracked
outbound context are intact.

## A4 — Observed Agent Distribution

| Required evidence | Current result |
| --- | --- |
| Genuine Agent referral sessions in rolling 14 days | **Not available** |
| Includes ChatGPT / OpenAI | **Not proven** |
| At least three meaningful referred shopper actions | **Not proven** |
| Reproducible source → session → action report | Technical report implemented; no genuine observation window |
| Synthetic/internal/test traffic excluded | **Yes** — controlled fixtures are labelled test and excluded from the verdict |

**A4 verdict: PARTIAL.** No synthetic request, browser simulation, or
controlled fixture is counted as real distribution proof.

## Severity summary

### P0

None found in the inspected Store/Campaign shopper surfaces after the CTA fix.

### P1

1. Add a first-party Product Click capture for the static public card path so
   a direct product shopper can be joined to the MerchantSession/source report
   without first opening the interactive runtime.

### P2

1. Keep merchant-owned checkout, shipping/returns, and purchase trust content
   explicit as an integration boundary rather than recreating it in VisuTry.
2. Continue periodic visual benchmark review as Reference assets and merchant
   configurations change.

## Industry comparison

| Dimension | Warby Parker / Zenni observable pattern | VisuTry current evidence |
| --- | --- | --- |
| First-screen commerce clarity | Shop categories/products are primary; AI assists selection | Store/Campaign H1, collection story, product cards, price, and collection CTA are primary after the fix |
| Brand and context | Brand/service/fit context explains why to continue | Merchant identity, Store/Campaign narrative, selected catalog, Reference disclosure |
| Product exploration | Product names/prices and product actions are visible | Product names, images, attributes, prices, View product, merchant destination |
| Recommendation / Try-On | Shopping assistance returns toward product confidence/order | Catalog-scoped recommendation, same-photo Try-On, Compare, Product Click intent |
| Mobile | Core shopping actions remain usable | No horizontal overflow in inspected Store and Playwright mobile coverage |
| Trust / transaction | Mature retail trust and purchase flows | VisuTry provides privacy/session boundaries and merchant-owned product destinations; checkout/returns remain outside the Reference Experience |

VisuTry is weaker on mature retailer trust/transaction depth because it is not
the merchant checkout. It may be vertically stronger in the narrower B2B
surface it controls: a merchant-configured Campaign subset connected to
catalog-aware Recommendation, Try-On, Compare, and measurable merchant intent.

## Gate A decision

- **A1 Landing Experience:** PASS after the CTA fix.
- **A2 Embedded Decision Experience:** PASS in controlled browser proof.
- **A3 Agent Commerce Readiness:** PASS technical readiness.
- **A4 Observed Agent Distribution:** PARTIAL; genuine production evidence is
  absent.

**Gate A: PARTIAL.** The remaining hard blocker is A4, not a reason to count
synthetic traffic or to broaden the product surface.

## Next actions

1. Deploy this change and re-run the Store/Campaign desktop and mobile browser
   evidence on the deployed SHA.
2. Decide whether the static-card Product Click P1 is worth adding to the
   first-party session report before the next Gate A audit.
3. Inspect the rolling 14-day report for genuine Agent referrals; require the
   active A4 threshold before changing the Gate A verdict.
