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

function optionalString(value: unknown): string | undefined {
  return value == null ? undefined : String(value)
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

const accountColumns = `"id", "userId", "type", "provider", "providerAccountId", "refresh_token", "access_token", "expires_at", "token_type", "scope", "id_token", "session_state"`

function newRecordId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `cf-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
}

function mapAdapterUser(row: Row): AdapterUser {
  return {
    id: String(row.id),
    name: nullableString(row.name),
    email: nullableString(row.email) ?? '',
    emailVerified: dateValue(row.emailVerified),
    image: nullableString(row.image),
  } as AdapterUser
}

function mapAdapterAccount(row: Row): AdapterAccount {
  return {
    id: String(row.id),
    userId: String(row.userId),
    type: String(row.type) as AdapterAccount['type'],
    provider: String(row.provider),
    providerAccountId: String(row.providerAccountId),
    refresh_token: optionalString(row.refresh_token),
    access_token: optionalString(row.access_token),
    expires_at: row.expires_at == null ? undefined : Number(row.expires_at),
    token_type: optionalString(row.token_type),
    scope: optionalString(row.scope),
    id_token: optionalString(row.id_token),
    session_state: optionalString(row.session_state),
  }
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

async function createUser(user: Omit<AdapterUser, 'id'>): Promise<AdapterUser> {
  const sql = getCloudflareSql()
  const now = new Date()
  const rows = await sql`
    INSERT INTO "User" ("id", "name", "email", "emailVerified", "image", "createdAt", "updatedAt")
    VALUES (${newRecordId()}, ${user.name ?? null}, ${user.email}, ${user.emailVerified ?? null}, ${user.image ?? null}, ${now}, ${now})
    ON CONFLICT ("email") DO UPDATE SET
      "name" = COALESCE("User"."name", EXCLUDED."name"),
      "emailVerified" = COALESCE("User"."emailVerified", EXCLUDED."emailVerified"),
      "image" = COALESCE("User"."image", EXCLUDED."image"),
      "updatedAt" = EXCLUDED."updatedAt"
    RETURNING ${sql.unsafe(adapterUserColumns)}
  `
  if (!rows[0]) throw new Error('Cloudflare Auth createUser returned no User row')
  return mapAdapterUser(rows[0])
}

async function updateUser(user: Partial<AdapterUser> & Pick<AdapterUser, 'id'>): Promise<AdapterUser> {
  const sql = getCloudflareSql()
  const hasName = Object.prototype.hasOwnProperty.call(user, 'name')
  const hasEmail = Object.prototype.hasOwnProperty.call(user, 'email')
  const hasEmailVerified = Object.prototype.hasOwnProperty.call(user, 'emailVerified')
  const hasImage = Object.prototype.hasOwnProperty.call(user, 'image')
  const rows = await sql`
    UPDATE "User"
    SET "name" = CASE WHEN ${hasName} THEN ${user.name ?? null} ELSE "name" END,
        "email" = CASE WHEN ${hasEmail} THEN ${user.email ?? null} ELSE "email" END,
        "emailVerified" = CASE WHEN ${hasEmailVerified} THEN ${user.emailVerified ?? null} ELSE "emailVerified" END,
        "image" = CASE WHEN ${hasImage} THEN ${user.image ?? null} ELSE "image" END,
        "updatedAt" = ${new Date()}
    WHERE "id" = ${user.id}
    RETURNING ${sql.unsafe(adapterUserColumns)}
  `
  if (!rows[0]) throw new Error(`Cloudflare Auth updateUser could not find User ${user.id}`)
  return mapAdapterUser(rows[0])
}

async function linkAccount(account: AdapterAccount): Promise<AdapterAccount> {
  const sql = getCloudflareSql()
  const rows = await sql`
    INSERT INTO "Account" ("id", "userId", "type", "provider", "providerAccountId", "refresh_token", "access_token", "expires_at", "token_type", "scope", "id_token", "session_state")
    VALUES (${newRecordId()}, ${account.userId}, ${account.type}, ${account.provider}, ${account.providerAccountId}, ${account.refresh_token ?? null}, ${account.access_token ?? null}, ${account.expires_at ?? null}, ${account.token_type ?? null}, ${account.scope ?? null}, ${account.id_token ?? null}, ${account.session_state ?? null})
    ON CONFLICT ("provider", "providerAccountId") DO NOTHING
    RETURNING ${sql.unsafe(accountColumns)}
  `
  if (rows[0]) return mapAdapterAccount(rows[0])

  const existing = await sql`
    SELECT ${sql.unsafe(accountColumns)}
    FROM "Account"
    WHERE "provider" = ${account.provider}
      AND "providerAccountId" = ${account.providerAccountId}
    LIMIT 1
  `
  if (!existing[0]) throw new Error('Cloudflare Auth linkAccount could not read the existing Account row')
  if (String(existing[0].userId) !== account.userId) {
    throw new Error('Cloudflare Auth account is already linked to another User')
  }
  return mapAdapterAccount(existing[0])
}

/**
 * Cloudflare NextAuth adapter for Auth0/JWT flows.
 *
 * The adapter deliberately implements only the Auth0 user/account writes needed
 * for a legitimate first login. Database sessions and email-passwordless
 * verification writes remain unsupported in the JWT-only Cloudflare boundary.
 */
export function createCloudflareAuthAdapter(): Adapter {
  return {
    getUser: getAdapterUserById,
    getUserByEmail: getAdapterUserByEmail,
    getUserByAccount: getAdapterUserByAccount,
    createUser,
    updateUser,
    linkAccount,
    createSession: async () => unsupportedWrite('createSession'),
    getSessionAndUser: async () => unsupportedWrite('getSessionAndUser'),
    updateSession: async () => unsupportedWrite('updateSession'),
    deleteSession: async () => unsupportedWrite('deleteSession'),
    createVerificationToken: async () => unsupportedWrite('createVerificationToken'),
    useVerificationToken: async () => unsupportedWrite('useVerificationToken'),
  }
}
