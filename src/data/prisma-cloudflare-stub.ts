/**
 * Cloudflare build-only replacement for Prisma runtime imports.
 *
 * Public Cloudflare reads use the direct Neon providers. Keeping this module
 * deliberately small prevents unsupported Prisma-backed routes from pulling
 * the query compiler into the Worker. Vercel and local application builds do
 * not resolve this file.
 */

export class PrismaClient {
  constructor() {
    throw new Error('Prisma is not available in the Cloudflare runtime; use a direct Neon provider')
  }
}

export const prisma = new Proxy({}, {
  get() {
    throw new Error('Prisma is not available in the Cloudflare runtime; use a direct Neon provider')
  },
})

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
