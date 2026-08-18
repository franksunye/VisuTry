import fs from 'node:fs'
import path from 'node:path'

const highFanoutLinkFiles = [
  'src/components/layout/Header.tsx',
  'src/components/layout/Footer.tsx',
  'src/app/[locale]/(main)/blog/page.tsx',
  'src/app/[locale]/(main)/glasses-guide/page.tsx',
  'src/app/[locale]/(main)/glasses-guide/[slug]/page.tsx',
]

function readSource(relativePath: string) {
  return fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8')
}

function nextLinkOpeningTags(source: string) {
  return source.match(/<Link\b[\s\S]*?>/g) ?? []
}

describe('P0-D1 prefetch containment', () => {
  it.each(highFanoutLinkFiles)('%s keeps every visible Next Link opt-out explicit', (relativePath) => {
    const linkTags = nextLinkOpeningTags(readSource(relativePath))

    expect(linkTags.length).toBeGreaterThan(0)
    linkTags.forEach((tag) => {
      expect(tag).toContain('prefetch={false}')
    })
  })
})
