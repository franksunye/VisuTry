# VisuTry External Distribution Kit

Date: 2026-06-18
Revised: 2026-06-30 for the four-product GTM path
Status: Active for X, Reddit, Product Hunt, and evergreen directories

## Campaign Links

Replace `{source}` with the actual channel or partner name.

Free face-shape discovery:

```text
https://www.visutry.com/en/face-shape-detector?utm_source={source}&utm_medium=external&utm_campaign=free_face_shape_detector
```

Personalized Glasses Advisor:

```text
https://www.visutry.com/en/face-analysis?utm_source={source}&utm_medium=external&utm_campaign=glasses_advisor
```

Glasses try-on:

```text
https://www.visutry.com/en/try-on/glasses?utm_source={source}&utm_medium=external&utm_campaign=virtual_glasses_tryon
```

Frame comparison:

```text
https://www.visutry.com/en/try-on/glasses/compare?utm_source={source}&utm_medium=external&utm_campaign=frame_compare
```

Use `community`, `social`, `directory`, `partner`, or `outreach` as `utm_medium` when the channel supports a more precise value.

Product Hunt launch traffic should use:

```text
https://www.visutry.com/en/face-shape-detector?utm_source=producthunt&utm_medium=launch&utm_campaign=free_face_shape_detector
```

## Public Assets

| Angle | Asset | Safe claim |
| --- | --- | --- |
| Glasses Advisor | `public/assets/marketing/face-analysis-slide-report.png` | Personalized frame-style guidance with reasons |
| Photo try-on | `public/assets/marketing/compare-slide-woman.png` | Visualize glasses from a photo or product image |
| Photo try-on | `public/assets/marketing/compare-slide-man.png` | Compare how a frame direction looks on a portrait |
| Glasses Advisor introduction | `public/assets/marketing/face-analysis-landing-art.jpg` | Guided path from personalized advice to frame selection |

Do not use private dashboard results for distribution without explicit consent.

## Ready Copy

### Community Post: Face Shape to Try-On

Title:

```text
I built a small test for the question "which glasses suit my face?"
```

Body:

```text
Most face-shape guides stop at "round faces should try angular frames" or similar rules. The difficult part is applying that advice to an actual pair of glasses.

I built VisuTry to test a more practical flow:

1. Use the free on-device detector for a likely face shape.
2. Get a deeper personalized shortlist only if you need it.
3. Use virtual try-on as the visual check instead of treating the face-shape rule as the answer.

The result is style guidance, not a prescription or a claim about physical fit. I am the builder, and I would especially value feedback on whether the recommendation-to-try-on flow is useful or just adds an extra step.

Demo: {campaign_link}
```

### Question-and-Answer Post

Question intent:

```text
Which glasses suit my face?
```

Answer:

```text
Start with face shape only as a shortlist, not a final rule. Angular frames often add definition to a round face, while rounder or oval frames can soften a square jaw, but frame width, bridge position, color, and personal style can change the result.

A practical process is:

1. Estimate your face shape from a front-facing photo.
2. Pick two or three contrasting frame directions.
3. Try those directions on the same photo.
4. Use real measurements and comfort checks before buying.

I work on VisuTry, which combines the first three steps. The important limitation is that a visual AI result cannot confirm prescription accuracy or physical comfort.

Tool: {campaign_link}
```

### Short Social Post

```text
Face-shape advice is only a shortlist. The useful question is whether the recommended frame still looks right on your own photo.

VisuTry now connects a free private Face Shape Detector to personalized glasses advice, Virtual Try-On, and Frame Compare.

{campaign_link}
```

### Directory Listing

Name:

```text
VisuTry
```

Tagline:

```text
Free face shape detector, glasses advice, and virtual try-on
```

Short description:

```text
VisuTry helps online eyewear shoppers find their likely face shape for free, get a personalized frame shortlist, and visualize glasses using a portrait plus a product image or screenshot. The free detector runs on-device. VisuTry is a visual shopping aid, not a medical, prescription, or physical-fit tool.
```

Full reusable fields, asset requirements, and submission tracking live in [Directory Submission Packet](./2026-06-19-directory-submission-packet.md).

### Product Hunt Draft

Tagline:

```text
Find your face shape free, then try and compare glasses
```

Short description:

```text
VisuTry connects a free on-device Face Shape Detector, an AI Glasses Advisor, Virtual Try-On from product images or screenshots, and side-by-side Frame Compare. It supports visual shopping decisions, not prescription or physical-fit checks.
```

Maker comment angle:

```text
I built VisuTry because face-shape tools usually stop at a label, while store try-on tools often work only for a limited catalog. VisuTry connects the steps: find your likely shape free and privately, get deeper advice if useful, then validate a product image or compare frames on the same portrait. I would especially value feedback on where this flow helps and where it adds friction.
```

### Reddit Operating Rule

- Answer an existing question completely before mentioning VisuTry.
- Disclose `I work on VisuTry` or `I built VisuTry` whenever the product is mentioned.
- Do not reuse the same promotional body across subreddits.
- Add a link only when the community rules allow self-promotion and the link materially helps the answer.
- Prefer high-intent eyewear questions over generic startup promotion threads.

### Publisher or Creator Outreach

Subject:

```text
Possible visual demo for your glasses-selection content
```

Body:

```text
Hi {first_name},

I noticed your work on {specific_article_or_topic}. I am building VisuTry, a photo-based glasses try-on and face-shape guidance tool.

Your point about {specific_observation} could be demonstrated visually: start with a face-shape shortlist, then compare the recommended frame direction on the same portrait. I can prepare a concise, non-exclusive demo for {publication_or_audience} using public or approved imagery.

There is no need to describe it as a fit or prescription tool. The useful claim is narrower: it helps readers turn frame advice into a visual comparison.

Would a short demo, screenshot set, or tool reference be useful for your audience?

Best,
Sun
VisuTry
https://www.visutry.com
```

## First Execution Queue

| Priority | Channel or segment | Action | Angle | Status |
| ---: | --- | --- | --- | --- |
| 1 | Existing X account | Publish short product demonstration | Face shape to try-on | [Live](https://x.com/franksunye/status/2067479409209344093) |
| 2 | Product Hunt | Prepare launch page, gallery, maker comment, and launch-day response block | Face shape to try-on | Preparation required |
| 3 | Reddit eyewear communities | Answer an existing selection question with builder disclosure | Which glasses suit my face | Rule and thread research required |
| 4 | Existing X account | Publish a second demonstration with a different asset and campaign | Photo try-on | Ready after first-post measurement |
| 5 | SaaSHub | Claim or update the existing outdated VisuTry listing | General product | Existing listing found; refresh required |
| 6 | SaaSCity | Submit the free indexed listing | General product | Free route verified; account required |
| 7 | AlternativeTo | Check for an existing item, then add or update VisuTry | Photo try-on | Account and duplicate check required |
| 8 | Indie Hackers | Create or refresh the product page and founder note | Builder story | Account check required |
| 9 | Futurepedia | Do not submit during this sprint | General product | Skipped: paid listing starts at $247; verified listing is $497 |
| 10 | Additional SaaS/AI directories | Verify the live free route before each submission | General product | Continuous queue |
| 11 | Eyewear review publishers | Research and contact 10 writers | Face shape to try-on | [First batch researched](./2026-06-18-outreach-targets-batch-1.md) |
| 12 | Independent eyewear creators | Research and contact 10 creators | Photo try-on | Research required |
| 13 | Shopify eyewear brands | Contact 5 brands with a specific SKU observation | Frame comparison | Research required |
| 14 | Boutique commerce agencies | Contact 5 agencies serving fashion/accessories | Merchant demo | Research required |

## Reporting Template

| Date | Channel | Live URL | Campaign | Sessions | Product actions | Reply/link | Next action |
| --- | --- | --- | --- | ---: | ---: | --- | --- |
| 2026-06-18 | X | [Post](https://x.com/franksunye/status/2067479409209344093) | `june_face_shape` | Pending | Pending | Pending | Check attributed traffic and actions after 24 hours |
