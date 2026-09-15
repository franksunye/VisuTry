#!/usr/bin/env node

/**
 * Prepare the production Cloudflare traffic-layer artifact.
 *
 * Cloudflare is not a second Next application in production. Vercel owns the
 * Next HTML, RSC/Flight, client graph, and all business/runtime page data.
 * This build only stages non-Next public assets for the Wrangler Static Assets
 * binding; the Worker itself is the thin capability router in
 * cloudflare-router/app-host-worker.ts.
 *
 * The output directory is deliberately cleaned first so a local or cached
 * OpenNext build can never leave stale Next artifacts in the production upload.
 */

import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const source = path.join(root, 'public')
const outputRoot = path.join(root, '.open-next')
const output = path.join(outputRoot, 'assets')

if (!fs.existsSync(source) || !fs.statSync(source).isDirectory()) {
  throw new Error(`Public asset directory not found: ${source}`)
}

// `.open-next` is a generated build directory, not a source or user-data path.
fs.rmSync(outputRoot, { recursive: true, force: true })
fs.mkdirSync(output, { recursive: true })
fs.cpSync(source, output, { recursive: true })

const fileCount = countFiles(output)
console.log(`Prepared Cloudflare traffic-layer assets at ${path.relative(root, output)} (${fileCount} files).`)

function countFiles(directory) {
  let count = 0
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name)
    if (entry.isDirectory()) count += countFiles(fullPath)
    else count += 1
  }
  return count
}
