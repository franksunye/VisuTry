import 'dotenv/config'
import { resolve } from 'node:path'
import { prisma } from '../src/lib/prisma'
import { readPilotPackage } from '../src/modules/store/application/pilot-delivery-kit'
import { buildPilotSeedPlan } from '../src/modules/store/application/pilot-seed-plan'

function packageArgument(): string {
  return process.argv.slice(2).find((argument) => !argument.startsWith('--')) ?? 'pilot/ello-sunglasses'
}

export async function runPilotSeedPlan(packagePath = packageArgument()) {
  const packageDir = resolve(packagePath)
  try {
    const pilot = await readPilotPackage(packageDir)
    const merchant = await prisma.merchant.findUnique({ where: { slug: pilot.config.merchantSlug }, select: { id: true } })
    const frames = merchant
      ? await prisma.merchantFrame.findMany({
          where: { merchantId: merchant.id },
          select: { sku: true, externalId: true, source: true, status: true },
        })
      : []
    const experiences = merchant
      ? await prisma.experience.findMany({
          where: { merchantId: merchant.id },
          select: { slug: true, type: true, status: true, _count: { select: { frames: true } } },
        })
      : []
    const plan = buildPilotSeedPlan({
      catalog: pilot.catalog,
      experiences: pilot.experiences,
      snapshot: {
        merchant,
        frames,
        experiences: experiences.map((experience) => ({
          slug: experience.slug,
          type: experience.type,
          status: experience.status,
          frameCount: experience._count.frames,
        })),
      },
    })
    console.log(JSON.stringify({ command: 'db:seed:pilot --dry-run', packageDir, merchantSlug: pilot.config.merchantSlug, ...plan }, null, 2))
    return plan
  } catch (error) {
    console.error(JSON.stringify({ command: 'db:seed:pilot --dry-run', packageDir, errors: [String(error)] }, null, 2))
    process.exitCode = 1
    return null
  } finally {
    await prisma.$disconnect()
  }
}

if (process.argv[1]?.endsWith('pilot-seed-plan.ts')) {
  runPilotSeedPlan().then((plan) => {
    if (plan?.errors.length) process.exitCode = 1
  })
}
