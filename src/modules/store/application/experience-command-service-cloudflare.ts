import { getCloudflareSql } from '@/data/neon-cloudflare'
import { createExperienceCommandService, type ExperienceCommandRepository } from './experience-command-service'

const repository: ExperienceCommandRepository = {
  async findTarget(merchantId, experienceId) {
    const sql = getCloudflareSql()
    const rows = await sql`
      SELECT e."id", e."slug", e."type", m."slug" AS "merchantSlug"
      FROM "Experience" e JOIN "Merchant" m ON m."id" = e."merchantId"
      WHERE e."id" = ${experienceId} AND e."merchantId" = ${merchantId} LIMIT 1
    `
    const row = rows[0]
    if (!row || (row.type !== 'STORE' && row.type !== 'CAMPAIGN')) return null
    return { id: String(row.id), slug: String(row.slug), type: row.type, merchantSlug: String(row.merchantSlug) }
  },
  async update(merchantId, experienceId, patch, options) {
    if (options?.afterUpdate) throw new Error('Cloudflare Experience commands accept SQL effects instead of Prisma callbacks')
    const sql = getCloudflareSql()
    const has = (field: string) => Object.prototype.hasOwnProperty.call(patch, field)
    const updateStatement = sql`
      UPDATE "Experience"
      SET "name" = CASE WHEN ${has('name')} THEN ${patch.name ?? null} ELSE "name" END,
        "headline" = CASE WHEN ${has('headline')} THEN ${patch.headline ?? null} ELSE "headline" END,
        "description" = CASE WHEN ${has('description')} THEN ${patch.description ?? null} ELSE "description" END,
        "heroAssetUrl" = CASE WHEN ${has('heroAssetUrl')} THEN ${patch.heroAssetUrl ?? null} ELSE "heroAssetUrl" END,
        "status" = CASE WHEN ${has('status')} THEN ${patch.status ?? null} ELSE "status" END,
        "journeyPolicy" = CASE WHEN ${has('journeyPolicy')} THEN ${patch.journeyPolicy ?? null} ELSE "journeyPolicy" END,
        "deliveryPolicy" = CASE WHEN ${has('deliveryPolicy')} THEN ${patch.deliveryPolicy ?? null} ELSE "deliveryPolicy" END,
        "presentationMode" = CASE WHEN ${has('presentationMode')} THEN ${patch.presentationMode ?? null} ELSE "presentationMode" END,
        "primaryCtaType" = CASE WHEN ${has('primaryCtaType')} THEN ${patch.primaryCtaType ?? null} ELSE "primaryCtaType" END,
        "primaryCtaLabel" = CASE WHEN ${has('primaryCtaLabel')} THEN ${patch.primaryCtaLabel ?? null} ELSE "primaryCtaLabel" END,
        "primaryCtaUrl" = CASE WHEN ${has('primaryCtaUrl')} THEN ${patch.primaryCtaUrl ?? null} ELSE "primaryCtaUrl" END,
        "secondaryCtaType" = CASE WHEN ${has('secondaryCtaType')} THEN ${patch.secondaryCtaType ?? null} ELSE "secondaryCtaType" END,
        "secondaryCtaLabel" = CASE WHEN ${has('secondaryCtaLabel')} THEN ${patch.secondaryCtaLabel ?? null} ELSE "secondaryCtaLabel" END,
        "secondaryCtaUrl" = CASE WHEN ${has('secondaryCtaUrl')} THEN ${patch.secondaryCtaUrl ?? null} ELSE "secondaryCtaUrl" END,
        "offerLabel" = CASE WHEN ${has('offerLabel')} THEN ${patch.offerLabel ?? null} ELSE "offerLabel" END,
        "offerCode" = CASE WHEN ${has('offerCode')} THEN ${patch.offerCode ?? null} ELSE "offerCode" END,
        "campaignObjective" = CASE WHEN ${has('campaignObjective')} THEN ${patch.campaignObjective ?? null} ELSE "campaignObjective" END,
        "campaignGate" = CASE WHEN ${has('campaignGate')} THEN ${patch.campaignGate ?? null} ELSE "campaignGate" END,
        "startAt" = CASE WHEN ${has('startAt')} THEN ${patch.startAt ?? null} ELSE "startAt" END,
        "endAt" = CASE WHEN ${has('endAt')} THEN ${patch.endAt ?? null} ELSE "endAt" END,
        "updatedAt" = NOW()
      WHERE "id" = ${experienceId} AND "merchantId" = ${merchantId}
      RETURNING *
    `
    const results = options?.atomicEffects?.length
      ? await sql.transaction([updateStatement, ...options.atomicEffects] as never, { isolationLevel: 'Serializable' })
      : [await updateStatement]
    const rows = results[0] ?? []
    if (!rows[0]) throw new Error('Experience not found')
    return { experience: rows[0], effects: results.slice(1) }
  },
  async replaceCatalogSelection(input) {
    if (input.afterReplace) throw new Error('Cloudflare Experience commands accept SQL effects instead of Prisma callbacks')
    const sql = getCloudflareSql()
    const statements = [
      sql`DELETE FROM "ExperienceFrame" WHERE "experienceId" = ${input.experienceId} AND "merchantId" = ${input.merchantId}`,
      ...input.frameIds.map((merchantFrameId, sortOrder) => sql`
        INSERT INTO "ExperienceFrame" ("experienceId", "merchantId", "merchantFrameId", "sortOrder", "active", "createdAt", "updatedAt")
        VALUES (${input.experienceId}, ${input.merchantId}, ${merchantFrameId}, ${sortOrder}, true, NOW(), NOW())
        ON CONFLICT ("experienceId", "merchantFrameId") DO UPDATE
        SET "sortOrder" = EXCLUDED."sortOrder", "active" = true, "updatedAt" = NOW()
      `),
      ...(input.atomicEffects ?? []),
    ]
    return sql.transaction(statements as never, { isolationLevel: 'Serializable' })
  },
}

export const experienceCommandsCloudflare = createExperienceCommandService(repository)
