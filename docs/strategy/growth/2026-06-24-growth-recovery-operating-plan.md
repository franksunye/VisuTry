# VisuTry Growth Recovery Operating Plan

Date: 2026-06-24
Window: 2026-06-24 to 2026-06-30
Owner: Frank + Codex
Status: Active

Related execution docs:

- [Reddit warmup and outreach execution](./2026-06-24-reddit-warmup-and-outreach-execution.md)
- [Growth volume catch-up](./2026-06-24-growth-volume-catchup.md)

## Situation

Recent traffic and registration volume are too thin to support product decisions. Some days produce no new registered users. At the same time, a new paid user on 2026-06-23 is a useful signal: even with weak top-of-funnel volume, the product can still convert a high-intent visitor.

The immediate job is not to broaden the product story. The immediate job is to send more qualified eyewear shoppers into the already validated path:

> upload a portrait, try or compare glasses from a product image or screenshot, then continue with a low-friction credit pack when the result is useful.

## This Week's Objective

Create enough qualified visits to learn where the next paid users can come from.

Targets for 2026-06-24 to 2026-06-30:

| KPI | Weekly target | Notes |
| --- | ---: | --- |
| Qualified external sessions | 50 | Exclude owner tests and unattributed direct traffic. |
| High-value product actions | 5 | Try-on start, face-analysis upload, pricing view, checkout start, or unlock. |
| Published placements | 5 | X, Reddit answers, directories, founder communities, or accepted partner mentions. |
| Personalized outreach messages | 10 | Eyewear publishers, opticians, creators, or ecommerce operators. |
| Serious replies | 1 | A reply that asks a real question, considers a demo, or discusses inclusion. |
| Paid-user evidence review | 1 | Review the 2026-06-23 paid user's entry path and first actions if data access allows. |

## Operating Diagnosis

Current working assumptions:

1. SEO is beginning to produce relevant impressions, but it is not yet enough to solve the daily traffic gap.
2. Broad email did not create a meaningful product-action lift, so another generic batch is not the next best move.
3. X showcase replies alone are likely too weak unless paired with a strong image, a specific founder prompt, or a visible audience.
4. The clearest paid-user pattern remains glasses try-on and the USD 2.99 credit-pack path.
5. The highest-leverage traffic is not generic AI-tool traffic; it is people actively choosing glasses, comparing frames, or writing about eyewear selection.

## 2026-06-23 Paid User Signal

Read-only production payment/task review on 2026-06-24 found:

- The newest paid user registered on 2026-06-23 and purchased within roughly 2 minutes.
- Product purchased: `CREDITS_PACK`, USD 2.99.
- Before payment: 1 completed face-analysis task, with the report unlocked.
- After payment: 4 completed glasses try-on tasks.
- Recent failed try-on tasks for this user: 0.
- Remaining usage after purchase suggests the user is actively evaluating multiple outputs, not only buying speculatively.

Interpretation:

1. Face analysis can act as a paid-intent bridge when it reaches an unlocked report.
2. The immediate monetization path is still the low-cost credits pack.
3. The product story should connect face analysis to repeated glasses try-on, not treat them as separate features.
4. For this cohort, speed matters: the user converted in the same session, so first-session clarity is more important than long nurture.

Growth implication for this week:

- Prioritize traffic sources where the user's question is already "which glasses suit me?" or "can I try these frames before buying?"
- Send visitors to `/en/face-analysis` when the entry question is face-shape advice.
- Send visitors to `/en/try-on/glasses` or `/en/try-on/glasses/compare` when the entry question is frame comparison or product screenshots.
- Keep the credit-pack CTA visible after successful free experiences.

## Channel Priorities

### P0: High-Intent Eyewear Distribution

Use when the thread or page already has the user's problem:

- which glasses suit my face
- choosing glasses online
- virtual glasses try-on
- compare frames
- try glasses from a screenshot
- designer glasses before buying

Allowed placements:

- helpful Reddit answers where self-disclosure and links are allowed
- X replies to high-intent founder or product showcase prompts
- Quora-style answers only if the answer can stand without the link
- comments or replies on eyewear selection posts where the product materially helps

Do not mass-post. One strong useful answer is better than five weak promotional drops.

Reddit warmup constraint:

- While the account is still warming up, cap Reddit at 1 successful helpful comment per day.
- If Reddit imposes a time gate or a comment does not clearly publish, stop for that day.
- Do not compensate by posting extra comments later the same day.
- Keep all warmup comments link-free, product-free, and AI-free until the account has several normal contributions.

### P0: Partner and Publisher Outreach

Use the existing 2026-06-18 outreach target list, but send only messages that reference a specific article or video.

This week, prioritize:

1. Dominic Tunnell Opticians
2. View Eyewear
3. ManlyKicks
4. Cindy Hattersley Design
5. Dolabany Eyewear
6. Midtown Vision

Goal: feedback, a resource mention, or permission to create a visual companion. Do not ask for all three at once.

### P1: Directory Hygiene

Continue only free or already-indexed routes:

- SaaSHub: claim or refresh existing listing
- SaaSCity: verify existing submission/listing before any duplicate submission
- AlternativeTo: submit only if the official route is free enough to test
- Indie Hackers: create or refresh a product page if the founder account is ready

Skip paid directories until a free directory produces qualified sessions or there is credible traffic evidence.

### P1: SEO Maintenance

Do not spend the week writing broad new articles. SEO work should be limited to:

- rechecking priority URL indexing
- improving titles/meta only where GSC shows impressions and low CTR
- adding internal links from pages that already receive impressions
- ensuring `/en/try-on/glasses` and `/en/face-analysis` remain the primary commercial destinations

## Daily Block

Run this once per day:

| Time | Action | Output |
| ---: | --- | --- |
| 15 min | Check registrations, payments, GA source/action data, and replies | one-line status |
| 25 min | Publish or prepare one high-intent placement | live URL or ready draft |
| 25 min | Send two personalized outreach messages | sent log and follow-up date |
| 20 min | Submit or refresh one free directory/community listing | submitted or blocked reason |
| 15 min | Update tracking table and decide tomorrow's first action | next action |

If only one thing can be done on a given day, choose the high-intent placement.

For Reddit, "one high-intent placement" currently means one successful no-link warmup comment, not a promotional answer.

## Minimum Daily Growth Floor

The first execution pass showed that Reddit warmup plus three emails is too light for the weekly target. Keep Reddit slow, but increase the rest of the system:

| Channel | Daily floor | Why |
| --- | ---: | --- |
| Reddit warmup | 1 successful no-link comment | Protect account health. |
| Personalized outreach | 5 prepared, 2-4 sent after approval | Build enough reply surface area. |
| Directory/community listing | 1 submitted or logged as blocked | Creates durable indexed surfaces. |
| Owned/social placement | 1 short post or reply | Keeps public proof of motion. |
| Tracking | 1 update | Prevents blind activity. |

Do not make up Reddit volume by overposting. Make up the volume through outreach, directories, and owned/community surfaces.

## Message Angles

### Angle A: Paid Path Evidence, Without Exposing User Data

Use internally and in founder communities:

```text
Small but useful signal for VisuTry: even during a weak traffic week, a visitor still converted to the low-cost credits pack.

The lesson is to stay narrow: glasses try-on from a product image or screenshot, not a broad AI fashion story.
```

Do not publish private customer details, task images, emails, or exact behavior.

### Angle B: Eyewear Shopper

```text
Face-shape advice is a shortlist, not the decision.

The more practical flow is:
1. upload a portrait,
2. identify a few likely frame directions,
3. try a product image or screenshot on the same photo,
4. compare before buying.

I am building VisuTry around that flow:
https://www.visutry.com/en/face-analysis?utm_source={source}&utm_medium=community&utm_campaign=june_face_shape
```

### Angle C: Screenshot Try-On

```text
Many eyewear pages still do not let you try the exact frame you are considering.

VisuTry is built for that gap: upload a portrait plus a glasses product image or screenshot, then use the result as a visual check before buying.

It is not prescription, measurement, or physical-fit advice.

https://www.visutry.com/en/try-on/glasses?utm_source={source}&utm_medium=community&utm_campaign=june_photo_tryon
```

### Angle D: Frame Comparison

```text
The hard part of choosing glasses online is not seeing one frame once. It is comparing several possible directions on the same face.

VisuTry's comparison flow is meant for that decision moment:
https://www.visutry.com/en/try-on/glasses/compare?utm_source={source}&utm_medium=community&utm_campaign=june_frame_compare
```

## Outreach Drafts

### Dominic Tunnell Opticians

Subject:

```text
Visual companion for your face-shape glasses guide
```

Body:

```text
Hi,

I read your guide on choosing glasses for different face shapes. It gives shoppers a useful direction, but the next step is usually visual: "would this actually work on my face?"

I am building VisuTry, a photo-based glasses try-on and face-shape guidance tool. It could work as a small visual companion to the guide: one portrait, a few frame directions, and a simple comparison.

Would a short screenshot set be useful for feedback?

Best,
Frank
VisuTry
https://www.visutry.com/en/face-analysis?utm_source=dominic_tunnell&utm_medium=outreach&utm_campaign=june_face_shape
```

### View Eyewear

Subject:

```text
Turning frame-shape advice into a visual check
```

Body:

```text
Hi,

Your frame-shape guide explains the style logic clearly. The part many online shoppers still struggle with is moving from a rule like "try this shape" to a visual comparison on their own photo.

I am building VisuTry to connect those steps: estimate a face-shape direction, then try a frame product image or screenshot on the same portrait.

It is deliberately not a medical, prescription, or physical-fit tool. The narrower use is helping shoppers compare style directions before they commit.

Would you be open to a concise demo or screenshot set for feedback?

Best,
Frank
VisuTry
https://www.visutry.com/en/try-on/glasses?utm_source=view_eyewear&utm_medium=outreach&utm_campaign=june_photo_tryon
```

### ManlyKicks

Subject:

```text
Possible addition to your virtual eyeglass try-on comparison
```

Body:

```text
Hi,

I saw your comparison of virtual eyeglass try-on tools. One gap I am working on is when a shopper has a product image or screenshot, but the store itself does not offer useful try-on.

VisuTry lets them upload a portrait plus a glasses image, then use the result as a quick visual style check.

If you refresh the comparison, would you be open to taking a look?

Best,
Frank
VisuTry
https://www.visutry.com/en/try-on/glasses?utm_source=manlykicks&utm_medium=outreach&utm_campaign=june_photo_tryon
```

### Dolabany Eyewear

Subject:

```text
Visual pre-visit frame comparison idea
```

Body:

```text
Hi,

I saw your article about helping customers pick frames for their face shape. It is practical, and I think the next useful step for shoppers is simply seeing a few options on their own face.

I am building VisuTry, a photo-based glasses try-on tool. It could help customers create a small visual shortlist before visiting or buying.

Would a short screenshot set or demo be useful for feedback?

Best,
Frank
VisuTry
https://www.visutry.com/en/try-on/glasses?utm_source=dolabany&utm_medium=outreach&utm_campaign=june_frame_compare
```

## Tracking Table

| Date | Channel | Action | URL/contact | Campaign | Sessions | Product actions | Result | Next action |
| --- | --- | --- | --- | --- | ---: | ---: | --- | --- |
| 2026-06-24 | Internal | Created weekly recovery operating plan | This doc | n/a | n/a | n/a | Ready | Execute first placement and first two outreach messages |
| 2026-06-24 | Internal | Reviewed newest paid-user pattern | Production read-only payment/task query | n/a | n/a | n/a | Same-session face-analysis unlock -> credits pack -> repeated glasses try-on | Use face-analysis-to-try-on as the primary weekly story |
| 2026-06-24 | Reddit | Posted one account-warmup comment | [Reddit warmup execution](./2026-06-24-reddit-warmup-and-outreach-execution.md) | n/a | n/a | n/a | One no-link comment posted; second attempt not counted | Continue with one useful no-link comment on 2026-06-25 |
| 2026-06-24 | Outreach | Sent three approved outreach emails | Dominic Tunnell, ManlyKicks, Dolabany | june_face_shape / june_photo_tryon / june_frame_compare | n/a | n/a | Sent from `sun@visutry.com` | Watch for replies |
| 2026-06-24 | Outreach | Sent three catch-up outreach emails with screenshot link | Cindy Hattersley, David Kind, The Spectacle Factory | june_photo_tryon | n/a | n/a | Sent from `sun@visutry.com`; Midtown form still pending | Watch for replies |
| 2026-06-24 | Directory | Updated catch-up queue | [Growth volume catch-up](./2026-06-24-growth-volume-catchup.md) | n/a | n/a | n/a | SaaSCity marked for status check before any duplicate submission | Verify directory status |

## Decision Rules

- If a channel produces 0 qualified visits after three credible placements, pause it for the sprint.
- If a placement produces at least one product action, publish a second angle on the same channel within 48 hours.
- If a paid user appears, review source, landing page, first action, and checkout path before adding new product work.
- If signups are flat but product actions rise, keep driving qualified traffic; do not optimize only for account creation.
- If visits arrive but no one starts try-on or face analysis, fix landing-page CTA clarity before increasing distribution.
- If an outreach segment gets no replies after 10 personalized messages, change the segment or offer.

## Next Action Queue

1. Check GA or referrer data for the 2026-06-23 paid user's acquisition source if available.
2. Post one no-link Reddit warmup comment per day while the account is still warming up.
3. Watch for replies from Dominic Tunnell Opticians, ManlyKicks, and Dolabany.
4. Use View Eyewear's contact form after browser/form access is available.
5. Claim or refresh SaaSHub if account access is available; verify SaaSCity existing submission before doing anything there.
6. Update this doc with live URLs, sessions, actions, and replies.
