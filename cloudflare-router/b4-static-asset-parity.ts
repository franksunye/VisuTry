/**
 * Same-commit hashed-asset parity gate for `/_next/static*`.
 *
 * Vercel (`next build`) and Cloudflare (`CLOUDFLARE_BUILD=1 next build` +
 * OpenNext) are independent webpack graphs. CLOUDFLARE_BUILD aliases can
 * change chunk hashes even at the same git SHA. `generateBuildId` alone does
 * not prove Vercel HTML's `/_next/static` files exist in `.open-next/assets`.
 *
 * Do not enable the production Worker Route `www.visutry.com/_next/static*`
 * until this gate returns `pass` for the same commit that is live on Vercel.
 *
 * Usage:
 *   npx tsx cloudflare-router/b4-static-asset-parity.ts
 *   npx tsx cloudflare-router/b4-static-asset-parity.ts --vercel .next --cloudflare .open-next/assets
 *
 * Exit: 0 pass, 1 fail, 2 skipped (build outputs missing)
 */

import fs from 'node:fs'
import path from 'node:path'

export interface HashedStaticParityResult {
  status: 'pass' | 'fail' | 'skipped'
  reason: string
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

export function hashedStaticParityGate(options?: {
  vercelNextDir?: string
  cloudflareAssetsDir?: string
}): HashedStaticParityResult {
  const vercelNextDir = options?.vercelNextDir || path.join(process.cwd(), '.next')
  const cloudflareAssetsDir = options?.cloudflareAssetsDir || path.join(process.cwd(), '.open-next', 'assets')
  const vercelStaticRoot = path.join(vercelNextDir, 'static')
  const cloudflareStaticRoot = path.join(cloudflareAssetsDir, '_next', 'static')

  if (!fs.existsSync(vercelStaticRoot) || !fs.existsSync(cloudflareStaticRoot)) {
    return {
      status: 'skipped',
      reason: 'both a Vercel-style `.next/static` tree and `.open-next/assets/_next/static` are required',
      vercelBuildId: readBuildId(vercelNextDir),
      cloudflareBuildId: readBuildId(path.join(cloudflareAssetsDir, '_next')) || readBuildId(vercelNextDir),
      vercelCount: 0,
      cloudflareCount: 0,
      missingOnCloudflare: [],
      extraOnCloudflare: [],
    }
  }

  const vercelBuildId = readBuildId(vercelNextDir)
  const cloudflareBuildId = readBuildId(path.join(cloudflareAssetsDir, '..', '..', '.next')) || readBuildId(path.join(cloudflareAssetsDir, '_next'))
  const compared = compareHashedStaticManifests(vercelStaticRoot, cloudflareStaticRoot)

  if (compared.vercelCount === 0) {
    return {
      status: 'fail',
      reason: 'Vercel `.next/static` is empty',
      vercelBuildId,
      cloudflareBuildId,
      ...compared,
    }
  }

  if (compared.missingOnCloudflare.length > 0) {
    return {
      status: 'fail',
      reason: `${compared.missingOnCloudflare.length} Vercel hashed files are missing from Cloudflare Static Assets`,
      vercelBuildId,
      cloudflareBuildId,
      ...compared,
    }
  }

  return {
    status: 'pass',
    reason: 'every Vercel `.next/static` file exists in `.open-next/assets/_next/static`',
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
