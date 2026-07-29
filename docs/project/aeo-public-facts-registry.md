# VisuTry Public Facts Registry

Status: working baseline for public website copy, AEO pages, structured data, pricing, and privacy review.

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
| Frame Compare | Charges per successfully generated frame | Public claim; settlement flow still requires full verification |

## AI processing

| Feature | Current implementation | Public-copy rule |
| --- | --- | --- |
| Face Analysis / Advisor | `gemini-3.1-flash-lite` through the GrsAI-compatible chat endpoint | Do not advertise the model version on the main landing pages. Disclose the direct processor accurately in privacy documentation after vendor legal details are verified. |
| Virtual Try-On | `nano-banana-fast` through the GrsAI image-generation endpoint | Describe the user outcome rather than binding marketing copy to the model identifier. |
| Free detector | On-device detector configuration with MediaPipe dependency | Limit any “processed in your browser” claim specifically to the free detector until the full request path is verified. |

## Credits and retention

- A Credits Pack is a **one-time purchase**, not a subscription.
- Purchased credits and stored images/results have different lifecycles.
- Public copy must not imply that non-expiring credits mean permanent image storage.
- Current card copy: “Purchased credits do not expire. Images and generated results follow the plan's data-retention period.”
- Try-on tasks have `expiresAt` and a scheduled cleanup path.
- Face-analysis cleanup requires separate implementation verification before making a universal deletion claim.

## Wording controls

Do not publish these statements without supporting evidence:

- “All photos always remain in the browser.”
- “All AI features use Google Gemini directly.”
- “All uploaded data is deleted exactly at the expiry timestamp.”
- “Real-time processing” unless a measurable service definition exists.
- “Priority processing” unless the queue implementation differentiates paid tiers.

## Current P0 corrections

- [x] Credits Pack signed-out CTA uses purchase language.
- [x] Credit lifetime is explicitly separated from image/result retention.
- [ ] Replace subscription-only legal copy for one-time purchases.
- [ ] Correct English indefinite articles on face-shape pages.
- [ ] Add visual-preview versus physical-fit limitation to the try-on page.
- [ ] Include face-analysis records and files in expiry cleanup.
- [ ] Verify successful-only quota settlement and partial Compare outcomes.
