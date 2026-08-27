/**
 * Single source of truth for Merchant MCP tool inventory and availability.
 *
 * Live production `/api/mcp` (Vercel Node) uses the canonical Prisma application
 * layer and exposes the full LIVE tool set. The `*-cloudflare` / raw-SQL server
 * is a Cloudflare-build adapter and may expose a reduced subset; it must not
 * silently invent tools that are absent from this registry.
 */

export const MCP_TOOL_NAMES = [
  'get_onboarding_status',
  'get_merchant',
  'list_frames',
  'import_frames',
  'validate_catalog',
  'inspect_catalog_source',
  'create_store',
  'set_store_frames',
  'preview_store',
  'publish_store',
  'list_campaigns',
  'get_campaign',
  'create_campaign',
  'set_campaign_frames',
  'update_campaign',
  'preview_campaign',
  'publish_campaign',
  'archive_campaign',
  'get_experience_summary',
  'get_experience_funnel',
  'get_top_frames',
  'get_intent_summary',
  'compare_experiences',
] as const

export type McpToolName = (typeof MCP_TOOL_NAMES)[number]

export type McpRuntimeFamily = 'canonical-prisma' | 'cloudflare-raw-sql'

/** Production Vercel Node `/api/mcp` — full Agent-Native surface. */
export const MCP_LIVE_RUNTIME: McpRuntimeFamily = 'canonical-prisma'

/**
 * Tools unavailable on the Cloudflare raw-SQL adapter until that adapter
 * implements equivalent application contracts (or CF stops serving them).
 */
export const MCP_CLOUDFLARE_ADAPTER_UNAVAILABLE: readonly McpToolName[] = [
  'inspect_catalog_source',
  'publish_campaign',
  'archive_campaign',
  'compare_experiences',
] as const

export const MCP_TOOL_SCOPES: Record<McpToolName, readonly string[]> = {
  get_onboarding_status: ['merchant:read'],
  get_merchant: ['merchant:read'],
  list_frames: ['catalog:read'],
  import_frames: ['catalog:write'],
  validate_catalog: ['catalog:read'],
  inspect_catalog_source: ['catalog:read'],
  create_store: ['experience:write'],
  set_store_frames: ['experience:write'],
  preview_store: ['experience:read'],
  publish_store: ['experience:write'],
  list_campaigns: ['experience:read'],
  get_campaign: ['experience:read'],
  create_campaign: ['experience:write'],
  set_campaign_frames: ['experience:write'],
  update_campaign: ['experience:write'],
  preview_campaign: ['experience:read'],
  publish_campaign: ['experience:write'],
  archive_campaign: ['experience:write'],
  get_experience_summary: ['analytics:read'],
  get_experience_funnel: ['analytics:read'],
  get_top_frames: ['analytics:read'],
  get_intent_summary: ['analytics:read'],
  compare_experiences: ['analytics:read'],
}

export const MCP_HIGH_IMPACT_TOOLS = new Set<McpToolName>([
  'publish_store',
  'publish_campaign',
  'archive_campaign',
])

export const MCP_WRITE_TOOLS = new Set<McpToolName>([
  'import_frames',
  'create_store',
  'set_store_frames',
  'publish_store',
  'create_campaign',
  'set_campaign_frames',
  'update_campaign',
  'publish_campaign',
  'archive_campaign',
])

export function mcpToolsForRuntime(runtime: McpRuntimeFamily): readonly McpToolName[] {
  if (runtime === 'canonical-prisma') return MCP_TOOL_NAMES
  const blocked = new Set(MCP_CLOUDFLARE_ADAPTER_UNAVAILABLE)
  return MCP_TOOL_NAMES.filter((name) => !blocked.has(name))
}

export function isMcpToolAvailable(name: string, runtime: McpRuntimeFamily): name is McpToolName {
  return (mcpToolsForRuntime(runtime) as readonly string[]).includes(name)
}
