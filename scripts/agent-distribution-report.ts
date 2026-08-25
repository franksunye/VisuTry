import 'dotenv/config'
import { Axiom } from '@axiomhq/js'
import { neon } from '@neondatabase/serverless'
import { buildMerchantDistributionReport } from '@/modules/store/domain/merchant-distribution-report'
import { buildConsumerFunnelReport, type ConsumerFunnelReportEvent } from '@/lib/agent-distribution-report'

type CliOptions = { from: Date; to: Date; json: boolean }

function parseOptions(argv: string[]): CliOptions {
  const now = new Date()
  const to = new Date(now)
  const from = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)
  let json = false

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]
    if (arg === '--json') {
      json = true
      continue
    }
    if (arg === '--from' || arg === '--to') {
      const value = argv[index + 1]
      if (!value) throw new Error(`${arg} requires an ISO timestamp`)
      const parsed = new Date(value)
      if (Number.isNaN(parsed.getTime())) throw new Error(`${arg} must be a valid ISO timestamp`)
      if (arg === '--from') from.setTime(parsed.getTime())
      else to.setTime(parsed.getTime())
      index += 1
    }
  }

  if (from >= to) throw new Error('--from must be before --to')
  return { from, to, json }
}

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim()
  if (!value) throw new Error(`${name} is required for a production report; no data was queried`)
  return value
}

function rowsFromAxiom(result: any): Array<Record<string, unknown>> {
  const rows: Array<Record<string, unknown>> = []
  for (const table of result?.tables || []) {
    const fields = (table.fields || []).map((field: { name: string }) => field.name)
    const columns = table.columns || []
    const rowCount = columns[0]?.length || 0
    for (let rowIndex = 0; rowIndex < rowCount; rowIndex += 1) {
      rows.push(Object.fromEntries(fields.map((field: string, fieldIndex: number) => [field, columns[fieldIndex]?.[rowIndex]])))
    }
  }
  for (const match of result?.matches || []) rows.push(match.data || match)
  return rows
}

function parsePayload(value: unknown): Record<string, unknown> {
  if (value && typeof value === 'object' && !Array.isArray(value)) return value as Record<string, unknown>
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed as Record<string, unknown>
    } catch {
      // Ignore malformed telemetry rows; the report must not fail open.
    }
  }
  return {}
}

function stringValue(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

async function readConsumerEvents(options: CliOptions): Promise<ConsumerFunnelReportEvent[]> {
  const token = requiredEnv('AXIOM_TOKEN')
  const dataset = process.env.AXIOM_DATASET?.trim() || 'visutry-logs'
  if (!/^[A-Za-z0-9_-]+$/.test(dataset)) throw new Error('AXIOM_DATASET contains unsupported characters')

  const axiom = new Axiom({ token, orgId: process.env.AXIOM_ORG_ID?.trim() || undefined })
  const result = await axiom.query(
    `['${dataset}'] | where message == "consumer_funnel_event" | project _time, data | take 50000`,
    {
      startTime: options.from.toISOString(),
      endTime: options.to.toISOString(),
      format: 'tabular',
      noCache: true,
    },
  )

  return rowsFromAxiom(result).map((row) => {
    const payload = parsePayload(row.data)
    return {
      trafficClass: stringValue(payload.traffic_class),
      funnelId: stringValue(payload.consumer_funnel_id),
      sourceClass: stringValue(payload.source_class),
      agentSource: stringValue(payload.agent_source),
      eventName: stringValue(payload.event_name),
      landingPage: stringValue(payload.landing_page),
      pagePath: stringValue(payload.page_path),
      surface: stringValue(payload.surface),
      entryPoint: stringValue(payload.entry_point),
      campaignName: stringValue(payload.campaign_name),
    }
  })
}

async function readMerchantReport(options: CliOptions) {
  const sql = neon(requiredEnv('DATABASE_URL'))
  const [sessions, events, intents] = await Promise.all([
    sql`
      SELECT s."id", s."source", s."medium", s."referrer", s."aiAgentSource", s."referenceData",
        m."pilotType" AS "merchantPilotType", m."referenceData" AS "merchantReferenceData",
        e."type" AS "experienceType"
      FROM "MerchantSession" s
      JOIN "Merchant" m ON m."id" = s."merchantId"
      LEFT JOIN "Experience" e ON e."id" = s."experienceId" AND e."merchantId" = s."merchantId"
      WHERE s."createdAt" >= ${options.from} AND s."createdAt" < ${options.to}
    `,
    sql`
      SELECT "merchantSessionId", "merchantFrameId", "type"
      FROM "MerchantEvent"
      WHERE "createdAt" >= ${options.from} AND "createdAt" < ${options.to}
        AND "merchantSessionId" IS NOT NULL
    `,
    sql`
      SELECT "merchantSessionId", "type"
      FROM "MerchantIntent"
      WHERE "createdAt" >= ${options.from} AND "createdAt" < ${options.to}
    `,
  ])

  const qualifying = sessions
    .filter((session) => (
      !session.referenceData
      && !session.merchantReferenceData
      && session.merchantPilotType !== 'INTERNAL'
      && session.experienceType !== null
    ))
    .map((session) => ({
      id: String(session.id),
      source: session.source == null ? null : String(session.source),
      medium: session.medium == null ? null : String(session.medium),
      referrer: session.referrer == null ? null : String(session.referrer),
      aiAgentSource: session.aiAgentSource == null ? null : String(session.aiAgentSource),
    }))

  return {
    sessionsRead: sessions.length,
    excludedReferenceOrInternalSessions: sessions.length - qualifying.length,
    storeCampaignSessions: qualifying.length,
    report: buildMerchantDistributionReport({
      sessions: qualifying,
      events: events.map((event) => ({
        merchantSessionId: event.merchantSessionId == null ? null : String(event.merchantSessionId),
        merchantFrameId: event.merchantFrameId == null ? null : String(event.merchantFrameId),
        type: String(event.type),
        count: 1,
      })),
      intents: intents.map((intent) => ({
        merchantSessionId: String(intent.merchantSessionId),
        type: String(intent.type),
        count: 1,
      })),
    }),
    boundary: 'Merchant Store/Campaign report is durable and separately joined by MerchantSession. It is not joined to Consumer funnel events because no shared identifier exists.',
  }
}

async function main() {
  const options = parseOptions(process.argv.slice(2))
  const [consumerEvents, merchant] = await Promise.all([
    readConsumerEvents(options),
    readMerchantReport(options),
  ])
  const report = {
    window: { from: options.from.toISOString(), to: options.to.toISOString(), timezone: 'UTC' },
    consumer: buildConsumerFunnelReport(consumerEvents),
    merchant,
    join: {
      status: 'not_joined',
      reason: 'Consumer funnel IDs and MerchantSession IDs are separate contracts. The report presents both evidence streams without inventing a cross-system session join.',
    },
  }

  if (options.json) {
    console.log(JSON.stringify(report, null, 2))
    return
  }
  console.log(`# Agent Distribution Report`)
  console.log(`Window: ${report.window.from} → ${report.window.to} (UTC)`)
  console.log(`Consumer candidate sessions: ${report.consumer.totalSessions}`)
  console.log(`Consumer Agent sessions: ${report.consumer.agentSessions}`)
  console.log(`Consumer sessions with decision action: ${report.consumer.sessionsWithDecisionAction}`)
  console.log(`Merchant Store/Campaign sessions: ${report.merchant.storeCampaignSessions}`)
  console.log(`Excluded Reference/Internal sessions: ${report.merchant.excludedReferenceOrInternalSessions}`)
  console.log(`Cross-system join: NOT JOINED — ${report.join.reason}`)
  console.log(JSON.stringify(report, null, 2))
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
