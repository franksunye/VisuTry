import type { PreparedDemoDecisionResultReference } from '../../domain/decision-result'
import {
  CANONICAL_DEMO_SHOPPER_PROFILE_ID,
  CANONICAL_DEMO_SHOPPER_PROFILE_VERSION,
} from '../../domain/prepared-demo-results'

export const PREPARED_DEMO_MANIFEST_VERSION = '1'
export const CANONICAL_DEMO_SHOPPER_PHOTO_SHA256 = '2a1277cbaef4bee43ebc5566311da50fd48ebcbd73f8abe028bc2622c072c9a0'

export type PreparedDemoAssetDescriptor = {
  assetName: string
  assetKey: string
  provenanceId: string
  manifestVersion: string
  source: 'PREPARED_DEMO'
  provenanceType: 'VISUTRY_AUTHORED_QA_FIXTURE' | 'LEAD_SUPPLIED_APPROVED_DEMO_OUTPUT'
  reviewStatus: 'QA_ONLY' | 'APPROVED'
  shopperProfileId: string
  shopperProfileVersion: string
  shopperPhotoAssetKey: string
  shopperPhotoSha256: string
  frameSku: string
  frameIdentity: 'ROWAN' | 'LANE'
  frameSourceAssetPath: string | null
  frameSourceSha256: string | null
  assetSha256: string
  contentType: 'image/svg+xml' | 'image/png' | 'image/webp'
  createdAt: string
  reviewedAt: string
  provenanceNote: string
  rightsUseApproval: string
  demoOnly: true
  notForSale: true
  assetClass: 'LOCAL_QA_FIXTURE' | 'APPROVED_DEMO_OUTPUT'
  localQaPath: string | null
  localStoragePath: string | null
  productionStorageKey: string | null
}

// These explicitly watermarked QA fixtures exercise the prepared-result
// contract only. They are not Try-On output, not customer-facing evidence, and
// are denied by the asset adapter outside the guarded Local Demo runtime.
export const PREPARED_DEMO_RESULT_MANIFEST: readonly PreparedDemoAssetDescriptor[] = [
  {
    assetName: 'VT Rowan — Local QA fixture',
    assetKey: 'visutry-demo-v1-vt-rowan-local-qa',
    provenanceId: 'prepared-demo-local-qa-rowan-v1',
    manifestVersion: PREPARED_DEMO_MANIFEST_VERSION,
    source: 'PREPARED_DEMO',
    provenanceType: 'VISUTRY_AUTHORED_QA_FIXTURE',
    reviewStatus: 'QA_ONLY',
    shopperProfileId: CANONICAL_DEMO_SHOPPER_PROFILE_ID,
    shopperProfileVersion: CANONICAL_DEMO_SHOPPER_PROFILE_VERSION,
    shopperPhotoAssetKey: 'visutry-demo-shopper-v1',
    shopperPhotoSha256: CANONICAL_DEMO_SHOPPER_PHOTO_SHA256,
    frameSku: 'VT-DEMO-001',
    frameIdentity: 'ROWAN',
    frameSourceAssetPath: '/assets/glasses-presets/round-classic.jpg',
    frameSourceSha256: '1845ec759e62f7a3ecd947d9622b4e9a0c6f73e99abd9e3eacc285856a49094c',
    assetSha256: 'c6f17c39c96c661231f9f20b1b0eceefd47f7c1c8c85309a2df9c152c9434ca7',
    contentType: 'image/svg+xml',
    createdAt: '2026-09-30',
    reviewedAt: '2026-09-30',
    provenanceNote: 'Disclosure-only QA graphic used to test prepared result routing; it contains no shopper photo and is not a Try-On output.',
    rightsUseApproval: 'VisuTry-authored local QA fixture; local development testing only; not approved for customer-facing use.',
    demoOnly: true,
    notForSale: true,
    assetClass: 'LOCAL_QA_FIXTURE',
    localQaPath: 'docs/assets/local-demo/prepared-results/rowan-qa-fixture.svg',
    localStoragePath: null,
    productionStorageKey: null,
  },
  {
    assetName: 'VT Lane — Local QA fixture',
    assetKey: 'visutry-demo-v1-vt-lane-local-qa',
    provenanceId: 'prepared-demo-local-qa-lane-v1',
    manifestVersion: PREPARED_DEMO_MANIFEST_VERSION,
    source: 'PREPARED_DEMO',
    provenanceType: 'VISUTRY_AUTHORED_QA_FIXTURE',
    reviewStatus: 'QA_ONLY',
    shopperProfileId: CANONICAL_DEMO_SHOPPER_PROFILE_ID,
    shopperProfileVersion: CANONICAL_DEMO_SHOPPER_PROFILE_VERSION,
    shopperPhotoAssetKey: 'visutry-demo-shopper-v1',
    shopperPhotoSha256: CANONICAL_DEMO_SHOPPER_PHOTO_SHA256,
    frameSku: 'VT-DEMO-002',
    frameIdentity: 'LANE',
    frameSourceAssetPath: '/assets/glasses-presets/rectangle-classic.jpg',
    frameSourceSha256: '3ad4eb05ca2a6b00149bf8a63d71de472b0674fc4bcfa4cb9592d111286c97ad',
    assetSha256: 'ea75779379aa939224ca304628d8901e92017a3614a263dc61efa682cc46b0bd',
    contentType: 'image/svg+xml',
    createdAt: '2026-09-30',
    reviewedAt: '2026-09-30',
    provenanceNote: 'Disclosure-only QA graphic used to test prepared result routing; it contains no shopper photo and is not a Try-On output.',
    rightsUseApproval: 'VisuTry-authored local QA fixture; local development testing only; not approved for customer-facing use.',
    demoOnly: true,
    notForSale: true,
    assetClass: 'LOCAL_QA_FIXTURE',
    localQaPath: 'docs/assets/local-demo/prepared-results/lane-qa-fixture.svg',
    localStoragePath: null,
    productionStorageKey: null,
  },
  {
    assetName: 'VT Rowan approved prepared Demo result',
    assetKey: 'visutry-demo-v1-vt-rowan-approved-local',
    provenanceId: 'prepared-demo-rowan-lead-approved-2026-09-30',
    manifestVersion: PREPARED_DEMO_MANIFEST_VERSION,
    source: 'PREPARED_DEMO',
    provenanceType: 'LEAD_SUPPLIED_APPROVED_DEMO_OUTPUT',
    reviewStatus: 'APPROVED',
    shopperProfileId: CANONICAL_DEMO_SHOPPER_PROFILE_ID,
    shopperProfileVersion: CANONICAL_DEMO_SHOPPER_PROFILE_VERSION,
    shopperPhotoAssetKey: 'visutry-demo-shopper-v1',
    shopperPhotoSha256: CANONICAL_DEMO_SHOPPER_PHOTO_SHA256,
    frameSku: 'VT-DEMO-001',
    frameIdentity: 'ROWAN',
    frameSourceAssetPath: '/assets/glasses-presets/round-classic.jpg',
    frameSourceSha256: '1845ec759e62f7a3ecd947d9622b4e9a0c6f73e99abd9e3eacc285856a49094c',
    assetSha256: '504fced34e90922ffe162c4abe746178777b4241afc5f262d28e93dba703b28c',
    contentType: 'image/png',
    createdAt: '2026-09-30',
    reviewedAt: '2026-09-30',
    provenanceNote: 'Lead-supplied approved prepared Demo output for the canonical synthetic shopper and VT Rowan. Original PNG bytes are preserved unchanged; no Provider telemetry or generation provenance is asserted by this local asset record.',
    rightsUseApproval: 'Product Lead approved this prepared Demo output for canonical VisuTry Demo use; demo-only and not for sale.',
    demoOnly: true,
    notForSale: true,
    assetClass: 'APPROVED_DEMO_OUTPUT',
    localQaPath: null,
    localStoragePath: 'docs/assets/local-demo/prepared-results/approved/rowan-prepared-result.png',
    productionStorageKey: null,
  },
  {
    assetName: 'VT Lane approved prepared Demo result',
    assetKey: 'visutry-demo-v1-vt-lane-approved-local',
    provenanceId: 'prepared-demo-lane-lead-approved-2026-09-30',
    manifestVersion: PREPARED_DEMO_MANIFEST_VERSION,
    source: 'PREPARED_DEMO',
    provenanceType: 'LEAD_SUPPLIED_APPROVED_DEMO_OUTPUT',
    reviewStatus: 'APPROVED',
    shopperProfileId: CANONICAL_DEMO_SHOPPER_PROFILE_ID,
    shopperProfileVersion: CANONICAL_DEMO_SHOPPER_PROFILE_VERSION,
    shopperPhotoAssetKey: 'visutry-demo-shopper-v1',
    shopperPhotoSha256: CANONICAL_DEMO_SHOPPER_PHOTO_SHA256,
    frameSku: 'VT-DEMO-002',
    frameIdentity: 'LANE',
    frameSourceAssetPath: '/assets/glasses-presets/rectangle-classic.jpg',
    frameSourceSha256: '3ad4eb05ca2a6b00149bf8a63d71de472b0674fc4bcfa4cb9592d111286c97ad',
    assetSha256: '1c6f03785756d230fb1806572e03e9acf9eda32f150acb84ee783ee8bfac7b71',
    contentType: 'image/png',
    createdAt: '2026-09-30',
    reviewedAt: '2026-09-30',
    provenanceNote: 'Lead-supplied approved prepared Demo output for the canonical synthetic shopper and VT Lane. Original PNG bytes are preserved unchanged; no Provider telemetry or generation provenance is asserted by this local asset record.',
    rightsUseApproval: 'Product Lead approved this prepared Demo output for canonical VisuTry Demo use; demo-only and not for sale.',
    demoOnly: true,
    notForSale: true,
    assetClass: 'APPROVED_DEMO_OUTPUT',
    localQaPath: null,
    localStoragePath: 'docs/assets/local-demo/prepared-results/approved/lane-prepared-result.png',
    productionStorageKey: null,
  },
]

export function findPreparedDemoAsset(assetKey: string): PreparedDemoAssetDescriptor | null {
  return PREPARED_DEMO_RESULT_MANIFEST.find((asset) => asset.assetKey === assetKey) ?? null
}

export function findPreparedDemoAssetForFrameSku(
  frameSku: string,
  env: Record<string, string | undefined> = process.env,
): PreparedDemoAssetDescriptor | null {
  const candidates = PREPARED_DEMO_RESULT_MANIFEST.filter((asset) => asset.frameSku === frameSku)

  if (
    env.APP_ENV === 'local' &&
    env.VERCEL_ENV === undefined &&
    env.VISUTRY_LOCAL_DEMO_RUNTIME === '1'
  ) {
    return candidates.find((asset) => asset.assetClass === 'APPROVED_DEMO_OUTPUT' && asset.localStoragePath) ?? null
  }

  if (env.APP_ENV === 'production' && env.VERCEL_ENV === 'production') {
    return candidates.find((asset) => asset.assetClass === 'APPROVED_DEMO_OUTPUT' && asset.productionStorageKey) ?? null
  }

  return null
}

export function preparedDemoReferenceForAsset(
  asset: PreparedDemoAssetDescriptor,
  frameId: string,
  presentedAt: string,
): PreparedDemoDecisionResultReference {
  return {
    source: 'PREPARED_DEMO',
    sourceRef: {
      assetKey: asset.assetKey,
      provenanceId: asset.provenanceId,
      manifestVersion: asset.manifestVersion,
      shopperProfileId: asset.shopperProfileId,
      shopperProfileVersion: asset.shopperProfileVersion,
    },
    frameId,
    status: 'PREPARED',
    presentedAt,
  }
}
