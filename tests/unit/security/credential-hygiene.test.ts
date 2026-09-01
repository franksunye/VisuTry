import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const importScript = path.join(root, 'scripts/import-500-models.py')
const scriptsRoot = path.join(root, 'scripts')

const embeddedDatabaseCredential = /postgres(?:ql)?:\/\/[^\s/:@]+:[^\s@]+@/i
const exposedNeonCredential = /\bnpg_[A-Za-z0-9]+\b/

function maintenanceScriptPaths(directory: string): string[] {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name)
    if (entry.isDirectory()) return maintenanceScriptPaths(entryPath)
    return /\.(?:js|mjs|py|sh|ts)$/.test(entry.name) ? [entryPath] : []
  })
}

describe('DB credential hygiene', () => {
  it('requires DATABASE_URL and contains no hard-coded database credential', () => {
    const source = fs.readFileSync(importScript, 'utf8')

    expect(source).toMatch(/DATABASE_URL\s*=\s*os\.environ\.get\(['"]DATABASE_URL['"]\)/)
    expect(source).toMatch(/DATABASE_URL is required/)
    expect(source).not.toMatch(embeddedDatabaseCredential)
    expect(source).not.toMatch(exposedNeonCredential)
  })

  it('keeps maintenance scripts free of embedded database credentials', () => {
    const violations: string[] = []

    for (const filePath of maintenanceScriptPaths(scriptsRoot)) {
      const source = fs.readFileSync(filePath, 'utf8')
      if (embeddedDatabaseCredential.test(source)) violations.push(path.relative(root, filePath))
      if (exposedNeonCredential.test(source)) violations.push(path.relative(root, filePath))
    }

    expect(violations).toEqual([])
  })
})
