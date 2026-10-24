/** Server-only fail-closed switch for the Consumer Try-On Kie secondary. */
import { resolveTryOnBlobAccessMode } from '@/lib/tryon-blob-access'
export type KieFallbackMode = 'off' | 'force-consumer' | 'auto-definitive'

export function kieFallbackMode(): KieFallbackMode {
  // Kie uploads user photos to provider-hosted URLs. Never enable this on a
  // casual flag flip before the explicit media-transfer/privacy release gate.
  if (!process.env.KIE_API_KEY ||
      process.env.KIE_MEDIA_EXPORT_APPROVED !== 'true' ||
      resolveTryOnBlobAccessMode() !== 'private') return 'off'
  const mode = process.env.KIE_TRYON_FALLBACK_MODE
  return mode === 'force-consumer' || mode === 'auto-definitive' ? mode : 'off'
}
