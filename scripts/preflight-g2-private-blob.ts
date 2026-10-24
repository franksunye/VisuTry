/**
 * Read-only, no-network configuration check for an approved G2 OFF deployment.
 * Output contains booleans and stable reason codes only; never print env values.
 *
 * This does not prove that Vercel connected the declared store, that the token
 * is accepted by Blob, or that Production is authorized for a cutover.
 */
import {
  getPrivateTryOnBlobOptions,
  resolveTryOnBlobAccessMode,
} from '../src/lib/tryon-blob-access'
import { kieFallbackMode } from '../src/lib/generation/kie-routing'
import { resolveStoreAssetAccessPolicy } from '../src/modules/store/infrastructure/config/store-asset-access-policy'

function safeCheck(check: () => boolean): boolean {
  try {
    return check()
  } catch {
    return false
  }
}

const checks = {
  explicitConsumerPrivateMode:
    process.env.TRY_ON_BLOB_ACCESS_MODE?.trim() === 'private' &&
    safeCheck(() => resolveTryOnBlobAccessMode() === 'private'),
  explicitPrivatePairPresent:
    Boolean(process.env.TRY_ON_BLOB_STORE_ID?.trim()) &&
    Boolean(process.env.TRY_ON_BLOB_READ_WRITE_TOKEN?.trim()),
  privatePairIdentityMatches: safeCheck(() => {
    if (!process.env.TRY_ON_BLOB_STORE_ID?.trim() ||
        !process.env.TRY_ON_BLOB_READ_WRITE_TOKEN?.trim()) return false
    return getPrivateTryOnBlobOptions().access === 'private'
  }),
  explicitStorePrivateMode:
    process.env.STORE_ASSET_ACCESS_MODE?.trim() === 'private' &&
    safeCheck(() => resolveStoreAssetAccessPolicy().assetAccessMode === 'PRIVATE_SIGNED'),
  kieRoutingExplicitlyOff: process.env.KIE_TRYON_FALLBACK_MODE?.trim() === 'off',
  mediaExportNotApproved: process.env.KIE_MEDIA_EXPORT_APPROVED !== 'true',
  effectiveKieRoutingOff: safeCheck(() => kieFallbackMode() === 'off'),
}

const blockers = Object.entries(checks)
  .filter(([, passed]) => !passed)
  .map(([name]) => name)

console.log(JSON.stringify({
  schemaVersion: 1,
  scope: 'configuration-only',
  verdict: blockers.length === 0 ? 'CONFIG_PASS' : 'CONFIG_HOLD',
  checks,
  blockers,
  liveStoreConnectionVerified: false,
  productionChangeAuthorized: false,
}))

if (blockers.length > 0) process.exitCode = 1
