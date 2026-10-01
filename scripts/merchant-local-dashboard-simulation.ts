import fs from 'node:fs'
import path from 'node:path'
import { createHash } from 'node:crypto'
import dotenv from 'dotenv'
import { Prisma, PrismaClient } from '@prisma/client'
import { assertDatabaseEnvironment } from '../src/lib/app-environment'
import { createRuntimePostgresAdapter } from '../src/lib/postgres-runtime'
import {
  assertLocalDashboardSimulationEnvironment,
  buildLocalDashboardSimulationSchedule,
  LOCAL_DASHBOARD_SIMULATION_FRAME_SKUS,
  LOCAL_DASHBOARD_SIMULATION_CONTEXTS,
  LOCAL_DASHBOARD_SIMULATION_MARKER,
  LOCAL_DASHBOARD_SIMULATION_MERCHANT,
  parseLocalDashboardSimulationPreset,
  type LocalDashboardSimulationPreset,
} from './lib/local-merchant-dashboard-simulation-contract'

const envFile = path.join(process.cwd(), '.env.local')
if (fs.existsSync(envFile)) dotenv.config({ path: envFile, override: false })

const INTENT_PREFIX = `${LOCAL_DASHBOARD_SIMULATION_MARKER}:`
const FRAME_ROWS = [
  { sku: 'SIM-OPT-001', name: 'Aster · Round acetate', imageUrl: '/assets/glasses-presets/large-round-classic.jpg', shape: 'Round', color: 'Tortoise', material: 'Acetate', styleTags: ['classic', 'lightweight'] },
  { sku: 'SIM-OPT-002', name: 'Nova · Soft square', imageUrl: '/assets/glasses-presets/square-classic.jpg', shape: 'Square', color: 'Black', material: 'Acetate', styleTags: ['modern', 'everyday'] },
  { sku: 'SIM-OPT-003', name: 'Morrow · Browline', imageUrl: '/assets/glasses-presets/browline-classic.jpg', shape: 'Browline', color: 'Champagne', material: 'Mixed', styleTags: ['editorial', 'lightweight'] },
  { sku: 'SIM-OPT-004', name: 'Cove · Sculpted cat-eye', imageUrl: '/assets/glasses-presets/cat-eye-classic.jpg', shape: 'Cat-eye', color: 'Dark tortoise', material: 'Acetate', styleTags: ['expressive', 'polished'] },
  { sku: 'SIM-OPT-005', name: 'Ellis · Fine rectangle', imageUrl: '/assets/glasses-presets/narrow-rectangle-classic.jpg', shape: 'Rectangle', color: 'Soft gold', material: 'Metal', styleTags: ['minimal', 'lightweight'] },
  { sku: 'SIM-OPT-006', name: 'Sora · Open geometric', imageUrl: '/assets/glasses-presets/geometric-classic.jpg', shape: 'Geometric', color: 'Silver', material: 'Metal', styleTags: ['modern', 'lightweight'] },
  { sku: 'SIM-OPT-007', name: 'Linden · Oval titanium', imageUrl: '/assets/glasses-presets/oval-classic.jpg', shape: 'Oval', color: 'Champagne', material: 'Titanium', styleTags: ['quiet', 'everyday'] },
  { sku: 'SIM-OPT-008', name: 'Avery · Oversized square', imageUrl: '/assets/glasses-presets/oversized-square-classic.jpg', shape: 'Square', color: 'Warm brown', material: 'Acetate', styleTags: ['bold', 'classic'] },
] as const

function isFixtureJson(value: Prisma.JsonValue | null, key: string): boolean {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    && (value as Prisma.JsonObject)[key] === LOCAL_DASHBOARD_SIMULATION_MARKER
}

function assertNoRelatedRows(counts: Record<string, number>): void {
  const populated = Object.entries(counts).filter(([, count]) => count > 0)
  if (populated.length) {
    throw new Error(`Refusing to reset the marked simulation Merchant because unexpected related data exists (${populated.map(([name]) => name).join(', ')}).`)
  }
}

async function main() {
  const preset = parseLocalDashboardSimulationPreset(process.argv.slice(2))
  const expectedDatabaseIdentity = assertLocalDashboardSimulationEnvironment(process.env)
  const prisma = new PrismaClient({ adapter: createRuntimePostgresAdapter(process.env) })
  const presetFrameSkuSet = new Set(LOCAL_DASHBOARD_SIMULATION_FRAME_SKUS[preset])
  const presetFrameDefinitions = FRAME_ROWS.filter((frame) => presetFrameSkuSet.has(frame.sku))
  if (presetFrameDefinitions.length !== presetFrameSkuSet.size) throw new Error(`Refusing: the ${preset} preset references an undefined TEST frame.`)

  try {
    const marker = await assertDatabaseEnvironment({
      client: prisma,
      expectedEnvironment: 'local',
      expectedDatabaseIdentity,
    })

    const result = await prisma.$transaction(async (tx) => {
      const owner = await tx.user.findUnique({ where: { id: LOCAL_DASHBOARD_SIMULATION_MERCHANT.ownerUserId }, select: { id: true } })
      if (!owner) throw new Error('Refusing: the existing Local mock owner mock-user-1 is missing; the fixture never creates an auth identity.')

      const existingMerchant = await tx.merchant.findUnique({
        where: { slug: LOCAL_DASHBOARD_SIMULATION_MERCHANT.slug },
        select: {
          id: true,
          name: true,
          classification: true,
          classificationSource: true,
          classificationReason: true,
          pilotType: true,
          referenceData: true,
          planCode: true,
          commercialStatus: true,
          pricingVersion: true,
          entitlementVersion: true,
          commerceSessionAllowance: true,
          standardRenderAllowance: true,
          premiumRenderAllowance: true,
          campaignAllowance: true,
          commercialExceptionCode: true,
          commercialAddOns: true,
          sponsoredUsagePolicyKey: true,
        },
      })

      if (existingMerchant && (
        existingMerchant.name !== LOCAL_DASHBOARD_SIMULATION_MERCHANT.name
        || existingMerchant.classification !== 'TEST'
        || existingMerchant.classificationSource !== LOCAL_DASHBOARD_SIMULATION_MARKER
        || existingMerchant.pilotType !== 'REFERENCE'
        || !existingMerchant.referenceData
        || existingMerchant.planCode !== null
        || existingMerchant.commercialStatus !== null
        || existingMerchant.pricingVersion !== null
        || existingMerchant.entitlementVersion !== null
        || existingMerchant.commerceSessionAllowance !== null
        || existingMerchant.standardRenderAllowance !== null
        || existingMerchant.premiumRenderAllowance !== null
        || existingMerchant.campaignAllowance !== null
        || existingMerchant.commercialExceptionCode !== null
        || existingMerchant.sponsoredUsagePolicyKey !== null
        || existingMerchant.commercialAddOns.length !== 0
      )) {
        throw new Error('Refusing to reuse the Local simulation slug: its identity/provenance or commercial fields do not match the exact non-commercial fixture.')
      }

      const merchantId = existingMerchant?.id
      const experiences = merchantId ? await tx.experience.findMany({
        where: { merchantId },
        select: { id: true, slug: true, type: true, referenceData: true, referenceMetadata: true },
      }) : []
      if (experiences.some((experience) => {
        const context = LOCAL_DASHBOARD_SIMULATION_CONTEXTS.find((candidate) => candidate.slug === experience.slug)
        return !context || context.type !== experience.type || !experience.referenceData
          || !isFixtureJson(experience.referenceMetadata, 'fixture')
      })) {
        throw new Error('Refusing to reset the simulation Merchant: an Experience is outside the exact marked Store/Campaign fixture.')
      }

      const frames = merchantId ? await tx.merchantFrame.findMany({
        where: { merchantId },
        select: { id: true, sku: true, source: true, sourceNotes: true },
      }) : []
      if (frames.some((frame) => !FRAME_ROWS.some((candidate) => candidate.sku === frame.sku)
        || frame.source !== 'SEED' || frame.sourceNotes !== LOCAL_DASHBOARD_SIMULATION_MARKER)) {
        throw new Error('Refusing to reset the simulation Merchant: a catalog row is outside the exact marked synthetic fixture.')
      }

      const memberships = merchantId ? await tx.merchantMembership.findMany({
        where: { merchantId },
        select: { userId: true, role: true },
      }) : []
      if (memberships.some((membership) => membership.userId !== owner.id || membership.role !== 'OWNER')) {
        throw new Error('Refusing to reset the simulation Merchant: an unexpected owner/member is attached.')
      }

      let relatedCounts: Record<string, number> = {}
      if (merchantId) {
        const [assets, usage, sponsoredUsage, tryOnTasks, orphanBlobs, abuseCounters, billingAccounts, billingEvents,
          agentCredentials, operationAudits, oauthAuthorizations, decisionResults, resultShares] = await Promise.all([
          tx.storeAsset.count({ where: { merchantId } }),
          tx.merchantUsageLedger.count({ where: { merchantId } }),
          tx.merchantSponsoredUsage.count({ where: { merchantId } }),
          tx.tryOnTask.count({ where: { merchantId } }),
          tx.storeOrphanBlob.count({ where: { merchantId } }),
          tx.storeAbuseCounter.count({ where: { merchantId } }),
          tx.merchantBillingAccount.count({ where: { merchantId } }),
          tx.merchantBillingEvent.count({ where: { merchantId } }),
          tx.merchantAgentCredential.count({ where: { merchantId } }),
          tx.merchantOperationAudit.count({ where: { merchantId } }),
          tx.merchantOAuthAuthorization.count({ where: { merchantId } }),
          tx.decisionResult.count({ where: { merchantId } }),
          tx.decisionResultShare.count({ where: { merchantId } }),
        ])
        // Keep append-only workspace activation telemetry intact; it is created
        // by visiting the Local Merchant UI and is not owned by this simulation.
        relatedCounts = { assets, usage, sponsoredUsage, tryOnTasks, orphanBlobs, abuseCounters, billingAccounts, billingEvents,
          agentCredentials, operationAudits, oauthAuthorizations, decisionResults, resultShares }
        assertNoRelatedRows(relatedCounts)
      }

      if (merchantId) {
        const sessions = await tx.merchantSession.findMany({
          where: { merchantId },
          select: { id: true, experienceId: true, referenceData: true, campaign: true, acquisitionSurface: true, photoAssetId: true },
        })
        const sessionIds = new Set(sessions.map((session) => session.id))
        if (sessions.some((session) => !session.referenceData
          || session.campaign !== LOCAL_DASHBOARD_SIMULATION_MARKER
          || session.acquisitionSurface !== LOCAL_DASHBOARD_SIMULATION_MARKER
          || session.photoAssetId !== null
          || !session.experienceId
          || !experiences.some((experience) => experience.id === session.experienceId))) {
          throw new Error('Refusing to reset the simulation Merchant: a session is not fixture-marked, reference-only, and photo-free.')
        }

        const [events, intents, experienceFrames] = await Promise.all([
          tx.merchantEvent.findMany({ where: { merchantId }, select: { merchantSessionId: true, referenceData: true, metadata: true } }),
          tx.merchantIntent.findMany({ where: { merchantId }, select: { merchantSessionId: true, idempotencyKey: true, email: true, name: true, note: true } }),
          tx.experienceFrame.findMany({ where: { merchantId }, select: { experienceId: true, merchantFrameId: true } }),
        ])
        if (events.some((event) => !event.referenceData || !sessionIds.has(event.merchantSessionId ?? '') || !isFixtureJson(event.metadata, 'fixture'))
          || intents.some((intent) => !sessionIds.has(intent.merchantSessionId)
            || !intent.idempotencyKey.startsWith(INTENT_PREFIX) || intent.email || intent.name || intent.note)
          || experienceFrames.some((join) => !experiences.some((experience) => experience.id === join.experienceId)
            || !frames.some((frame) => frame.id === join.merchantFrameId))) {
          throw new Error('Refusing to reset the simulation Merchant: an event, intent, or selection is outside the exact fixture-owned scope.')
        }

        await tx.merchantIntent.deleteMany({ where: { merchantId } })
        await tx.merchantEvent.deleteMany({ where: { merchantId } })
        await tx.merchantSession.deleteMany({ where: { merchantId } })
        await tx.experienceFrame.deleteMany({ where: { merchantId } })
        await tx.experience.deleteMany({ where: { merchantId } })
        await tx.merchantFrame.deleteMany({ where: { merchantId } })
      }

      const merchant = existingMerchant
        ? await tx.merchant.update({
          where: { id: existingMerchant.id },
          data: {
            status: 'ACTIVE',
            classification: 'TEST',
            classificationSource: LOCAL_DASHBOARD_SIMULATION_MARKER,
            classificationReason: 'Deterministic, synthetic Local-only merchant dashboard UX simulation.',
            pilotType: 'REFERENCE',
            referenceData: true,
            tryOnEnabled: true,
            compareEnabled: true,
            maxCompareFrames: 2,
          },
          select: { id: true },
        })
        : await tx.merchant.create({
          data: {
            slug: LOCAL_DASHBOARD_SIMULATION_MERCHANT.slug,
            name: LOCAL_DASHBOARD_SIMULATION_MERCHANT.name,
            status: 'ACTIVE',
            classification: 'TEST',
            classificationSource: LOCAL_DASHBOARD_SIMULATION_MARKER,
            classificationReason: 'Deterministic, synthetic Local-only merchant dashboard UX simulation.',
            pilotType: 'REFERENCE',
            referenceData: true,
            tryOnEnabled: true,
            compareEnabled: true,
            maxCompareFrames: 2,
            inquiryEnabled: true,
          },
          select: { id: true },
        })

      await tx.merchantMembership.upsert({
        where: { userId_merchantId: { userId: owner.id, merchantId: merchant.id } },
        create: { userId: owner.id, merchantId: merchant.id, role: 'OWNER' },
        update: { role: 'OWNER' },
      })

      const frameRows = await Promise.all(presetFrameDefinitions.map((frame) => tx.merchantFrame.create({
        data: {
          merchantId: merchant.id,
          sku: frame.sku,
          name: frame.name,
          shape: frame.shape,
          color: frame.color,
          material: frame.material,
          imageUrl: frame.imageUrl,
          styleTags: [...frame.styleTags],
          source: 'SEED',
          sourceNotes: LOCAL_DASHBOARD_SIMULATION_MARKER,
          status: 'ACTIVE',
          enrichmentStatus: 'APPROVED',
        },
        select: { id: true, sku: true },
      })))
      const frameBySku = new Map(frameRows.map((frame) => [frame.sku, frame.id]))

      const experienceRows = await Promise.all(LOCAL_DASHBOARD_SIMULATION_CONTEXTS.map((context, index) => tx.experience.create({
        data: {
          merchantId: merchant.id,
          type: context.type,
          slug: context.slug,
          name: context.name,
          status: preset === 'showcase' || index !== 3 ? 'ACTIVE' : 'DRAFT',
          headline: 'Find a considered fit for everyday wear',
          description: 'Local-only dashboard simulation context; there is no live offer or commercial transaction.',
          campaignObjective: context.type === 'CAMPAIGN' ? 'INTENT' : null,
          campaignGate: context.type === 'CAMPAIGN' ? 'NONE' : null,
          presentationMode: context.type === 'CAMPAIGN' ? 'PRODUCT_FIRST' : null,
          referenceData: true,
          referenceMetadata: {
            fixture: LOCAL_DASHBOARD_SIMULATION_MARKER,
            preset,
            ownership: 'VISUTRY',
            disclosure: 'Synthetic Local reference data; not customer activity, sales, or a live campaign.',
          },
        },
        select: { id: true, slug: true },
      })))
      const experienceBySlug = new Map(experienceRows.map((experience) => [experience.slug, experience.id]))

      await tx.experienceFrame.createMany({
        data: experienceRows.flatMap((experience) => frameRows.map((frame, sortOrder) => ({
          experienceId: experience.id,
          merchantId: merchant.id,
          merchantFrameId: frame.id,
          sortOrder,
          active: true,
        }))),
      })

      const now = new Date()
      const schedule = buildLocalDashboardSimulationSchedule(now, preset)
      const sessionRows = schedule.map((row) => {
        const experienceId = experienceBySlug.get(row.experienceSlug)
        if (!experienceId) throw new Error('Refusing: simulation schedule references an unknown Experience context.')
        const createdAt = row.recentOffsetMinutes !== null
          ? new Date(now.getTime() - row.recentOffsetMinutes * 60_000)
          : row.dayOffset === 0
            ? new Date(now.getTime() - (18 + row.sequence % 19) * 60_000)
            : new Date(now.getTime() - row.dayOffset * 86_400_000)
        const sessionId = `sim-${merchant.id}-${String(row.sequence + 1).padStart(3, '0')}`
        const capabilityTokenHash = createHash('sha256')
          .update(`${LOCAL_DASHBOARD_SIMULATION_MARKER}:${preset}:${row.dayOffset}:${row.experienceSlug}:${row.sequence}`)
          .digest('hex')
        const frameId = frameBySku.get(row.frameSku)
        if (!frameId) throw new Error(`Refusing: schedule references missing TEST frame ${row.frameSku}.`)
        return {
          row,
          session: {
            id: sessionId,
            merchantId: merchant.id,
            experienceId,
            capabilityTokenHash,
            status: row.recentOffsetMinutes === null ? 'COMPLETED' as const : 'ACTIVE' as const,
            referenceData: true,
            createdAt,
            lastActiveAt: createdAt,
            expiresAt: new Date(createdAt.getTime() + 7 * 86_400_000),
            source: row.source,
            medium: row.medium,
            referrer: row.referrer,
            campaign: LOCAL_DASHBOARD_SIMULATION_MARKER,
            acquisitionSurface: LOCAL_DASHBOARD_SIMULATION_MARKER,
            locale: 'en',
          },
        }
      })
      const sessionIdBySequence = new Map(sessionRows.map(({ row, session }) => [row.sequence, session.id]))
      const experienceIdBySequence = new Map(schedule.map((row) => [row.sequence, experienceBySlug.get(row.experienceSlug)!]))
      const frameIdBySequence = new Map(schedule.map((row) => [row.sequence, frameBySku.get(row.frameSku)!]))
      const createdAtBySequence = new Map(sessionRows.map(({ row, session }) => [row.sequence, session.createdAt]))
      const eventRows = schedule.flatMap((row) => row.eventTypes.map((type, eventIndex) => {
        const sessionId = sessionIdBySequence.get(row.sequence)!
        const createdAt = createdAtBySequence.get(row.sequence)!
        return {
          eventId: `${INTENT_PREFIX}${sessionId}:event:${eventIndex}`,
          type,
          merchantId: merchant.id,
          merchantSessionId: sessionId,
          experienceId: experienceIdBySequence.get(row.sequence)!,
          merchantFrameId: type === 'merchant_frame_selected' || type === 'merchant_tryon_started' || type === 'merchant_tryon_completed' || type === 'merchant_compare_started'
            ? frameIdBySequence.get(row.sequence)!
            : null,
          source: 'SERVER' as const,
          locale: 'en',
          deviceType: row.sequence % 5 < 3 ? 'MOBILE' as const : 'DESKTOP' as const,
          referenceData: true,
          metadata: { fixture: LOCAL_DASHBOARD_SIMULATION_MARKER, preset, behaviorSequence: row.sequence },
          createdAt: new Date(createdAt.getTime() + eventIndex * 12_000),
        }
      }))
      const intentRows = schedule.flatMap((row) => row.intentTypes.map((type, intentIndex) => {
        const sessionId = sessionIdBySequence.get(row.sequence)!
        const createdAt = createdAtBySequence.get(row.sequence)!
        return {
          merchantId: merchant.id,
          merchantSessionId: sessionId,
          experienceId: experienceIdBySequence.get(row.sequence)!,
          merchantFrameId: frameIdBySequence.get(row.sequence)!,
          type,
          idempotencyKey: `${INTENT_PREFIX}${sessionId}:intent:${intentIndex}`,
          createdAt: new Date(createdAt.getTime() + 70_000 + intentIndex * 12_000),
        }
      }))
      if (sessionRows.length) await tx.merchantSession.createMany({ data: sessionRows.map(({ session }) => session) })
      if (eventRows.length) await tx.merchantEvent.createMany({ data: eventRows })
      if (intentRows.length) await tx.merchantIntent.createMany({ data: intentRows })

      return {
        merchant: LOCAL_DASHBOARD_SIMULATION_MERCHANT.slug,
        preset,
        experiences: experienceRows.length,
        frames: frameRows.length,
        sessions: schedule.length,
        current30DaySessions: schedule.filter((row) => row.dayOffset < 30).length,
        previous30DaySessions: schedule.filter((row) => row.dayOffset >= 30 && row.dayOffset < 60).length,
        recentActivitySessions: schedule.filter((row) => row.recentOffsetMinutes !== null).length,
        events: eventRows.length,
        intents: intentRows.length,
        referenceData: true,
        classification: 'TEST',
        pilotType: 'REFERENCE',
      }
    }, { timeout: 120_000 })

    console.log(JSON.stringify({ environment: marker.environment, database: marker.databaseIdentity, result }, null, 2))
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
})
