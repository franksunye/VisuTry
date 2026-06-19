# VisuTry Directory Submission Packet

Date: 2026-06-19
Status: Ready for assisted submissions
Owner: Frank + Codex

## Purpose

This is the reusable source for Product Hunt preparation, SaaS directories, AI tool catalogs, software-alternative sites, and maker communities. It follows the ZISO pattern: one canonical fact packet, per-site field adaptation, and a durable submission log.

Product Hunt is a launch surface, not an evergreen directory. Reddit and X are distribution channels, not listing sites.

## Canonical Product Fields

| Field | Value |
| --- | --- |
| Product name | VisuTry |
| Website | `https://www.visutry.com` |
| Primary campaign URL | `https://www.visutry.com/en/face-analysis` |
| Category | Virtual Try-On, Eyewear, Artificial Intelligence, Shopping Assistant |
| Pricing | Free trial; credit pack from $2.99; subscription options available |
| Founder / maker | Frank / Ye Sun |
| Support | `support@visutry.com` |
| Source | `https://github.com/franksunye/VisuTry` |
| X | `https://x.com/franksunye` |
| Product boundary | Visual shopping and style guidance only; not prescription, medical, or physical-fit advice |

## Copy Variants

### Taglines

Primary:

```text
AI face analysis and virtual glasses try-on from a photo
```

Launch-oriented:

```text
Find glasses for your face, then try them on from a photo
```

Catalog-oriented:

```text
Photo-based virtual try-on for glasses, outfits, shoes, and accessories
```

### Short Description

```text
VisuTry helps online eyewear shoppers estimate their face shape, shortlist frame styles, and visualize glasses using a portrait plus a frame image or screenshot.
```

### Medium Description

```text
VisuTry is an AI-assisted visual shopping tool for people choosing glasses online. Upload a clear portrait to estimate your face shape and shortlist frame directions, then try a product image or screenshot on the same photo. The result supports visual comparison and style decisions; it does not verify prescription accuracy, measurements, comfort, or physical fit.
```

### Long Description

```text
VisuTry connects two steps that are usually separated when shopping for glasses online: deciding which frame direction may suit your face and checking that direction on your own photo.

Users can upload a portrait for AI-assisted face-shape and frame-style guidance, then use virtual try-on with a glasses product image or screenshot. VisuTry also supports photo-based try-on for outfits, shoes, and accessories, plus comparison workflows for reviewing several generated looks.

VisuTry is a visual shopping aid. It does not provide medical or prescription advice and cannot confirm measurements, comfort, lens accuracy, or physical fit.
```

### Founder Note

```text
Hi, I am Frank, the maker of VisuTry. I built it because face-shape guides often stop at generic rules, while many store try-on tools work only with a limited catalog. VisuTry connects the two: use face analysis as a shortlist, then test a frame image or screenshot on the same portrait. I am especially interested in feedback on recommendation quality, comparison clarity, and where the flow adds friction.
```

## Field Map

| Common field | Recommended value |
| --- | --- |
| URL for evergreen directories | `https://www.visutry.com` |
| URL for face-analysis campaign | `https://www.visutry.com/en/face-analysis?utm_source={directory}&utm_medium=directory&utm_campaign=june_face_shape` |
| URL for Product Hunt | `https://www.visutry.com/en/face-analysis?utm_source=producthunt&utm_medium=launch&utm_campaign=june_face_shape` |
| Primary category | Virtual Try-On |
| Secondary categories | Artificial Intelligence, Eyewear, Shopping Assistant |
| Pricing model | Freemium |
| Target users | Online eyewear shoppers, style-conscious consumers, virtual try-on users |
| Differentiator | Face-shape shortlist connected directly to photo-based glasses try-on |
| Safe claim | Visualize and compare style directions before buying |
| Boundary | No prescription, medical, measurement, comfort, or physical-fit claim |

## Asset Checklist

Available:

- Face-analysis report: `public/assets/marketing/face-analysis-landing-art.jpg`
- Face-analysis alternative: `public/assets/marketing/face-analysis-slide-report.png`
- Photo try-on: `public/assets/marketing/compare-slide-woman.png`
- Photo try-on alternative: `public/assets/marketing/compare-slide-man.png`
- Vector mark: `public/favicon.svg`
- Square PNG logo: `public/assets/marketing/visutry-logo-1024.png`

Still required before Product Hunt launch:

- Product Hunt gallery ordered as problem, face-analysis flow, photo try-on, comparison, limitation/trust.
- Optional 30-45 second product walkthrough.
- Final maker profile and launch-day response availability.

## Current Target Queue

| Priority | Site | Type | Route | Cost status | Current status | Next action |
| ---: | --- | --- | --- | --- | --- | --- |
| 1 | Product Hunt | Coordinated launch | `https://www.producthunt.com/launch` | Free launch route expected; live page blocked automated verification | Not found in indexed duplicate check | Prepare assets and confirm maker account |
| 2 | SaaSHub | Software directory | Existing VisuTry pages are indexed | Free product submission/management route advertised | Existing, outdated | Claim and refresh copy, categories, pricing, and screenshots |
| 3 | SaaSCity | SaaS directory | `https://saascity.io/submit` | Free indexed listing verified | Not found in duplicate check | Sign in or create account, then submit |
| 4 | AlternativeTo | Alternatives directory | `https://alternativeto.net/software/add/` | Account required; cost not verified | Not found in indexed duplicate check | Check account and submit only through the official form |
| 5 | Indie Hackers | Maker/product community | Products database | Account required | Duplicate check pending | Create or refresh product page with founder note |
| 6 | Futurepedia | AI directory | `https://www.futurepedia.io/submit-tool` | $247 basic sold out; $497 verified | Skipped | Reconsider only after proven directory ROI |

## Submission Procedure

1. Check whether VisuTry already exists on the site.
2. Use `refresh_existing` when an indexed listing exists; never create a duplicate to bypass ownership work.
3. Inspect the live fields, moderation rules, cost, and link policy.
4. Skip paid routes until a free directory produces qualified sessions or a paid placement has credible traffic evidence.
5. Select the shortest copy variant that fits without removing the product boundary.
6. Use a source-specific UTM URL when the field accepts campaign parameters; otherwise use the canonical homepage.
7. Save the submitted or pending state and record the follow-up date.
8. Review pending submissions after 7 days and approved listings once per quarter.

## Tracking Log

| Date | Site | Account | Submitted URL | Status | Cost | Notes | Follow-up |
| --- | --- | --- | --- | --- | ---: | --- | --- |
| 2026-06-19 | SaaSHub | Unknown | Existing indexed listing | Needs update | $0 expected | Old positioning and pricing appear in search results | Claim/account check |
| 2026-06-19 | SaaSCity | Not checked | Not submitted | Ready | $0 | Free indexed listing and 24-hour review advertised | Account check |
| 2026-06-19 | Futurepedia | Not needed | Not submitted | Skipped | $247+ | Does not meet sprint rule for paid directories | Revisit after ROI proof |

Status values: `Not started`, `Ready`, `Drafted`, `Submitted`, `Approved`, `Rejected`, `Needs update`, `Skipped`, `Duplicate`.

## Maintenance Rhythm

- Daily during the current sprint: submit or refresh one qualified free listing.
- Weekly: check pending approvals, referral sessions, and high-value actions.
- Monthly: add up to five newly verified directories; do not import bulk lists without checking live forms.
- Quarterly: refresh approved listings when positioning, pricing, screenshots, or product capabilities change.
