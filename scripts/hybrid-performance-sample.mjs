#!/usr/bin/env node
/**
 * Read-only hybrid vs direct-Vercel latency sample.
 *
 * Does not change Cloudflare, DNS, cache rules, Vercel, Neon, or app behavior.
 * GET only. Concurrency 1. Alternate hybrid/vercel to reduce time-of-day bias.
 *
 * Usage:
 *   node scripts/hybrid-performance-sample.mjs
 *   node scripts/hybrid-performance-sample.mjs --validate-only
 *   node scripts/hybrid-performance-sample.mjs --warmup 5 --samples 30
 */

import { spawnSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync, mkdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const HYBRID_ORIGIN = 'https://www.visutry.com'
const VERCEL_ORIGIN = 'https://visutry.vercel.app'
const GIT_ALIAS_ORIGIN = 'https://visutry-git-main-sunye.vercel.app'
const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36 VisuTry-Hybrid-Perf-Sample/1.1'
const ACCEPT = 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.8'

const HEADER_ALLOWLIST = [
  'server',
  'cf-ray',
  'cf-cache-status',
  'cf-apo-via',
  'cf-worker',
  'x-visutry-router-backend',
  'x-visutry-router-invocation',
  'x-visutry-router-layer',
  'x-visutry-router-class',
  'x-visutry-router-cache',
  'layer',
  'invocation',
  'x-matched-path',
  'x-vercel-id',
  'x-vercel-cache',
  'x-vercel-mitigated',
  'age',
  'cache-control',
  'content-type',
  'content-length',
  'location',
  'vary',
  'x-opennext-cache',
  'x-opennext-revalidate',
]

const FALLBACK_ROUTES = [
  { path: '/', owner: 'vercel-fallback' },
  { path: '/en', owner: 'vercel-fallback' },
  { path: '/en/face-analysis', owner: 'vercel-fallback' },
]

const CLOUDFLARE_HUB = { path: '/en/glasses-guide', owner: 'cloudflare' }
const CANDIDATE_DETAIL_SLUGS = [
  'rectangle-glasses',
  'best-rectangle-glasses-for-round-face',
]

const CURL_WRITEOUT = [
  'http_code=%{http_code}',
  'num_redirects=%{num_redirects}',
  'url_effective=%{url_effective}',
  'time_namelookup=%{time_namelookup}',
  'time_connect=%{time_connect}',
  'time_appconnect=%{time_appconnect}',
  'time_pretransfer=%{time_pretransfer}',
  'time_starttransfer=%{time_starttransfer}',
  'time_total=%{time_total}',
  'size_download=%{size_download}',
  'remote_ip=%{remote_ip}',
].join('\\n')

function parseArgs(argv) {
  const out = {
    warmup: 5,
    samples: 30,
    timeoutSec: 30,
    delayMs: 400,
    vercelOrigin: VERCEL_ORIGIN,
    onlyRoutes: null,
    validateOnly: false,
    outDir: 'docs/operations/evidence/hybrid-performance',
  }
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]
    if (arg === '--validate-only') out.validateOnly = true
    else if (arg === '--warmup') out.warmup = Number(argv[++i])
    else if (arg === '--samples') out.samples = Number(argv[++i])
    else if (arg === '--timeout') out.timeoutSec = Number(argv[++i])
    else if (arg === '--delay-ms') out.delayMs = Number(argv[++i])
    else if (arg === '--vercel-origin') out.vercelOrigin = String(argv[++i]).replace(/\/$/, '')
    else if (arg === '--routes') out.onlyRoutes = String(argv[++i]).split(',').map((item) => item.trim()).filter(Boolean)
    else if (arg === '--out-dir') out.outDir = argv[++i]
    else throw new Error(`Unknown argument: ${arg}`)
  }
  if (!Number.isFinite(out.warmup) || out.warmup < 0) throw new Error('invalid --warmup')
  if (!Number.isFinite(out.samples) || out.samples < 1) throw new Error('invalid --samples')
  if (!Number.isFinite(out.timeoutSec) || out.timeoutSec < 5) throw new Error('invalid --timeout')
  if (!Number.isFinite(out.delayMs) || out.delayMs < 0) throw new Error('invalid --delay-ms')
  if (!/^https:\/\/[^/]+\.vercel\.app$/.test(out.vercelOrigin)) throw new Error('invalid --vercel-origin')
  return out
}

function nowIso() {
  return new Date().toISOString()
}

function secToMs(value) {
  const n = Number(value)
  if (!Number.isFinite(n)) return null
  return Math.round(n * 1000)
}

function parseWriteout(text) {
  const rows = {}
  for (const line of text.trim().split('\n')) {
    const idx = line.indexOf('=')
    if (idx === -1) continue
    rows[line.slice(0, idx)] = line.slice(idx + 1)
  }
  return rows
}

function parseHeaderBlocks(raw) {
  const blocks = []
  const parts = raw.split(/\r?\n\r?\n/)
  for (const part of parts) {
    const lines = part.split(/\r?\n/).filter(Boolean)
    if (!lines.length || !/^HTTP\/\d/.test(lines[0])) continue
    const headers = {}
    for (const line of lines.slice(1)) {
      const idx = line.indexOf(':')
      if (idx === -1) continue
      headers[line.slice(0, idx).trim().toLowerCase()] = line.slice(idx + 1).trim()
    }
    const statusMatch = lines[0].match(/HTTP\/\S+\s+(\d+)/)
    blocks.push({
      statusLine: lines[0],
      status: statusMatch ? Number(statusMatch[1]) : null,
      headers,
    })
  }
  return blocks
}

function pickHeaders(headers) {
  const picked = {}
  for (const key of HEADER_ALLOWLIST) {
    if (headers[key] != null) picked[key] = headers[key]
  }
  return picked
}

function sleepMs(ms) {
  if (!ms) return
  spawnSync('sleep', [String(ms / 1000)])
}

function requestOnce(url, timeoutSec) {
  const dir = mkdtempSync(join(tmpdir(), 'visutry-hybrid-perf-'))
  const headerFile = join(dir, 'headers.txt')
  const bodyFile = join(dir, 'body.bin')
  try {
    const startedAt = nowIso()
    const result = spawnSync(
      'curl',
      [
        '-sS',
        '-4',
        '--http2',
        '--location',
        '--max-redirs',
        '5',
        '--max-time',
        String(timeoutSec),
        '-A',
        USER_AGENT,
        '-H',
        `Accept: ${ACCEPT}`,
        '-H',
        'Accept-Language: en-US,en;q=0.9',
        '-D',
        headerFile,
        '-o',
        bodyFile,
        '-w',
        CURL_WRITEOUT,
        url,
      ],
      { encoding: 'utf8' },
    )
    const headerRaw = readFileSync(headerFile, 'utf8')
    const blocks = parseHeaderBlocks(headerRaw)
    const finalBlock = blocks.at(-1) || { status: null, headers: {} }
    const writeout = parseWriteout(result.stdout || '')
    const namelookup = Number(writeout.time_namelookup)
    const connect = Number(writeout.time_connect)
    const appconnect = Number(writeout.time_appconnect)
    const pretransfer = Number(writeout.time_pretransfer)
    const starttransfer = Number(writeout.time_starttransfer)
    const total = Number(writeout.time_total)
    return {
      timestamp: startedAt,
      url,
      curlExit: result.status,
      curlError: result.status === 0 ? null : (result.stderr || 'curl failed').trim().slice(0, 300),
      httpStatus: writeout.http_code ? Number(writeout.http_code) : finalBlock.status,
      redirectCount: writeout.num_redirects ? Number(writeout.num_redirects) : Math.max(0, blocks.length - 1),
      firstStatus: blocks[0]?.status ?? null,
      firstLocation: blocks[0]?.headers?.location ?? null,
      finalUrl: writeout.url_effective || url,
      remoteIp: writeout.remote_ip || null,
      dnsMs: secToMs(namelookup),
      tcpConnectMs: Number.isFinite(connect) && Number.isFinite(namelookup) ? Math.max(0, Math.round((connect - namelookup) * 1000)) : null,
      tlsMs: Number.isFinite(appconnect) && Number.isFinite(connect) ? Math.max(0, Math.round((appconnect - connect) * 1000)) : null,
      waitingMs: Number.isFinite(starttransfer) && Number.isFinite(pretransfer) ? Math.max(0, Math.round((starttransfer - pretransfer) * 1000)) : null,
      ttfbMs: secToMs(starttransfer),
      totalMs: secToMs(total),
      responseSize: writeout.size_download ? Number(writeout.size_download) : 0,
      headers: pickHeaders(finalBlock.headers || {}),
    }
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
}

function isRetryableStatus(sample) {
  return sample.curlExit !== 0 || sample.httpStatus === 403 || sample.httpStatus === 429 || sample.httpStatus === 503
}

function requestWithRetry(url, timeoutSec, { retries = 1, delayMs = 400 } = {}) {
  let last = requestOnce(url, timeoutSec)
  last.attempt = 1
  for (let i = 0; i < retries && isRetryableStatus(last); i += 1) {
    sleepMs(1500 * (i + 1))
    last = requestOnce(url, timeoutSec)
    last.attempt = i + 2
  }
  sleepMs(delayMs)
  return last
}

function hostOf(url) {
  try {
    return new URL(url).hostname
  } catch {
    return ''
  }
}

function isDirectVercelSample(sample) {
  const server = (sample.headers.server || '').toLowerCase()
  const hasCfRay = Boolean(sample.headers['cf-ray'])
  const hasCfCache = Boolean(sample.headers['cf-cache-status'])
  const finalHost = hostOf(sample.finalUrl)
  const redirectedToWww = finalHost === 'www.visutry.com' || (sample.firstLocation || '').includes('www.visutry.com')
  return {
    ok:
      sample.curlExit === 0 &&
      server === 'vercel' &&
      !hasCfRay &&
      !hasCfCache &&
      !redirectedToWww &&
      finalHost.endsWith('.vercel.app'),
    server,
    hasCfRay,
    hasCfCache,
    redirectedToWww,
    finalHost,
    httpStatus: sample.httpStatus,
  }
}

function classifyObservedOwner(sample, expectedOwner) {
  const headers = sample?.headers || {}
  const backend = headers['x-visutry-router-backend'] || null
  const layer = headers['x-visutry-router-layer'] || headers.layer || null
  const invocation = headers['x-visutry-router-invocation'] || headers.invocation || null
  const hasVercelId = Boolean(headers['x-vercel-id'])
  const hasCfRay = Boolean(headers['cf-ray'])
  if (backend === 'cloudflare') return { expectedOwner, observed: 'cloudflare-worker', backend, layer, invocation }
  if (hasCfRay && hasVercelId && !backend) return { expectedOwner, observed: 'cloudflare-proxy-vercel', backend, layer, invocation }
  if (!hasCfRay && hasVercelId) return { expectedOwner, observed: 'direct-vercel', backend, layer, invocation }
  return { expectedOwner, observed: 'unknown', backend, layer, invocation }
}

function percentile(values, p) {
  if (!values.length) return null
  const sorted = [...values].sort((a, b) => a - b)
  if (sorted.length === 1) return sorted[0]
  const idx = (sorted.length - 1) * p
  const lo = Math.floor(idx)
  const hi = Math.ceil(idx)
  if (lo === hi) return sorted[lo]
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo)
}

function round1(n) {
  return n == null ? null : Math.round(n * 10) / 10
}

function deltaPct(hybrid, vercel) {
  if (hybrid == null || vercel == null || vercel === 0) return null
  return ((hybrid - vercel) / vercel) * 100
}

function magnitudeFromPcts(pcts) {
  const abs = pcts.map((n) => Math.abs(n)).filter((n) => Number.isFinite(n))
  if (!abs.length) return 'n/a'
  const worst = Math.max(...abs)
  if (worst < 5) return 'neutral'
  return worst > 10 ? 'material difference' : 'small difference'
}

function classVerdict(rows) {
  if (!rows.length) return { label: 'INCONCLUSIVE', magnitude: 'n/a' }
  const winners = new Set(rows.map((row) => row.winner))
  winners.delete('neutral')
  const pcts = rows.map((row) => row.pair.ttfbDeltaPct).filter((n) => n != null)
  if (winners.size === 0) return { label: 'EFFECTIVELY NEUTRAL', magnitude: 'neutral' }
  if (winners.size > 1) return { label: 'MIXED', magnitude: 'routes disagree' }
  const only = [...winners][0]
  if (only === 'hybrid') return { label: 'HYBRID FASTER', magnitude: magnitudeFromPcts(pcts) }
  if (only === 'vercel') return { label: 'HYBRID SLOWER', magnitude: magnitudeFromPcts(pcts) }
  return { label: 'INCONCLUSIVE', magnitude: 'n/a' }
}

function winnerFromP50(hybrid, vercel) {
  const pct = deltaPct(hybrid, vercel)
  if (pct == null) return 'inconclusive'
  if (Math.abs(pct) < 5) return 'neutral'
  return pct > 0 ? 'vercel' : 'hybrid'
}

function statsFor(samples) {
  const ok = samples.filter((s) => s.curlExit === 0 && s.httpStatus >= 200 && s.httpStatus < 400)
  const ttfb = ok.map((s) => s.ttfbMs).filter((n) => n != null)
  const total = ok.map((s) => s.totalMs).filter((n) => n != null)
  return {
    n: samples.length,
    ok: ok.length,
    errorRate: samples.length ? (samples.length - ok.length) / samples.length : 1,
    ttfbP50: round1(percentile(ttfb, 0.5)),
    ttfbP95: round1(percentile(ttfb, 0.95)),
    totalP50: round1(percentile(total, 0.5)),
    totalP95: round1(percentile(total, 0.95)),
    statuses: samples.reduce((acc, s) => {
      const key = String(s.httpStatus ?? 'none')
      acc[key] = (acc[key] || 0) + 1
      return acc
    }, {}),
  }
}

function medianPair(hybridStats, vercelStats) {
  const ttfbDeltaMs = hybridStats.ttfbP50 != null && vercelStats.ttfbP50 != null
    ? round1(hybridStats.ttfbP50 - vercelStats.ttfbP50)
    : null
  const totalDeltaMs = hybridStats.totalP50 != null && vercelStats.totalP50 != null
    ? round1(hybridStats.totalP50 - vercelStats.totalP50)
    : null
  return {
    ttfbDeltaMs,
    ttfbDeltaPct: round1(deltaPct(hybridStats.ttfbP50, vercelStats.ttfbP50)),
    totalDeltaMs,
    totalDeltaPct: round1(deltaPct(hybridStats.totalP50, vercelStats.totalP50)),
    winner: winnerFromP50(hybridStats.ttfbP50, vercelStats.ttfbP50),
  }
}

function weightedMedian(pairs) {
  const usable = pairs.filter((p) => p.hybrid != null && p.vercel != null)
  if (!usable.length) return { hybrid: null, vercel: null, deltaMs: null, deltaPct: null }
  const hybrid = round1(percentile(usable.map((p) => p.hybrid), 0.5))
  const vercel = round1(percentile(usable.map((p) => p.vercel), 0.5))
  return {
    hybrid,
    vercel,
    deltaMs: hybrid != null && vercel != null ? round1(hybrid - vercel) : null,
    deltaPct: round1(deltaPct(hybrid, vercel)),
  }
}

function probePath(origin, path, timeoutSec, options = {}) {
  return requestWithRetry(`${origin}${path}`, timeoutSec, options)
}

function resolveDetailRoute(timeoutSec, notes, vercelOrigin) {
  for (const slug of CANDIDATE_DETAIL_SLUGS) {
    const path = `/en/glasses-guide/${slug}`
    const hybrid = probePath(HYBRID_ORIGIN, path, timeoutSec)
    const vercel = probePath(vercelOrigin, path, timeoutSec)
    notes.push({
      path,
      hybridStatus: hybrid.httpStatus,
      vercelStatus: vercel.httpStatus,
      hybridBackend: hybrid.headers['x-visutry-router-backend'] || null,
      vercelServer: vercel.headers.server || null,
    })
    const comparable = hybrid.httpStatus === 200 && vercel.httpStatus === 200
    if (comparable || vercel.httpStatus === 200) {
      return {
        path,
        owner: 'cloudflare',
        comparable,
        hybridStatus: hybrid.httpStatus,
        vercelStatus: vercel.httpStatus,
        reason: comparable
          ? 'both endpoints returned 200'
          : `Vercel 200 / Hybrid ${hybrid.httpStatus}; not semantically equivalent`,
      }
    }
  }
  return null
}

function validateBaseline(timeoutSec, vercelOrigin, paths = ['/', '/en', '/en/face-analysis', '/en/glasses-guide']) {
  const checks = []
  let clean = true
  for (const path of paths) {
    const sample = probePath(vercelOrigin, path, timeoutSec)
    const direct = isDirectVercelSample(sample)
    const okStatus = path === '/'
      ? sample.httpStatus === 200 && sample.redirectCount >= 1
      : sample.httpStatus === 200
    const row = {
      path,
      ...direct,
      httpStatus: sample.httpStatus,
      redirectCount: sample.redirectCount,
      firstLocation: sample.firstLocation,
      finalUrl: sample.finalUrl,
      xMatchedPath: sample.headers['x-matched-path'] || null,
      ok: direct.ok && okStatus,
    }
    if (!row.ok) clean = false
    checks.push(row)
  }

  const gitAlias = probePath(GIT_ALIAS_ORIGIN, '/en', timeoutSec)
  const gitDirect = isDirectVercelSample(gitAlias)

  return {
    hybridOrigin: HYBRID_ORIGIN,
    vercelOrigin,
    cleanBaseline: clean,
    stopReason: clean
      ? null
      : `${vercelOrigin} is not a clean direct-Vercel baseline (Cloudflare headers, www redirect, or non-equivalent status).`,
    vercelChecks: checks,
    sameVersionAlias: {
      origin: GIT_ALIAS_ORIGIN,
      ok: gitDirect.ok && gitAlias.httpStatus === 200,
      httpStatus: gitAlias.httpStatus,
      server: gitAlias.headers.server || null,
      hasCfRay: Boolean(gitAlias.headers['cf-ray']),
      finalHost: hostOf(gitAlias.finalUrl),
      note: 'Existing git production alias. Not used as the sample origin; production fallback remains visutry.vercel.app.',
    },
  }
}

function fmtMs(n) {
  return n == null ? 'n/a' : `${n}`
}

function fmtPct(n) {
  if (n == null) return 'n/a'
  const sign = n > 0 ? '+' : ''
  return `${sign}${n.toFixed(1)}%`
}

function fmtDeltaMs(n) {
  if (n == null) return 'n/a'
  const sign = n > 0 ? '+' : ''
  return `${sign}${n}`
}

function buildSummaryText({
  fallbackMedian,
  cloudflareMedian,
  fallbackVerdict,
  cloudflareVerdict,
  comparableRows,
  overall,
  caveats,
}) {
  const lines = [
    'VISUTRY HYBRID PERFORMANCE RESULT',
    '',
    'Fallback routes:',
    'Hybrid vs Direct Vercel',
    `Median TTFB difference: ${fmtDeltaMs(fallbackMedian.deltaMs)} ms (${fmtPct(fallbackMedian.deltaPct)})`,
    `Result: ${fallbackVerdict.label}${fallbackVerdict.magnitude !== 'n/a' && fallbackVerdict.magnitude !== 'neutral' ? ` (${fallbackVerdict.magnitude})` : ''}`,
    '',
    'Cloudflare-owned Glasses Guide:',
    'Hybrid vs Direct Vercel',
    `Median TTFB improvement: ${cloudflareMedian.deltaMs == null ? 'n/a' : `${round1(-cloudflareMedian.deltaMs)}`} ms (${
      cloudflareMedian.deltaPct == null ? 'n/a' : fmtPct(-cloudflareMedian.deltaPct)
    })`,
    `Result: ${cloudflareVerdict.label}${cloudflareVerdict.magnitude !== 'n/a' && cloudflareVerdict.magnitude !== 'neutral' ? ` (${cloudflareVerdict.magnitude})` : ''}`,
    '',
    'Sampled routes:',
    `Hybrid wins: ${comparableRows.filter((r) => r.winner === 'hybrid').length} / ${comparableRows.length}`,
    `Vercel wins: ${comparableRows.filter((r) => r.winner === 'vercel').length} / ${comparableRows.length}`,
    `Neutral: ${comparableRows.filter((r) => r.winner === 'neutral').length} / ${comparableRows.length}`,
    '',
    'OVERALL:',
    `${overall} for this small sample.`,
    '',
  ]
  if (caveats.length) {
    lines.push('Caveats:')
    for (const caveat of caveats) lines.push(`- ${caveat}`)
    lines.push('')
  }
  return lines.join('\n')
}

function overallLabel({ fallbackVerdict, cloudflareVerdict, comparableRows, expectedComparable }) {
  if (!comparableRows.length) return 'INCONCLUSIVE'
  if (comparableRows.length < expectedComparable) return 'INCONCLUSIVE'
  const hybridWins = comparableRows.filter((r) => r.winner === 'hybrid').length
  const vercelWins = comparableRows.filter((r) => r.winner === 'vercel').length
  if (fallbackVerdict.label === 'MIXED' || cloudflareVerdict.label === 'MIXED') return 'mixed'
  if (fallbackVerdict.label === 'HYBRID SLOWER' && cloudflareVerdict.label === 'HYBRID FASTER') {
    return 'mixed — fallback penalty vs Cloudflare-owned gain; do not average'
  }
  if (fallbackVerdict.label === 'HYBRID FASTER' && cloudflareVerdict.label === 'HYBRID SLOWER') {
    return 'mixed — fallback faster, Cloudflare-owned slower; do not average'
  }
  if (vercelWins && hybridWins) return 'mixed'
  if (fallbackVerdict.label === 'INCONCLUSIVE' && cloudflareVerdict.label === 'INCONCLUSIVE') return 'INCONCLUSIVE'
  if (hybridWins && !vercelWins) return 'CF + Vercel is FASTER'
  if (vercelWins && !hybridWins) return 'CF + Vercel is SLOWER'
  if (fallbackVerdict.label === 'EFFECTIVELY NEUTRAL' && (cloudflareVerdict.label === 'EFFECTIVELY NEUTRAL' || cloudflareVerdict.label === 'INCONCLUSIVE')) {
    return 'CF + Vercel is EFFECTIVELY NEUTRAL'
  }
  return 'mixed'
}

function markdownTable(rows) {
  const header = '| Route | Owner | Hybrid p50 TTFB | Vercel p50 TTFB | Delta ms | Delta % | Hybrid p95 | Vercel p95 | Winner |'
  const sep = '| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |'
  const body = rows.map((row) => {
    return `| ${row.path} | ${row.owner} | ${fmtMs(row.hybrid.ttfbP50)} | ${fmtMs(row.vercel.ttfbP50)} | ${fmtDeltaMs(row.pair.ttfbDeltaMs)} | ${fmtPct(row.pair.ttfbDeltaPct)} | ${fmtMs(row.hybrid.ttfbP95)} | ${fmtMs(row.vercel.ttfbP95)} | ${row.winner} |`
  })
  return [header, sep, ...body].join('\n')
}

function runRouteSample(route, args) {
  const measured = []
  const warmup = []
  const probeOpts = { delayMs: args.delayMs }
  let consecutiveVercel403 = 0
  const pushPair = (phase, seq, bucket) => {
    const hybrid = { ...probePath(HYBRID_ORIGIN, route.path, args.timeoutSec, probeOpts), endpointType: 'hybrid', route: route.path, owner: route.owner, phase, seq }
    const vercel = { ...probePath(args.vercelOrigin, route.path, args.timeoutSec, probeOpts), endpointType: 'vercel', route: route.path, owner: route.owner, phase, seq }
    bucket.push(hybrid, vercel)
    consecutiveVercel403 = vercel.httpStatus === 403 ? consecutiveVercel403 + 1 : 0
    return { hybrid, vercel, aborted: consecutiveVercel403 >= 5 }
  }
  for (let i = 0; i < args.warmup; i += 1) {
    const { hybrid, vercel, aborted } = pushPair('warmup', i + 1, warmup)
    process.stderr.write(`warmup ${route.path} ${i + 1}/${args.warmup} hybrid=${hybrid.httpStatus} vercel=${vercel.httpStatus}\n`)
    if (aborted) return { warmup, measured, aborted: 'vercel-403-streak' }
  }
  for (let i = 0; i < args.samples; i += 1) {
    const { hybrid, vercel, aborted } = pushPair('measured', i + 1, measured)
    process.stderr.write(`sample ${route.path} ${i + 1}/${args.samples} hybrid=${hybrid.ttfbMs}ms/${hybrid.httpStatus} vercel=${vercel.ttfbMs}ms/${vercel.httpStatus}\n`)
    if (aborted) return { warmup, measured, aborted: 'vercel-403-streak' }
  }
  return { warmup, measured, aborted: null }
}

function main() {
  const args = parseArgs(process.argv.slice(2))
  const startedAt = nowIso()
  process.stderr.write(`Validating direct Vercel baseline ${args.vercelOrigin}…\n`)
  const baselinePaths = args.onlyRoutes?.length ? args.onlyRoutes : ['/', '/en', '/en/face-analysis', '/en/glasses-guide']
  const baseline = validateBaseline(args.timeoutSec, args.vercelOrigin, baselinePaths)
  const slugNotes = []
  const detail = args.onlyRoutes && !args.onlyRoutes.some((path) => path.includes('/glasses-guide/'))
    ? null
    : resolveDetailRoute(args.timeoutSec, slugNotes, args.vercelOrigin)
  let routes = [...FALLBACK_ROUTES, CLOUDFLARE_HUB]
  if (detail?.comparable) routes.push(detail)
  if (args.onlyRoutes) {
    routes = routes.filter((route) => args.onlyRoutes.includes(route.path))
    if (!routes.length) throw new Error(`--routes did not match known sample paths: ${args.onlyRoutes.join(',')}`)
  }

  const validation = {
    kind: 'visutry-hybrid-performance-validation',
    startedAt,
    baseline,
    glassesGuideDetail: detail,
    slugProbes: slugNotes,
  }

  if (!baseline.cleanBaseline) {
    const text = [
      'VISUTRY HYBRID PERFORMANCE RESULT',
      '',
      `STOP: ${args.vercelOrigin} is not a clean direct-Vercel baseline.`,
      baseline.stopReason,
      '',
      JSON.stringify(baseline, null, 2),
      '',
    ].join('\n')
    process.stdout.write(text)
    process.exit(2)
  }

  if (args.validateOnly) {
    process.stdout.write(`${JSON.stringify(validation, null, 2)}\n`)
    return
  }

  const allWarmup = []
  const allMeasured = []
  const abortedRoutes = []
  for (const route of routes) {
    const result = runRouteSample(route, args)
    allWarmup.push(...result.warmup)
    allMeasured.push(...result.measured)
    if (result.aborted) {
      abortedRoutes.push({ path: route.path, reason: result.aborted })
      process.stderr.write(`Abort remaining routes after ${route.path}: ${result.aborted}\n`)
      break
    }
  }

  const caveats = [
    'Exploratory first-round sample from one client network. Not an SLO.',
    'p50 is the primary intuitive metric; p95 is for tail regression only.',
    'Fallback penalty and Cloudflare-owned gain are reported separately and must not be averaged.',
    `Direct Vercel origin: ${args.vercelOrigin}. Default production fallback is ${VERCEL_ORIGIN}; git alias ${GIT_ALIAS_ORIGIN}.`,
    'Requests use IPv4 (-4) so both origins share a comparable client path. Do not mix this with IPv6/Private Relay samples.',
    'A class result is MIXED when its routes disagree; a single median is descriptive only.',
  ]
  if (abortedRoutes.length) {
    caveats.push(
      `Aborted after Vercel 403 streak: ${abortedRoutes.map((row) => row.path).join(', ')}. Remaining routes were not sampled.`,
    )
  }
  if (detail && !detail.comparable) {
    caveats.push(
      `${detail.path} is Cloudflare-owned on www but Hybrid returned ${detail.hybridStatus} while Vercel returned ${detail.vercelStatus}. It is sampled for evidence and excluded from win/gain statistics.`,
    )
  }

  const rows = routes.map((route) => {
    const hybridSamples = allMeasured.filter((s) => s.route === route.path && s.endpointType === 'hybrid')
    const vercelSamples = allMeasured.filter((s) => s.route === route.path && s.endpointType === 'vercel')
    const hybrid = statsFor(hybridSamples)
    const vercel = statsFor(vercelSamples)
    const minOk = Math.ceil(args.samples * 0.8)
    const comparable = route.comparable !== false && hybrid.ok >= minOk && vercel.ok >= minOk
    const pair = comparable ? medianPair(hybrid, vercel) : { ttfbDeltaMs: null, ttfbDeltaPct: null, totalDeltaMs: null, totalDeltaPct: null, winner: 'incomparable' }
    const observedHybrid = classifyObservedOwner(hybridSamples[0] || {}, route.owner)
    const observedVercel = classifyObservedOwner(vercelSamples[0] || {}, 'direct-vercel')
    return {
      path: route.path,
      owner: route.owner,
      comparable,
      comparableReason: route.reason || (comparable ? 'both endpoints returned success after redirects' : 'not comparable'),
      observedHybrid,
      observedVercel,
      hybrid,
      vercel,
      pair,
      winner: comparable ? pair.winner : 'incomparable',
    }
  })

  const comparableRows = rows.filter((row) => row.comparable)
  const fallbackRows = comparableRows.filter((row) => row.owner === 'vercel-fallback')
  const cloudflareRows = comparableRows.filter((row) => row.owner === 'cloudflare')
  const fallbackMedian = weightedMedian(fallbackRows.map((row) => ({ hybrid: row.hybrid.ttfbP50, vercel: row.vercel.ttfbP50 })))
  const cloudflareMedian = weightedMedian(cloudflareRows.map((row) => ({ hybrid: row.hybrid.ttfbP50, vercel: row.vercel.ttfbP50 })))
  const fallbackVerdict = classVerdict(fallbackRows)
  const cloudflareVerdict = classVerdict(cloudflareRows)
  const expectedComparable = routes.filter((route) => route.comparable !== false).length
  const overall = overallLabel({
    fallbackVerdict,
    cloudflareVerdict,
    comparableRows,
    expectedComparable,
  })

  const summaryText = buildSummaryText({
    fallbackMedian,
    cloudflareMedian,
    fallbackVerdict,
    cloudflareVerdict,
    comparableRows,
    overall,
    caveats,
  })

  const table = markdownTable(rows)
  const fallbackPenalty = fallbackRows.map((row) => ({
    route: row.path,
    hybridMinusVercelTtfbMs: row.pair.ttfbDeltaMs,
    hybridMinusVercelTtfbPct: row.pair.ttfbDeltaPct,
    hybridMinusVercelTotalMs: row.pair.totalDeltaMs,
    hybridMinusVercelTotalPct: row.pair.totalDeltaPct,
  }))
  const cloudflareGain = cloudflareRows.map((row) => ({
    route: row.path,
    vercelMinusHybridTtfbMs: row.pair.ttfbDeltaMs == null ? null : round1(-row.pair.ttfbDeltaMs),
    vercelMinusHybridTtfbPct: row.pair.ttfbDeltaPct == null ? null : round1(-row.pair.ttfbDeltaPct),
    vercelMinusHybridTotalMs: row.pair.totalDeltaMs == null ? null : round1(-row.pair.totalDeltaMs),
    vercelMinusHybridTotalPct: row.pair.totalDeltaPct == null ? null : round1(-row.pair.totalDeltaPct),
  }))

  const endedAt = nowIso()
  const stamp = endedAt.replace(/[:.]/g, '-').replace('T', 'T').replace('Z', 'Z')
  mkdirSync(args.outDir, { recursive: true })
  const rawPath = join(args.outDir, `${stamp}-raw-samples.json`)
  const aggPath = join(args.outDir, `${stamp}-aggregate.json`)
  const mdPath = join(args.outDir, `${stamp}-summary.md`)

  const raw = {
    kind: 'visutry-hybrid-performance-raw',
    startedAt,
    endedAt,
    hybridOrigin: HYBRID_ORIGIN,
    vercelOrigin: args.vercelOrigin,
    warmupRequests: args.warmup,
    measuredRequests: args.samples,
    concurrency: 1,
    method: 'GET',
    ipVersion: 4,
    delayMs: args.delayMs,
    timeoutSec: args.timeoutSec,
    userAgent: USER_AGENT,
    warmup: allWarmup,
    samples: allMeasured,
  }
  const aggregate = {
    kind: 'visutry-hybrid-performance-aggregate',
    startedAt,
    endedAt,
    validation,
    summaryText,
    overall,
    fallbackVerdict,
    cloudflareVerdict,
    fallbackMedian,
    cloudflareMedian,
    fallbackPenalty,
    cloudflareGain,
    rows,
    abortedRoutes,
    evidence: { rawPath, aggPath, mdPath },
  }
  const markdown = [
    '# VisuTry hybrid performance sample',
    '',
    `- Started: ${startedAt}`,
    `- Ended: ${endedAt}`,
    `- Hybrid: ${HYBRID_ORIGIN}`,
    `- Direct Vercel: ${args.vercelOrigin}`,
    `- Warm-up / measured: ${args.warmup} / ${args.samples} per endpoint per route`,
    `- Concurrency: 1, method GET, alternating hybrid then Vercel`,
    '',
    '## Direct summary',
    '',
    '```text',
    summaryText.trimEnd(),
    '```',
    '',
    '## Route table',
    '',
    table,
    '',
    '## Fallback penalty (Hybrid − Direct Vercel)',
    '',
    fallbackPenalty.length
      ? fallbackPenalty.map((row) => `- \`${row.route}\`: ${fmtDeltaMs(row.hybridMinusVercelTtfbMs)} ms TTFB (${fmtPct(row.hybridMinusVercelTtfbPct)}); total ${fmtDeltaMs(row.hybridMinusVercelTotalMs)} ms (${fmtPct(row.hybridMinusVercelTotalPct)})`).join('\n')
      : '_none_',
    '',
    '## Cloudflare gain (Direct Vercel − Hybrid)',
    '',
    cloudflareGain.length
      ? cloudflareGain.map((row) => `- \`${row.route}\`: ${fmtDeltaMs(row.vercelMinusHybridTtfbMs)} ms TTFB (${fmtPct(row.vercelMinusHybridTtfbPct)}); total ${fmtDeltaMs(row.vercelMinusHybridTotalMs)} ms (${fmtPct(row.vercelMinusHybridTotalPct)})`).join('\n')
      : '_none comparable_',
    '',
    '## Interpretation rules (exploratory, not an SLO)',
    '',
    '- `|delta| < 5%`: EFFECTIVELY NEUTRAL',
    '- `5%–10%`: small difference',
    '- `> 10%`: material difference',
    '- Do not average fallback penalty with Cloudflare-owned gain.',
    '',
  ].join('\n')

  writeFileSync(rawPath, `${JSON.stringify(raw, null, 2)}\n`)
  writeFileSync(aggPath, `${JSON.stringify(aggregate, null, 2)}\n`)
  writeFileSync(mdPath, `${markdown}\n`)

  process.stdout.write(`${summaryText}\n`)
  process.stdout.write(`${table}\n\n`)
  process.stdout.write(`Evidence:\n- ${rawPath}\n- ${aggPath}\n- ${mdPath}\n`)
}

try {
  main()
} catch (error) {
  process.stderr.write(`${error instanceof Error ? error.stack : String(error)}\n`)
  process.exit(1)
}
