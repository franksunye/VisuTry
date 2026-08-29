import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

describe('public Store/Campaign routes skip anonymous auth', () => {
  it('does not wrap locale root in SessionProvider', () => {
    const source = readFileSync(resolve(process.cwd(), 'src/app/[locale]/layout.tsx'), 'utf8')
    expect(source).not.toMatch(/SessionProvider/)
    expect(source).not.toMatch(/PaymentConversionTracker/)
    expect(source).toMatch(/resolvePublicAnalyticsBootstrap/)
  })

  it('keeps SessionProvider on 2C consumer routes', () => {
    const source = readFileSync(resolve(process.cwd(), 'src/app/[locale]/(main)/layout.tsx'), 'utf8')
    expect(source).toMatch(/ConsumerSessionBoundary/)
  })
})
