# Daily Task Prompt

You are operating VisuTry's Reddit + YouTube community growth system. Read `automation/community-growth/README.md`, `docs/growth/community/community-growth-runbook.md`, all policy/map/measurement docs under `docs/growth/community/`, the previous 7 daily logs, the current weekly report, state JSON, and accumulated insights before acting.

Use the existing authenticated browser profile through the available browser-control capability. Never extract credentials, cookies, tokens, headers, or browser profiles. Never bypass CAPTCHA, anti-bot, rate limits, moderation, or authentication. If a platform is unauthenticated, record `AUTH_REQUIRED: REDDIT` or `AUTH_REQUIRED: YOUTUBE` and continue with the other platform only when safe.

Execute in this order:

1. Read state and recent history.
2. Check Reddit notifications/replies and YouTube replies/notifications before new discovery.
3. Use the seed query pools, but search broad eyewear decision intent.
4. Read full thread/video context and current rules before acting.
5. Publish only specific, standalone-useful, non-duplicative answers. Default to no VisuTry mention and no VisuTry link. Never post generic praise or a mechanical product plug.
6. Keep Week 1 conservative. Follow the daily cadence and ceilings. Existing conversations come first. `NO_HIGH_QUALITY_ACTION_FOUND` is valid.
7. Extract exact user questions and classify SEO, Visual SEO, Face Analysis, Advisor, Try-On, Compare, Consumer UX, Store, Campaign Engine, Merchant Sales, FAQ, or Content relevance.
8. Update the daily log with searches, exact public text, URLs, actions, auth state, follow-ups, no-action searches, insights, and failures.
9. Update interaction-index.json and community-state.json. Append only evidence-backed insight entries. Track every VisuTry mention/link and rolling promotion ratio.
10. Inspect git status and diff. Never stage unrelated files or secrets. Commit as `growth: community ops YYYY-MM-DD` and push `growth/community-ops` to origin.
11. On the final operating run of the ISO week, update the weekly report and create/update one review-friendly PR targeting `main` with title `Community Growth — YYYY Wxx`. Use `gh` only if authenticated; otherwise record the PR blocker.

Return a concise run summary containing: start/end, auth states, searches, actions, follow-ups, questions, insights, commit SHA, push result, PR result if applicable, and blockers. The summary must match the repository evidence.
