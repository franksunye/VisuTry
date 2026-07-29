import fs from 'node:fs'
import path from 'node:path'

describe('pricing legal notice', () => {
  it('does not render subscription-only legal wording on the mixed pricing page', () => {
    const pagePath = path.join(
      process.cwd(),
      'src/app/[locale]/(main)/pricing/page.tsx',
    )
    const source = fs.readFileSync(pagePath, 'utf8')

    expect(source).not.toContain("t('legal.prefix')")
    expect(source).not.toContain("t('legal.suffix')")
    expect(source).toContain("t('legal.terms')")
    expect(source).toContain("t('legal.privacy')")
    expect(source).toContain("t('legal.refund')")
  })
})
