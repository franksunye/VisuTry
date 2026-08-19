#!/usr/bin/env node
/**
 * Bounded Hybrid vs Direct Vercel parity for Glasses Guide after cache fix.
 */
import { spawnSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const HYBRID = 'https://www.visutry.com'
const VERCEL = 'https://visutry.vercel.app'
const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 VisuTry-GG-Parity/1.0'

const ROUTES = [
  '/en/glasses-guide',
  '/en/glasses-guide/best-rectangle-glasses-for-round-face',
  '/en/glasses-guide/best-square-glasses-for-round-face',
  '/en/glasses-guide/best-browline-glasses-for-round-face',
  '/de/glasses-guide',
  '/de/glasses-guide/best-rectangle-glasses-for-round-face',
  '/ar/glasses-guide',
  '/ar/glasses-guide/best-rectangle-glasses-for-round-face',
  '/en/glasses-guide/definitely-invalid-slug',
]

function request(origin, path, init = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'visutry-gg-parity-'))
  const headerFile = join(dir, 'headers.txt')
  const bodyFile = join(dir, 'body.bin')
  try {
    const args = [
      '-sS', '-4', '--http2', '--location', '--max-redirs', '5',
      '--max-time', '30', '-A', UA,
      '-D', headerFile, '-o', bodyFile,
      '-w', 'http_code=%{http_code}\\n',
      `${origin}${path}`,
    ]
    if (init.method === 'HEAD') args.splice(1, 0, '-I')
    if (init.headers) {
      for (const [key, value] of Object.entries(init.headers)) {
        args.push('-H', `${key}: ${value}`)
      }
    }
    const result = spawnSync('curl', args, { encoding: 'utf8' })
    const headerRaw = readFileSync(headerFile, 'utf8')
    const body = readFileSync(bodyFile).toString('utf8')
    const blocks = headerRaw.split(/\r?\n\r?\n/).filter(Boolean)
    const last = blocks.at(-1) || ''
    const headers = {}
    for (const line of last.split(/\r?\n/).slice(1)) {
      const idx = line.indexOf(':')
      if (idx === -1) continue
      headers[line.slice(0, idx).trim().toLowerCase()] = line.slice(idx + 1).trim()
    }
    const statusMatch = (result.stdout || '').match(/http_code=(\d+)/)
    const canonical = body.match(/rel="canonical" href="([^"]+)"/)?.[1] ?? null
    const rtl = /dir="rtl"/.test(body.slice(0, 4000))
    const title = body.match(/<title>([^<]+)<\/title>/i)?.[1] ?? null
    return {
      status: statusMatch ? Number(statusMatch[1]) : null,
      canonical,
      rtl,
      title,
      headers: {
        'x-nextjs-cache': headers['x-nextjs-cache'] ?? null,
        'x-vercel-cache': headers['x-vercel-cache'] ?? null,
        'x-visutry-router-backend': headers['x-visutry-router-backend'] ?? null,
        'x-visutry-router-layer': headers['x-visutry-router-layer'] ?? null,
        'content-type': headers['content-type'] ?? null,
      },
    }
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
}

function compare(path) {
  const hybrid = request(HYBRID, path)
  const vercel = request(VERCEL, path)
  const pass =
    hybrid.status === vercel.status &&
    !(vercel.status === 200 && hybrid.status === 404) &&
    (hybrid.status !== 200 || hybrid.canonical === vercel.canonical)
  return { path, hybrid, vercel, pass }
}

function main() {
  const rows = ROUTES.map(compare)
  const head = {
    path: '/en/glasses-guide (HEAD)',
    hybrid: request(HYBRID, '/en/glasses-guide', { method: 'HEAD' }),
    vercel: request(VERCEL, '/en/glasses-guide', { method: 'HEAD' }),
  }
  head.pass = head.hybrid.status === head.vercel.status
  const rsc = {
    path: '/en/glasses-guide (RSC)',
    hybrid: request(HYBRID, '/en/glasses-guide', {
      headers: { Accept: 'text/x-component', RSC: '1' },
    }),
    vercel: request(VERCEL, '/en/glasses-guide', {
      headers: { Accept: 'text/x-component', RSC: '1' },
    }),
  }
  rsc.pass = rsc.hybrid.status === rsc.vercel.status

  const all = [...rows, head, rsc]
  const passCount = all.filter((row) => row.pass).length
  const report = {
    generatedAt: new Date().toISOString(),
    pass: passCount === all.length,
    passCount,
    total: all.length,
    rows: all,
  }
  console.log(JSON.stringify(report, null, 2))
  process.exit(report.pass ? 0 : 1)
}

main()
