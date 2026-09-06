import { readFile } from 'node:fs/promises'
import { createClient } from '@libsql/client'

const REQUIRED_AUTHORIZATION = '1'

if (process.env.ANALYTICS_EVENT_PROVIDER?.trim().toLowerCase() !== 'turso') {
  throw new Error('Set ANALYTICS_EVENT_PROVIDER=turso before bootstrapping the analytics database.')
}
if (process.env.TURSO_ANALYTICS_BOOTSTRAP_AUTHORIZED !== REQUIRED_AUTHORIZATION) {
  throw new Error('Set TURSO_ANALYTICS_BOOTSTRAP_AUTHORIZED=1 for the explicit analytics schema setup.')
}
if (!process.env.TURSO_DATABASE_URL || !process.env.TURSO_AUTH_TOKEN) {
  throw new Error('TURSO_DATABASE_URL and TURSO_AUTH_TOKEN are required; values are never printed.')
}

const sql = await readFile(new URL('./turso-analytics-schema.sql', import.meta.url), 'utf8')
const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
})

try {
  await client.executeMultiple(sql)
  console.log('Turso analytics schema is ready.')
} finally {
  client.close()
}
