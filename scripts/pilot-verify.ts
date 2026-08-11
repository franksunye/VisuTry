import 'dotenv/config'
import { resolve } from 'node:path'
import { prisma } from '../src/lib/prisma'
import { readPilotPackage, type PilotExperienceConfig } from '../src/modules/store/application/pilot-delivery-kit'

function packageArgument(): string {
  return process.argv.slice(2).find((argument) => !argument.startsWith('--')) ?? 'pilot/ello-sunglasses'
}

function expectedExternalIds(experience: PilotExperienceConfig, activeCatalogIds: string[]) {
  return experience.catalogSelection === 'ALL_ACTIVE' ? activeCatalogIds : experience.catalogSelection
}

async function main() {
  const packageDir = resolve(packageArgument())
  try {
    const pilot = await readPilotPackage(packageDir)
    const merchant = await prisma.merchant.findUnique({
      where: { slug: pilot.config.merchantSlug },
      select: {
        id: true,
        slug: true,
        name: true,
        status: true,
        referenceData: true,
        defaultSource: true,
        defaultCampaign: true,
        frames: {
          select: { sku: true, externalId: true, status: true, source: true },
        },
        experiences: {
          orderBy: { slug: 'asc' },
          select: {
            id: true,
            type: true,
            slug: true,
            status: true,
            referenceData: true,
            defaultSource: true,
            defaultCampaign: true,
            frames: {
              where: { active: true },
              orderBy: { sortOrder: 'asc' },
              select: {
                sortOrder: true,
                merchantFrame: { select: { externalId: true, sku: true, status: true } },
              },
            },
          },
        },
      },
    })
    const errors: string[] = []
    const warnings: string[] = []
    if (!merchant) {
      errors.push(`Merchant not found: ${pilot.config.merchantSlug}`)
      console.log(JSON.stringify({ command: 'pilot:verify', packageDir, errors, warnings }, null, 2))
      process.exitCode = 1
      return
    }
    if (merchant.name !== pilot.config.displayName) errors.push(`Merchant name mismatch: expected ${pilot.config.displayName}, got ${merchant.name}`)
    if (merchant.status !== 'ACTIVE') errors.push(`Merchant status is ${merchant.status}, expected ACTIVE`)
    if (merchant.referenceData !== pilot.config.referenceData) errors.push('Merchant referenceData mismatch')
    if (merchant.defaultSource !== pilot.config.measurement.defaultSource) errors.push('Merchant defaultSource mismatch')
    if (merchant.defaultCampaign !== pilot.config.measurement.defaultCampaign) errors.push('Merchant defaultCampaign mismatch')

    const activeCatalog = pilot.catalog.filter((row) => row.status === 'ACTIVE')
    const activeCsvFrames = merchant.frames.filter((frame) => frame.source === 'CSV' && frame.status === 'ACTIVE')
    const framesBySku = new Map(merchant.frames.map((frame) => [frame.sku, frame]))
    for (const row of activeCatalog) {
      const frame = framesBySku.get(row.sku)
      if (!frame) errors.push(`Missing MerchantFrame for SKU ${row.sku}`)
      else if (frame.status !== 'ACTIVE') errors.push(`MerchantFrame ${row.sku} is ${frame.status}, expected ACTIVE`)
      else if (frame.externalId !== row.externalId) errors.push(`External ID mismatch for SKU ${row.sku}`)
    }
    if (activeCsvFrames.length !== activeCatalog.length) {
      errors.push(`Active CSV frame count mismatch: expected ${activeCatalog.length}, got ${activeCsvFrames.length}`)
    }

    const experiencesBySlug = new Map(merchant.experiences.map((experience) => [experience.slug, experience]))
    const activeCatalogIds = activeCatalog.map((row) => row.externalId)
    const experienceResults = pilot.experiences.map((config) => {
      const actual = experiencesBySlug.get(config.experienceSlug)
      const expectedIds = expectedExternalIds(config, activeCatalogIds)
      const actualIds = actual?.frames.map((frame) => frame.merchantFrame.externalId).filter((id): id is string => Boolean(id)) ?? []
      const experienceErrors: string[] = []
      if (!actual) experienceErrors.push('missing')
      else {
        if (actual.type !== config.type) experienceErrors.push(`type=${actual.type}`)
        if (actual.status !== config.status) experienceErrors.push(`status=${actual.status}`)
        if (actual.referenceData !== (config.referenceData ?? pilot.config.referenceData)) experienceErrors.push('referenceData')
        if (actual.defaultSource !== (config.measurement?.defaultSource ?? pilot.config.measurement.defaultSource)) experienceErrors.push('defaultSource')
        if (actual.defaultCampaign !== (config.measurement?.defaultCampaign ?? pilot.config.measurement.defaultCampaign)) experienceErrors.push('defaultCampaign')
        if (JSON.stringify(actualIds) !== JSON.stringify(expectedIds)) experienceErrors.push(`frames=${actualIds.length}/${expectedIds.length}`)
        actual.frames.forEach((frame, index) => {
          if (frame.sortOrder !== index) experienceErrors.push(`sortOrder@${index}=${frame.sortOrder}`)
          if (frame.merchantFrame.status !== 'ACTIVE') experienceErrors.push(`inactive-frame@${index}`)
        })
      }
      if (experienceErrors.length > 0) errors.push(`${config.experienceSlug}: ${experienceErrors.join(', ')}`)
      return { slug: config.experienceSlug, type: config.type, expectedFrameCount: expectedIds.length, actualFrameCount: actualIds.length, errors: experienceErrors }
    })
    const expectedSlugs = new Set(pilot.experiences.map((experience) => experience.experienceSlug))
    const extras = merchant.experiences.filter((experience) => !expectedSlugs.has(experience.slug)).map((experience) => experience.slug)
    if (extras.length > 0) warnings.push(`Unexpected existing Experience rows were left untouched: ${extras.join(', ')}`)
    const report = {
      command: 'pilot:verify',
      packageDir,
      merchant: { id: merchant.id, slug: merchant.slug, referenceData: merchant.referenceData },
      catalog: { expectedActive: activeCatalog.length, actualActiveCsv: activeCsvFrames.length },
      experiences: experienceResults,
      warnings,
      errors,
    }
    console.log(JSON.stringify(report, null, 2))
    if (errors.length > 0) process.exitCode = 1
  } catch (error) {
    console.error(JSON.stringify({ command: 'pilot:verify', packageDir, errors: [String(error)] }, null, 2))
    process.exitCode = 1
  } finally {
    await prisma.$disconnect()
  }
}

main()
