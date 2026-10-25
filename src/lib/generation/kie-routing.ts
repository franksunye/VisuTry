/** Server-only fail-closed switch for the Consumer Try-On Kie secondary. */
export type KieFallbackMode = 'off' | 'force-consumer' | 'auto-definitive'

export function kieFallbackMode(): KieFallbackMode {
  // The server-only routing mode is the deliberate operator switch.
  // Kie transfers must still receive separate release authorization.
  if (!process.env.KIE_API_KEY) return 'off'
  const mode = process.env.KIE_TRYON_FALLBACK_MODE
  return mode === 'force-consumer' || mode === 'auto-definitive' ? mode : 'off'
}
