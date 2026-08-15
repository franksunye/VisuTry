import type { Adapter, AdapterAccount, AdapterUser } from 'next-auth/adapters'
import { getCloudflareSql } from './neon-cloudflare'

export type CloudflareAuthUser = {
  id: string
  name: string | null
  email: string | null
  emailVerified: Date | null
  image: string | null
  username: string | null
  freeTrialsUsed: number
  premiumUsageCount: number
  creditsPurchased: number
  creditsUsed: number
  isPremium: boolean
  premiumExpiresAt: Date | null
  currentSubscriptionType: string | null
  role: 'USER' | 'ADMIN'
  lastRetention3DayEmailSent: Date | null
  lastRetention24HEmailSent: Date | null
  lastRetentionDeletedEmailSent: Date | null
  createdAt: Date
  updatedAt: Date
}

type Row = Record<string, unknown>

function dateValue(value: unknown): Date | null {
  return value == null ? null : value instanceof Date ? value : new Date(String(value))
}

function requiredDate(value: unknown): Date {
  return dateValue(value) ?? new Date(0)
}

function nullableString(value: unknown): string | null {
  return value == null ? null : String(value)
}

function mapUser(row: Row): CloudflareAuthUser {
  return {
    id: String(row.id),
    name: nullableString(row.name),
    email: nullableString(row.email),
    emailVerified: dateValue(row.emailVerified),
    image: nullableString(row.image),
    username: nullableString(row.username),
    freeTrialsUsed: Number(row.freeTrialsUsed ?? 0),
    premiumUsageCount: Number(row.premiumUsageCount ?? 0),
    creditsPurchased: Number(row.creditsPurchased ?? 0),
    creditsUsed: Number(row.creditsUsed ?? 0),
    isPremium: Boolean(row.isPremium),
    premiumExpiresAt: dateValue(row.premiumExpiresAt),
    currentSubscriptionType: nullableString(row.currentSubscriptionType),
    role: String(row.role) === 'ADMIN' ? 'ADMIN' : 'USER',
    lastRetention3DayEmailSent: dateValue(row.lastRetention3DayEmailSent),
    lastRetention24HEmailSent: dateValue(row.lastRetention24HEmailSent),
    lastRetentionDeletedEmailSent: dateValue(row.lastRetentionDeletedEmailSent),
    createdAt: requiredDate(row.createdAt),
    updatedAt: requiredDate(row.updatedAt),
  }
}

const userColumns = `
  "id", "name", "email", "emailVerified", "image", "username",
  "freeTrialsUsed", "premiumUsageCount", "creditsPurchased", "creditsUsed",
  "isPremium", "premiumExpiresAt", "currentSubscriptionType", "role",
  "lastRetention3DayEmailSent", "lastRetention24HEmailSent",
  "lastRetentionDeletedEmailSent", "createdAt", "updatedAt"
`

const adapterUserColumns = `"id", "name", "email", "emailVerified", "image"`
const adapterUserColumnsQualified = `u."id", u."name", u."email", u."emailVerified", u."image"`

function mapAdapterUser(row: Row): AdapterUser {
  return {
    id: String(row.id),
    name: nullableString(row.name),
    email: nullableString(row.email) ?? '',
    emailVerified: dateValue(row.emailVerified),
    image: nullableString(row.image),
  } as AdapterUser
}

export async function getCloudflareAuthUser(userId: string): Promise<CloudflareAuthUser | null> {
  const sql = getCloudflareSql()
  const rows = await sql`
    SELECT ${sql.unsafe(userColumns)}
    FROM "User"
    WHERE "id" = ${userId}
    LIMIT 1
  `
  return rows[0] ? mapUser(rows[0]) : null
}

async function getAdapterUserById(userId: string): Promise<AdapterUser | null> {
  const sql = getCloudflareSql()
  const rows = await sql`
    SELECT ${sql.unsafe(adapterUserColumns)}
    FROM "User"
    WHERE "id" = ${userId}
    LIMIT 1
  `
  return rows[0] ? mapAdapterUser(rows[0]) : null
}

async function getAdapterUserByEmail(email: string): Promise<AdapterUser | null> {
  const sql = getCloudflareSql()
  const rows = await sql`
    SELECT ${sql.unsafe(adapterUserColumns)}
    FROM "User"
    WHERE "email" = ${email}
    LIMIT 1
  `
  return rows[0] ? mapAdapterUser(rows[0]) : null
}

async function getAdapterUserByAccount(account: Pick<AdapterAccount, 'provider' | 'providerAccountId'>): Promise<AdapterUser | null> {
  const sql = getCloudflareSql()
  const rows = await sql`
    SELECT ${sql.unsafe(adapterUserColumnsQualified)}
    FROM "Account" a
    JOIN "User" u ON u."id" = a."userId"
    WHERE a."provider" = ${account.provider}
      AND a."providerAccountId" = ${account.providerAccountId}
    LIMIT 1
  `
  return rows[0] ? mapAdapterUser(rows[0]) : null
}

function unsupportedWrite(method: string): never {
  throw new Error(`Cloudflare Auth adapter does not implement ${method}; existing linked users only in Phase B1`)
}

/**
 * Read-only NextAuth adapter for existing provider-linked users.
 *
 * Auth0 account/user creation and linking are intentionally deferred because
 * they are database writes. Vercel continues using PrismaAdapter.
 */
export function createCloudflareAuthAdapter(): Adapter {
  return {
    getUser: getAdapterUserById,
    getUserByEmail: getAdapterUserByEmail,
    getUserByAccount: getAdapterUserByAccount,
    createUser: async () => unsupportedWrite('createUser'),
    updateUser: async () => unsupportedWrite('updateUser'),
    linkAccount: async () => unsupportedWrite('linkAccount'),
    createSession: async () => unsupportedWrite('createSession'),
    getSessionAndUser: async () => unsupportedWrite('getSessionAndUser'),
    updateSession: async () => unsupportedWrite('updateSession'),
    deleteSession: async () => unsupportedWrite('deleteSession'),
    createVerificationToken: async () => unsupportedWrite('createVerificationToken'),
    useVerificationToken: async () => unsupportedWrite('useVerificationToken'),
  }
}
