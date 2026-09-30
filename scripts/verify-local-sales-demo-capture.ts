import fs from 'node:fs'
import path from 'node:path'
import { PrismaClient } from '@prisma/client'
import { assertDatabaseEnvironment } from '../src/lib/app-environment'
import { createRuntimePostgresAdapter, resolveRuntimePostgresProvider } from '../src/lib/postgres-runtime'
import { assertLocalSalesDemoCaptureEnvironment, LOCAL_SALES_DEMO_SCENES } from './lib/local-sales-demo-capture-contract'

type CapturedScene = {
  id: string
  name: string
  file: string
  purpose: string
  qaStill: string
  qaStillTimeSeconds: number | null
  durationMs: number
  sizeBytes: number
  width: number
  height: number
}

type CaptureState = {
  runId: string
  mode: 'blocked'
  startedAt: string
  sessionIds: string[]
  tryOnSubmissions: number
  browserAudit: {
    unexpectedOrigins: string[]
    errors: string[]
    notFound: string[]
    serverErrors: string[]
  }
  scenes: CapturedScene[]
  capturedAt: string
}

function fail(message: string): never {
  throw new Error(`Local sales-demo capture verification failed: ${message}`)
}

function safeReadJson<T>(file: string): T {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8')) as T
  } catch {
    return fail('the private Playwright state file is missing or invalid.')
  }
}

function redactServerLog(value: string): string {
  return value
    .replace(/sk_(?:test|live)_[A-Za-z0-9]+/g, '[REDACTED_STRIPE_KEY]')
    .replace(/Bearer\s+[^\s"']+/gi, 'Bearer [REDACTED]')
    .replace(/((?:GRSAI_API_KEY|GEMINI_API_KEY|BLOB_READ_WRITE_TOKEN|NEXTAUTH_SECRET)\s*[=:]\s*)[^\s"']+/gi, '$1[REDACTED]')
    .replace(/("(?:merchantSessionId|sessionId|userId|merchantId)"\s*:\s*")[^"]+("\s*[,}])/gi, '$1[REDACTED_ID]$2')
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[REDACTED_EMAIL]')
    .replace(/(https?:\/\/[^\s?]+)\?[^\s]*/g, '$1?[REDACTED_QUERY]')
}

async function main() {
  assertLocalSalesDemoCaptureEnvironment(process.env)
  if (resolveRuntimePostgresProvider(process.env) !== 'PRISMA_PG') fail('PrismaPg is not selected.')

  const outputDirValue = process.env.VISUTRY_LOCAL_SALES_DEMO_OUTPUT_DIR
  const stateFile = process.env.VISUTRY_LOCAL_SALES_DEMO_STATE_FILE
  const rawLog = process.env.VISUTRY_LOCAL_SALES_DEMO_RAW_LOG
  const gitSha = process.env.VISUTRY_LOCAL_SALES_DEMO_GIT_SHA
  if (!outputDirValue || !stateFile || !rawLog || !gitSha) fail('artifact paths or source SHA are missing.')

  const outputDir = path.resolve(outputDirValue)
  const outputRoot = path.resolve('.local/sales-demo')
  if (!outputDir.startsWith(`${outputRoot}${path.sep}`)) fail('output directory escaped .local/sales-demo.')
  const privateRoot = path.resolve('.local/sales-demo/.private')
  const resolvedState = path.resolve(stateFile)
  if (!resolvedState.startsWith(`${privateRoot}${path.sep}`)) fail('private browser state escaped its protected directory.')

  const state = safeReadJson<CaptureState>(resolvedState)
  if (state.mode !== 'blocked' || state.tryOnSubmissions !== 0) fail('provider mode or Try-On submission count is not safe.')
  if (state.sessionIds.length !== 3 || new Set(state.sessionIds).size !== 3) fail('expected three unique bounded shopper sessions.')
  if (state.browserAudit.unexpectedOrigins.length || state.browserAudit.errors.length
    || state.browserAudit.notFound.length || state.browserAudit.serverErrors.length) {
    fail('the browser audit contains an unexpected external origin, browser error, 404, or 5xx.')
  }
  const expectedScenes = LOCAL_SALES_DEMO_SCENES
  if (state.scenes.length !== expectedScenes.length) fail('the capture did not produce exactly four scenes.')
  for (const [index, expected] of expectedScenes.entries()) {
    const scene = state.scenes[index]
    if (scene.id !== expected.id || scene.file !== expected.file || scene.width !== 1440 || scene.height !== 810
      || !scene.qaStillTimeSeconds || scene.durationMs <= 0 || scene.sizeBytes <= 0) {
      fail(`scene ${expected.id} failed the decoded video metadata contract.`)
    }
    const videoFile = path.join(outputDir, scene.file)
    const stillFile = path.join(outputDir, scene.qaStill)
    if (!fs.statSync(videoFile).isFile() || fs.statSync(videoFile).size !== scene.sizeBytes) fail(`${scene.file} is missing or changed.`)
    if (!fs.statSync(stillFile).isFile() || fs.statSync(stillFile).size === 0) fail(`${scene.qaStill} is missing or empty.`)
  }

  const raw = fs.readFileSync(rawLog, 'utf8')
  if (/Submitting task to:.*(?:grsaiapi\.com|generativelanguage\.googleapis\.com)|generativelanguage\.googleapis\.com/i.test(raw)) {
    fail('server log contains an AI provider dispatch marker.')
  }
  if (/blob\.vercel-storage\.com|vercel\.blob\.storage/i.test(raw)) fail('server log contains a Vercel Blob access marker.')

  const prisma = new PrismaClient({ adapter: createRuntimePostgresAdapter(process.env) })
  let merchantSlug = ''
  let selectedProducts: string[] = []
  let databaseAudit: Record<string, number | string> = {}
  try {
    const marker = await assertDatabaseEnvironment({
      client: prisma,
      expectedEnvironment: 'local',
      expectedDatabaseIdentity: 'local:127.0.0.1:5433/visutry_local',
    })
    const merchant = await prisma.merchant.findUnique({
      where: { slug: 'visutry-demo-optical' },
      select: { id: true, slug: true, classification: true, pilotType: true },
    })
    if (!merchant || merchant.classification !== 'TEST' || merchant.pilotType !== 'DEMO') {
      fail('canonical VisuTry Demo TEST Merchant is missing or not classified as TEST/DEMO.')
    }
    merchantSlug = merchant.slug

    const store = await prisma.experience.findFirst({
      where: { merchantId: merchant.id, type: 'STORE', slug: 'store', status: 'ACTIVE' },
      select: { id: true },
    })
    if (!store) fail('the canonical active Store is missing.')

    const [frames, selected, sessions, tasks, requests] = await Promise.all([
      prisma.merchantFrame.findMany({
        where: { merchantId: merchant.id },
        select: { id: true, sku: true, name: true, imageUrl: true },
        orderBy: { sku: 'asc' },
      }),
      prisma.experienceFrame.findMany({
        where: { merchantId: merchant.id, experienceId: store.id, active: true },
        select: { merchantFrame: { select: { sku: true, name: true } } },
        orderBy: { sortOrder: 'asc' },
      }),
      prisma.merchantSession.count({ where: { merchantId: merchant.id, id: { in: state.sessionIds } } }),
      prisma.tryOnTask.count({ where: { merchantId: merchant.id, merchantSessionId: { in: state.sessionIds } } }),
      prisma.generationRequest.findMany({
        where: { merchantId: merchant.id, startedAt: { gte: new Date(state.startedAt) } },
        select: { id: true },
      }),
    ])
    if (frames.length !== 10 || selected.length !== 10) fail('the preserved 10-product demo catalog/Store selection is not intact.')
    if (sessions !== 3) fail(`only ${sessions} of the three captured shopper sessions are present in Local PostgreSQL.`)
    if (tasks !== 0 || requests.length !== 0) fail('Try-On tasks or GenerationRequests were created during capture.')
    const attempts = requests.length
      ? await prisma.generationAttempt.count({ where: { requestId: { in: requests.map(({ id }) => id) } } })
      : 0
    if (attempts !== 0) fail('GenerationAttempts were created during capture.')

    selectedProducts = selected.map(({ merchantFrame }) => merchantFrame.name)
    databaseAudit = {
      databaseEnvironment: marker.environment,
      databaseIdentity: marker.databaseIdentity,
      merchantClassification: merchant.classification,
      shopperSessions: sessions,
      storeTryOnTasks: tasks,
      generationRequests: requests.length,
      generationAttempts: attempts,
      catalogProducts: frames.length,
      selectedStoreProducts: selected.length,
    }
  } finally {
    await prisma.$disconnect()
  }

  const manifest = {
    runId: state.runId,
    sourceSha: gitSha,
    environment: 'LOCAL',
    merchant: merchantSlug,
    viewport: '1440x810',
    shopperAsset: 'docs/assets/local-demo/visutry-demo-shopper-v1.png',
    storeSelection: selectedProducts,
    scenes: state.scenes,
    safety: {
      providerMode: 'blocked',
      tryOnSubmissions: state.tryOnSubmissions,
      grsaiCalls: 0,
      geminiCalls: 0,
      productionDatabase: 0,
      productionAnalytics: 0,
      liveStripeWrites: 0,
      vercelBlobAccesses: 0,
    },
    verification: {
      browser: {
        unexpectedOrigins: 0,
        errors: 0,
        notFound: 0,
        serverErrors: 0,
      },
      database: databaseAudit,
      verifiedAt: new Date().toISOString(),
    },
  }
  fs.writeFileSync(path.join(outputDir, 'scene-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, { mode: 0o600 })
  fs.writeFileSync(path.join(outputDir, 'server.log'), redactServerLog(raw), { mode: 0o600 })
  fs.chmodSync(path.join(outputDir, 'server.log'), 0o600)
  fs.chmodSync(path.join(outputDir, 'scene-manifest.json'), 0o600)
  fs.unlinkSync(resolvedState)

  console.log('LOCAL SALES DEMO EVIDENCE: PASS')
  console.log(`merchant: ${merchantSlug} / TEST`)
  console.log(`decoded scenes: ${state.scenes.length} × 1440x810`)
  console.log('shopper sessions: 3; Try-On tasks=0; GenerationRequests=0; GenerationAttempts=0')
  console.log('GrsAI=0 Gemini=0 Production=0 LiveStripe=0 VercelBlob=0')
  console.log(`manifest: ${path.join(outputDir, 'scene-manifest.json')}`)
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : 'Unknown Local sales-demo verification error.')
  process.exitCode = 1
})
