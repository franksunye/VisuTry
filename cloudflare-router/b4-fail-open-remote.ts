/**
 * B4.2C remote fail-open verification.
 *
 * Local `requestLimitFailOpen: true` is intent only. Phase C PASS requires
 * reading back attached Cloudflare Routes and asserting an exact
 * ungated-P0 www set: every expected route exists, no extra
 * `www.visutry.com` routes, `script === visutry-cf-production`, and
 * `request_limit_fail_open === true`.
 *
 * Do not call this against production from B4.2B.
 *
 * Usage (after attaching P0, with a saved API list):
 *   npx tsx cloudflare-router/b4-fail-open-remote.ts --from-json attached-routes.json
 *
 * Exit: 0 pass, 1 fail, 2 skipped (no remote dump)
 */

import fs from 'node:fs'
import path from 'node:path'
import {
  assertRemoteFailOpenActivation,
  type B4AttachedCloudflareRoute,
} from './b4-production-routes'

function isMain() {
  const entry = process.argv[1] ? path.resolve(process.argv[1]) : ''
  return entry.endsWith(`${path.sep}b4-fail-open-remote.ts`) || entry.endsWith(`${path.sep}b4-fail-open-remote.js`)
}

function parseAttached(raw: unknown): B4AttachedCloudflareRoute[] {
  if (Array.isArray(raw)) return raw as B4AttachedCloudflareRoute[]
  if (raw && typeof raw === 'object' && Array.isArray((raw as { result?: unknown }).result)) {
    return (raw as { result: B4AttachedCloudflareRoute[] }).result
  }
  throw new Error('expected an array of routes or a Cloudflare { result: [] } payload')
}

if (isMain()) {
  const fromJson = process.argv.includes('--from-json')
    ? process.argv[process.argv.indexOf('--from-json') + 1]
    : undefined
  if (!fromJson) {
    process.stdout.write(`${JSON.stringify({
      status: 'skipped',
      reason: 'no remote dump. After attaching P0, save GET /zones/:zone/workers/routes to JSON and re-run with --from-json. Local intent is not Phase C PASS.',
    }, null, 2)}\n`)
    process.exit(2)
  }
  const raw = JSON.parse(fs.readFileSync(path.resolve(fromJson), 'utf8'))
  const errors = assertRemoteFailOpenActivation({ attached: parseAttached(raw) })
  process.stdout.write(`${JSON.stringify({ status: errors.length === 0 ? 'pass' : 'fail', errors }, null, 2)}\n`)
  process.exit(errors.length === 0 ? 0 : 1)
}
