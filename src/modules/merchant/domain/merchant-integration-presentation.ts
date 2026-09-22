export type AgentCredentialUsageEvidence = {
  status: 'ACTIVE' | 'REVOKED'
  lastUsedAt: string | Date | null
}

export type MerchantAgentKeyAccessStatus = {
  kind: 'NOT_CONFIGURED' | 'READY_TO_CONNECT' | 'USED'
  activeCredentialCount: number
  revokedCredentialCount: number
  latestActiveUseAt: string | null
}

function isoDate(value: string | Date | null): string | null {
  if (value == null) return null
  const parsed = value instanceof Date ? value : new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString()
}

/** A credential proves setup only; successful authenticated use is the connection evidence. */
export function resolveMerchantAgentKeyAccessStatus(
  credentials: readonly AgentCredentialUsageEvidence[],
): MerchantAgentKeyAccessStatus {
  const active = credentials.filter((credential) => credential.status === 'ACTIVE')
  const lastUses = active
    .map((credential) => isoDate(credential.lastUsedAt))
    .filter((value): value is string => value !== null)
    .sort((left, right) => Date.parse(right) - Date.parse(left))

  return {
    kind: active.length === 0
      ? 'NOT_CONFIGURED'
      : lastUses.length > 0
        ? 'USED'
        : 'READY_TO_CONNECT',
    activeCredentialCount: active.length,
    revokedCredentialCount: credentials.length - active.length,
    latestActiveUseAt: lastUses[0] ?? null,
  }
}
