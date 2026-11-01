/** @jest-environment node */

import fs from 'node:fs'
import path from 'node:path'
import {
  SEO_EDGE_CACHE_TARGETS,
  seoEdgeExactPurgeBody,
  validateSeoEdgeOriginDocument,
} from '../../cloudflare-router/seo-edge-cache-release'

const ROOT = path.join(__dirname, '../..')

function originHtml(target: (typeof SEO_EDGE_CACHE_TARGETS)[number], extras = ''): string {
  return `<!doctype html><html><head>
    <title>${target.title}</title>
    <link rel="canonical" href="https://www.visutry.com${target.path}">
    <meta name="robots" content="index,follow">
    </head><body><h1>${target.title}</h1>${'ok'.repeat(100)}${extras}</body></html>`
}

function htmlResponse(status = 200): Response {
  return new Response(null, { status, headers: { 'content-type': 'text/html; charset=utf-8' } })
}

describe('two-URL SEO edge cache repair gate', () => {
  it('has exactly the two production round-face URLs and never a zone-wide purge', () => {
    const body = seoEdgeExactPurgeBody()
    expect(body).toEqual({
      files: [
        'https://www.visutry.com/ru/style/round-face',
        'https://www.visutry.com/de/style/round-face',
      ],
    })
    expect(JSON.stringify(body)).not.toMatch(/purge_everything|prefixes|hosts|tags/)
  })

  it.each(SEO_EDGE_CACHE_TARGETS)('accepts only the new title, H1 and self-canonical for $path', (target) => {
    expect(validateSeoEdgeOriginDocument(target, htmlResponse(), originHtml(target))).toEqual([])
  })

  it('rejects stale title or stale H1 before allowing a purge', () => {
    const target = SEO_EDGE_CACHE_TARGETS[0]
    const good = originHtml(target)
    expect(validateSeoEdgeOriginDocument(target, htmlResponse(), good.replace(
      `<title>${target.title}</title>`, '<title>outdated</title>',
    ))).toContain(`expected new title ${target.title}`)
    expect(validateSeoEdgeOriginDocument(target, htmlResponse(), good.replace(
      `<h1>${target.title}</h1>`, '<h1>outdated</h1>',
    ))).toContain(`expected new H1 ${target.title}`)
  })

  it('rejects wrong canonical, noindex, and HTTP errors', () => {
    const target = SEO_EDGE_CACHE_TARGETS[1]
    const good = originHtml(target)
    expect(validateSeoEdgeOriginDocument(target, htmlResponse(), good.replace(
      `https://www.visutry.com${target.path}`, 'https://www.visutry.com/de/style/oval-face',
    )).join(' ')).toContain('canonical')
    expect(validateSeoEdgeOriginDocument(target, htmlResponse(), good.replace('index,follow', 'noindex,follow')))
      .toContain('origin is noindex')
    expect(validateSeoEdgeOriginDocument(target, htmlResponse(503), good).join(' ')).toContain('HTTP 503')
  })

  it('keeps the secret-bearing workflow strictly manual and fail-closed', () => {
    const workflow = fs.readFileSync(path.join(ROOT, '.github/workflows/seo-edge-cache-release.yml'), 'utf8')
    const release = fs.readFileSync(path.join(ROOT, 'scripts/seo-edge-cache-release.ts'), 'utf8')
    expect(workflow).toContain('workflow_dispatch:')
    expect(workflow).not.toMatch(/^  (push|schedule|repository_dispatch|issue_comment|pull_request):/m)
    expect(workflow).toContain("if: github.ref == 'refs/heads/main'")
    expect(workflow).toContain('permissions:\n  contents: read')
    expect(workflow).toContain('cancel-in-progress: false')
    expect(workflow).toContain('CLOUDFLARE_D1_CACHE_PURGE_TOKEN')
    expect(workflow).toContain('VERCEL_D1_DEPLOYMENT_READ_TOKEN')
    expect(release).toContain("process.env.SEO_EDGE_PURGE_APPROVED !== '1'")
    expect(release).toContain('await verifyProductionOrigin()')
    expect(release).toContain('seoEdgeExactPurgeBody()')
    expect(release).not.toContain('purge_everything')
  })
})
