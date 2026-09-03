export const AGENT_DISTRIBUTION_SOURCE_CLASSES = [
  'chatgpt',
  'openai',
  'perplexity',
  'gemini',
  'copilot',
  'claude',
  'organic_search',
  'generic_referral',
  'paid',
  'direct',
  'social',
  'reddit',
  'youtube',
  'other',
] as const

export type AgentDistributionSourceClass = (typeof AGENT_DISTRIBUTION_SOURCE_CLASSES)[number]

export const CONSUMER_DECISION_EVENTS = [
  'face_shape_detection_completed',
  'face_analysis_completed',
  'recommendation_viewed',
  'tryon_started',
  'tryon_completed',
  'comparison_created',
  'comparison_completed',
] as const

export type ConsumerDecisionEventName = (typeof CONSUMER_DECISION_EVENTS)[number]

export type ConsumerFunnelReportEvent = {
  trafficClass: 'test' | 'production_candidate' | string | null
  funnelId: string | null
  sourceClass: string | null
  agentSource: string | null
  eventName: string | null
  landingPage?: string | null
  pagePath?: string | null
  surface?: string | null
  entryPoint?: string | null
  campaignName?: string | null
}

export type ConsumerFunnelSourceReport = {
  sourceClass: AgentDistributionSourceClass | 'agent_unknown'
  sessions: number
  sessionsWithDecisionAction: number
  decisionActions: Partial<Record<ConsumerDecisionEventName, number>>
  landingSurfaces: string[]
}

export type ConsumerFunnelReport = {
  eventsRead: number
  excludedTestEvents: number
  productionCandidateEvents: number
  totalSessions: number
  agentSessions: number
  sessionsWithDecisionAction: number
  bySource: ConsumerFunnelSourceReport[]
  downstreamIntent: {
    status: 'not_supported_by_consumer_event_contract'
    reason: string
  }
}

const KNOWN_AGENT_SOURCES = new Set([
  'chatgpt',
  'openai',
  'perplexity',
  'gemini',
  'copilot',
  'claude',
])

function normalize(value: string | null | undefined): string {
  return (value || '').trim().toLowerCase()
}

function sourceKey(event: ConsumerFunnelReportEvent): AgentDistributionSourceClass | 'agent_unknown' {
  const sourceClass = normalize(event.sourceClass)
  const agentSource = normalize(event.agentSource)
  if (KNOWN_AGENT_SOURCES.has(agentSource)) return agentSource as AgentDistributionSourceClass
  if (sourceClass === 'agent') return 'agent_unknown'
  if ((AGENT_DISTRIBUTION_SOURCE_CLASSES as readonly string[]).includes(sourceClass)) {
    return sourceClass as AgentDistributionSourceClass
  }
  return 'other'
}

function addSurface(target: Set<string>, event: ConsumerFunnelReportEvent) {
  for (const value of [event.surface, event.entryPoint, event.landingPage, event.pagePath]) {
    const normalized = value?.trim()
    if (normalized) target.add(normalized)
  }
}

/**
 * Build the privacy-safe Consumer side of the Agent Distribution report.
 *
 * This intentionally reports source -> anonymous funnel session -> decision
 * action. It does not claim a join to MerchantSession or intent records: the
 * two systems currently have different identifiers and are reported separately
 * by the read-only production command.
 */
export function buildConsumerFunnelReport(events: ConsumerFunnelReportEvent[]): ConsumerFunnelReport {
  const sourceMetrics = new Map<ConsumerFunnelSourceReport['sourceClass'], {
    sessions: Set<string>
    actionSessions: Set<string>
    actions: Partial<Record<ConsumerDecisionEventName, number>>
    surfaces: Set<string>
  }>()
  const allSessions = new Set<string>()
  const actionSessions = new Set<string>()
  let excludedTestEvents = 0
  let productionCandidateEvents = 0

  for (const event of events) {
    if (event.trafficClass === 'test') {
      excludedTestEvents += 1
      continue
    }
    if (event.trafficClass !== 'production_candidate' || !event.funnelId) continue
    productionCandidateEvents += 1
    const key = sourceKey(event)
    const current = sourceMetrics.get(key) || {
      sessions: new Set<string>(),
      actionSessions: new Set<string>(),
      actions: {},
      surfaces: new Set<string>(),
    }
    current.sessions.add(event.funnelId)
    allSessions.add(event.funnelId)
    addSurface(current.surfaces, event)

    if ((CONSUMER_DECISION_EVENTS as readonly string[]).includes(event.eventName || '')) {
      const action = event.eventName as ConsumerDecisionEventName
      current.actionSessions.add(event.funnelId)
      actionSessions.add(event.funnelId)
      current.actions[action] = (current.actions[action] || 0) + 1
    }
    sourceMetrics.set(key, current)
  }

  const reportKeys = Array.from(new Set([
    ...AGENT_DISTRIBUTION_SOURCE_CLASSES,
    ...Array.from(sourceMetrics.keys()),
  ])) as Array<ConsumerFunnelSourceReport['sourceClass']>
  const bySource = reportKeys
    .map((sourceClass) => {
      const value = sourceMetrics.get(sourceClass)
      return {
        sourceClass,
        sessions: value?.sessions.size || 0,
        sessionsWithDecisionAction: value?.actionSessions.size || 0,
        decisionActions: value?.actions || {},
        landingSurfaces: Array.from(value?.surfaces || []).sort(),
      }
    })
    .sort((a, b) => b.sessions - a.sessions || a.sourceClass.localeCompare(b.sourceClass))

  return {
    eventsRead: events.length,
    excludedTestEvents,
    productionCandidateEvents,
    totalSessions: allSessions.size,
    agentSessions: bySource
      .filter((row) => KNOWN_AGENT_SOURCES.has(row.sourceClass))
      .reduce((total, row) => total + row.sessions, 0),
    sessionsWithDecisionAction: actionSessions.size,
    bySource,
    downstreamIntent: {
      status: 'not_supported_by_consumer_event_contract',
      reason: 'Consumer funnel events do not carry MerchantSession or intent identifiers; use the separate Merchant Store/Campaign report for product click, inquiry, and high-intent metrics.',
    },
  }
}
