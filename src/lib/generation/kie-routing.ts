/** Server-only fail-closed switch for the Consumer Try-On Kie secondary. */
import { hasPrivateTryOnBlobIdentity, resolveTryOnBlobAccessMode } from '@/lib/tryon-blob-access'
export type KieFallbackMode = 'off' | 'force-consumer' | 'force-all' | 'auto-definitive'
export type TryOnSurface = 'consumer' | 'store'

export function kieFallbackMode(): KieFallbackMode {
  // Kie uploads user photos to provider-hosted URLs. Never enable this on a
  // casual flag flip before the explicit media-transfer/privacy release gate.
  if (!process.env.KIE_API_KEY ||
      process.env.KIE_MEDIA_EXPORT_APPROVED !== 'true' ||
      resolveTryOnBlobAccessMode() !== 'private' ||
      !hasPrivateTryOnBlobIdentity()) return 'off'
  const mode = process.env.KIE_TRYON_FALLBACK_MODE
  return mode === 'force-consumer' || mode === 'force-all' || mode === 'auto-definitive'
    ? mode : 'off'
}

/**
 * Shared provider selection for NEW Grsai-bound Try-On tasks.
 * A task's chosen provider must be persisted before outbound dispatch; already
 * claimed/accepted tasks MUST continue with their original provider.
 *
 * Store must explicitly establish its own private asset policy before opting
 * in. The separate Consumer private-Blob and vendor privacy gates remain in
 * kieFallbackMode(), even for Store traffic.
 */
export function selectNewTryOnProvider(
  surface: TryOnSurface,
  options?: { storePrivateAssets?: boolean },
): 'grsai' | 'kie' {
  const mode = kieFallbackMode()
  if (surface === 'store' && options?.storePrivateAssets !== true) return 'grsai'
  if (mode === 'force-all' || (surface === 'consumer' && mode === 'force-consumer')) {
    return 'kie'
  }
  return 'grsai'
}
