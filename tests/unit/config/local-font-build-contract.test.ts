import { readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'

const appRoot = path.join(process.cwd(), 'src', 'app')

function collectSourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name)
    if (entry.isDirectory()) return collectSourceFiles(fullPath)
    return /\.(?:css|[cm]?[jt]sx?)$/.test(entry.name) ? [fullPath] : []
  })
}

describe('local font build contract', () => {
  const sourceFiles = collectSourceFiles(appRoot)
  const sourceByPath = sourceFiles.map((file) => [file, readFileSync(file, 'utf8')] as const)

  it('does not let production app source reintroduce build-time Google Fonts fetching', () => {
    const googleFontImports = sourceByPath
      .filter(([, source]) => /(?:from\s*|import\s*)['"]next\/font\/google['"]/.test(source))
      .map(([file]) => path.relative(process.cwd(), file))

    expect(googleFontImports).toEqual([])
    expect(sourceByPath.some(([, source]) => /fonts\.(?:googleapis|gstatic)\.com/.test(source))).toBe(false)
  })

  it('keeps local variable font faces, display behavior, and CSS variable names aligned', () => {
    const localeLayout = readFileSync(path.join(appRoot, '[locale]', 'layout.tsx'), 'utf8')
    const adminLayout = readFileSync(path.join(appRoot, '(admin)', 'layout.tsx'), 'utf8')
    const globalStyles = readFileSync(path.join(appRoot, 'globals.css'), 'utf8')
    const interStyles = readFileSync(
      path.join(process.cwd(), 'node_modules/@fontsource-variable/inter/wght.css'),
      'utf8',
    )
    const arabicStyles = readFileSync(
      path.join(process.cwd(), 'node_modules/@fontsource-variable/noto-sans-arabic/wght.css'),
      'utf8',
    )
    const packageJson = JSON.parse(readFileSync(path.join(process.cwd(), 'package.json'), 'utf8')) as {
      dependencies?: Record<string, string>
    }

    expect(localeLayout).toContain("@fontsource-variable/inter/wght.css")
    expect(localeLayout).toContain("@fontsource-variable/noto-sans-arabic/wght.css")
    expect(adminLayout).toContain("@fontsource-variable/inter/wght.css")
    expect(packageJson.dependencies?.['@fontsource-variable/inter']).toBe('5.3.0')
    expect(packageJson.dependencies?.['@fontsource-variable/noto-sans-arabic']).toBe('5.3.0')
    expect(globalStyles).toMatch(/--font-inter:\s*'Inter Variable'/)
    expect(globalStyles).toMatch(/--font-arabic:\s*'Noto Sans Arabic Variable'/)
    expect(globalStyles).toContain('font-family: var(--font-inter)')
    expect(globalStyles).toContain('font-family: var(--font-arabic), var(--font-inter)')
    expect(interStyles).toContain('font-display: swap')
    expect(interStyles).toContain('font-weight: 100 900')
    expect(arabicStyles).toContain('font-display: swap')
    expect(arabicStyles).toContain('font-weight: 100 900')
    expect(arabicStyles).toContain('unicode-range: U+0600-06FF')
  })
})
