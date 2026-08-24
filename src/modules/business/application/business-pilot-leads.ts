import { createHash } from 'node:crypto'
import { isIP } from 'node:net'
import { Prisma } from '@prisma/client'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { BUSINESS_PILOT_LEAD_STATUSES } from '../domain/business-pilot-lead'

const HOUR_MS = 60 * 60 * 1000
const RATE_LIMIT = 5

const optionalText = (max: number) => z.string().trim().max(max).optional().transform((value) => value || undefined)

export const businessPilotLeadInputSchema = z.object({
  requestId: z.string().uuid(),
  contactName: z.string().trim().min(2).max(120),
  email: z.string().trim().toLowerCase().email().max(254),
  businessName: z.string().trim().min(2).max(160),
  businessType: z.enum(['optical-store', 'eyewear-brand', 'ecommerce', 'agency', 'other']),
  websiteUrl: optionalText(500).refine((value) => !value || /^https?:\/\//iu.test(value), 'Use a full http(s) URL.'),
  frameCountRange: z.enum(['8-20', '21-50', '51-200', '200+', 'not-sure']),
  trafficSource: optionalText(120),
  goal: z.enum(['store', 'campaign', 'demo', 'partnership', 'not-sure']),
  message: optionalText(2000),
  locale: z.string().trim().min(2).max(16),
  acquisitionSource: optionalText(120),
  acquisitionMedium: optionalText(120),
  campaignName: optionalText(160),
  landingPath: optionalText(500),
  referrerHost: optionalText(255),
  consentToContact: z.literal(true),
  companyFax: optionalText(200),
}).strict()

export const businessPilotLeadUpdateSchema = z.object({
  status: z.enum(BUSINESS_PILOT_LEAD_STATUSES).optional(),
  objection: z.string().trim().max(2000).nullable().optional(),
  nextAction: z.string().trim().max(2000).nullable().optional(),
  pilotOutcome: z.string().trim().max(2000).nullable().optional(),
  demoAt: z.string().datetime().nullable().optional(),
}).strict().refine((value) => Object.keys(value).length > 0, 'At least one field is required.')

export class BusinessPilotLeadError extends Error {
  constructor(readonly code: string, message: string, readonly status: number, readonly retryAfterSeconds?: number) {
    super(message)
    this.name = 'BusinessPilotLeadError'
  }
}

function singleIp(value: string | null): string | null {
  if (!value) return null
  const normalized = value.trim().replace(/^\[|\]$/gu, '')
  return normalized.includes(',') || isIP(normalized) === 0 ? null : normalized
}

export function businessLeadIdentity(headers: Headers): string {
  if (process.env.VERCEL === '1' || process.env.VERCEL === 'true' || process.env.VERCEL_URL) {
    return singleIp(headers.get('x-vercel-forwarded-for')) || 'vercel:unknown'
  }
  if (process.env.CF_PAGES || process.env.CLOUDFLARE_WORKERS) {
    return singleIp(headers.get('cf-connecting-ip')) || 'cloudflare:unknown'
  }
  return process.env.NODE_ENV === 'production' ? 'untrusted' : singleIp(headers.get('x-forwarded-for')) || 'local'
}

export function assertBusinessLeadOrigin(headers: Headers): void {
  const origin = headers.get('origin')
  if (!origin) return
  let parsed: URL
  try {
    parsed = new URL(origin)
  } catch {
    throw new BusinessPilotLeadError('FORBIDDEN_ORIGIN', 'Origin is not allowed.', 403)
  }
  const allowed = new Set([
    'https://www.visutry.com',
    'https://visutry.com',
    ...(process.env.NODE_ENV === 'production' ? [] : ['http://localhost:3000', 'http://localhost:3001']),
  ])
  if (origin !== parsed.origin || !allowed.has(parsed.origin)) {
    throw new BusinessPilotLeadError('FORBIDDEN_ORIGIN', 'Origin is not allowed.', 403)
  }
}

export async function consumeBusinessLeadRateLimit(identity: string, now = new Date(), limit = RATE_LIMIT): Promise<void> {
  const windowStart = new Date(Math.floor(now.getTime() / HOUR_MS) * HOUR_MS)
  const secret = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET || 'visutry-business-pilot-lead'
  const identityHash = createHash('sha256').update(`${secret}\0${identity.slice(0, 256)}`).digest('hex')
  const row = await prisma.businessPilotLeadRateLimit.upsert({
    where: { identityHash_windowStart: { identityHash, windowStart } },
    create: { identityHash, windowStart, count: 1 },
    update: { count: { increment: 1 } },
    select: { count: true },
  })
  if (row.count > limit) {
    const retryAfter = Math.max(1, Math.ceil((windowStart.getTime() + HOUR_MS - now.getTime()) / 1000))
    throw new BusinessPilotLeadError('RATE_LIMITED', 'Too many requests. Please try again later.', 429, retryAfter)
  }
}

export async function createBusinessPilotLead(raw: unknown, identity: string) {
  const parsed = businessPilotLeadInputSchema.safeParse(raw)
  if (!parsed.success) throw new BusinessPilotLeadError('INVALID_REQUEST', 'Please check the highlighted form fields.', 400)
  if (parsed.data.companyFax) return { id: null, requestId: parsed.data.requestId, accepted: true, spam: true }

  const existing = await prisma.businessPilotLead.findUnique({ where: { requestId: parsed.data.requestId }, select: { id: true, requestId: true } })
  if (existing) return { ...existing, accepted: true, duplicate: true }

  await consumeBusinessLeadRateLimit(identity)
  const { companyFax: _honeypot, ...data } = parsed.data
  try {
    const lead = await prisma.businessPilotLead.create({ data, select: { id: true, requestId: true } })
    return { ...lead, accepted: true, duplicate: false }
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      const lead = await prisma.businessPilotLead.findUniqueOrThrow({ where: { requestId: data.requestId }, select: { id: true, requestId: true } })
      return { ...lead, accepted: true, duplicate: true }
    }
    throw error
  }
}

export async function listBusinessPilotLeads(status?: string) {
  const validatedStatus = status && BUSINESS_PILOT_LEAD_STATUSES.includes(status as typeof BUSINESS_PILOT_LEAD_STATUSES[number])
    ? status as typeof BUSINESS_PILOT_LEAD_STATUSES[number]
    : undefined
  return prisma.businessPilotLead.findMany({
    where: validatedStatus ? { status: validatedStatus } : undefined,
    orderBy: { createdAt: 'desc' },
    take: 200,
  })
}

export async function updateBusinessPilotLead(id: string, raw: unknown) {
  const parsed = businessPilotLeadUpdateSchema.safeParse(raw)
  if (!parsed.success) throw new BusinessPilotLeadError('INVALID_REQUEST', 'Invalid lead update.', 400)
  const { demoAt, status, ...rest } = parsed.data
  try {
    return await prisma.businessPilotLead.update({
      where: { id },
      data: {
        ...rest,
        ...(demoAt !== undefined ? { demoAt: demoAt ? new Date(demoAt) : null } : {}),
        ...(status ? { status, statusUpdatedAt: new Date() } : {}),
      },
    })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      throw new BusinessPilotLeadError('NOT_FOUND', 'Lead not found.', 404)
    }
    throw error
  }
}

export function businessPilotLeadErrorResponse(error: unknown) {
  if (error instanceof BusinessPilotLeadError) {
    return { status: error.status, body: { success: false, error: error.code, message: error.message }, retryAfterSeconds: error.retryAfterSeconds }
  }
  console.error('Business Pilot lead operation failed', error)
  return { status: 500, body: { success: false, error: 'INTERNAL_ERROR', message: 'Unable to process the request.' } }
}
