# VisuTry Campaign Creation

The canonical public Skill is `/skills/campaign-creation`. Use it with an authenticated VisuTry Merchant Agent Credential and the `/api/mcp` endpoint.

This Skill guides the agent through catalog inspection, deterministic frame selection, Campaign DRAFT creation, policy configuration, preview, explicit approval, publish, and live URL return. It does not authorize a tenant; the credential does.

The default policy is `INTENT` + `NONE` + `EDITORIAL_FIRST`. Use `LEAD` + `OPT_IN_AFTER_VALUE` only when the merchant clearly requests lead collection. Keep Sponsored Usage separate from Conversion Gate.
