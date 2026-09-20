import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.join(__dirname, '../..')
const smoke = fs.readFileSync(path.join(ROOT, 'scripts/production-smoke.mjs'), 'utf8')

describe('production smoke ownership contract', () => {
  it('keeps the exact public HTML allowlist separate from Vercel-owned application HTML', () => {
    expect(smoke).toContain("const cloudflareHtmlRoutes = [")
    for (const route of [
      '/en',
      '/en/face-shape-detector',
      '/en/what-glasses-suit-my-face',
      '/en/ai-glasses-advisor',
      '/en/virtual-glasses-try-on',
      '/en/blog/ai-face-analysis-for-glasses-guide',
      '/en/brand/gentle-monster',
    ]) {
      expect(smoke).toContain(`{ path: '${route}' }`)
    }
    expect(smoke).toContain("const nextHtmlRoutes = [")
    expect(smoke).toContain("{ path: '/en/glasses-guide' }")
    expect(smoke).toContain("{ path: '/en/face-analysis', bodyMarker: /AI Glasses Advisor/i }")
  })

  it('keeps the root locale redirect and Next client graph Vercel-owned', () => {
    expect(smoke).toContain("async function checkLocaleRedirect()")
    expect(smoke).toContain("assertVercelOwnership(response.headers, 'locale redirect /')")
    expect(smoke).toContain("assertVercelOwnership(response.headers, `RSC ${path}`)")
    expect(smoke).toContain("assertVercelOwnership(response.headers, `${label} asset ${assetPath}`)")
    expect(smoke).toContain("x-visutry-router-cache') !== 'public-html-offload'")
  })
})
