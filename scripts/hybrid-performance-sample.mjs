#!/usr/bin/env node
/**
 * Read-only hybrid vs Direct-Vercel latency sample.
 *
 * Default first-pass is low volume so visutry.vercel.app is less likely to
 * challenge. Use --full for a larger sample.
 *
 *   node scripts/hybrid-performance-sample.mjs
 *   node scripts/hybrid-performance-sample.mjs --full
 *   node scripts/hybrid-performance-sample.mjs --validate-only
 */

import { spawnSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync, mkdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const HYBRID_ORIGIN = 'https://www.visutry.com'
const VERCEL_ORIGIN = 'https://visutry.vercel.app'
const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36 VisuTry-Hybrid-Perf-Sample/1.2'
const ACCEPT = 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.8'
const COMBINATION_PAGES = 'src/config/search-combination-pages.ts'

const HEADER_ALLOWLIST = [
  'server',
  'cf-ray',
  'cf-cache-status',
  'x-visutry-router-backend',
  'x-visutry-router-invocation',
  'x-visutry-router-layer',
  'x-matched-path',
  'x-vercel-id',
  'x-vercel-cache',
  'x-vercel-mitigated',
  'age',
  'cache-control',
  'content-type',
  'location',
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
  const full = argv.includes('--full')
  const out = {
    warmup: full ? 5 : 2,
    samples: full ? 30 : 8,
    runs: 3,
    timeoutSec: 30,
    delayMs: full ? 400 : 700,
    jitterMs: full ? 50 : 250,
    vercelOrigin: VERCEL_ORIGIN,
    validateOnly: argv.includes('--validate-only'),
    outDir: 'docs/operations/evidence/hybrid-performance',
  }
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]
    if (arg === '--validate-only' || arg === '--full') continue
    if (arg === '--warmup') out.warmup = Number(argv[++i])
    else if (arg === '--samples') out.samples = Number(argv[++i])
    else if (arg === '--runs') out.runs = Number(argv[++i])
    else if (arg === '--timeout') out.timeoutSec = Number(argv[++i])
    else if (arg === '--delay-ms') out.delayMs = Number(argv[++i])
    else if (arg === '--vercel-origin') out.vercelOrigin = String(argv[++i]).replace(/\/$/, '')
    else if (arg === '--out-dir') out.outDir = argv[++i]
    else throw new Error(`Unknown argument: ${arg}`)
  }
  if (!Number.isFinite(out.warmup) || out.warmup < 0) throw new Error('invalid --warmup')
  if (!Number.isFinite(out.samples) || out.samples < 1) throw new Error('invalid --samples')
  if (!Number.isFinite(out.runs) || out.runs < 1) throw new Error('invalid --runs')
  if (!/^https:\/\/[^/]+\.vercel\.app$/.test(out.vercelOrigin)) throw new Error('invalid --vercel-origin')
  return out
}

function discoverGlassesGuideDetailSlug() {
  const src = readFileSync(COMBINATION_PAGES, 'utf8')
  const match = src.match(/export const COMBINATION_SEARCH_PAGES[\s\S]*?slug: '([a-z0-9-]+)'/)
  if (!match) throw new Error(`Could not read a glasses-guide slug from ${COMBINATION_PAGES}`)
  return match[1]
}

function nowIso() {
  return new Date().toISOString()
}

function secToMs(value) {
  const n = Number(value)
  return Number.isFinite(n) ? Math.round(n * 1000) : null
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
    blocks.push({ statusLine: lines[0], status: statusMatch ? Number(statusMatch[1]) : null, headers })
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
  spawnSync('sleep', [String(Math.max(0, ms) / 1000)])
}

function jitterDelay(baseMs, jitterMs) {
  const delta = jitterMs ? Math.floor(Math.random() * jitterMs) : 0
  sleepMs(baseMs + delta)
}

function looksLikeChallenge(body, sample) {
  const text = (body || '').slice(0, 8000).toLowerCase()
  const mitigated = (sample.headers['x-vercel-mitigated'] || '').length > 0
  const challengeHints = [
    'vercel.com/security',
    'security checkpoint',
    'unwanted automated traffic',
    'verify you are human',
    'attention required',
    '_vercel_challenge',
  ]
  return sample.httpStatus === 403 || mitigated || challengeHints.some((hint) => text.includes(hint))
}

function requestOnce(url, timeoutSec) {
  const dir = mkdtempSync(join(tmpdir(), 'visutry-hybrid-perf-'))
  const headerFile = join(dir, 'headers.txt')
  const bodyFile = join(dir, 'body.bin')
  try {
    const result = spawnSync(
      'curl',
      [
        '-sS', '-4', '--http2', '--location', '--max-redirs', '5',
        '--max-time', String(timeoutSec),
        '-A', USER_AGENT,
        '-H', `Accept: ${ACCEPT}`,
        '-H', 'Accept-Language: en-US,en;q=0.9',
        '-D', headerFile, '-o', bodyFile, '-w', CURL_WRITEOUT, url,
      ],
      { encoding: 'utf8' },
    )
    const headerRaw = readFileSync(headerFile, 'utf8')
    const body = readFileSync(bodyFile)
    const blocks = parseHeaderBlocks(headerRaw)
    const finalBlock = blocks.at(-1) || { status: null, headers: {} }
    const writeout = parseWriteout(result.stdout || '')
    const namelookup = Number(writeout.time_namelookup)
    const connect = Number(writeout.time_connect)
    const appconnect = Number(writeout.time_appconnect)
    const pretransfer = Number(writeout.time_pretransfer)
    const starttransfer = Number(writeout.time_starttransfer)
    const sample = {
      timestamp: nowIso(),
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
      totalMs: secToMs(Number(writeout.time_total)),
      responseSize: writeout.size_download ? Number(writeout.size_download) : 0,
      headers: pickHeaders(finalBlock.headers || {}),
      bodyPreview: body.toString('utf8', 0, 400),
    }
    sample.challenge = looksLikeChallenge(body.toString('utf8'), sample)
    sample.semantic = sample.curlExit === 0 && !sample.challenge && sample.httpStatus >= 200 && sample.httpStatus < 400
    return sample
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
}

function hostOf(url) {
  try { return new URL(url).hostname } catch { return '' }
}

function isDirectVercelSample(sample) {
  const server = (sample.headers.server || '').toLowerCase()
  const hasCfRay = Boolean(sample.headers['cf-ray'])
  const finalHost = hostOf(sample.finalUrl)
  return {
    ok: sample.curlExit === 0 && server === 'vercel' && !hasCfRay && !sample.challenge && finalHost.endsWith('.vercel.app'),
    server,
    hasCfRay,
    challenge: sample.challenge,
    finalHost,
    httpStatus: sample.httpStatus,
  }
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

function statsFor(samples) {
  const ok = samples.filter((s) => s.semantic)
  const ttfb = ok.map((s) => s.ttfbMs).filter((n) => n != null)
  const total = ok.map((s) => s.totalMs).filter((n) => n != null)
  const p95Supported = ttfb.length >= 5
  return {
    n: samples.length,
    ok: ok.length,
    errorRate: samples.length ? round1((samples.length - ok.length) / samples.length * 100) : 100,
    challengeCount: samples.filter((s) => s.challenge).length,
    ttfbP50: round1(percentile(ttfb, 0.5)),
    ttfbP95: p95Supported ? round1(percentile(ttfb, 0.95)) : null,
    totalP50: round1(percentile(total, 0.5)),
  }
}

function classifyDelta(pct) {
  if (pct == null) return { label: 'INCONCLUSIVE', magnitude: 'n/a' }
  const abs = Math.abs(pct)
  if (abs < 5) return { label: 'EFFECTIVELY NEUTRAL', magnitude: 'neutral', sign: 0 }
  const sign = pct < 0 ? 'HYBRID FASTER' : 'HYBRID SLOWER'
  return { label: sign, magnitude: abs > 10 ? 'material' : 'small', sign: pct < 0 ? -1 : 1 }
}

function consistencyAcrossRuns(runPcts) {
  const usable = runPcts.filter((n) => n != null)
  if (!usable.length) return { consistency: 'INCONCLUSIVE', result: 'INCONCLUSIVE', medianPct: null }
  const classes = usable.map((pct) => classifyDelta(pct))
  const medianPct = round1(percentile(usable, 0.5))
  const nonNeutralSigns = [...new Set(classes.filter((c) => c.sign !== 0).map((c) => c.sign))]
  if (nonNeutralSigns.length > 1) {
    return { consistency: 'MIXED / sign changes across runs', result: 'MIXED / INCONCLUSIVE', medianPct }
  }
  const medianClass = classifyDelta(medianPct)
  if (medianClass.sign === 0) {
    return { consistency: nonNeutralSigns.length ? 'outlier in one run; median neutral' : 'consistent', result: 'EFFECTIVELY NEUTRAL', medianPct }
  }
  const label = medianClass.sign < 0 ? 'HYBRID FASTER' : 'HYBRID SLOWER'
  const material = classes.filter((c) => c.sign !== 0).every((c) => c.magnitude === 'material')
  if (material) {
    return { consistency: 'consistent material signal', result: `${label} — CONSISTENT MATERIAL SIGNAL`, medianPct }
  }
  return { consistency: 'same direction', result: label, medianPct }
}

function fmtPct(n) {
  if (n == null) return 'n/a'
  const sign = n > 0 ? '+' : ''
  return `${sign}${n.toFixed(1)}%`
}

function fmtMs(n) {
  return n == null ? 'n/a' : String(n)
}

function probe(origin, path, args) {
  const sample = requestOnce(`${origin}${path}`, args.timeoutSec)
  jitterDelay(args.delayMs, args.jitterMs)
  return sample
}

function runOnce(routes, args, runIndex) {
  const measured = []
  let consecutiveVercelChallenge = 0
  let blocked = false
  for (const route of routes) {
    for (let i = 0; i < args.warmup; i += 1) {
      const hybrid = { ...probe(HYBRID_ORIGIN, route.path, args), endpointType: 'hybrid', route: route.path, owner: route.owner, phase: 'warmup', run: runIndex, seq: i + 1 }
      const vercel = { ...probe(args.vercelOrigin, route.path, args), endpointType: 'vercel', route: route.path, owner: route.owner, phase: 'warmup', run: runIndex, seq: i + 1 }
      measured.push(hybrid, vercel)
      process.stderr.write(`run ${runIndex} warmup ${route.path} ${i + 1}/${args.warmup} hybrid=${hybrid.httpStatus} vercel=${vercel.httpStatus}${vercel.challenge ? ' CHALLENGE' : ''}\n`)
      if (vercel.challenge) consecutiveVercelChallenge += 1
      else consecutiveVercelChallenge = 0
      if (consecutiveVercelChallenge >= 3) {
        blocked = true
        break
      }
    }
    if (blocked) break
    for (let i = 0; i < args.samples; i += 1) {
      const hybrid = { ...probe(HYBRID_ORIGIN, route.path, args), endpointType: 'hybrid', route: route.path, owner: route.owner, phase: 'measured', run: runIndex, seq: i + 1 }
      const vercel = { ...probe(args.vercelOrigin, route.path, args), endpointType: 'vercel', route: route.path, owner: route.owner, phase: 'measured', run: runIndex, seq: i + 1 }
      measured.push(hybrid, vercel)
      process.stderr.write(`run ${runIndex} sample ${route.path} ${i + 1}/${args.samples} hybrid=${hybrid.ttfbMs}ms/${hybrid.httpStatus} vercel=${vercel.ttfbMs}ms/${vercel.httpStatus}${vercel.challenge ? ' CHALLENGE' : ''}\n`)
      if (vercel.challenge) consecutiveVercelChallenge += 1
      else consecutiveVercelChallenge = 0
      if (consecutiveVercelChallenge >= 3) {
        blocked = true
        break
      }
    }
    if (blocked) break
  }
  return { measured, blocked }
}

function summarizeClass(samples, owner) {
  const hybrid = statsFor(samples.filter((s) => s.owner === owner && s.endpointType === 'hybrid' && s.phase === 'measured'))
  const vercel = statsFor(samples.filter((s) => s.owner === owner && s.endpointType === 'vercel' && s.phase === 'measured'))
  const vercelChallenge = samples.some((s) => s.owner === owner && s.endpointType === 'vercel' && s.challenge)
  if (vercelChallenge) {
    return { hybrid, vercel, ttfbDeltaPct: null, blocked: true, verdict: classifyDelta(null) }
  }
  const pct = round1(deltaPct(hybrid.ttfbP50, vercel.ttfbP50))
  return { hybrid, vercel, ttfbDeltaPct: pct, blocked: false, verdict: classifyDelta(pct) }
}

function main() {
  const args = parseArgs(process.argv.slice(2))
  const startedAt = nowIso()
  const detailSlug = discoverGlassesGuideDetailSlug()
  const detailPath = `/en/glasses-guide/${detailSlug}`
  const routes = [
    { path: '/', owner: 'vercel-fallback' },
    { path: '/en', owner: 'vercel-fallback' },
    { path: '/en/glasses-guide', owner: 'cloudflare' },
    { path: detailPath, owner: 'cloudflare' },
  ]

  process.stderr.write(`Validating Direct Vercel ${args.vercelOrigin} and discovering ${detailPath}…\n`)
  const vercelHub = probe(args.vercelOrigin, '/en', args)
  const vercelDetail = probe(args.vercelOrigin, detailPath, args)
  const hybridDetail = probe(HYBRID_ORIGIN, detailPath, args)
  const direct = isDirectVercelSample(vercelHub)
  if (vercelHub.challenge || vercelDetail.challenge) {
    process.stdout.write([
      'VISUTRY HYBRID PERFORMANCE RESULT',
      '',
      'DIRECT VERCEL BASELINE BLOCKED',
      '',
      'Fallback routes:',
      'Run consistency: n/a',
      'Median directional result: n/a',
      'Result: INCONCLUSIVE',
      '',
      'Cloudflare-owned Glasses Guide:',
      'Run consistency: n/a',
      'Median directional result: n/a',
      'Result: INCONCLUSIVE',
      '',
      'Direct Vercel challenge contamination:',
      'YES',
      '',
      'OVERALL:',
      'INCONCLUSIVE',
      'for this small local sample.',
      '',
    ].join('\n'))
    process.exit(2)
  }
  if (vercelDetail.httpStatus !== 200 || hybridDetail.httpStatus !== 200) {
    throw new Error(`Detail slug ${detailPath} is not 200 on both origins (Vercel ${vercelDetail.httpStatus}, Hybrid ${hybridDetail.httpStatus})`)
  }
  if (!direct.ok && vercelHub.httpStatus !== 200) {
    throw new Error(`${args.vercelOrigin} is not a usable Direct Vercel baseline`)
  }
  if (args.validateOnly) {
    process.stdout.write(`${JSON.stringify({ vercelOrigin: args.vercelOrigin, detailPath, vercelHub: vercelHub.httpStatus, vercelDetail: vercelDetail.httpStatus, hybridDetail: hybridDetail.httpStatus }, null, 2)}\n`)
    return
  }

  const allMeasured = []
  const runSummaries = []
  let blocked = false
  for (let run = 1; run <= args.runs; run += 1) {
    const result = runOnce(routes, args, run)
    allMeasured.push(...result.measured)
    const fallback = summarizeClass(result.measured, 'vercel-fallback')
    const cloudflare = summarizeClass(result.measured, 'cloudflare')
    runSummaries.push({ run, fallback, cloudflare, blocked: result.blocked || fallback.blocked || cloudflare.blocked })
    if (result.blocked) {
      blocked = true
      process.stderr.write('DIRECT VERCEL BASELINE BLOCKED — stopping remaining runs\n')
      break
    }
  }

  const fallbackPcts = runSummaries.map((row) => row.fallback.ttfbDeltaPct)
  const cloudflarePcts = runSummaries.map((row) => row.cloudflare.ttfbDeltaPct)
  const fallbackAcross = consistencyAcrossRuns(fallbackPcts)
  const cloudflareAcross = consistencyAcrossRuns(cloudflarePcts)
  const challengeYes = blocked || allMeasured.some((s) => s.endpointType === 'vercel' && s.challenge)
  const classResults = [fallbackAcross.result, cloudflareAcross.result].map((label) => (
    label.startsWith('HYBRID FASTER') ? 'HYBRID FASTER'
      : label.startsWith('HYBRID SLOWER') ? 'HYBRID SLOWER'
        : label.includes('MIXED') ? 'MIXED'
          : label
  ))
  const uniqueClass = new Set(classResults.filter((label) => label !== 'EFFECTIVELY NEUTRAL'))
  const overall = challengeYes
    ? 'INCONCLUSIVE'
    : (uniqueClass.has('MIXED') || uniqueClass.size > 1
      ? 'MIXED'
      : (uniqueClass.size === 1 ? [...uniqueClass][0] : 'EFFECTIVELY NEUTRAL'))

  const header = [
    'VISUTRY HYBRID PERFORMANCE RESULT',
    '',
    'Fallback routes:',
    `Run consistency: ${fallbackAcross.consistency}`,
    `Median directional result: ${fmtPct(fallbackAcross.medianPct)} TTFB (Hybrid − Direct Vercel)`,
    `Result: ${fallbackAcross.result}`,
    '',
    'Cloudflare-owned Glasses Guide:',
    `Run consistency: ${cloudflareAcross.consistency}`,
    `Median directional result: ${fmtPct(cloudflareAcross.medianPct)} TTFB (Hybrid − Direct Vercel)`,
    `Result: ${cloudflareAcross.result}`,
    '',
    'Direct Vercel challenge contamination:',
    challengeYes ? 'YES' : 'NO',
    '',
    'OVERALL:',
    overall,
    'for this small local sample.',
    '',
  ].join('\n')

  const tableLines = [
    '| Run | Class | Hybrid TTFB p50 | Vercel TTFB p50 | Hybrid TTFB p95 | Delta % | Hybrid total p50 | Error rate H/V | Result |',
    '| --- | --- | ---: | ---: | ---: | ---: | ---: | --- | --- |',
  ]
  for (const row of runSummaries) {
    for (const [name, stats] of [['fallback', row.fallback], ['glasses-guide', row.cloudflare]]) {
      tableLines.push(
        `| ${row.run} | ${name} | ${fmtMs(stats.hybrid.ttfbP50)} | ${fmtMs(stats.vercel.ttfbP50)} | ${fmtMs(stats.hybrid.ttfbP95)} | ${fmtPct(stats.ttfbDeltaPct)} | ${fmtMs(stats.hybrid.totalP50)} | ${stats.hybrid.errorRate}% / ${stats.vercel.errorRate}% | ${stats.blocked ? 'INCONCLUSIVE (challenge)' : stats.verdict.label} |`,
      )
    }
  }

  const endedAt = nowIso()
  const stamp = endedAt.replace(/[:.]/g, '-').replace(/T/, 'T')
  mkdirSync(args.outDir, { recursive: true })
  const rawPath = join(args.outDir, `${stamp}-raw-samples.json`)
  const aggPath = join(args.outDir, `${stamp}-aggregate.json`)
  const mdPath = join(args.outDir, `${stamp}-summary.md`)
  writeFileSync(rawPath, `${JSON.stringify({ kind: 'visutry-hybrid-performance-raw', startedAt, endedAt, args, routes, samples: allMeasured }, null, 2)}\n`)
  writeFileSync(aggPath, `${JSON.stringify({ kind: 'visutry-hybrid-performance-aggregate', startedAt, endedAt, detailPath, runSummaries, fallbackAcross, cloudflareAcross, overall, challengeYes, header }, null, 2)}\n`)
  writeFileSync(mdPath, `# VisuTry hybrid performance sample\n\n\`\`\`text\n${header.trimEnd()}\n\`\`\`\n\n${tableLines.join('\n')}\n`)

  process.stdout.write(`${header}\n${tableLines.join('\n')}\n\nEvidence:\n- ${rawPath}\n- ${aggPath}\n- ${mdPath}\n`)
}

try {
  main()
} catch (error) {
  process.stderr.write(`${error instanceof Error ? error.stack : String(error)}\n`)
  process.exit(1)
}
