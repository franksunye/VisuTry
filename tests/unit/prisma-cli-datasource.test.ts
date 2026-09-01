import {
  PRISMA_GENERATE_PLACEHOLDER_URL,
  resolvePrismaCliDatasourceUrl,
} from '../../prisma/resolve-cli-datasource-url'

describe('resolvePrismaCliDatasourceUrl', () => {
  it('prefers DATABASE_MIGRATION_URL over all legacy migration variables', () => {
    expect(
      resolvePrismaCliDatasourceUrl(
        {
          DATABASE_MIGRATION_URL: 'postgresql://migration/db',
          DATABASE_URL_UNPOOLED: 'postgresql://unpooled/db',
          DIRECT_DATABASE_URL: 'postgresql://direct/db',
          DIRECT_URL: 'postgresql://direct-alias/db',
          DATABASE_URL: 'postgresql://pooled/db',
        },
        ['node', 'prisma', 'migrate', 'deploy'],
      ),
    ).toEqual({ url: 'postgresql://migration/db', mode: 'direct' })
  })

  it('ignores blank migration URLs when selecting the next configured source', () => {
    expect(
      resolvePrismaCliDatasourceUrl(
        {
          DATABASE_MIGRATION_URL: '   ',
          DATABASE_URL_UNPOOLED: 'postgresql://unpooled/db',
          DATABASE_URL: 'postgresql://pooled/db',
        },
        ['node', 'prisma', 'migrate', 'deploy'],
      ),
    ).toEqual({ url: 'postgresql://unpooled/db', mode: 'direct' })
  })

  it('prefers DATABASE_URL_UNPOOLED for migrate and generate', () => {
    const env = {
      DATABASE_URL_UNPOOLED: 'postgresql://direct/db',
      DATABASE_URL: 'postgresql://pooled/db',
    }

    expect(resolvePrismaCliDatasourceUrl(env, ['node', 'prisma', 'migrate', 'deploy'])).toEqual({
      url: 'postgresql://direct/db',
      mode: 'direct',
    })
    expect(resolvePrismaCliDatasourceUrl(env, ['node', 'prisma', 'generate'])).toEqual({
      url: 'postgresql://direct/db',
      mode: 'direct',
    })
  })

  it('falls back to DATABASE_URL when the unpooled URL is absent', () => {
    expect(
      resolvePrismaCliDatasourceUrl(
        { DATABASE_URL: 'postgresql://pooled/db' },
        ['node', 'prisma', 'migrate', 'status'],
      ),
    ).toEqual({
      url: 'postgresql://pooled/db',
      mode: 'pooled-fallback',
    })
  })

  it('allows prisma generate without any database URL', () => {
    expect(resolvePrismaCliDatasourceUrl({}, ['node', 'prisma', 'generate'])).toEqual({
      url: PRISMA_GENERATE_PLACEHOLDER_URL,
      mode: 'generate-placeholder',
    })
  })

  it('uses a placeholder when Prisma loads the config without generate on argv', () => {
    expect(resolvePrismaCliDatasourceUrl({}, ['node', 'jiti'])).toEqual({
      url: PRISMA_GENERATE_PLACEHOLDER_URL,
      mode: 'generate-placeholder',
    })
  })

  it('still requires a database URL for migrate and db commands', () => {
    expect(() =>
      resolvePrismaCliDatasourceUrl({}, ['node', 'prisma', 'migrate', 'deploy']),
    ).toThrow(/No database URL found/)
    expect(() => resolvePrismaCliDatasourceUrl({}, ['node', 'prisma', 'db', 'pull'])).toThrow(
      /No database URL found/,
    )
  })
})
