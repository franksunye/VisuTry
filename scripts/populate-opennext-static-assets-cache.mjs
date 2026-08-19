#!/usr/bin/env node
/**
 * Copy OpenNext prerender cache into Workers Static Assets so
 * `wrangler deploy` (which skips `opennextjs-cloudflare deploy`'s populate
 * step) still ships the official static-assets incremental cache.
 *
 * Must match @opennextjs/cloudflare populateStaticAssetsIncrementalCache:
 *   .open-next/cache → .open-next/assets/cdn-cgi/_next_cache
 */
import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const ROOT = process.cwd()
const OUTPUT_DIR = path.join(ROOT, '.open-next')
const SOURCE_CACHE = path.join(OUTPUT_DIR, 'cache')
const COMPILED_CONFIG = path.join(OUTPUT_DIR, '.build', 'open-next.config.mjs')
const EXPECTED_CACHE_NAME = 'cf-static-assets-incremental-cache'

const { CACHE_DIR, NAME } = await import(
  '@opennextjs/cloudflare/overrides/incremental-cache/static-assets-incremental-cache'
)

if (NAME !== EXPECTED_CACHE_NAME) {
  throw new Error(`Unexpected static-assets cache name: ${NAME}`)
}

if (!fs.existsSync(SOURCE_CACHE)) {
  throw new Error(`OpenNext cache not found at ${SOURCE_CACHE}. Run opennextjs-cloudflare build first.`)
}

if (fs.existsSync(COMPILED_CONFIG)) {
  const compiled = await import(pathToFileURL(COMPILED_CONFIG).href)
  const incremental = compiled.default?.default?.override?.incrementalCache
  if (incremental === 'dummy') {
    throw new Error(
      'Compiled OpenNext still uses dummy incremental cache. Rebuild after wiring staticAssetsIncrementalCache in open-next.config.ts.',
    )
  }
  const resolved = typeof incremental === 'function' ? await incremental() : incremental
  if (!resolved || resolved.name !== EXPECTED_CACHE_NAME) {
    throw new Error(
      `Compiled incremental cache is ${resolved?.name ?? typeof incremental}, expected ${EXPECTED_CACHE_NAME}.`,
    )
  }
}

const destination = path.join(OUTPUT_DIR, 'assets', CACHE_DIR)
fs.cpSync(SOURCE_CACHE, destination, { recursive: true })

const requiredPaths = [
  'en/glasses-guide.cache',
  'en/glasses-guide/best-rectangle-glasses-for-round-face.cache',
  'de/glasses-guide.cache',
  'ar/glasses-guide.cache',
]
const buildIds = fs.readdirSync(destination).filter((name) => {
  const full = path.join(destination, name)
  return fs.statSync(full).isDirectory() && name !== '__fetch'
})
if (buildIds.length === 0) {
  throw new Error(`No build-id directories copied into ${destination}`)
}

for (const buildId of buildIds) {
  for (const relative of requiredPaths) {
    const file = path.join(destination, buildId, relative)
    if (!fs.existsSync(file)) {
      throw new Error(`Missing populated cache file: ${path.relative(ROOT, file)}`)
    }
  }
}

const fileCount = countFiles(destination)
console.log(
  `Populated Workers Static Assets incremental cache at ${path.relative(ROOT, destination)} (${fileCount} files, buildIds=${buildIds.join(',')}).`,
)

function countFiles(dir) {
  let total = 0
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) total += countFiles(full)
    else total += 1
  }
  return total
}
