import fs from 'node:fs'
import path from 'node:path'
import { PrismaClient } from '@prisma/client'
import { assertDatabaseEnvironment } from '../src/lib/app-environment'
import { createRuntimePostgresAdapter, resolveRuntimePostgresProvider } from '../src/lib/postgres-runtime'

const statePath = process.env.VISUTRY_LOCAL_DEMO_PROVIDER_SMOKE_STATE_FILE
const evidenceDir = process.env.VISUTRY_LOCAL_DEMO_EVIDENCE_DIR

function fail(message: string): never {
  throw new Error(`Provider-smoke verification failed: ${message}`)
}

async function main() {
  if (process.env.APP_ENV !== 'local' || process.env.VERCEL_ENV || process.env.VERCEL) {
    fail('APP_ENV must be local outside Vercel')
  }
  if (process.env.VISUTRY_LOCAL_DEMO_RUNTIME !== '1') fail('Local Demo runtime marker is missing')
  if (!statePath || !evidenceDir) fail('state/evidence path is not configured')
  if (resolveRuntimePostgresProvider(process.env) !== 'PRISMA_PG') fail('PrismaPg Local runtime is required')

  const state = JSON.parse(fs.readFileSync(statePath, 'utf8')) as {
    merchantSessionId?: string
    tryOnSubmitCount?: number
    resultToken?: string
  }
  if (!state.merchantSessionId) fail('MerchantSession id is missing from browser state')
  if (state.tryOnSubmitCount !== 2) fail(`browser submit count is ${state.tryOnSubmitCount}, expected 2`)

  const prisma = new PrismaClient({ adapter: createRuntimePostgresAdapter(process.env) })
  try {
    await assertDatabaseEnvironment({
      client: prisma,
      expectedEnvironment: 'local',
      expectedDatabaseIdentity: 'local:127.0.0.1:5433/visutry_local',
    })

    const merchant = await prisma.merchant.findUnique({
      where: { slug: 'visutry-demo-optical' },
      select: { id: true, classification: true },
    })
    if (!merchant || merchant.classification !== 'TEST') fail('canonical TEST Demo Merchant is missing')

    const tasks = await prisma.tryOnTask.findMany({
      where: {
        merchantId: merchant.id,
        merchantSessionId: state.merchantSessionId,
        origin: { in: ['STORE_DEMO', 'STORE_PILOT'] },
      },
      select: {
        id: true,
        status: true,
        merchantFrame: { select: { sku: true, name: true } },
        resultImageUrl: true,
      },
      orderBy: { createdAt: 'asc' },
    })
    if (tasks.length !== 2) fail(`TryOnTask count is ${tasks.length}, expected 2`)
    const skus = tasks.map((task) => task.merchantFrame?.sku).sort()
    if (JSON.stringify(skus) !== JSON.stringify(['VT-DEMO-001', 'VT-DEMO-002'])) {
      fail(`unexpected frame SKUs: ${JSON.stringify(skus)}`)
    }
    if (tasks.some((task) => task.status !== 'COMPLETED' || !task.resultImageUrl)) {
      fail('both TryOnTasks must be COMPLETED with result images')
    }

    const requests = await prisma.generationRequest.findMany({
      where: { tryOnTaskId: { in: tasks.map((task) => task.id) } },
      include: { attempts: { orderBy: { attemptNumber: 'asc' } } },
      orderBy: { startedAt: 'asc' },
    })
    if (requests.length !== 2) fail(`GenerationRequest count is ${requests.length}, expected 2`)

    const attempts = requests.flatMap((request) => request.attempts)
    if (attempts.length !== 2) fail(`GenerationAttempt count is ${attempts.length}, expected exactly 2`)
    for (const request of requests) {
      if (request.finalStatus !== 'COMPLETED') fail(`request ${request.id} is not COMPLETED`)
      if (request.attemptCount !== 1) fail(`request ${request.id} attemptCount=${request.attemptCount}, expected 1`)
      if (request.requestedProvider !== 'grsai') fail(`request ${request.id} provider is not grsai`)
      if (request.attempts.length !== 1) fail(`request ${request.id} has ${request.attempts.length} attempts`)
      const attempt = request.attempts[0]
      if (attempt.provider !== 'grsai' || attempt.status !== 'COMPLETED' || !attempt.providerTaskId) {
        fail(`request ${request.id} has an invalid provider attempt`)
      }
    }

    const audit = {
      status: 'PASS',
      merchantSessionId: state.merchantSessionId,
      resultTokenPresent: Boolean(state.resultToken),
      tryOnTasks: tasks.map((task) => ({
        id: task.id,
        sku: task.merchantFrame?.sku,
        name: task.merchantFrame?.name,
        status: task.status,
      })),
      generationRequests: requests.map((request) => ({
        id: request.id,
        tryOnTaskId: request.tryOnTaskId,
        finalStatus: request.finalStatus,
        attemptCount: request.attemptCount,
        requestedProvider: request.requestedProvider,
        requestedModel: request.requestedModel,
        endToEndDurationMs: request.endToEndDurationMs,
        attempts: request.attempts.map((attempt) => ({
          attemptNumber: attempt.attemptNumber,
          provider: attempt.provider,
          model: attempt.model,
          providerTaskId: attempt.providerTaskId,
          status: attempt.status,
          submitDurationMs: attempt.submitDurationMs,
          providerDurationMs: attempt.providerDurationMs,
          attemptDurationMs: attempt.attemptDurationMs,
        })),
      })),
      verifiedAt: new Date().toISOString(),
    }

    const output = path.join(path.resolve(evidenceDir), 'provider-audit.json')
    fs.writeFileSync(output, JSON.stringify(audit, null, 2), { mode: 0o600 })
    console.log('LOCAL DEMO PROVIDER AUDIT: PASS')
    console.log('GenerationRequest=2 GenerationAttempt=2 provider=grsai terminal=COMPLETED')
    console.log(`Audit: ${output}`)
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
})
