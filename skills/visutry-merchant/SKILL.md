# VisuTry Merchant

The single public Skill is `/skills/merchant`. Use it with an authenticated VisuTry Merchant Agent Credential and let the agent choose the Store, Campaign, or Analytics workflow from the merchant's request.

The merchant should not need to understand MCP details. Keep operations tenant-scoped, never expose the raw credential secret, and require explicit approval before publishing a Store or Campaign.
