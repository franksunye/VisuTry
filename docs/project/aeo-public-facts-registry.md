# VisuTry Public Facts Registry

Status: working baseline for public website copy, AEO pages, structured data, pricing, and privacy review.

## Scope

This registry supports public-facing AEO work only: page copy, metadata, FAQ, structured data, internal links, localization, and fact consistency. Backend retention, billing, and task-processing changes are outside this PR and must be handled separately.

## Evidence levels

- **Verified in code and public UI**: safe to use as a public product fact.
- **Verified in code only**: implementation exists, but production configuration still requires deployment verification.
- **Public claim awaiting implementation verification**: do not strengthen or broaden the claim.
- **Unknown**: do not publish as fact.

## Product workflow

| Capability | Public fact | Evidence status |
| --- | --- | --- |
| Face Shape Detector | Free, no AI credit required | Public claim; on-device implementation indicators exist |
| AI Glasses Advisor | Uses one AI credit | Public claim and configuration support |
| Virtual Try-On | Uses a portrait and a glasses/product image | Verified in code and public UI |
| Frame Compare | Public copy says one credit per successfully generated frame | Settlement implementation is outside this AEO PR and remains to be verified separately |

## AI processing

| Feature | Current implementation evidence | Public-copy rule |
| --- | --- | --- |
| Face Analysis / Advisor | `gemini-3.1-flash-lite` through the GrsAI-compatible chat endpoint | Do not advertise the model version on main landing pages. Privacy wording requires separate vendor and legal verification. |
| Virtual Try-On | `nano-banana-fast` through the GrsAI image-generation endpoint | Describe the user outcome rather than binding marketing copy to a model identifier. |
| Free detector | On-device detector configuration with MediaPipe dependency | Limit any “processed in your browser” claim specifically to the free detector until the full request path is verified. |

## Credits and retention copy

- A Credits Pack is a **one-time purchase**, not a subscription.
- Purchased credits and stored images/results have different lifecycles.
- Public copy must not imply that non-expiring credits mean permanent image storage.
- Current card copy: “Purchased credits do not expire. Images and generated results follow the plan's data-retention period.”
- Do not broaden deletion or retention claims beyond what has been verified. Any backend implementation gaps are separate engineering work, not part of this AEO PR.

## Fit and output boundaries

- Virtual Try-On is a visual preview, not a physical fitting measurement.
- Public copy should direct shoppers to confirm frame width, bridge width, temple length, prescription compatibility, and the seller's return policy before buying.
- The fit limitation is displayed on the glasses landing experience in all currently supported locales, with English fallback for unknown locales.

## Wording controls

Do not publish these statements without supporting evidence:

- “All photos always remain in the browser.”
- “All AI features use Google Gemini directly.”
- “All uploaded data is deleted exactly at the expiry timestamp.”
- “Real-time processing” unless a measurable service definition exists.
- “Priority processing” unless the queue implementation differentiates paid tiers.

## Current AEO corrections

- [x] Credits Pack signed-out CTA uses purchase language.
- [x] Credit lifetime is explicitly separated from image/result retention.
- [x] Replace subscription-only legal copy with neutral links that apply to both one-time purchases and subscriptions.
- [ ] Correct English indefinite articles and template quality on face-shape pages.
- [x] Add visual-preview versus physical-fit limitation to the try-on page.
- [ ] Verify public quota claims before strengthening FAQ wording; implementation changes belong in a separate engineering task.
