import { buildConsumerFunnelReport } from '@/lib/agent-distribution-report'
import { serializeAxiomRecord } from '@/lib/logger'

function flattenAxiomRecord(value: unknown, prefix = ''): Record<string, unknown> {
  if (value === undefined || value === null || typeof value !== 'object' || Array.isArray(value)) {
    return prefix ? { [prefix]: value } : {}
  }

  return Object.entries(value).reduce<Record<string, unknown>>((result, [key, nestedValue]) => {
    return Object.assign(result, flattenAxiomRecord(nestedValue, prefix ? `${prefix}.${key}` : key))
  }, {})
}

function reportEventFromAxiomRow(row: Record<string, unknown>) {
  const read = (field: string) => row[field] ?? row[`data.${field}`] ?? null
  return {
    trafficClass: typeof read('traffic_class') === 'string' ? read('traffic_class') as string : null,
    funnelId: typeof read('consumer_funnel_id') === 'string' ? read('consumer_funnel_id') as string : null,
    sourceClass: typeof read('source_class') === 'string' ? read('source_class') as string : null,
    agentSource: typeof read('agent_source') === 'string' ? read('agent_source') as string : null,
    eventName: typeof read('event_name') === 'string' ? read('event_name') as string : null,
    landingPage: typeof read('landing_page') === 'string' ? read('landing_page') as string : null,
    pagePath: typeof read('page_path') === 'string' ? read('page_path') as string : null,
    surface: typeof read('surface') === 'string' ? read('surface') as string : null,
    entryPoint: typeof read('entry_point') === 'string' ? read('entry_point') as string : null,
    campaignName: typeof read('campaign_name') === 'string' ? read('campaign_name') as string : null,
  }
}

describe('buildConsumerFunnelReport', () => {
  it('excludes test events and counts anonymous sessions with decision actions by source', () => {
    const report = buildConsumerFunnelReport([
      {
        trafficClass: 'test',
        funnelId: 'test-session',
        sourceClass: 'agent',
        agentSource: 'chatgpt',
        eventName: 'tryon_completed',
      },
      {
        trafficClass: 'production_candidate',
        funnelId: 'agent-session-1',
        sourceClass: 'agent',
        agentSource: 'chatgpt',
        eventName: 'face_shape_detection_completed',
        landingPage: '/en/face-shape-detector',
        surface: 'consumer',
      },
      {
        trafficClass: 'production_candidate',
        funnelId: 'agent-session-1',
        sourceClass: 'agent',
        agentSource: 'chatgpt',
        eventName: 'tryon_completed',
        pagePath: '/en/try-on/glasses',
      },
      {
        trafficClass: 'production_candidate',
        funnelId: 'organic-session-1',
        sourceClass: 'organic_search',
        agentSource: null,
        eventName: 'recommendation_viewed',
      },
    ])

    expect(report.excludedTestEvents).toBe(1)
    expect(report.totalSessions).toBe(2)
    expect(report.agentSessions).toBe(1)
    expect(report.sessionsWithDecisionAction).toBe(2)
    expect(report.bySource).toEqual(expect.arrayContaining([
      expect.objectContaining({
        sourceClass: 'chatgpt',
        sessions: 1,
        sessionsWithDecisionAction: 1,
        decisionActions: {
          face_shape_detection_completed: 1,
          tryon_completed: 1,
        },
        landingSurfaces: ['/en/face-shape-detector', '/en/try-on/glasses', 'consumer'],
      }),
    ]))
  })

  it('keeps downstream intent as an explicit unsupported boundary', () => {
    const report = buildConsumerFunnelReport([])
    expect(report.downstreamIntent.status).toBe('not_supported_by_consumer_event_contract')
    expect(report.downstreamIntent.reason).toContain('MerchantSession')
  })

  it('reads legacy dotted rows and new bounded records without double counting', () => {
    const legacyRow = {
      'data.traffic_class': 'test',
      'data.consumer_funnel_id': 'legacy-test-session',
      'data.source_class': 'agent',
      'data.agent_source': 'chatgpt',
      'data.event_name': 'tryon_completed',
      'data.unbounded_legacy_field': 'ignored by the projection',
    }
    const canonicalRow = flattenAxiomRecord(serializeAxiomRecord({
      id: 'log-2',
      timestamp: '2026-09-04T00:00:00.000Z',
      level: 'info',
      category: 'web',
      message: 'consumer_funnel_event',
      data: {
        traffic_class: 'production_candidate',
        consumer_funnel_id: 'canonical-session',
        source_class: 'agent',
        agent_source: 'chatgpt',
        event_name: 'recommendation_viewed',
      },
    }))

    const report = buildConsumerFunnelReport([
      reportEventFromAxiomRow(legacyRow),
      reportEventFromAxiomRow(canonicalRow),
    ])

    expect(report.eventsRead).toBe(2)
    expect(report.excludedTestEvents).toBe(1)
    expect(report.productionCandidateEvents).toBe(1)
    expect(report.totalSessions).toBe(1)
    expect(report.agentSessions).toBe(1)
    expect(report.sessionsWithDecisionAction).toBe(1)
    expect(report.bySource.find((row) => row.sourceClass === 'chatgpt')).toEqual(expect.objectContaining({
      sessions: 1,
      sessionsWithDecisionAction: 1,
      decisionActions: { recommendation_viewed: 1 },
    }))
  })
})
