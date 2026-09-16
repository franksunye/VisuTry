/** @jest-environment node */

import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const ROOT = path.join(__dirname, '../..')
const NPM = process.platform === 'win32' ? 'npm.cmd' : 'npm'

const productionBuildEnv = { ...process.env }
for (const key of [
  'DATABASE_URL',
  'DATABASE_URL_UNPOOLED',
  'DIRECT_URL',
  'POSTGRES_URL',
  'POSTGRES_PRISMA_URL',
  'POSTGRES_URL_NON_POOLING',
  'NEXTAUTH_SECRET',
  'AUTH_SECRET',
  'NEXTAUTH_URL',
  'STRIPE_SECRET_KEY',
  'GEMINI_API_KEY',
  'GRSAI_API_KEY',
  'GEMINI_API_BASE_URL',
  'BLOB_READ_WRITE_TOKEN',
  'RESEND_API_KEY',
  'CLOUDFLARE_BUILD',
]) {
  delete productionBuildEnv[key]
}

describe('Cloudflare production build boundary', () => {
  let bundleDir: string

  it('pins production deployment to the traffic-layer Wrangler entrypoint', () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8')) as {
      scripts: Record<string, string>
    }
    expect(pkg.scripts['deploy:cloudflare:production']).toContain(
      'OPEN_NEXT_DEPLOY=true wrangler deploy --env production --keep-vars',
    )
    expect(pkg.scripts['ci:cloudflare:deploy:production']).toBe(
      'OPEN_NEXT_DEPLOY=true wrangler deploy --env production --keep-vars',
    )
  })

  afterEach(() => {
    if (bundleDir) fs.rmSync(bundleDir, { recursive: true, force: true })
  })

  it('builds and bundles the traffic layer without Next/Prisma application runtime', () => {
    const buildOutput = execFileSync(NPM, ['run', 'ci:cloudflare:build'], {
      cwd: ROOT,
      env: productionBuildEnv,
      encoding: 'utf8',
    })
    expect(buildOutput).toMatch(/Prepared Cloudflare traffic-layer assets/)

    bundleDir = fs.mkdtempSync(path.join(os.tmpdir(), 'visutry-cloudflare-production-'))
    execFileSync(NPM, [
      'run',
      'ci:cloudflare:deploy:production',
      '--',
      '--dry-run',
      '--outdir',
      bundleDir,
      '--metafile',
      path.join(bundleDir, 'meta.json'),
    ], {
      cwd: ROOT,
      env: productionBuildEnv,
      encoding: 'utf8',
    })

    const bundle = fs.readFileSync(path.join(bundleDir, 'app-host-worker.js'), 'utf8')
    expect(bundle).not.toMatch(/\.open-next\/worker\.js|@prisma\/client|\bPrismaClient\b/)
    expect(bundle).not.toMatch(/next-server|next\/dist|server\/app/)
    expect(fs.existsSync(path.join(ROOT, '.open-next', 'worker.js'))).toBe(false)
  })
})
