# VisuTry Product Architecture SEO/GEO Sync

**Date:** 2026-06-30
**Status:** Active source of truth
**Owner:** GTM
**Scope:** Face Shape Detector, Glasses Advisor, Virtual Try-On, Frame Compare

## 1. GTM decision

VisuTry is no longer presented as three disconnected AI tools. The public product path is:

> Face Shape Detector → Glasses Advisor → Virtual Try-On → Frame Compare

Each step answers a different shopper question:

1. **Face Shape Detector:** What is my likely face shape?
2. **Glasses Advisor:** Which frame directions are worth trying, and why?
3. **Virtual Try-On:** How does one specific product image look on my photo?
4. **Frame Compare:** Which of several candidate frames looks best side by side?

The Detector is the free acquisition product. The other three products create recommendation depth, visual proof, repeat usage, and credit revenue.

## 2. Competitor evidence

### Detect Face Shape

- Uses the exact product language `Face Shape Detector`.
- Leads with upload, speed, no measuring, and no sign-up.
- Semrush estimated 181.58K visits in May 2026; 60.76% came from Google organic.
- Its largest estimated keyword was `face shape detector`, with 246K search volume and 38.12% of estimated organic traffic.

Sources:

- https://www.detect-face-shape.com/
- https://www.semrush.com/website/detect-face-shape.com/overview/

### FaceCalculators

- Combines camera, photo upload, and manual measurement.
- Repeats `Face Shape Detector` in title, headings, FAQ, and calls to action.
- Uses on-device processing and personalized style guidance as trust and retention mechanisms.

Source: https://facecalculators.com/

### FaceShape.io

- Uses `Detect Face Shape` in navigation and `Face Shape Detector` in product copy.
- Extends the result into hairstyle, makeup, and accessory recommendations.

Source: https://faceshape.io/

### Perfect Corp

- Explicitly connects face-shape detection, personalized frame recommendations, and virtual try-on.
- Frames the commercial problem as hesitation and decision paralysis, not lack of AI technology.
- Uses virtual try-on as the final visual validation after recommendation.

Sources:

- https://www.perfectcorp.com/business/products/frames-and-face-shapes
- https://www.perfectcorp.com/business/showcase/eye-wear

### What VisuTry must outperform

- Match the competitors' low-friction free entry.
- Be more honest about estimate quality and privacy.
- Turn the result into a real eyewear decision instead of ending at a face-shape label.
- Accept product images and screenshots that are not limited to one retailer catalog.
- Measure the complete path from free result to advice, try-on, comparison, and payment.

## 3. Keyword ownership

One search intent must have one primary URL.

| URL | Product role | Primary query family | Must not target as primary |
| --- | --- | --- | --- |
| `/en/face-shape-detector` | Free acquisition | `face shape detector`, `free face shape detector`, `face shape checker`, `face shape finder` | `AI glasses advisor` |
| `/en/face-analysis` | Paid guidance | `glasses advisor`, `personalized glasses recommendations`, `what glasses suit my face` | `free face shape detector` |
| `/en/try-on/glasses` | Specific-frame validation | `virtual glasses try on`, `try glasses on photo`, `glasses try on from screenshot` | `face shape detector` |
| `/en/try-on/glasses/compare` | Multi-frame decision | `frame compare`, `compare glasses online`, `compare glasses on face` | `virtual try on one product` |
| `/en/glasses-for-face-shape` | Editorial hub | `glasses for face shape`, `what glasses suit my face shape` | Tool-first detector queries |

The existing `/face-analysis` URL stays in place to preserve history and links, but its public product name and search promise are now **Glasses Advisor**.

## 4. Page contracts

### Homepage

- Promise the complete journey in one sentence.
- Make the free Detector the primary CTA.
- Keep Virtual Try-On as the secondary high-intent CTA.
- Show the four products as a connected sequence.
- Give Glasses Advisor a distinct section for users who need a deeper shortlist.
- Explain the privacy difference between on-device Detector and account-based products.

### Face Shape Detector

- Tool must appear above explanatory content.
- No login, no credits, no server photo upload.
- Avoid accuracy percentages until a labeled benchmark exists.
- Result must offer three continuations: Advisor, Try-On, and face-shape guide.
- Track upload, completion, failure reason, and downstream CTA.

### Glasses Advisor

- Own the value of personalized recommendations, not the generic detector keyword.
- Explain what the user receives beyond a free face-shape estimate.
- Offer the free Detector as the no-login alternative.
- Continue into Virtual Try-On.

### Virtual Try-On

- Own product-image and screenshot intent.
- Link uncertain shoppers to the free Detector first.
- Mention Glasses Advisor as the deeper recommendation option.

### Frame Compare

- Own side-by-side comparison intent.
- Explain credit use per generated frame.
- Link uncertain shoppers to the free Detector.
- Publish SoftwareApplication structured data.

### Pricing

- State clearly that Face Shape Detector is always free.
- Credits apply to Glasses Advisor, Virtual Try-On, and Frame Compare.
- Do not imply that a user must pay to learn their likely face shape.

## 5. GEO fact contract

These facts must stay consistent across visible copy, FAQ, structured data, directory listings, and AI-search answers:

- VisuTry's Face Shape Detector is free and requires no account or credits.
- The Detector processes the selected photo in browser memory; the photo is not sent to VisuTry by that tool.
- The result is a styling estimate, not identity recognition, medical advice, or physical frame measurement.
- Glasses Advisor provides a deeper personalized report and uses credits.
- Virtual Try-On accepts a portrait plus a glasses product image or screenshot.
- Frame Compare creates side-by-side results from preset frames.
- A Credits Pack is a one-time purchase; credits do not expire.

Do not claim calibrated classification accuracy, biometric identity recognition, prescription fit, or guaranteed physical sizing.

## 6. Structured data contract

| Page | Required schema |
| --- | --- |
| Detector | SoftwareApplication, HowTo, FAQPage |
| Advisor | SoftwareApplication, HowTo, FAQPage |
| Virtual Try-On | SoftwareApplication, FAQPage |
| Frame Compare | SoftwareApplication |
| Homepage | Organization, WebSite, FAQPage |

Schema names and descriptions must match the visible product names. Structured data is support for machine understanding, not a substitute for visible explanatory content.

## 7. Measurement

### Free Detector events

- `face_shape_detector_upload`
- `face_shape_detector_complete`
- `face_shape_detector_failed`
- `face_shape_detector_cta_click`

Required dimensions include processing mode, file type, quality score, processing time, face-shape result, failure reason, and CTA destination where applicable.

### Funnel KPIs

| Metric | Initial target |
| --- | ---: |
| Detector page → valid upload | 20%+ |
| Valid upload → measured result | 80%+ |
| Result → any next-step click | 15%+ |
| Result → Glasses Advisor | 5%+ |
| Result → Virtual Try-On | 5%+ |
| Organic query impressions for detector family | Week-over-week growth |

Targets are operating hypotheses until VisuTry has enough real traffic for stable baselines.

## 8. International indexing policy

The newly published face-shape content cluster is currently written in English. Until a page has reviewed localized body copy:

- index only the English URL;
- do not advertise untranslated locale copies through sitemap or hreflang;
- keep non-English copies `noindex,follow` so navigation still works;
- reopen each locale only after title, description, visible content, FAQ, and structured data are localized together.

This avoids presenting duplicate English pages as translated alternatives.

## 9. Distribution positioning

Use separate campaign destinations by intent:

- Free discovery: `/en/face-shape-detector`
- Personalized recommendation: `/en/face-analysis`
- Specific product validation: `/en/try-on/glasses`
- Multi-frame decision: `/en/try-on/glasses/compare`

Canonical public description:

> Find your face shape for free, get a personalized frame shortlist, then try and compare glasses on your own photo.

## 10. Review cadence

Every weekly GTM review should inspect:

1. GSC query and page performance by the five intent groups.
2. Detector upload, completion, failure, and continuation rates.
3. Advisor, Try-On, Compare, Pricing, and purchase actions originating from Detector sessions.
4. Index coverage for English priority URLs.
5. New referring domains, directory listings, and AI-search citations.

Do not add another content cluster until the current tool-to-commercial path has measurable traffic and conversion data.
