/** Server-only fail-closed switch for the Consumer Try-On Kie secondary. */
export type KieFallbackMode = 'off' | 'force-consumer' | 'force-all' | 'auto-definitive'
export type TryOnSurface = 'consumer' | 'store'

export function kieFallbackMode(): KieFallbackMode {
  // A non-OFF server mode plus credential is the explicit operator switch.
  // Real-media transfer still requires separate release authorization.
  if (!process.env.KIE_API_KEY) return 'off'
  const mode = process.env.KIE_TRYON_FALLBACK_MODE
  return mode === 'force-consumer' || mode === 'force-all' || mode === 'auto-definitive'
    ? mode : 'off'
}

/**
 * Shared provider selection for NEW Grsai-bound Try-On tasks.
 * A task's chosen provider must be persisted before outbound dispatch; already
 * claimed/accepted tasks MUST continue with their original provider.
 *
 * Consumer and Store reuse their existing Blob policies; selecting Kie
 * must not change the storage or authorized delivery contract.
 */
export function selectNewTryOnProvider(
  surface: TryOnSurface,
): 'grsai' | 'kie' {
  const mode = kieFallbackMode()
  if (mode === 'force-all' || (surface === 'consumer' && mode === 'force-consumer')) {
    return 'kie'
  }
  return 'grsai'
}
