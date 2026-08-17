/**
 * Cloudflare build-only replacement for Prisma runtime imports.
 *
 * Public Cloudflare reads use the direct Neon providers. Keeping this module
 * deliberately small prevents unsupported Prisma-backed routes from pulling
 * the query compiler into the Worker. Vercel and local application builds do
 * not resolve this file.
 */

const unavailableMessage = 'Prisma is not available in the Cloudflare runtime; use a direct Neon provider'
const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build'

function unavailableOperation(method: string): unknown {
  if (!isBuildTime) throw new Error(unavailableMessage)
  if (method === 'count') return Promise.resolve(0)
  if (method === 'findMany' || method === 'groupBy' || method === 'aggregate') return Promise.resolve([])
  if (method === 'findFirst' || method === 'findUnique') return Promise.resolve(null)
  return Promise.resolve({})
}

function createUnavailableMethod(method: string) {
  return new Proxy(function unavailablePrismaMethod() {}, {
    apply: () => unavailableOperation(method),
    get: (_target, property) => createUnavailableMethod(`${method}.${String(property)}`),
  })
}

function createUnavailableModel() {
  return new Proxy({}, {
    get(_target, property) {
      return createUnavailableMethod(String(property))
    },
  })
}

function createUnavailableClient() {
  return new Proxy({}, {
    get(_target, property) {
      // Avoid making the proxy thenable while allowing route modules to
      // construct a client during Next/OpenNext build collection.
      if (property === 'then') return undefined
      if (String(property).startsWith('$')) return createUnavailableMethod(String(property))
      return createUnavailableModel()
    },
  })
}

export class PrismaClient {
  constructor() {
    return createUnavailableClient()
  }
}

export const prisma = createUnavailableClient()

export const Prisma = {
  TransactionIsolationLevel: {
    Serializable: 'Serializable',
    ReadUncommitted: 'ReadUncommitted',
    ReadCommitted: 'ReadCommitted',
    RepeatableRead: 'RepeatableRead',
    Snapshot: 'Snapshot',
  },
  PrismaClientKnownRequestError: class PrismaClientKnownRequestError extends Error {},
}

export const PaymentStatus = {
  PENDING: 'PENDING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  REFUNDED: 'REFUNDED',
} as const

export const TaskStatus = {
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
} as const

export const TryOnType = {
  GLASSES: 'GLASSES',
  OUTFIT: 'OUTFIT',
  SHOES: 'SHOES',
  ACCESSORIES: 'ACCESSORIES',
} as const

export const UserRole = {
  USER: 'USER',
  ADMIN: 'ADMIN',
} as const
