import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const sourceRoot = path.join(root, 'src')
const allowedProviderFiles = new Set([
  path.join(sourceRoot, 'lib/postgres-runtime.ts'),
  path.join(sourceRoot, 'data/neon-cloudflare.ts'),
])

const providerMarkers = [
  '@prisma/adapter-neon',
  '@neondatabase/serverless',
  'PrismaNeon',
  'neon(',
]

function sourcePaths(directory: string): string[] {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name)
    if (entry.isDirectory()) return sourcePaths(entryPath)
    return /\.(?:js|mjs|ts|tsx)$/.test(entry.name) ? [entryPath] : []
  })
}

describe('PostgreSQL provider boundary', () => {
  it('keeps provider-specific runtime markers inside approved infrastructure files', () => {
    const violations: string[] = []

    for (const filePath of sourcePaths(sourceRoot)) {
      const source = fs.readFileSync(filePath, 'utf8')
      if (!providerMarkers.some((marker) => source.includes(marker))) continue
      if (!allowedProviderFiles.has(filePath)) violations.push(path.relative(root, filePath))
    }

    expect(violations).toEqual([])
  })

  it('keeps the canonical runtime singleton on the contained adapter path', () => {
    const prismaSource = fs.readFileSync(path.join(sourceRoot, 'lib/prisma.ts'), 'utf8')
    const providerSource = fs.readFileSync(path.join(sourceRoot, 'lib/postgres-runtime.ts'), 'utf8')

    expect(prismaSource).toContain("from './postgres-runtime'")
    expect(prismaSource).not.toContain('@prisma/adapter-neon')
    expect(prismaSource).not.toContain('PrismaNeon')
    expect(providerSource).toContain('@prisma/adapter-neon')
    expect(providerSource).toContain('DATABASE_URL')
  })
})
