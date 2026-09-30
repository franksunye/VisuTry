import type { PreparedDemoDecisionResultReference } from '../../domain/decision-result'
import {
  CANONICAL_DEMO_SHOPPER_PROFILE_ID,
  CANONICAL_DEMO_SHOPPER_PROFILE_VERSION,
} from '../../domain/prepared-demo-results'

export const PREPARED_DEMO_MANIFEST_VERSION = '1'
export const CANONICAL_DEMO_SHOPPER_PHOTO_SHA256 = '2a1277cbaef4bee43ebc5566311da50fd48ebcbd73f8abe028bc2622c072c9a0'

export type PreparedDemoAssetDescriptor = {
  assetKey: string
  provenanceId: string
  manifestVersion: string
  source: 'PREPARED_DEMO'
  shopperProfileId: string
  shopperProfileVersion: string
  shopperPhotoSha256: string
  frameSku: string
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
  productionStorageKey: string | null
}

// These explicitly watermarked QA fixtures exercise the prepared-result
// contract only. They are not Try-On output, not customer-facing evidence, and
// are denied by the asset adapter outside the guarded Local Demo runtime.
export const PREPARED_DEMO_RESULT_MANIFEST: readonly PreparedDemoAssetDescriptor[] = [
  {
    assetKey: 'visutry-demo-v1-vt-rowan-local-qa',
    provenanceId: 'prepared-demo-local-qa-rowan-v1',
    manifestVersion: PREPARED_DEMO_MANIFEST_VERSION,
    source: 'PREPARED_DEMO',
    shopperProfileId: CANONICAL_DEMO_SHOPPER_PROFILE_ID,
    shopperProfileVersion: CANONICAL_DEMO_SHOPPER_PROFILE_VERSION,
    shopperPhotoSha256: CANONICAL_DEMO_SHOPPER_PHOTO_SHA256,
    frameSku: 'VT-DEMO-001',
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
    productionStorageKey: null,
  },
  {
    assetKey: 'visutry-demo-v1-vt-lane-local-qa',
    provenanceId: 'prepared-demo-local-qa-lane-v1',
    manifestVersion: PREPARED_DEMO_MANIFEST_VERSION,
    source: 'PREPARED_DEMO',
    shopperProfileId: CANONICAL_DEMO_SHOPPER_PROFILE_ID,
    shopperProfileVersion: CANONICAL_DEMO_SHOPPER_PROFILE_VERSION,
    shopperPhotoSha256: CANONICAL_DEMO_SHOPPER_PHOTO_SHA256,
    frameSku: 'VT-DEMO-002',
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
    productionStorageKey: null,
  },
]

export function findPreparedDemoAsset(assetKey: string): PreparedDemoAssetDescriptor | null {
  return PREPARED_DEMO_RESULT_MANIFEST.find((asset) => asset.assetKey === assetKey) ?? null
}

export function findPreparedDemoAssetForFrameSku(frameSku: string): PreparedDemoAssetDescriptor | null {
  return PREPARED_DEMO_RESULT_MANIFEST.find((asset) => asset.frameSku === frameSku) ?? null
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
