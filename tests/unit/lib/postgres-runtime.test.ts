/** @jest-environment node */

jest.mock('@prisma/adapter-pg', () => ({
  PrismaPg: jest.fn().mockImplementation((options) => ({ provider: 'pg', options })),
}))
jest.mock('@prisma/adapter-neon', () => ({
  PrismaNeon: jest.fn().mockImplementation((options) => ({ provider: 'neon', options })),
}))

import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaNeon } from '@prisma/adapter-neon'
import { createRuntimePostgresAdapter, resolveRuntimePostgresProvider } from '@/lib/postgres-runtime'

describe('runtime PostgreSQL provider boundary', () => {
  it('uses PrismaPg only for explicit loopback Local runtime', () => {
    const env = {
      APP_ENV: 'local',
      DATABASE_URL: 'postgresql://user@127.0.0.1:5433/visutry_local',
    }
    expect(resolveRuntimePostgresProvider(env)).toBe('PRISMA_PG')
    expect(createRuntimePostgresAdapter(env)).toMatchObject({ provider: 'pg' })
    expect(PrismaPg).toHaveBeenCalledWith({ connectionString: env.DATABASE_URL })
  })

  it('fails closed when Local is pointed at a remote database', () => {
    const env = { APP_ENV: 'local', DATABASE_URL: 'postgresql://user@db.example/visutry' }
    expect(() => createRuntimePostgresAdapter(env)).toThrow(/loopback PostgreSQL/)
    expect(PrismaPg).not.toHaveBeenCalledWith({ connectionString: env.DATABASE_URL })
  })

  it('keeps Preview and Production on Neon', () => {
    for (const APP_ENV of ['preview', 'production']) {
      const env = { APP_ENV, DATABASE_URL: 'postgresql://user@db.example/visutry' }
      expect(resolveRuntimePostgresProvider(env)).toBe('PRISMA_NEON')
      expect(createRuntimePostgresAdapter(env)).toMatchObject({ provider: 'neon' })
    }
    expect(PrismaNeon).toHaveBeenCalled()
  })

  it('does not infer Local when APP_ENV and VERCEL_ENV are absent', () => {
    const env = { DATABASE_URL: 'postgresql://user@db.example/visutry' }
    expect(resolveRuntimePostgresProvider(env)).toBe('PRISMA_NEON')
  })
})
