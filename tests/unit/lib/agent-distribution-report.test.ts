import { buildConsumerFunnelReport } from '@/lib/agent-distribution-report'

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
})
