export type GenerationTelemetryOriginName = 'CONSUMER' | 'STORE' | 'CAMPAIGN'

export function resolveStoreTelemetryAttribution(experience: { id: string; type: string } | null | undefined): {
  telemetryOrigin: Exclude<GenerationTelemetryOriginName, 'CONSUMER'>
  campaignId: string | null
  storeId: string | null
} {
  if (experience?.type === 'CAMPAIGN') {
    return {
      telemetryOrigin: 'CAMPAIGN',
      campaignId: experience.id,
      storeId: null,
    }
  }
  return {
    telemetryOrigin: 'STORE',
    campaignId: null,
    storeId: experience?.id ?? null,
  }
}
