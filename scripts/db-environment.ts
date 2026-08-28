import 'dotenv/config'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'
import { assertDatabaseEnvironment, databaseIdentityFromUrl, requireExplicitAppEnvironment, type AppEnvironment } from '../src/lib/app-environment'

const connectionString = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL
if (!connectionString) throw new Error('DATABASE_URL_UNPOOLED or DATABASE_URL is required.')
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) })

function expectedEnvironment(): AppEnvironment {
  const environment = requireExplicitAppEnvironment()
  if (environment === 'production') throw new Error('Environment marker registration refuses Production.')
  return environment
}

function expectedIdentity(environment: AppEnvironment): string {
  const configured = process.env.VISUTRY_DATABASE_IDENTITY?.trim()
  if (configured) return configured
  const derived = databaseIdentityFromUrl(process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL)
  if (!derived) throw new Error('A valid DATABASE_URL or VISUTRY_DATABASE_IDENTITY is required.')
  return environment === 'local' ? `local:${derived}` : derived
}

function assertSafeUrl(environment: AppEnvironment): void {
  const identity = databaseIdentityFromUrl(process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL)
  if (!identity) throw new Error('A valid database URL is required.')
  if (environment !== 'production' && /ep-wandering-union-ad43rx1s/i.test(identity)) {
    throw new Error('The configured database is the known Production Neon branch; refusing non-Production registration.')
  }
}

async function main() {
  const command = process.argv[2] ?? 'status'
  const environment = expectedEnvironment()
  assertSafeUrl(environment)
  const identity = expectedIdentity(environment)
  if (command === 'register') {
    await prisma.environmentMetadata.upsert({
      where: { id: 'primary' },
      create: { id: 'primary', environment: environment.toUpperCase(), databaseIdentity: identity },
      update: { environment: environment.toUpperCase(), databaseIdentity: identity },
    })
  } else if (command !== 'status') {
    throw new Error(`Unknown command: ${command}. Use register or status.`)
  }
  const marker = await assertDatabaseEnvironment({
    client: prisma,
    expectedEnvironment: environment,
    expectedDatabaseIdentity: identity,
  })
  console.log(JSON.stringify({ environment, databaseIdentity: marker.databaseIdentity, markerEnvironment: marker.environment, result: 'PASS' }, null, 2))
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
}).finally(async () => {
  await prisma.$disconnect()
})
