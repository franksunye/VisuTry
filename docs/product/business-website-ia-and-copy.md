# VisuTry Business Website — IA & Public Content Contract

**Status:** Current canonical Business website content contract  
**Owner:** Product / Growth / Sales  
**Last reconciled:** 2026-09-28

## 1. Purpose

The Business website explains VisuTry to eyewear brands, retailers, commerce teams, and agency partners without weakening the independent Consumer product.

The Business site is not a separate brand. It is the merchant-facing product and commercial area under VisuTry.

Primary root:

```text
/{locale}/business
```

## 2. Canonical Merchant Narrative

All core Business pages share one journey:

> **Discovery → Decision → Merchant Action**

Commerce Intelligence is the evidence layer around that journey.

The public site should make this progression clear without forcing every page to repeat the complete feature list.

Canonical market-facing terms:

- Recommendation
- Virtual Try-On
- Frame Compare
- Decision Result
- Merchant Actions
- Store
- Campaigns
- Commerce Intelligence
- Merchant Workspace
- AI Commerce Session

Avoid exposing internal domain terminology such as `Handoff` when a clearer merchant-facing term exists.

## 3. Page Ownership

Each page has one primary information job.

| Page | Owns | Must not become |
| --- | --- | --- |
| Business Home | Why VisuTry exists; the overall merchant value proposition; routes to product surfaces | A second Platform, Pricing, or Integrations page |
| Platform | System model: catalog foundation, shared decision runtime, sibling Experiences, Merchant Workspace | A traffic-channel or campaign-use-case page |
| Store | Always-on, open-ended merchant discovery experience | A generic list of every platform capability |
| Campaigns | Focused experiences shaped by arrival context, source, collection, or brief | A second Store page or generic feature overview |
| Commerce Intelligence | Merchant operating questions, analysis context, observable intent, evidence boundary | A BI suite or revenue-attribution promise |
| Pricing | Commercial packaging, plan capacity, AI Commerce Session semantics, Pilot and Enterprise paths | A general product overview |
| Examples | Product proof and clearly labeled Reference Experiences | Customer proof unless the relationship is real and approved |
| Integrations | Hosted-first deployment, current operating boundary, deeper-integration direction | A promise of unshipped integrations |
| Pilot | Request, scope, operating process, included Pilot experience, and review cycle | A second recurring Pricing page |

## 4. Core Page Contracts

### Business Home

**Role:** category/value story.

Hero:

> **Be discovered. Help shoppers decide. Turn intent into action.**

The page should answer:

1. Why eyewear merchants need a decision layer.
2. What Store and Campaigns are.
3. How Merchant Workspace supports operation.
4. How Commerce Intelligence provides evidence.
5. How to start a 30-day Pilot.

Do not duplicate detailed recurring plan capacity or integration detail here.

### Platform

**Role:** explain the system behind the Experiences.

The page owns:

- merchant-scoped catalog foundation;
- Experience configuration;
- shared decision runtime;
- Decision Result + Merchant Actions;
- Store and Campaigns as sibling Experiences;
- Merchant Workspace;
- Commerce Intelligence as the evidence layer.

Do not turn Platform into a list of paid/social/email/QR use cases. Those belong primarily to Campaigns.

### Store

**Role:** explain the always-on Store use case.

The page owns:

- persistent merchant-branded discovery;
- broader assortment exploration;
- shopper journey through narrowing, evaluation, Decision Result, and Merchant Actions;
- web delivery;
- Kiosk-ready delivery where commercially entitled and configured.

Store is the strongest product-truth page for the persistent shopping experience.

### Campaigns

**Role:** explain why arrival context should change the experience.

The page owns:

- collection and launch traffic;
- paid and social traffic;
- creator/editorial traffic;
- QR/event traffic;
- focused catalog subsets;
- brand/agency workflow;
- source / Experience context;
- Reference Campaign proof.

Campaigns reuse the shared decision runtime. Their differentiator is context, not a separate feature stack.

### Commerce Intelligence

**Role:** answer merchant operating questions with observable evidence.

The page should help a merchant ask:

- Are shoppers reaching a shortlist?
- Which frames reach deeper evaluation?
- Which Experiences create stronger observable intent?
- Where do shoppers continue through Merchant Actions?

Evidence boundary:

> Intent is useful evidence. It is not a revenue guarantee.

Revenue attribution requires commerce/order data. Incremental revenue claims require credible experiment design.

## 5. Commercial Truth

The canonical commercial contract is implemented in the Merchant commercial plan domain and rendered on the Pricing page.

Do not duplicate recurring plan numbers across general Business pages unless the copy is deliberately sourced from the canonical contract.

The Pricing page owns:

- Free / Launch / Growth / Scale / Enterprise packaging;
- Founding Merchant Pilot;
- AI Commerce Session semantics;
- plan capacity;
- plan capability comparison;
- Kiosk packaging;
- support / integration scope.

The public Founding Pilot pricing policy is:

- one **Founding Pilot** offer, not separate hosted / Campaign / in-store Pilot SKUs;
- public entry price: **From $149 / 30 days**;
- final scope and Pilot fee are confirmed based on deployment configuration before billing;
- hosted, Campaign, in-store, and other deployment configurations may vary in scope and pricing;
- merchant-specific proposals and quotations may use the confirmed configuration-specific fee directly.

The public CTA convention is:

- **Start 30-Day Pilot** on Business marketing pages;
- **Request Pilot Review** on the Pilot page itself and in the Pricing-page Pilot block;
- **Start Free** where the Free commercial path is relevant.

## 6. Claims Boundary

Allowed when supported by the shipped product:

- merchant-scoped catalog;
- hosted Store and Campaign Experiences;
- Recommendation;
- Virtual Try-On;
- Frame Compare;
- Decision Result / supported continuation;
- configured Merchant Actions;
- observable product-interest and action signals;
- Experience and available source context;
- Merchant Workspace;
- hosted-first deployment;
- Kiosk-ready delivery when plan entitlement and configuration allow it.

Use careful wording for:

- attribution;
- deeper commerce integrations;
- AI-assistant / agent distribution;
- any feature that depends on merchant-specific configuration.

Do not claim:

- guaranteed physical fit or medical accuracy;
- guaranteed conversion or revenue uplift;
- incremental GMV without credible experimental evidence;
- full revenue attribution without order/commerce integration;
- customer or partner relationships for Reference Experiences;
- integrations, APIs, sync, autonomous checkout, or channels that are not shipped and approved for public marketing.

## 7. Product Proof Rules

Product proof must be truthful and traceable to current product surfaces.

Reference Experiences must be labeled as reference / simulation and must not imply a customer, client, or partner relationship.

The site may use:

- current Store UI;
- current Campaign UI;
- current Merchant Workspace UI;
- current approved Commerce Intelligence UI;
- approved Reference Experience routes.

Do not invent metrics, controls, integrations, or merchant relationships for marketing visuals.

## 8. Navigation

Desktop primary navigation:

```text
Platform | Store | Campaigns | Commerce Intelligence | Pricing | Examples
Merchant Sign In | Start 30-Day Pilot
```

Mobile uses the same primary information architecture.

Do not add large solution / industry / resource mega-menus at the current product stage.

## 9. Content Governance

Public Business copy has one source of truth:

```text
src/config/business-site.ts
```

`BusinessMarketingPage` renders that contract and should not maintain a second runtime copy layer.

Automated tests protect:

- canonical terminology;
- CTA consistency;
- distinct page roles;
- non-duplicated core section headlines;
- Commerce Intelligence evidence boundaries;
- critical browser routes and page responsibilities.

When product or commercial reality changes, update the canonical product/commercial contract first, then reconcile this public content contract and its tests.
