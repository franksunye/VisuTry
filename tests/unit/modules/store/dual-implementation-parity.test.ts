/**
 * Behavioral parity contracts between the live `*-cloudflare` (raw-SQL)
 * application services and the Prisma alternate used by non-MCP surfaces.
 *
 * Tool-name parity alone is insufficient: mutations must preserve shared
 * business invariants such as public discovery invalidation.
 */

import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const prismaCampaign = readFileSync(
  join(process.cwd(), 'src/modules/store/application/campaign-service.ts'),
  'utf8',
)
const liveCampaign = readFileSync(
  join(process.cwd(), 'src/modules/store/application/campaign-service-cloudflare.ts'),
  'utf8',
)
const mcpRoute = readFileSync(join(process.cwd(), 'src/app/api/mcp/route.ts'), 'utf8')
const liveMcpServer = readFileSync(
  join(process.cwd(), 'src/modules/merchant/mcp/server-cloudflare.ts'),
  'utf8',
)
const alternateMcpServer = readFileSync(
  join(process.cwd(), 'src/modules/merchant/mcp/server.ts'),
  'utf8',
)

function mutationUsesDiscoveryInvalidation(source: string, exportName: string): boolean {
  const marker = `export async function ${exportName}`
  const start = source.indexOf(marker)
  if (start < 0) return false
  const nextExport = source.indexOf('\nexport async function ', start + marker.length)
  const body = nextExport < 0 ? source.slice(start) : source.slice(start, nextExport)
  return body.includes('withPublicDiscoveryInvalidation')
}

describe('dual-implementation behavioral parity', () => {
  it('production MCP serves on Vercel Node while wiring the live *-cloudflare implementation', () => {
    expect(mcpRoute).toMatch(/export const runtime\s*=\s*['"]nodejs['"]/)
    expect(mcpRoute).toContain("from '@/modules/merchant/mcp/server-cloudflare'")
    expect(mcpRoute).not.toContain("from '@/modules/merchant/mcp/server'")
  })

  it('live campaign mutations that Prisma invalidates also wrap withPublicDiscoveryInvalidation', () => {
    for (const name of ['createCampaignDraft', 'updateCampaign', 'setCampaignFrames'] as const) {
      expect(mutationUsesDiscoveryInvalidation(prismaCampaign, name)).toBe(true)
      expect(mutationUsesDiscoveryInvalidation(liveCampaign, name)).toBe(true)
    }
  })

  it('Prisma publish/archive invalidate discovery; live path keeps explicit out-of-scope errors', () => {
    expect(mutationUsesDiscoveryInvalidation(prismaCampaign, 'publishCampaign')).toBe(true)
    expect(mutationUsesDiscoveryInvalidation(prismaCampaign, 'archiveCampaign')).toBe(true)
    expect(liveCampaign).toContain('CLOUDFLARE_PUBLISH_OUT_OF_SCOPE')
    expect(liveMcpServer).not.toContain("registerTool('publish_campaign'")
    expect(liveMcpServer).not.toContain("registerTool('archive_campaign'")
    expect(alternateMcpServer).toContain("registerTool('publish_campaign'")
    expect(alternateMcpServer).toContain("registerTool('archive_campaign'")
  })
})
