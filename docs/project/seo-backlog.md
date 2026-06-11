# SEO Backlog

Last updated: 2026-06-11
Current sprint: Face Analysis to Glasses Try-On Growth
Owner: Codex

## Critical

### Google Search Console Verification

Priority: P0
Status: Done

Tasks:

- [x] Confirm GSC property access for `https://visutry.com/`.

Acceptance:

- [x] Can access GSC dashboard.
- [x] Property verified.

### Submit Sitemap

Priority: P0
Status: Done

Tasks:

- [x] Submit `https://visutry.com/sitemap.xml` in GSC.
- [x] Verify successful submission.

Acceptance:

- [x] Sitemap submitted on 2026-06-11.
- [x] GSC shows successful submission.

### Request Face Analysis Indexing

Priority: P0
Status: Done

Tasks:

- [x] Request indexing for `/en/face-analysis`.
- [x] Request indexing for `/en/blog/ai-face-analysis-for-glasses-guide`.

Acceptance:

- [x] Both URLs requested on 2026-06-11.
- [x] Both URLs showed discovered but not indexed before the request.

### GA Key Events for Face Analysis Funnel

Priority: P0
Status: Done

Tasks:

- [x] Mark `face_analysis_complete` as a key event.
- [x] Create and mark `face_analysis_upload` as a key event.
- [x] Create and mark `try_on_from_face_analysis` as a key event.
- [x] Create and mark `face_analysis_unlock_success` as a key event.

Acceptance:

- [x] GA key events list includes all four face-analysis funnel events.
- [x] New code-based events may show no data stream until they are triggered by real users.

## High Priority

### Face Analysis to Try-On Repositioning

Priority: P0
Status: In progress

Business goal:

Make `/en/face-analysis` rank and convert as a glasses decision tool, not a standalone face-analysis novelty.

Tasks:

- [x] Update `/en/face-analysis` metadata around AI face analysis for glasses.
- [x] Add FAQ, HowTo, and SoftwareApplication schema.
- [x] Add GA tracking for upload, completion, try-on from analysis, and unlock success.
- [x] Strengthen first-screen copy around "find glasses that fit your face".
- [x] Add stronger above-the-fold try-on bridge.
- [x] Add internal links to face-shape pages and try-on page.

Acceptance:

- [x] First viewport clearly connects face analysis to glasses try-on.
- [x] Primary CTA drives analysis upload or sign-in.
- [x] Secondary CTA drives direct glasses try-on.

### Build Glasses for Face Shape Hub

Priority: P1
Status: Done

Target URL:

- `/en/glasses-for-face-shape`

Target intent:

- `best glasses for my face shape`
- `what glasses suit my face`
- `glasses for face shape`

Tasks:

- [x] Create page route and metadata.
- [x] Add face-shape comparison table.
- [x] Link to `/en/face-analysis`.
- [x] Link to `/en/try-on/glasses`.
- [x] Link to `/en/style/[faceShape]`.
- [x] Add FAQ schema.

Acceptance:

- [x] Page has clear conversion path: read guidance, analyze face, try glasses.
- [x] Page is included in sitemap.
- [x] Page passes lint/typecheck.

### Upgrade Face-Shape Programmatic Pages

Priority: P1
Status: Done

Tasks:

- [x] Improve `/style/[faceShape]` template.
- [x] Add useful static guidance when frame inventory is sparse.
- [x] Add CTA to `/en/face-analysis`.
- [x] Add CTA to `/en/try-on/glasses`.
- [x] Add FAQ schema per face shape.
- [x] Add stable sitemap entries for six core face-shape pages.

Acceptance:

- [x] Each face-shape page can rank and convert even with limited inventory.
- [x] Internal links connect face-shape pages back into the try-on funnel.

### Monitor Indexing and Query Movement

Priority: P1
Status: Active

Tasks:

- [ ] Check GSC for `/en/face-analysis`.
- [ ] Check GSC for `/en/blog/ai-face-analysis-for-glasses-guide`.
- [ ] Track impressions for face-analysis and glasses-intent query groups.
- [ ] Log issues and next action.

Acceptance:

- [ ] Weekly status note completed.
- [ ] Query movement documented.

## Medium Priority

### Refresh Priority Blog Pages

Priority: P2
Status: TODO

Tasks:

- [ ] Refresh `/en/blog/ai-face-analysis-for-glasses-guide`.
- [ ] Refresh `/en/blog/how-to-choose-glasses-for-your-face`.
- [ ] Refresh `/en/blog/best-glasses-for-face-shapes-guide`.
- [ ] Refresh `/en/blog/best-ai-virtual-glasses-tryon-tools-2025`.
- [ ] Add contextual CTAs to face analysis and glasses try-on.

Acceptance:

- [ ] Blog pages support the face-analysis to try-on funnel.
- [ ] Pages target researched question-style GEO queries.

### Fix 404 Errors

Priority: P2
Status: TODO

Tasks:

- [ ] Review 404 errors in GSC.
- [ ] Identify patterns.
- [ ] Add redirects or fix links.
- [ ] Verify fixes.

Acceptance:

- [ ] 404 errors materially reduced.

### Add Internal Links

Priority: P2
Status: Done

Tasks:

- [x] Add contextual internal links to the original nine blog posts.
- [x] Add links from face analysis to glasses decision pages.
- [x] Add links from glasses decision pages back to face analysis and try-on.

Acceptance:

- [x] The face-analysis to try-on funnel is visible from the new hub and the face-analysis landing page.

## Future

### Content Expansion

- [ ] Write new pages only after GSC impressions validate demand.
- [ ] Focus on face-shape and glasses try-on gaps.
- [ ] Avoid generic beauty or face-score content unless it connects to glasses try-on.

### Social Distribution

- [ ] Share priority pages on X, LinkedIn, Reddit, and Quora after the funnel pages are complete.

### Link Building

- [ ] Reach out to eyewear, online shopping, and style blogs after the decision hub is live.

## Sprint Goals

### Week 1

- [x] GSC sitemap submitted.
- [x] Two priority URLs requested for indexing.
- [x] GA key events configured.
- [x] `/en/face-analysis` repositioned around glasses try-on.
- [x] `/en/glasses-for-face-shape` built or scoped for build.

### Week 2

- [x] Face-shape pages upgraded.
- [ ] Four priority blog pages refreshed.
- [ ] New or updated pages submitted in GSC.
- [ ] First weekly funnel report produced.

## See Also

- [Face Analysis to Glasses Try-On Growth Plan](../strategy/seo/2026-06-11-face-analysis-to-tryon-growth-plan.md)
- [Keyword Mapping](../strategy/seo/keywords-mapping.md)
- [Programmatic SEO Execution Plan](../strategy/seo/programmatic-seo-execution-plan.md)
