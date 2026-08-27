/**
 * Live MCP uses the canonical Prisma application layer on Vercel Node.
 * The `*-cloudflare` / raw-SQL family remains a Cloudflare-build adapter only.
 *
 * Campaign behavioral contracts live in `campaign-service.test.ts` (canonical)
 * and `cloudflare-write-parity.test.ts` (adapter subset). This file asserts
 * wiring + tool-registry single-sourcing rather than lexical invalidation checks.
 */

import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  MCP_CLOUDFLARE_ADAPTER_UNAVAILABLE,
  MCP_LIVE_RUNTIME,
  MCP_TOOL_NAMES,
  mcpToolsForRuntime,
} from '@/modules/merchant/mcp/tool-registry'

const mcpRoute = readFileSync(join(process.cwd(), 'src/app/api/mcp/route.ts'), 'utf8')
const liveMcpServer = readFileSync(
  join(process.cwd(), 'src/modules/merchant/mcp/server.ts'),
  'utf8',
)
const adapterMcpServer = readFileSync(
  join(process.cwd(), 'src/modules/merchant/mcp/server-cloudflare.ts'),
  'utf8',
)
const nextConfig = readFileSync(join(process.cwd(), 'next.config.js'), 'utf8')

function registeredTools(source: string): string[] {
  return [...source.matchAll(/registerTool\('([a-z_]+)'/g)].map((match) => match[1])
}

describe('MCP live path + tool-registry convergence', () => {
  it('production MCP serves on Vercel Node and wires the canonical Prisma MCP server', () => {
    expect(mcpRoute).toMatch(/export const runtime\s*=\s*['"]nodejs['"]/)
    expect(mcpRoute).toContain("from '@/modules/merchant/mcp/server'")
    expect(mcpRoute).toContain("from '@/modules/merchant/application/merchant-mcp'")
    expect(mcpRoute).not.toContain('server-cloudflare')
    expect(mcpRoute).not.toContain('merchant-mcp-cloudflare')
    expect(MCP_LIVE_RUNTIME).toBe('canonical-prisma')
  })

  it('CLOUDFLARE_BUILD aliases keep the raw-SQL adapter for true CF bundles only', () => {
    expect(nextConfig).toContain("merchant/mcp/server$")
    expect(nextConfig).toContain('server-cloudflare.ts')
    expect(nextConfig).toContain('merchant-mcp-cloudflare.ts')
  })

  it('live MCP registers exactly the registry LIVE tool set including publish_campaign', () => {
    const liveTools = registeredTools(liveMcpServer)
    expect(liveTools).toEqual([...MCP_TOOL_NAMES])
    expect(liveTools).toContain('publish_campaign')
    expect(liveTools).toContain('archive_campaign')
    expect(liveTools).toContain('inspect_catalog_source')
    expect(liveTools).toContain('compare_experiences')
    expect(liveMcpServer).toContain("from './tool-registry'")
  })

  it('cloudflare adapter registers only the declared adapter subset', () => {
    const adapterTools = registeredTools(adapterMcpServer)
    expect(adapterTools).toEqual([...mcpToolsForRuntime('cloudflare-raw-sql')])
    for (const name of MCP_CLOUDFLARE_ADAPTER_UNAVAILABLE) {
      expect(adapterTools).not.toContain(name)
    }
    expect(adapterMcpServer).toContain("from './tool-registry'")
  })
})
