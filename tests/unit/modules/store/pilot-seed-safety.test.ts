import { assertLocalPilotSeedTarget } from '@/modules/store/domain/pilot-seed-safety'

const safe = {
  appEnv: 'local',
  nodeEnv: 'test',
  confirmation: 'local-test-only',
  databaseUrl: 'postgresql://local@127.0.0.1:5433/visutry_local_factory_test',
  databaseUrlUnpooled: 'postgresql://local@localhost:5433/visutry_local_factory_test',
}

describe('legacy Pilot seed local-only safety boundary', () => {
  it('accepts an explicitly confirmed disposable loopback TEST database', () => {
    expect(() => assertLocalPilotSeedTarget(safe)).not.toThrow()
  })

  it.each([
    { appEnv: undefined },
    { appEnv: 'preview' },
    { appEnv: 'production' },
    { nodeEnv: 'production' },
    { vercelEnv: 'production' },
  ])('fails closed outside a local non-production runtime: %o', (override) => {
    expect(() => assertLocalPilotSeedTarget({ ...safe, ...override })).toThrow(/restricted to APP_ENV=local/)
  })

  it.each([undefined, 'yes', 'true', 'prod'])('rejects the old ambiguous confirmation string: %s', (confirmation) => {
    expect(() => assertLocalPilotSeedTarget({ ...safe, confirmation })).toThrow(/local-test-only/)
  })

  it.each([
    'postgresql://user@remote-db.example.com:5432/visutry_local_factory_test',
    'postgresql://user@10.0.0.4:5432/visutry_local_factory_test',
    'postgresql://user@localhost:5432/production',
    'postgresql://user@localhost:5432/visutry_local_other?host=/var/run/postgresql',
    'https://localhost:5432/visutry_local_factory_test',
    'not-a-database-url',
  ])('refuses untrusted or non-test DB destination: %s', (databaseUrl) => {
    expect(() => assertLocalPilotSeedTarget({ ...safe, databaseUrl })).toThrow(/Pilot seed DATABASE_URL/)
  })

  it('rejects a remote unpooled URL even with a safe pooled URL', () => {
    expect(() => assertLocalPilotSeedTarget({
      ...safe,
      databaseUrlUnpooled: 'postgresql://user@production-db.example.com:5432/visutry_local_factory_test',
    })).toThrow(/Pilot seed DATABASE_URL_UNPOOLED/)
  })

  it('requires both database targets explicitly, preventing ambient remote defaults', () => {
    expect(() => assertLocalPilotSeedTarget({ ...safe, databaseUrlUnpooled: undefined })).toThrow(/explicit local DATABASE_URL_UNPOOLED/)
  })
})
