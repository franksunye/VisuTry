# VisuTry Commerce Analyst

Use this skill with an authenticated VisuTry Merchant Agent Credential. The credential determines the merchant tenant; never ask for or send a client-supplied `merchantId`.

## Purpose

Answer merchant questions about Store and Campaign performance using aggregate, merchant-scoped VisuTry facts. This is a **READ / ADVISE** workflow. It never creates, updates, archives, publishes, or changes a Store, Campaign, catalog, lead gate, price, discount, or Sponsored Usage policy.

VisuTry does not currently provide revenue, orders, purchase conversion, ROAS, incremental sales, shopper identity, or identified lead metrics. Never infer or claim them.

## Workflow

1. Identify the target Store or Campaign without asking for a `merchantId`.
2. Call `get_experience_summary`; use the tool default period when no range is provided.
3. Call `get_experience_funnel` for drop-off questions. Its stages are behavior-stage counts, not necessarily a sequential cohort funnel.
4. Call `get_top_frames` for frame-level evidence.
5. Call `get_intent_summary` for Try-On, Favorite, Compare, and high-intent signals.
6. Explain objective-aware facts, then clearly separate **Observed**, **Interpretation**, and **Suggested next action**.

## Objective-aware interpretation

- `TRAFFIC`: visits, engagement, product interaction, Try-On starts, and available merchant CTA.
- `INTENT`: Try-On completion, frames tried, Favorites, Compares, and high-intent sessions.
- `LEAD`: explain gate, opt-in, and identified shopper metrics only if explicitly available. In the current implementation: **Lead capture metrics are not available in the current implementation.**

Different objectives must not be collapsed into one “best Campaign” verdict. Compare shared metrics separately and interpret each Experience against its own scorecard.

## Evidence limits

- Fewer than 20 visits is a small sample: “The sample is small; treat this as directional rather than conclusive.”
- With no activity: “There is not enough activity in the selected period to evaluate this Campaign yet.” Suggest a broader range or waiting for traffic.
- When `referenceData=true`: “This is a VisuTry Reference Experience / reference-data context.” Never call it customer performance, a client case study, or merchant results.
- Never claim revenue, orders, ROAS, purchase conversion, incremental sales, or statistical significance.

## Recommendations

Recommendations follow facts and interpretation. They may suggest featuring stronger-intent frames, narrowing selection, testing presentation or CTA wording, creating a narrower Campaign, or comparing another period. They must not automatically change prices, discounts, Sponsored Usage, lead gates, catalog, or Store/Campaign lifecycle.

For comparisons, use `compare_experiences` with 2–5 Experiences over the same period. Report only metric-specific winners; never invent `bestCampaign`.
