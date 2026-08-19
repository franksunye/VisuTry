#!/usr/bin/env node
/**
 * Low-volume cache header probe for OpenNext static-assets incremental cache.
 * Sends sequential requests and prints x-nextjs-cache / router headers.
 */
import { spawnSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 VisuTry-OpenNext-Cache-Probe/1.0'

function sleepMs(ms) {
  spawnSync('sleep', [String(Math.max(0, ms) / 1000)])
}

function parseHeaderBlocks(raw) {
  const blocks = []
  for (const part of raw.split(/\r?\n\r?\n/)) {
    const lines = part.split(/\r?\n/).filter(Boolean)
    if (!lines.length || !/^HTTP\/\d/.test(lines[0])) continue
    const headers = {}
    for (const line of lines.slice(1)) {
      const idx = line.indexOf(':')
      if (idx === -1) continue
      headers[line.slice(0, idx).trim().toLowerCase()] = line.slice(idx + 1).trim()
    }
    const statusMatch = lines[0].match(/HTTP\/\S+\s+(\d+)/)
    blocks.push({ status: statusMatch ? Number(statusMatch[1]) : null, headers })
  }
  return blocks
}

function requestOnce(url, init = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'visutry-cache-probe-'))
  const headerFile = join(dir, 'headers.txt')
  const bodyFile = join(dir, 'body.bin')
  try {
    const args = [
      '-sS', '-4', '--http2', '--location', '--max-redirs', '5',
      '--max-time', '30',
      '-A', USER_AGENT,
      '-D', headerFile, '-o', bodyFile,
      '-w', 'http_code=%{http_code}\\n',
      url,
    ]
    if (init.method === 'HEAD') args.splice(1, 0, '-I')
    if (init.headers) {
      for (const [key, value] of Object.entries(init.headers)) {
        args.push('-H', `${key}: ${value}`)
      }
    }
    const result = spawnSync('curl', args, { encoding: 'utf8' })
    const headerRaw = readFileSync(headerFile, 'utf8')
    const body = readFileSync(bodyFile)
    const blocks = parseHeaderBlocks(headerRaw)
    const finalBlock = blocks.at(-1) || { status: null, headers: {} }
    const statusMatch = (result.stdout || '').match(/http_code=(\d+)/)
    return {
      status: statusMatch ? Number(statusMatch[1]) : finalBlock.status,
      headers: finalBlock.headers,
      bodyPreview: body.toString('utf8', 0, 200),
    }
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
}

function pick(headers, keys) {
  const out = {}
  for (const key of keys) {
    if (headers[key] != null) out[key] = headers[key]
  }
  return out
}

function probeLabel(origin, path, attempts, init = {}) {
  const url = `${origin.replace(/\/$/, '')}${path}`
  const rows = []
  for (let i = 1; i <= attempts; i += 1) {
    const sample = requestOnce(url, init)
    rows.push({
      attempt: i,
      status: sample.status,
      ...pick(sample.headers, [
        'x-nextjs-cache',
        'x-opennext-cache',
        'x-visutry-router-backend',
        'x-visutry-router-layer',
        'x-visutry-router-cache',
        'cf-ray',
        'age',
        'cache-control',
        'server-timing',
        'content-type',
        'link',
      ]),
    })
    if (i < attempts) sleepMs(700)
  }
  return rows
}

function extractCanonical(bodyPreview) {
  const match = bodyPreview.match(/rel="canonical" href="([^"]+)"/)
  return match?.[1] ?? null
}

function main() {
  const args = process.argv.slice(2)
  const origin = args[0] || 'http://127.0.0.1:8787'
  const attempts = Number(args[1] || 3)
  const routes = [
    { label: 'hub', path: '/en/glasses-guide' },
    { label: 'detail', path: '/en/glasses-guide/best-rectangle-glasses-for-round-face' },
    { label: 'de-hub', path: '/de/glasses-guide' },
    { label: 'ar-hub', path: '/ar/glasses-guide' },
    { label: 'invalid', path: '/en/glasses-guide/definitely-invalid-slug' },
  ]

  const report = {
    origin,
    attempts,
    generatedAt: new Date().toISOString(),
    routes: {},
  }

  for (const route of routes) {
    report.routes[route.path] = probeLabel(origin, route.path, attempts)
  }

  report.head = probeLabel(origin, '/en/glasses-guide', 1, { method: 'HEAD' })
  report.rsc = probeLabel(origin, '/en/glasses-guide', 1, {
    headers: {
      Accept: 'text/x-component',
      RSC: '1',
    },
  })

  const hubHtml = requestOnce(`${origin.replace(/\/$/, '')}/en/glasses-guide`)
  report.canonical = extractCanonical(hubHtml.bodyPreview)

  console.log(JSON.stringify(report, null, 2))
}

main()
