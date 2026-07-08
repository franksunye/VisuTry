# VisuTry Reddit Warmup and Outreach Execution

Date: 2026-06-24
Owner: Frank + Codex
Status: Execution started; Reddit warmup is rate-limited to one successful comment today

## What Was Executed Today

### 1. Production Paid-User Review

Completed a read-only production review of the newest paid user.

Finding:

- Registered on 2026-06-23.
- Purchased `CREDITS_PACK` for USD 2.99 within roughly 2 minutes.
- Completed and unlocked one face-analysis report before payment.
- Completed 4 glasses try-on tasks after payment.
- Recent failed try-on tasks: 0.

Growth conclusion:

The next traffic push should lead with the face-analysis-to-glasses-try-on path, not a broad AI fashion story.

### 2. Outreach Contacts Verified

Verified reachable outbound routes:

| Target | Route | Source evidence | Status |
| --- | --- | --- | --- |
| Dominic Tunnell Opticians | `info@tunnellvision.co.uk` | Contact page says to email this address | Dry-run email prepared |
| ManlyKicks | `support@manlykicks.com` | Support page lists this email for product/general inquiries | Dry-run email prepared |
| Dolabany Eyewear | `marketing@dolabanyeyewear.com` | Trustpilot contact info lists this address | Dry-run email prepared |
| View Eyewear | Website form | Contact page uses a submission form | Needs browser/form submission |

Per VisuTry email-ops rules, external human emails are not sent until Frank explicitly approves the final recipient, subject, and body.

### 3. Outreach Emails Sent

The approved short outreach emails were sent with the unified mail CLI from `sun@visutry.com`.

First sent batch:

1. Dominic Tunnell Opticians: `<518bdde7-20f8-0b18-2084-4d150d34cbfe@visutry.com>`
2. ManlyKicks: `<e1703d27-6014-233e-185e-f91c568d2da7@visutry.com>`
3. Dolabany Eyewear: `<71cd730a-1032-76fa-6cbd-c931234efd2f@visutry.com>`

Second sent batch, with hosted example screenshot:

```text
https://www.visutry.com/assets/marketing/compare-slide-woman.png
```

4. Cindy Hattersley Design: `<3a51af18-7627-9cd3-14d7-4731d666a9d1@visutry.com>`
5. David Kind: `<fc952cca-22fd-eb21-e50d-131b5098878f@visutry.com>`
6. The Spectacle Factory: `<c3251147-2d7a-f874-7a13-e836fb42471a@visutry.com>`

## Reddit Current State

Public Reddit JSON/API access from the local environment is blocked by Reddit network security unless logged in or using a developer token. Search-indexed pages are still enough for targeting, but actual posting must happen from the logged-in Reddit account.

Relevant current target:

- `r/glassesadvice/new`
- Description: subreddit for choosing eyewear, sunglasses, and frames to fit the face.
- Rule visible from indexed result: no optometry; fashion, fit, or hardware posts only.
- Current visible thread types include:
  - "Are these frames too heavy/dark for my face?"
  - "Which is best out of these 3?"
  - "Which one suits me best? Number 1 (Grey), or number 2 (Transparent)?"
  - "What vibe does give? Which matches my personality. Guy in tech"
  - "Help choosing - did I pick right and second pair option"
  - "What glasses suit me? Especially compensating for my oblong face shape?"

## Reddit Account Warmup Rule

For the next 7 days, do not lead with VisuTry links.

The account should earn trust by leaving useful, specific comments:

- 1 useful comment per day while the account is still warming up.
- No links for the first 5-7 useful comments.
- No repeated templates.
- Mention "I work on a glasses try-on tool" only when directly relevant, and only after the account has several normal contributions.
- Avoid prescription, diagnosis, optometry, medical, or fit-certainty claims.
- Keep comments grounded in visible frame proportions, color contrast, bridge position, lens height, brow alignment, and personal style.
- If Reddit imposes a time gate, stop for the day instead of trying to push through it.

## Today's Reddit Warmup Execution

One no-link, no-product, no-AI warmup comment was posted from the logged-in account.

### Posted Comment: r/glassesadvice

Thread:

```text
https://www.reddit.com/r/glassesadvice/comments/1ue0ih5/do_these_glasses_suit_me/
```

Comment:

```text
If they are sliding down, I would separate the fit issue from the style issue first. A frame can look good but still be the wrong bridge width or need the temples adjusted.

From what you wrote, I would take them back and ask for a proper adjustment before deciding you picked the wrong shape. If they still slide after that, look for a slightly narrower bridge or a frame with adjustable nose pads. Style-wise, loose frames always look worse because they sit too low on the face.
```

Result:

- Posted successfully.
- No VisuTry link.
- No product mention.
- No AI/tool mention.
- Stayed inside the subreddit's fashion/fit/hardware lane.

The attempted second comment is treated as not successfully posted. Do not retry it today.

## Future Reddit Comment Bank

These are available for future days from the logged-in account. They are intentionally link-free.

### Thread Type: "Are these frames too heavy/dark for my face?"

```text
I would compare them by looking at two things separately: color weight and frame size.

If pics 1-2 feel heavy, it is probably less about the shape and more about the dark upper rim drawing attention before your eyes. If the width and bridge feel comfortable, a softer tortoise, translucent brown, or thinner dark frame could keep the structure without making the frame feel so dominant.

Your current pair in pic 3 is useful as a baseline: if it feels easier on your face, look for a similar visual weight but with a slightly more intentional shape.
```

### Thread Type: "Which is best out of these 3?"

```text
I would pick based on which one keeps your eyes closest to the visual center of the lenses. That usually matters more than face-shape rules.

If one frame sits too low or leaves a lot of empty lens below the eyes, it can make the whole pair feel off even if the shape is nice. The best option is usually the one where the top line follows your brow naturally, the width does not extend too far past your temples, and your eyes do not look crowded into the upper corner.
```

### Thread Type: "Which one suits me best? Grey or Transparent?"

```text
Between grey and transparent, I would think about contrast first.

Transparent frames usually feel lighter and more casual, but they can disappear if your features or hair already have soft contrast. Grey gives a little more definition while still being less intense than black.

If both shapes fit similarly, I would choose grey when you want the glasses to look intentional, and transparent if you want them to blend in.
```

### Thread Type: "What vibe does this give? Guy in tech"

```text
The narrower frames give a more precise, technical vibe, but they can also read a little severe if the lens height is too shallow.

For a tech/professional look that still feels approachable, I would look for a frame with clean lines but a bit more lens height or a softer corner. It keeps the sharpness without making the glasses look like they are doing all the talking.
```

### Thread Type: "What glasses suit me? Oblong face shape"

```text
For an oblong face, I would usually test frames with a bit more lens height and some visual weight on the upper half. Very narrow rectangles can lengthen the face even more.

Look for shapes that add a little horizontal structure: soft square, browline, or a slightly rounded rectangle. I would avoid anything too tiny or too low-profile unless you specifically want a very minimal look.
```

## First Link-Allowed Reddit Answer

Use this only after several useful no-link comments, or if the poster explicitly asks for tools.

```text
Face-shape advice is useful as a shortlist, but I would not treat it as the final answer. The practical process is:

1. Check whether the frame width is close to your face width.
2. Make sure your eyes sit near the center of the lenses.
3. Compare at least two different shapes on the same photo.
4. Use measurements and comfort checks before buying.

I work on VisuTry, so take this with that disclosure: the tool is meant for that visual comparison step, not for prescription, measurements, or physical fit. If a photo-based check would help, you can try it here:
https://www.visutry.com/en/face-analysis?utm_source=reddit&utm_medium=community&utm_campaign=june_face_shape
```

## Execution Log

| Date | Channel | Action | Status | Next step |
| --- | --- | --- | --- | --- |
| 2026-06-24 | Production data | Reviewed newest paid-user path | Done | Use face-analysis-to-try-on in growth messaging |
| 2026-06-24 | Email outreach | Sent Dominic Tunnell outreach from `sun@visutry.com` | Sent | Watch for reply |
| 2026-06-24 | Email outreach | Sent ManlyKicks outreach from `sun@visutry.com` | Sent | Watch for reply |
| 2026-06-24 | Email outreach | Sent Dolabany outreach from `sun@visutry.com` | Sent | Watch for reply |
| 2026-06-24 | Email outreach | Sent Cindy Hattersley outreach from `sun@visutry.com` with screenshot link | Sent | Watch for reply |
| 2026-06-24 | Email outreach | Sent David Kind outreach from `sun@visutry.com` with screenshot link | Sent | Watch for reply |
| 2026-06-24 | Email outreach | Sent The Spectacle Factory outreach from `sun@visutry.com` with screenshot link | Sent | Watch for reply |
| 2026-06-24 | Reddit | Posted one no-link warmup comment in `r/glassesadvice` | Done for today | Continue with one more useful comment on 2026-06-25 |
| 2026-06-24 | Reddit | Attempted second warmup comment | Not counted | Do not retry today because Reddit may enforce timing limits |

## Next Concrete Actions

1. On 2026-06-25, post exactly one additional no-link Reddit warmup comment.
2. Record the live comment URL here.
3. Watch inbox for replies from the six outreach targets sent today.
4. After 5-7 normal Reddit comments across several days, use the first link-allowed answer only where the poster asks for tools or process help.
