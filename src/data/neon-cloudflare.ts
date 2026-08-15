import { neon } from '@neondatabase/serverless'

export function getCloudflareSql() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) throw new Error('DATABASE_URL is not configured for the Cloudflare runtime')
  return neon(connectionString)
}
