/**
 * FORENSIC / REGRESSION GUARD for `/_next/static/*` graph parity.
 *
 * ROLE (post 2026-08-19 cutover): This is NOT a production activation gate.
 * Vercel is the sole Next frontend owner (see B4_NEXT_FRONTEND_OWNER). Production
 * must NOT enable Cloudflare `/_next/static` while Vercel owns the Next frontend,
 * EVEN IF this parity check happens to PASS on one build. A green result here does
 * not authorize mounting `www.visutry.com/_next/static/*` on the Worker — that
 * pattern is hard-blocked in b4-production-routes.ts. This tool exists only to:
 *   - forensically diff the two webpack graphs when investigating an incident, and
 *   - regression-detect drift between the Vercel and CLOUDFLARE_BUILD graphs.
 *
 * Vercel (`next build`) and Cloudflare (`CLOUDFLARE_BUILD=1 next build` +
 * OpenNext) are independent webpack graphs. A Cloudflare build overwrites
 * `.next`, so comparing live `.next/static` to `.open-next/assets` can false
 * PASS. Snapshot the Vercel `.next` tree *before* the Cloudflare build.
 * The snapshot marker records `gitSha` (`git rev-parse HEAD`); parity fails
 * if that SHA does not equal the current HEAD.
 *
 * Only a future migration of the ENTIRE Next frontend (HTML + RSC + client graph +
 * `/_next/static`) to Cloudflare as one self-consistent build/runtime may revisit
 * whether Cloudflare serves `/_next/static`.
 *
 * Forensic sequence:
 *   1. `CI=1 npm run build:ci`
 *   2. `npm run b4:snapshot-vercel-next`  → `.artifacts/b4/vercel-next`
 *   3. `npm run build:cloudflare`
 *   4. `npm run b4:asset-parity`
 *
 * Exit: 0 pass, 1 fail, 2 skipped (snapshot or OpenNext assets missing)
 */

import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

export const B4_VERCEL_NEXT_SNAPSHOT_DIR = path.join('.artifacts', 'b4', 'vercel-next')
export const B4_VERCEL_NEXT_SNAPSHOT_MARKER = '.b4-vercel-snapshot.json'
export const B4_CLOUDFLARE_ASSETS_DIR = path.join('.open-next', 'assets')

export interface B4VercelNextSnapshotMarker {
  kind: 'vercel-next-snapshot'
  copiedAt: string
  source: string
  buildId: string | null
  gitSha: string
  note: string
}

export interface HashedStaticParityResult {
  status: 'pass' | 'fail' | 'skipped'
  reason: string
  vercelArtifact: string
  vercelBuildId: string | null
  cloudflareBuildId: string | null
  snapshotGitSha: string | null
  currentGitSha: string | null
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

export function readGitHeadSha(cwd = process.cwd()): string {
  const sha = execFileSync('git', ['rev-parse', 'HEAD'], { cwd, encoding: 'utf8' }).trim()
  if (!sha) throw new Error('git rev-parse HEAD returned empty')
  return sha
}

export function readVercelNextSnapshotMarker(snapshotDir: string): B4VercelNextSnapshotMarker | null {
  const file = path.join(snapshotDir, B4_VERCEL_NEXT_SNAPSHOT_MARKER)
  if (!fs.existsSync(file)) return null
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8')) as B4VercelNextSnapshotMarker
  } catch {
    return null
  }
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
  gitSha?: string
}): { snapshotDir: string; buildId: string | null; gitSha: string } {
  const sourceNextDir = options?.sourceNextDir || path.join(process.cwd(), '.next')
  const snapshotDir = options?.snapshotDir || path.join(process.cwd(), B4_VERCEL_NEXT_SNAPSHOT_DIR)
  const gitSha = options?.gitSha || readGitHeadSha()
  const staticDir = path.join(sourceNextDir, 'static')
  if (!fs.existsSync(staticDir)) {
    throw new Error(`cannot snapshot Vercel Next build: missing ${staticDir}`)
  }
  fs.mkdirSync(path.dirname(snapshotDir), { recursive: true })
  fs.rmSync(snapshotDir, { recursive: true, force: true })
  fs.cpSync(sourceNextDir, snapshotDir, { recursive: true })
  const buildId = readBuildId(snapshotDir)
  const marker: B4VercelNextSnapshotMarker = {
    kind: 'vercel-next-snapshot',
    copiedAt: new Date().toISOString(),
    source: sourceNextDir,
    buildId,
    gitSha,
    note: 'Taken before CLOUDFLARE_BUILD=1. Do not refresh this after the Cloudflare build. gitSha must equal the Cloudflare build commit.',
  }
  fs.writeFileSync(
    path.join(snapshotDir, B4_VERCEL_NEXT_SNAPSHOT_MARKER),
    `${JSON.stringify(marker, null, 2)}\n`,
  )
  return { snapshotDir, buildId, gitSha }
}

export function hashedStaticParityGate(options?: {
  vercelNextDir?: string
  cloudflareAssetsDir?: string
  gitSha?: string
}): HashedStaticParityResult {
  const vercelNextDir = options?.vercelNextDir || path.join(process.cwd(), B4_VERCEL_NEXT_SNAPSHOT_DIR)
  const cloudflareAssetsDir = options?.cloudflareAssetsDir || path.join(process.cwd(), B4_CLOUDFLARE_ASSETS_DIR)
  const vercelStaticRoot = path.join(vercelNextDir, 'static')
  const cloudflareStaticRoot = path.join(cloudflareAssetsDir, '_next', 'static')
  const withIds = (
    status: HashedStaticParityResult['status'],
    reason: string,
    extra?: Partial<HashedStaticParityResult>,
  ): HashedStaticParityResult => ({
    status,
    reason,
    vercelArtifact: vercelNextDir,
    vercelBuildId: extra?.vercelBuildId ?? null,
    cloudflareBuildId: extra?.cloudflareBuildId ?? null,
    snapshotGitSha: extra?.snapshotGitSha ?? null,
    currentGitSha: extra?.currentGitSha ?? null,
    vercelCount: extra?.vercelCount ?? 0,
    cloudflareCount: extra?.cloudflareCount ?? 0,
    missingOnCloudflare: extra?.missingOnCloudflare ?? [],
    extraOnCloudflare: extra?.extraOnCloudflare ?? [],
  })

  const marker = readVercelNextSnapshotMarker(vercelNextDir)
  if (!fs.existsSync(vercelStaticRoot) || !marker) {
    return withIds(
      'skipped',
      `Vercel Next snapshot missing at ${vercelNextDir} (need ${B4_VERCEL_NEXT_SNAPSHOT_MARKER}). Run \`npm run b4:snapshot-vercel-next\` after \`npm run build:ci\` and before \`npm run build:cloudflare\`. Live .next is not a valid Vercel artifact after a Cloudflare build.`,
      { cloudflareBuildId: readBuildId(path.join(process.cwd(), '.next')) },
    )
  }

  let currentGitSha: string | null = options?.gitSha ?? null
  if (!currentGitSha) {
    try {
      currentGitSha = readGitHeadSha()
    } catch (error) {
      return withIds('fail', `cannot read current git SHA: ${error instanceof Error ? error.message : String(error)}`, {
        vercelBuildId: readBuildId(vercelNextDir),
        snapshotGitSha: marker.gitSha || null,
      })
    }
  }

  if (!marker.gitSha) {
    return withIds('fail', 'Vercel snapshot marker is missing gitSha; same-commit parity cannot be proven', {
      vercelBuildId: readBuildId(vercelNextDir),
      currentGitSha,
    })
  }

  if (marker.gitSha !== currentGitSha) {
    return withIds(
      'fail',
      `same-commit parity failed: snapshot gitSha ${marker.gitSha} != current ${currentGitSha}`,
      {
        vercelBuildId: readBuildId(vercelNextDir),
        snapshotGitSha: marker.gitSha,
        currentGitSha,
      },
    )
  }

  if (!fs.existsSync(cloudflareStaticRoot)) {
    return withIds('skipped', `Cloudflare Static Assets missing at ${cloudflareStaticRoot}`, {
      vercelBuildId: readBuildId(vercelNextDir),
      snapshotGitSha: marker.gitSha,
      currentGitSha,
    })
  }

  const vercelBuildId = readBuildId(vercelNextDir)
  const cloudflareBuildId = readBuildId(path.join(process.cwd(), '.next'))
  const compared = compareHashedStaticManifests(vercelStaticRoot, cloudflareStaticRoot)
  const ids = {
    vercelBuildId,
    cloudflareBuildId,
    snapshotGitSha: marker.gitSha,
    currentGitSha,
    ...compared,
  }

  if (compared.vercelCount === 0) {
    return withIds('fail', 'Vercel snapshot `.next/static` is empty', ids)
  }

  if (compared.missingOnCloudflare.length > 0) {
    return withIds(
      'fail',
      `${compared.missingOnCloudflare.length} Vercel hashed files are missing from Cloudflare Static Assets`,
      ids,
    )
  }

  return withIds(
    'pass',
    'every file in the Vercel Next snapshot exists in `.open-next/assets/_next/static` at the same git SHA',
    ids,
  )
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
