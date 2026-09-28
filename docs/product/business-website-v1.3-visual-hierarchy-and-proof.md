# VisuTry Business Website v1.3 — Visual Hierarchy & Product Proof

**Status:** Current implementation contract  
**Last reconciled:** 2026-09-28

## 1. Objective

The Business site should feel like one coherent product family without making every page look or read the same.

Visual hierarchy follows page responsibility:

- Home = category story;
- Platform = system architecture;
- Store = persistent product experience;
- Campaigns = focused campaign experience;
- Commerce Intelligence = evidence and analysis.

Use product proof to support the page's job, not as decoration.

## 2. Global Composition Rules

- Keep the current white / cool-neutral foundation and restrained sapphire accent.
- Use one dominant visual focal point per viewport.
- Prefer editorial split layouts and meaningful negative space over dense SaaS card walls.
- Text-only supporting sections should be shorter than proof-heavy sections.
- Four-card groups may use four balanced columns on large screens and two columns on medium screens.
- Do not repeat the same large product visual twice on one page unless the second crop proves a different part of the experience.
- Alternate supporting visual position only when it improves reading rhythm; do not alternate mechanically.

## 3. Hero Roles

| Page | Hero role | Visual |
| --- | --- | --- |
| Business Home | Category / proposition | `B2B-VIS-01` |
| Platform | System model | `B2B-VIS-02` |
| Store | Dominant product truth | `B2B-VIS-03` |
| Campaigns | Campaign product truth | `B2B-VIS-04` |
| Commerce Intelligence | Evidence layer | `B2B-VIS-06` |
| Pricing | Commercial clarity | Text / pricing composition |
| Examples | Product proof index | Text + `B2B-VIS-07` below hero |
| Integrations | Deployment explanation | Text-led |
| Pilot | Low-risk engagement | Text-led |

Store intentionally gives more space to the product visual than to the hero copy.

Commerce Intelligence intentionally uses the strongest dark hero treatment.

## 4. Supporting Proof Placement

### Business Home

Use supporting proof for three different responsibilities:

1. Product surfaces → Store proof (`B2B-VIS-03`)
2. Merchant operating model → Merchant Workspace (`B2B-VIS-05`)
3. Commerce Intelligence → Intelligence proof (`B2B-VIS-06`)

Do not add a second embedded Pilot block before the shared closing Pilot CTA.

### Platform

Use `B2B-VIS-02` for the system model and `B2B-VIS-05` for Merchant Workspace.

Do not reuse Store product proof inside the shared-runtime section. Platform explains the system; Store proves the Store.

### Store

Use `B2B-VIS-03` as the dominant hero proof.

A supporting 4:3 Store crop may appear beside the shopper-experience section to show journey detail.

### Campaigns

Use `B2B-VIS-04` as the dominant hero proof.

Do not repeat the identical Campaign visual again in the body. Reference Campaign proof is provided through the approved reference route.

### Commerce Intelligence

Use `B2B-VIS-06` in the hero.

The body should move back into light analysis sections. Reserve a dark/high-contrast body section for the Evidence Boundary so the page does not become one continuous dark dashboard treatment.

### Examples

Use `B2B-VIS-07` as the reference portfolio visual and `B2B-VIS-03` only where Store proof adds a different product perspective.

### Integrations / Pilot

Use `B2B-VIS-05` only where Merchant Workspace proves the operating model.

## 5. Visual Asset Truth Rules

Any visual that looks like product UI must be traceable to current product UI.

Allowed:

- crop and reframing;
- selective zoom;
- background cleanup;
- combining a small number of true UI crops;
- restrained labels.

Forbidden:

- fake metrics;
- invented controls;
- fake merchant relationships;
- fake integrations;
- fake revenue attribution;
- UI that implies unshipped product behavior.

## 6. Loading / Performance

Only above-the-fold hero visuals receive:

- `loading="eager"`;
- high fetch priority.

Supporting proof is lazy-loaded.

A repeated asset ID does not automatically make every occurrence high priority.

## 7. Section Rhythm

Use full spacing for:

- hero-adjacent product proof;
- card groups;
- step/process bands;
- split sections with visuals;
- deliberate high-contrast sections.

Use tighter spacing for concise text-only supporting sections.

Avoid consecutive large sections that repeat the same capability story.

## 8. Responsive Rules

### Desktop

- Keep maximum content width around the existing 1200–1280px system.
- One dominant visual per viewport.
- Preserve asymmetric Store hero treatment.
- Four-card groups may render in four columns when legible.

### Tablet

- Collapse split proof below or above copy before horizontal compression.
- Keep the navigation collapsed before long labels crowd the header.

### Mobile

- Keep the primary CTA visible early.
- Stack proof cleanly without horizontal page overflow.
- Do not shrink dense UI into unreadable thumbnails.
- Comparison tables may scroll within their own container rather than widening the document.

## 9. Navigation / Footer

Header CTA:

> **Start 30-Day Pilot**

Footer positioning should reinforce the same Merchant narrative rather than revert to a VTO-only feature list.

## 10. Definition of Done

The Business visual system is aligned when:

- every core page has a distinct visual role;
- proof is attached to the section it actually supports;
- Platform does not borrow Store proof unnecessarily;
- Campaigns does not repeat identical Campaign proof;
- Commerce Intelligence has readable light/dark rhythm;
- Home does not duplicate the closing Pilot offer;
- only hero visuals are high-priority loaded;
- 4-card groups are balanced on large screens;
- product-looking visuals remain traceable to real current UI;
- desktop, tablet, and mobile critical browser coverage remains green.
