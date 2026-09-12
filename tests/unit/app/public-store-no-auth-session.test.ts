import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

describe('public Store/Campaign routes skip anonymous auth', () => {
  it('does not wrap the public route group in the consumer session boundary', () => {
    const source = readFileSync(resolve(process.cwd(), 'src/app/[locale]/(public)/layout.tsx'), 'utf8')
    expect(source).not.toMatch(/SessionProvider/)
    expect(source).not.toMatch(/ConsumerSessionBoundary/)
    expect(source).not.toMatch(/PaymentConversionTracker/)
  })

  it('keeps SessionProvider on 2C consumer routes', () => {
    const source = readFileSync(resolve(process.cwd(), 'src/app/[locale]/(consumer-app)/layout.tsx'), 'utf8')
    expect(source).toMatch(/ConsumerSessionBoundary/)
  })
})
