/**
 * Same-commit hashed-asset parity gate for `/_next/static/*`.
 *
 * Vercel (`next build`) and Cloudflare (`CLOUDFLARE_BUILD=1 next build` +
 * OpenNext) are independent webpack graphs. A Cloudflare build overwrites
 * `.next`, so comparing live `.next/static` to `.open-next/assets` can false
 * PASS. Snapshot the Vercel `.next` tree *before* the Cloudflare build.
 *
 * Required sequence:
 *   1. `CI=1 npm run build:ci`
 *   2. `npm run b4:snapshot-vercel-next`  → `.artifacts/b4/vercel-next`
 *   3. `npm run build:cloudflare`
 *   4. `npm run b4:asset-parity`
 *
 * Do not enable `www.visutry.com/_next/static/*` until this gate returns `pass`.
 *
 * Exit: 0 pass, 1 fail, 2 skipped (snapshot or OpenNext assets missing)
 */

import fs from 'node:fs'
import path from 'node:path'

export const B4_VERCEL_NEXT_SNAPSHOT_DIR = path.join('.artifacts', 'b4', 'vercel-next')
export const B4_VERCEL_NEXT_SNAPSHOT_MARKER = '.b4-vercel-snapshot.json'
export const B4_CLOUDFLARE_ASSETS_DIR = path.join('.open-next', 'assets')

export interface HashedStaticParityResult {
  status: 'pass' | 'fail' | 'skipped'
  reason: string
  vercelArtifact: string
  vercelBuildId: string | null
  cloudflareBuildId: string | null
  vercelCount: number
  cloudflareCount: number
  missingOnCloudflare: string[]
  extraOnCloudflare: string[]
}

function walkRelativeFiles(root: string, prefix = ''): string[] {
  if (!fs.existsSync(root)) return []
  const entries = fs.readdirSync(root, { withFileTypes: true })
  const files: string[] = []
  for (const entry of entries) {
    const relative = prefix ? `${prefix}/${entry.name}` : entry.name
    const full = path.join(root, entry.name)
    if (entry.isDirectory()) files.push(...walkRelativeFiles(full, relative))
    else files.push(relative)
  }
  return files.sort()
}

export function readBuildId(dir: string): string | null {
  const file = path.join(dir, 'BUILD_ID')
  if (!fs.existsSync(file)) return null
  return fs.readFileSync(file, 'utf8').trim() || null
}

export function compareHashedStaticManifests(
  vercelStaticRoot: string,
  cloudflareStaticRoot: string,
): Pick<HashedStaticParityResult, 'vercelCount' | 'cloudflareCount' | 'missingOnCloudflare' | 'extraOnCloudflare'> {
  const vercel = new Set(walkRelativeFiles(vercelStaticRoot))
  const cloudflare = new Set(walkRelativeFiles(cloudflareStaticRoot))
  return {
    vercelCount: vercel.size,
    cloudflareCount: cloudflare.size,
    missingOnCloudflare: [...vercel].filter((file) => !cloudflare.has(file)),
    extraOnCloudflare: [...cloudflare].filter((file) => !vercel.has(file)),
  }
}

export function snapshotVercelNextBuild(options?: {
  sourceNextDir?: string
  snapshotDir?: string
}): { snapshotDir: string; buildId: string | null } {
  const sourceNextDir = options?.sourceNextDir || path.join(process.cwd(), '.next')
  const snapshotDir = options?.snapshotDir || path.join(process.cwd(), B4_VERCEL_NEXT_SNAPSHOT_DIR)
  const staticDir = path.join(sourceNextDir, 'static')
  if (!fs.existsSync(staticDir)) {
    throw new Error(`cannot snapshot Vercel Next build: missing ${staticDir}`)
  }
  fs.mkdirSync(path.dirname(snapshotDir), { recursive: true })
  fs.rmSync(snapshotDir, { recursive: true, force: true })
  fs.cpSync(sourceNextDir, snapshotDir, { recursive: true })
  const buildId = readBuildId(snapshotDir)
  fs.writeFileSync(
    path.join(snapshotDir, B4_VERCEL_NEXT_SNAPSHOT_MARKER),
    `${JSON.stringify({
      kind: 'vercel-next-snapshot',
      copiedAt: new Date().toISOString(),
      source: sourceNextDir,
      buildId,
      note: 'Taken before CLOUDFLARE_BUILD=1. Do not refresh this after the Cloudflare build.',
    }, null, 2)}\n`,
  )
  return { snapshotDir, buildId }
}

export function hashedStaticParityGate(options?: {
  vercelNextDir?: string
  cloudflareAssetsDir?: string
}): HashedStaticParityResult {
  const vercelNextDir = options?.vercelNextDir || path.join(process.cwd(), B4_VERCEL_NEXT_SNAPSHOT_DIR)
  const cloudflareAssetsDir = options?.cloudflareAssetsDir || path.join(process.cwd(), B4_CLOUDFLARE_ASSETS_DIR)
  const vercelStaticRoot = path.join(vercelNextDir, 'static')
  const cloudflareStaticRoot = path.join(cloudflareAssetsDir, '_next', 'static')
  const empty = {
    vercelCount: 0,
    cloudflareCount: 0,
    missingOnCloudflare: [] as string[],
    extraOnCloudflare: [] as string[],
  }

  const snapshotMarker = path.join(vercelNextDir, B4_VERCEL_NEXT_SNAPSHOT_MARKER)
  if (!fs.existsSync(vercelStaticRoot) || !fs.existsSync(snapshotMarker)) {
    return {
      status: 'skipped',
      reason: `Vercel Next snapshot missing at ${vercelNextDir} (need ${B4_VERCEL_NEXT_SNAPSHOT_MARKER}). Run \`npm run b4:snapshot-vercel-next\` after \`npm run build:ci\` and before \`npm run build:cloudflare\`. Live .next is not a valid Vercel artifact after a Cloudflare build.`,
      vercelArtifact: vercelNextDir,
      vercelBuildId: null,
      cloudflareBuildId: readBuildId(path.join(process.cwd(), '.next')),
      ...empty,
    }
  }

  if (!fs.existsSync(cloudflareStaticRoot)) {
    return {
      status: 'skipped',
      reason: `Cloudflare Static Assets missing at ${cloudflareStaticRoot}`,
      vercelArtifact: vercelNextDir,
      vercelBuildId: readBuildId(vercelNextDir),
      cloudflareBuildId: null,
      ...empty,
    }
  }

  const vercelBuildId = readBuildId(vercelNextDir)
  const cloudflareBuildId = readBuildId(path.join(process.cwd(), '.next'))
  const compared = compareHashedStaticManifests(vercelStaticRoot, cloudflareStaticRoot)

  if (compared.vercelCount === 0) {
    return {
      status: 'fail',
      reason: 'Vercel snapshot `.next/static` is empty',
      vercelArtifact: vercelNextDir,
      vercelBuildId,
      cloudflareBuildId,
      ...compared,
    }
  }

  if (compared.missingOnCloudflare.length > 0) {
    return {
      status: 'fail',
      reason: `${compared.missingOnCloudflare.length} Vercel hashed files are missing from Cloudflare Static Assets`,
      vercelArtifact: vercelNextDir,
      vercelBuildId,
      cloudflareBuildId,
      ...compared,
    }
  }

  return {
    status: 'pass',
    reason: 'every file in the Vercel Next snapshot exists in `.open-next/assets/_next/static`',
    vercelArtifact: vercelNextDir,
    vercelBuildId,
    cloudflareBuildId,
    ...compared,
  }
}

function isMain() {
  const entry = process.argv[1] ? path.resolve(process.argv[1]) : ''
  return entry.endsWith(`${path.sep}b4-static-asset-parity.ts`) || entry.endsWith(`${path.sep}b4-static-asset-parity.js`)
}

if (isMain()) {
  if (process.argv.includes('--snapshot')) {
    const snapshot = snapshotVercelNextBuild()
    process.stdout.write(`${JSON.stringify({ action: 'snapshot', ...snapshot }, null, 2)}\n`)
    process.exit(0)
  }
  const vercelFlag = process.argv.includes('--vercel')
    ? process.argv[process.argv.indexOf('--vercel') + 1]
    : undefined
  const cloudflareFlag = process.argv.includes('--cloudflare')
    ? process.argv[process.argv.indexOf('--cloudflare') + 1]
    : undefined
  const result = hashedStaticParityGate({
    vercelNextDir: vercelFlag,
    cloudflareAssetsDir: cloudflareFlag,
  })
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`)
  if (result.status === 'pass') process.exit(0)
  if (result.status === 'skipped') process.exit(2)
  process.exit(1)
}
