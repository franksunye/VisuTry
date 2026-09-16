import fs from 'node:fs'
import path from 'node:path'

const highFanoutLinkFiles = [
  'src/components/layout/Header.tsx',
  'src/components/layout/Footer.tsx',
  'src/app/[locale]/(public)/blog/page.tsx',
  'src/app/[locale]/(public)/glasses-guide/page.tsx',
  'src/app/[locale]/(public)/glasses-guide/[slug]/page.tsx',
]

const stylePageFile = 'src/app/[locale]/(public)/style/[faceShape]/page.tsx'
const publicRouteRoot = 'src/app/[locale]/(public)'

function readSource(relativePath: string) {
  return fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8')
}

function listTsxFiles(relativeDirectory: string): string[] {
  const absoluteDirectory = path.join(process.cwd(), relativeDirectory)

  return fs.readdirSync(absoluteDirectory, { withFileTypes: true }).flatMap((entry) => {
    const relativePath = path.join(relativeDirectory, entry.name)

    if (entry.isDirectory()) return listTsxFiles(relativePath)
    return entry.isFile() && entry.name.endsWith('.tsx') ? [relativePath] : []
  })
}

function nextLinkOpeningTags(source: string) {
  return source.match(/<Link\b[\s\S]*?>/g) ?? []
}

describe('P0-D1 prefetch containment', () => {
  it('keeps Public route files behind the governed PublicLink boundary', () => {
    const publicRouteFiles = listTsxFiles(publicRouteRoot)

    expect(publicRouteFiles.length).toBeGreaterThan(0)
    publicRouteFiles.forEach((relativePath) => {
      const source = readSource(relativePath)
      expect(source).not.toMatch(/from ['\"]next\/link['\"]|require\(['\"]next\/link['\"]\)/)
    })
  })

  it('defaults PublicLink to no speculative prefetch', () => {
    const source = readSource('src/components/layout/PublicLink.tsx')

    expect(source).toMatch(/prefetch\s*=\s*false/)
    expect(source).toMatch(/<NextLink[\s\S]*prefetch=\{prefetch\}/)
  })

  it.each(highFanoutLinkFiles)('%s keeps every visible Next Link opt-out explicit', (relativePath) => {
    const linkTags = nextLinkOpeningTags(readSource(relativePath))

    expect(linkTags.length).toBeGreaterThan(0)
    linkTags.forEach((tag) => {
      expect(tag).toContain('prefetch={false}')
    })
  })

  it('disables speculative prefetch for style sibling SEO links', () => {
    const source = readSource(stylePageFile)

    expect(source).toMatch(
      /href=\{`\/\$\{locale\}\/style\/\$\{item\}-face`\}[\s\S]{0,160}prefetch=\{false\}/,
    )
  })

  it('disables speculative prefetch for the English glasses-guide exploration link', () => {
    const source = readSource(stylePageFile)

    expect(source).toMatch(
      /href=\{`\/\$\{locale\}\/glasses-guide`\}[\s\S]{0,160}prefetch=\{false\}/,
    )
  })
})
