# VisuTry GTM v3.2：10× Qualified Traffic Execution Plan

**Status:** Active source of truth for GTM execution  
**Version:** 3.2
**Last updated:** 2026-08-10
**Owner:** Growth / Product / Engineering / Analytics  
**Review cadence:** Weekly  
**Execution horizon:** 60–90 days  
**Scope:** Consumer acquisition, SEO, AI discovery, visual discovery, external distribution, funnel conversion, growth engineering, and measurement.

> This is the only active GTM execution plan for VisuTry. Historical SEO, backlink, directory, outreach, GEO, brand-page, and growth-sprint documents remain supporting references or execution history only. They do not create parallel GTM priorities.

---

## 1. Current stage

VisuTry has moved beyond the question of whether any stranger will pay for the product.

The current evidence is still early, but it is strong enough to define the next operating problem:

> The consumer eyewear-decision workflow is producing repeated paid behavior, but the traffic sample is still too small to make high-confidence decisions about conversion, pricing, channel quality, and the long-term consumer business.

The current public product path is:

> **Face Shape Detector → Glasses Advisor → Virtual Try-On → Frame Compare → Credits Pack**

The strongest current commercial interpretation is:

- free face-shape detection acquires and activates high-intent users;
- Advisor narrows frame directions;
- Try-On provides visual proof for a specific frame;
- Compare supports the final purchase decision;
- Credits Pack monetizes immediate, episodic consumer intent;
- consumer subscription remains secondary unless future repeat-use data proves otherwise.

The immediate GTM task is therefore not to invent more product surface area. It is to scale the number of qualified users entering this workflow and measure what they do.

---

## 2. Operating baseline — 2026-08-03

### Traffic

| Metric | Current directional baseline |
| --- | ---: |
| Active users, last 30 days | ~1,651 |
| Sessions, last 30 days | ~1,824 |
| Organic Search | Largest acquisition channel |
| Direct | Meaningful secondary source |
| AI Assistant | Material source; ChatGPT is the main identifiable AI referrer |

### AI discovery quality check — 2026-08-10

GA comparison for 2026-07-27–2026-08-09 versus the preceding 14 days:

| AI Assistant metric | Current 14 days | Previous 14 days | Interpretation |
| --- | ---: | ---: | --- |
| Sessions | 223 | 184 | Raw discovery increased ~21% |
| Engaged sessions | 148 | 151 | Qualified volume was flat / slightly down |
| Engagement rate | 66.37% | 82.07% | Landing and intent quality weakened |
| Average engagement time / session | 57 sec | 73 sec | Visitors found less continuation value |
| Key events | 46 | 50 | Product-intent actions did not grow |
| ChatGPT sessions | 217 | 174 | ChatGPT remained the dominant identifiable AI source |

Operating interpretation:

> AI exposure is growing, but qualified AI traffic is not. The immediate AI-discovery priority is message and landing-intent consistency, not more generic AI content volume.

The current acquisition mix means the operating model is no longer “SEO only”. It is qualified traffic growth across several compounding discovery engines.

### Revenue

Latest Stripe export reviewed on 2026-08-03:

| Metric | Current directional baseline |
| --- | ---: |
| Successful payments in export | 22 |
| Gross revenue | USD 83.78 |
| Stripe fees | USD 9.91 |
| Net after Stripe fees | ~USD 73.87 |
| Dominant consumer purchase | USD 2.99 Credits Pack |
| Subscription signal | One user has renewed across multiple months |

The absolute revenue is still small. The current constraint is **sample size**.

---

## 3. The only GTM objective

> **Increase VisuTry from roughly 1,800 monthly sessions to 15,000–20,000 qualified monthly sessions within 60–90 days, while preserving or improving paid-conversion quality.**

“Qualified” means the traffic has a plausible path into Detector, Advisor, Try-On, Compare, or Purchase. Generic fashion traffic, bot-like traffic, or traffic with no realistic product continuation does not count as strategic growth.

### Milestones

| Horizon | Monthly sessions target | What must be proven |
| --- | ---: | --- |
| Current | ~1,800 | Repeated paid behavior exists |
| ~30 days | 3,000–5,000 | At least two traffic engines create incremental qualified demand |
| ~60 days | 7,000–10,000 | Winning query / visual / distribution patterns can be replicated |
| ~90 days | 15,000–20,000 | Sample size is large enough for more reliable commercial decisions |

### Commercial validation target at 10× traffic

Directional target, not a commitment:

- **100–200 successful paid transactions / month**;
- **USD 500–1,000 monthly consumer revenue** if conversion quality holds or improves.

---

## 4. Growth equation and success criteria

All GTM decisions reduce to:

> **Qualified Traffic × Paid Conversion × Revenue per Payer = Consumer Revenue**

The current phase attacks Qualified Traffic first, while protecting Paid Conversion and measuring Revenue per Payer.

### North star

**Qualified monthly sessions**

### Commercial guardrails

| Metric | Purpose |
| --- | --- |
| Revenue / 1,000 qualified sessions | Prevent low-quality traffic inflation |
| Paid conversion rate | Ensure purchase intent survives scaling |
| Monthly successful payments | Build a meaningful commercial sample |
| Revenue per payer | Measure monetization depth |

### Funnel diagnostics

| Stage | Core metrics |
| --- | --- |
| Acquisition | sessions, source / medium, landing page, query cluster |
| Activation | Detector start, upload, completion |
| Continuation | result → Advisor / Try-On / Compare |
| Product use | try-on and compare start / completion |
| Purchase | pricing view, begin checkout, verified purchase |
| Quality | revenue / 1,000 sessions by source, page, locale, country |

Page count, backlink count, outreach count, comment count, directory submissions, or Pinterest post count are input metrics only. They are never success metrics by themselves.

---

## 5. Operating model: three workstreams, one goal

GTM execution is split into three workstreams so responsibilities can be assigned independently without creating three strategies.

### Workstream A — Engineering / Product Engineering

**Mission:** Build the technical surfaces and instrumentation that allow qualified traffic to land, continue through the product, and be measured reliably.

Engineering does **not** own traffic volume by itself. It owns the technical conversion and scaling infrastructure.

### Workstream B — Growth / Marketing

**Mission:** Create and distribute high-intent acquisition surfaces across Search, Visual, AI Discovery, and external channels.

Growth does **not** own product implementation. It owns demand capture, content/asset production, distribution, outreach, and channel experiments.

### Workstream C — Product / Analytics

**Mission:** Define the funnel, maintain the measurement model, review experiments, identify bottlenecks, and decide what Engineering and Growth should scale or stop.

Product / Analytics is the shared decision layer. It does not become a separate channel-execution team.

### Responsibility rule

Every active GTM task must have:

1. one **primary owner**;
2. one measurable output;
3. one outcome metric;
4. a review date;
5. an expand / modify / stop decision.

Tasks with unclear ownership do not enter the sprint.

---

## 6. Four traffic engines

All Growth / Marketing acquisition work belongs to one of these four engines.

### Engine 1 — Search → Tool

**Role:** Primary compounding acquisition engine.

Growth unit:

> **Search query → intent-matched landing page → interactive tool → personalized result → next decision step**

Priority clusters:

- `face shape detector`, `what is my face shape`;
- `what glasses suit my face`, `glasses for my face shape`;
- glasses for round / oval / square / heart / diamond / long faces;
- `oval vs oblong face`, `round vs square face`;
- `virtual glasses try on`, `try glasses on photo`;
- `compare glasses frames`, `which glasses look better`;
- evidence-backed brand try-on queries;
- sizing, proportion, and frame-shape decision questions.

Execution rules:

1. Start with **20–30 high-intent Search→Tool pages**.
2. Expand toward **50–80 useful pages only from evidence**.
3. No return to a “1,000+ pages” page-count objective in this phase.
4. Brand pages remain a sub-experiment, not a strategy.
5. English is primary; other locales expand only where GSC / GA shows real demand.

### Engine 2 — Visual Discovery

**Role:** Use VisuTry’s visual nature to create reusable discovery assets.

Primary surfaces:

- Google Images;
- Pinterest;
- visual assets embedded in Search→Tool pages.

Priority assets:

- face shape → recommended frame geometry;
- frame-shape comparison visuals;
- face-shape comparison diagrams;
- before / after try-on examples;
- multi-frame comparisons;
- frame width and proportion guidance.

### Engine 3 — AI Discovery

**Role:** Scale an acquisition source already producing identifiable referrals, especially ChatGPT.

Requirements:

- consistent product identity and terminology;
- crawlable first-party product facts;
- intentional crawler access;
- concrete question-answer pages;
- consistent pricing, privacy, and capability claims;
- original methodology, comparisons, and visuals;
- credible third-party references where naturally earned.

### Engine 4 — External Distribution & Authority

**Role:** Create qualified external discovery and third-party authority that support Engines 1–3.

Includes:

- YouTube participation;
- Reddit participation;
- backlink outreach;
- product / AI directories;
- relevant publishers;
- resource pages;
- selected partnerships and communities.

The historical 60-domain backlink plan and the first 25 YouTube comments are execution evidence, not current GTM objectives.

---

## 7. Engineering execution backlog

This is the authoritative engineering scope for the 10× phase. Product engineering outside this list requires explicit evidence that it improves acquisition, activation, continuation, purchase, or measurement.

### P0 — Must complete first

| Engineering task | Outcome | Acceptance condition |
| --- | --- | --- |
| Source → purchase attribution | Know which landing/source produces paid behavior | acquisition source and landing context survive through verified purchase reporting |
| Funnel event audit | Trust Detector → Purchase data | required events fire once, use stable names, and can be segmented |
| Search→Tool landing template | Growth can ship pages quickly without bespoke engineering | reusable SEO-safe page template with tool CTA, visuals, FAQ/schema where appropriate |
| Detector continuation | Prevent free result dead-end | result clearly routes into Advisor / Try-On / Compare |
| Try-On / Compare visibility | Make commercial actions easy to reach | relevant landing/result pages expose direct next-step CTAs |
| Indexation baseline | New high-intent pages can be discovered | canonical, sitemap, robots, hreflang where applicable are correct |
| Mobile acquisition-flow QA | Protect majority mobile journey | upload, Detector, result, Try-On, Compare, pricing work without blocking defects |

### P1 — Complete during first 30 days

| Engineering task | Outcome |
| --- | --- |
| Image SEO infrastructure | search engines can discover optimized original visuals |
| Internal-link modules | winning intent clusters can reinforce each other |
| Growth metadata convention | every new page records `query_cluster`, `content_cluster`, locale and product path |
| Landing performance | high-intent pages remain fast enough for acquisition |
| Checkout / payment failure observability | separate demand failure from payment-system failure |
| Credits Pack messaging hooks | Growth/Product can test value communication without redesigning checkout |

### P2 — Only after data supports it

- new free micro-tools such as frame-size / width checker;
- lightweight “Which glasses suit me?” quiz;
- additional landing-page interaction modules;
- new visual-generation utilities for Growth;
- locale-specific technical expansion.

### Engineering non-priorities during this phase

- large Studio build-out;
- heavy Store / merchant dashboard;
- Shopify public app;
- WooCommerce plugin;
- public API;
- broad SDK expansion unrelated to acquisition;
- large consumer feature projects unrelated to the funnel.

---

## 8. Growth / Marketing execution backlog

This is the authoritative marketing execution scope for the 10× phase.

### P0 — Search demand capture

1. Build a **query opportunity table** from GSC using query × landing page × country × device.
2. Select the first **20–30 high-intent Search→Tool pages**.
3. For each page define:
   - target query / intent;
   - user question;
   - first useful answer;
   - required original visual;
   - product continuation CTA;
   - internal-link targets;
   - measurement tag.
4. Refresh existing pages with impressions / ranking upside before creating weak new pages.
5. Review first batch after indexing and initial impression data before expanding page families.

### P0 — Visual asset system

1. Create a reusable visual library for the priority Search→Tool pages.
2. Reuse the same strong asset across:
   - site page;
   - Google Images;
   - Pinterest;
   - YouTube thumbnail / explanation where relevant;
   - external editorial references.
3. Every distributed visual must point to a relevant landing page, not generically to the homepage.

### P0 — AI discovery consistency

The canonical public identity is:

> **VisuTry is an eyewear decision and conversion platform that helps shoppers discover suitable frames, preview them, compare options, and move toward purchase.**

The canonical consumer path is:

> **Face Shape Detector → Glasses Advisor → Virtual Try-On → Frame Compare**

The canonical merchant position is:

> **VisuTry Store is an AI Commerce / Campaign Engine for eyewear merchants that turns human and AI-assistant traffic into personalized frame discovery, measurable purchase intent, and conversion signals.**

Execution requirements:

1. Keep first-party product descriptions and names consistent:
   - Face Shape Detector;
   - Glasses Advisor;
   - Virtual Try-On;
   - Frame Compare.
2. Treat `src/lib/product-positioning.ts` as the code-level public-facts contract for metadata and structured data.
3. Keep `public/llms.txt`, homepage metadata/schema, Store metadata/schema, pricing, FAQ, privacy, and visible product copy aligned with that contract.
4. Keep pricing, privacy, capability, and limitation facts consistent:
   - the Face Shape Detector is free, no-login, and on-device;
   - Advisor, Try-On, and Compare use account-based trials or credits;
   - the Credits Pack is a one-time purchase and purchased credits do not expire;
   - account uploads and results are private by default;
   - face shape is a styling estimate, not medical or identity recognition;
   - virtual try-on does not guarantee physical fit, prescription, or comfort.
5. Do not make model-vendor names part of VisuTry's durable public identity.
6. Do not describe VisuTry globally as a general clothing, footwear, accessories, or universal fashion try-on platform. Legacy capabilities may remain available without defining the brand.
7. Describe Store as agent-ready through public facts, stable URLs, structured metadata, and attribution. Do not claim a public agent API, autonomous purchase action, SDK, Shopify app, or WooCommerce plugin before those surfaces exist.
8. Convert recurring concrete eyewear questions into answerable first-party pages.
9. Track ChatGPT and other identifiable AI landing pages and continuation behavior.

Acceptance conditions:

- the canonical descriptions above appear without contradictory global claims across machine-readable and primary visible surfaces;
- `llms.txt` covers both the consumer workflow and merchant product;
- Organization, WebSite, and Store structured data describe the same eyewear decision / conversion category;
- global metadata contains no model-vendor positioning and no multi-category try-on identity;
- all supported locales preserve the four product roles and the same privacy / pricing boundaries;
- the weekly dashboard compares AI Assistant sessions, engaged sessions, engagement rate, continuation events, landing pages, and verified revenue;
- any AI landing page with rising sessions but falling qualified continuation receives an improve / merge / stop decision.

### P1 — External distribution

Run distribution around actual user questions and useful assets, not generic promotion.

Priority channels:

- YouTube eyewear / face-shape / glasses-selection videos;
- Reddit threads with genuine eyewear decision questions;
- relevant eyewear, optometry, style, AI-tool, and ecommerce publications;
- legitimate tool directories;
- resource-page and methodology outreach.

Growth output volume is managed operationally, but success is judged by qualified sessions, product behavior, citations/references, and reusable user-question insight.

### Marketing non-priorities

- generic fashion content with no product continuation;
- mass AI-written blog production;
- arbitrary page-count targets;
- arbitrary backlink-count targets;
- comment-volume targets;
- broad paid media intended to manufacture traction.

---

## 9. Product / Analytics execution backlog

### P0 — Measurement model

At minimum preserve or implement:

- `face_shape_detector_start`
- `face_shape_detector_upload`
- `face_shape_detector_complete`
- `face_shape_detector_cta_click`
- `seo_funnel_click`
- `try_on_start`
- `try_on_complete`
- `frame_compare_start`
- `frame_compare_complete` where available
- `view_pricing`
- `begin_checkout`
- `purchase`

Events should carry where technically appropriate:

- `landing_page`
- `landing_locale`
- `page_path`
- `country`
- `source`
- `medium`
- `growth_source`
- `query_cluster`
- `content_cluster`
- `product_path`
- `value`
- `currency`
- `checkout_session_id` on `begin_checkout`
- `purchase_context` (`pricing` or `face_analysis_report`)
- `face_analysis_task_id` for report-unlock Checkout flows

Privacy requirements remain strict: no user face photos, raw biometric landmarks, or personally identifying facial information may be sent to growth analytics.

`purchase` must be server-verified and deduplicated by transaction identifier.

Stripe Checkout lifecycle is also persisted server-side. A row is created as
`PENDING` before redirect, then signed webhooks move it to `COMPLETED` or
`FAILED` with a reason such as `checkout_session_expired` or
`async_payment_failed`. GA is the behavioral view; Stripe plus the Payment
table is the payment-system source of truth.

The current consumer Checkout baseline and reopening conditions are defined in
`docs/ops/consumer-checkout-observation-2026-08-10.md`. Checkout is in an
observation period: do not change price, Link, payment-method presentation,
report-unlock copy, or Checkout layout until at least 14 days and 30–50 unique
Sessions have accumulated, unless a payment-integrity incident is found.

### P0 — Weekly dashboard

Maintain one weekly view containing at least:

| Dimension | Required view |
| --- | --- |
| Overall | sessions, qualified sessions, paid transactions, revenue |
| Engine | Search / Visual / AI / External |
| Funnel | Detector → continuation → Try-On / Compare → Checkout → Purchase |
| Landing | top landing pages by qualified sessions and revenue |
| Source | source / medium and revenue / 1,000 sessions |
| Geography | country and locale |
| Quality | paid conversion and revenue / 1,000 qualified sessions |

### P1 — Decision analysis

Every week identify:

- top 5 pages / sources to scale;
- top 5 queries with realistic ranking upside;
- largest funnel drop-off;
- weak traffic sources to stop;
- acquisition patterns worth replicating;
- any unexpected payer / repeat-use behavior worth user research.

---

## 10. Cross-functional execution matrix

| Initiative | Engineering | Growth / Marketing | Product / Analytics |
| --- | --- | --- | --- |
| Search→Tool page template | **Owner** | Requirements / content | Measurement / priority |
| 20–30 landing pages | Technical support | **Owner** | Prioritization / review |
| SEO indexation / sitemap / canonical | **Owner** | QA intent / metadata | Monitor indexing |
| Visual asset library | Tooling support | **Owner** | Select high-value topics |
| Google Images / Pinterest distribution | Infra support | **Owner** | Measure quality |
| AI crawler / technical accessibility | **Owner** | Fact consistency / pages | Monitor AI referrals |
| YouTube / Reddit / outreach | — | **Owner** | Measure and stop/scale |
| Detector continuation CTA | **Owner** | Copy / user intent | Funnel diagnosis |
| Try-On / Compare exposure | **Owner** | Messaging | Funnel diagnosis |
| Analytics instrumentation | **Owner** | naming requirements | **Accountable** |
| Weekly GTM dashboard | data support | channel notes | **Owner** |
| Weekly stop / scale decisions | feasibility input | channel input | **Owner / facilitator** |

“Owner” means the team that is responsible for delivery. “Accountable” means the team that defines whether the delivered output is trustworthy enough for decision-making.

---

## 11. First 30-day execution plan

The first 30 days should be run as four weekly sprints rather than as a loose list of GTM activities.

### Week 1 — Measurement + production system

**Engineering**

- audit all funnel events and purchase attribution;
- fix missing / duplicate event issues;
- establish Search→Tool landing template;
- verify canonical / sitemap / hreflang / robots for current growth pages;
- verify mobile Detector → result → next-step flow.

**Growth / Marketing**

- build query opportunity table;
- select first 20–30 target pages, but only queue the first 8–10 for immediate production;
- define visual requirements for those pages;
- audit current first-party product facts for AI consistency;
- inventory reusable backlink / YouTube / Reddit research from historical plans.

**Product / Analytics**

- freeze the funnel definition;
- create the weekly baseline dashboard;
- establish baseline for qualified sessions, Detector continuation, paid conversion, and revenue / 1,000 sessions.

**Week 1 gate:** Do not scale content production until attribution and page template are usable.

### Week 2 — First acquisition batch

**Engineering**

- ship any remaining landing-template blockers;
- implement internal-link modules and image-discovery requirements;
- fix major Detector continuation friction found in Week 1.

**Growth / Marketing**

- publish / optimize the first 8–10 Search→Tool pages;
- produce original visuals for the batch;
- distribute selected visuals to Google Images / Pinterest-ready surfaces;
- run a focused external distribution batch around the exact questions covered by those pages.

**Product / Analytics**

- verify indexing / impressions / landing sessions;
- verify new traffic enters Detector / Try-On / Compare;
- flag any intent mismatch immediately.

### Week 3 — Second acquisition batch + conversion fixes

**Engineering**

- fix the largest measured acquisition-to-product bottleneck;
- implement lightweight messaging / CTA changes needed for testing;
- improve page or upload performance where data shows friction.

**Growth / Marketing**

- produce the second 8–10 page batch using Week 2 evidence;
- scale only the visual formats showing discovery;
- deepen AI-answerable pages around queries already producing traffic;
- continue only external channels producing referral, authority, or strong question insight.

**Product / Analytics**

- compare first-batch pages by impressions, clicks, Detector entry, continuation and purchase behavior;
- recommend winners to scale and losers to modify / stop.

### Week 4 — Consolidate winners

**Engineering**

- remove recurring production bottlenecks;
- address purchase / payment failures if visible;
- complete P1 acquisition infrastructure with proven need.

**Growth / Marketing**

- complete the initial 20–30 page set only where evidence supports it;
- strengthen internal links and external references to the strongest clusters;
- concentrate distribution on the top-performing questions / assets.

**Product / Analytics**

- run 30-day review;
- decide which two or more engines deserve increased resources for Days 31–60;
- recalculate traffic, conversion, payer, and revenue baselines.

**30-day exit target:** monthly run-rate trending toward **3,000–5,000 qualified sessions** with no material collapse in paid-conversion quality.

---

## 12. Days 31–60 and 61–90

### Days 31–60 — Replicate proven patterns

Target: **7,000–10,000 monthly sessions**.

Engineering focuses on:

- removing bottlenecks in winning acquisition flows;
- improving continuation and conversion based on measured drop-off;
- supporting scalable page / visual production without bespoke implementation.

Growth focuses on:

- expanding only winning query families;
- improving CTR and rankings with realistic upside;
- scaling successful visual formats;
- concentrating AI content and external distribution on proven intent clusters.

Product / Analytics focuses on:

- comparing quality by engine, source, page, locale, and country;
- protecting paid conversion and revenue / 1,000 sessions;
- deciding what stops and what doubles down.

### Days 61–90 — Scale winners

Target: **15,000–20,000 monthly sessions**.

Engineering focuses only on scaling constraints and high-volume funnel conversion.

Growth scales proven query clusters, visual templates, locales, and distribution surfaces; low-quality traffic sources are stopped even if they create raw pageviews.

Product / Analytics prepares the commercial review using the larger sample:

- paid conversion by acquisition intent;
- revenue by source / landing page;
- Credits Pack behavior;
- repeat payer patterns;
- whether pricing or packaging should be tested next;
- whether consumer evidence is now strong enough to change Studio / Store / B2B sequencing.

---

## 13. Weekly operating cadence

### Monday — Prioritize

30–45 minutes.

Decide:

- which pages / channels / funnel bottlenecks matter this week;
- exact Engineering tasks;
- exact Growth tasks;
- success / stop criteria.

### During week — Execute independently

Engineering and Growth operate as separate queues. Cross-team dependencies must be explicit, not discovered at the end of the sprint.

### Friday — Review

30–45 minutes.

Answer only:

1. Which engine created incremental qualified sessions?
2. Which pages / sources produced Detector, Try-On, Compare, Checkout or Purchase behavior?
3. What changed in paid conversion and revenue / 1,000 sessions?
4. Which Engineering change removed a meaningful funnel constraint?
5. Which Growth activity deserves more volume?
6. What stops next week?

No experiment survives repeated weak reviews because effort has already been invested in it.

---

## 14. Decision rules

| Observation | Decision |
| --- | --- |
| Sessions rise and product continuation stays healthy | Scale source / template |
| Search impressions rise but CTR is weak | Improve title, snippet, intent match, visual presentation |
| Landing traffic rises but product entry is weak | Fix intent-to-product connection |
| Detector completion rises but continuation does not | Fix result-page CTA / recommendation path |
| Checkout rises but purchase does not | Inspect price, trust, payment, technical failure |
| AI referrals rise but product behavior is weak | Reassess answer / landing intent match |
| Visual discovery rises but engagement is weak | Change asset intent or destination |
| External distribution creates no referral, authority, or question insight | Stop / reduce |
| Page family remains unindexed or demandless after a reasonable window | Fix, merge, rewrite, or stop |
| Revenue / 1,000 sessions falls materially as traffic scales | Treat growth as low quality and reallocate effort |

---

## 15. Explicit non-priorities

During the current 60–90-day phase, do not create independent initiatives for:

- another GTM master plan;
- a separate SEO master plan;
- a separate GEO / AI-search master plan;
- a backlink KPI program;
- a YouTube-comment KPI program;
- a Pinterest KPI program;
- page-count targets detached from demand;
- 1,000+ page programmatic SEO;
- large paid-acquisition campaigns intended to manufacture traction;
- large consumer features unrelated to the funnel;
- large B2B implementation before merchant validation.

---

## 16. Document governance

### Level 1 — Commercial strategy

`docs/strategy/commercial-strategy.md`

Answers: What business should VisuTry become, and what roles do Consumer, Studio, Store, SDK, and B2B play?

### Level 2 — Current GTM execution source of truth

`docs/strategy/analytics/gtm.md`

Answers: What must Engineering, Growth, Product, and Analytics do now to scale qualified consumer traffic and create a larger commercial sample?

This document is the **only active GTM execution source of truth**.

### Level 3 — Evidence / references / archive

SEO/GEO architecture, keyword research, backlink ledgers, YouTube/Reddit history, competitor research, old growth sprints, programmatic SEO plans, and channel packets remain evidence and reusable tactics only.

If another document conflicts with this document on current GTM priority, this document wins unless explicitly replaced by a later source-of-truth version.

---

## 17. One-line decision standard

> **If a task cannot plausibly increase qualified traffic, improve the Detector → Advisor → Try-On → Compare → Purchase path, or improve our ability to measure those outcomes, it is not a current GTM priority.**

And every weekly review ends with:

> **Which engine is moving VisuTry from ~1.8K monthly sessions toward 15K–20K, what must Engineering remove to let it scale, and what should Growth stop doing next week?**

---

## 18. Change log

| Version | Date | Change |
| --- | --- | --- |
| 3.2 | 2026-08-10 | Froze the consumer and merchant AI-facing message contract; added the AI traffic-quality baseline and claim boundaries; closed the current Checkout optimization round with a server-side lifecycle observation protocol and evidence-based reopening conditions. |
| 3.1 | 2026-08-03 | Split the 10× qualified-traffic plan into Engineering, Growth, and Product / Analytics execution backlogs. |
