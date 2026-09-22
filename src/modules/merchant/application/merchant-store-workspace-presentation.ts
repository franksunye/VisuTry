import type { MerchantStoreWorkspace, MerchantStoreWorkspaceFrame } from './merchant-store-workspace'

export type MerchantStoreWorkspaceAttention = {
  code: 'STORE_MISSING' | 'STORE_HAS_NO_PRODUCTS' | 'SELECTED_PRODUCT_MISSING' | 'SELECTED_PRODUCT_INELIGIBLE'
  title: string
  message: string
  productId?: string
}

export type MerchantStoreWorkspacePrimaryAction = 'CREATE_STORE' | 'MANAGE_PRODUCTS' | 'REVIEW_CATALOG' | 'PREVIEW_STORE' | 'VIEW_LIVE_STORE'

export type MerchantStoreWorkspacePresentation = {
  lifecycle: 'MISSING' | 'DRAFT' | 'LIVE'
  selectedProducts: Array<{ id: string; frame: MerchantStoreWorkspaceFrame | null; eligible: boolean; issues: string[] }>
  attention: MerchantStoreWorkspaceAttention[]
  primaryAction: MerchantStoreWorkspacePrimaryAction
  canPreview: boolean
  canPublish: boolean
  selectedCount: number
  eligibleSelectedCount: number
}

const issueMessages: Record<string, string> = {
  MISSING_STABLE_IDENTITY: 'This product needs a product URL or stable identity.',
  MISSING_NAME: 'Add a product name in Catalog before showing it in your Store.',
  MISSING_IMAGE_URL: 'Add a usable product image in Catalog before showing it in your Store.',
  INVALID_PRODUCT_URL: 'Check this product’s link in Catalog.',
  MISSING_PRODUCT_URL: 'Add a product link in Catalog before showing it in your Store.',
  FRAME_NOT_ACTIVE: 'This product is no longer active in Catalog.',
  FRAME_NOT_FOUND_OR_INACTIVE: 'This selected product is missing or inactive in Catalog.',
}

export function merchantStoreEligibilityMessage(issues: string[]): string {
  return issues.map((issue) => issueMessages[issue] ?? 'Review this product in Catalog.').join(' ')
}

export function resolveMerchantStoreWorkspacePresentation(workspace: MerchantStoreWorkspace): MerchantStoreWorkspacePresentation {
  const store = workspace.store
  if (!store) {
    const hasStoreReadyProducts = workspace.catalog.some((frame) => frame.storeReadiness.storeEligible)
    return {
      lifecycle: 'MISSING',
      selectedProducts: [],
      attention: [{ code: 'STORE_MISSING', title: 'Store not created', message: 'Create a private Store draft to choose products and preview the shopper experience.' }],
      primaryAction: hasStoreReadyProducts ? 'CREATE_STORE' : 'REVIEW_CATALOG',
      canPreview: false,
      canPublish: false,
      selectedCount: 0,
      eligibleSelectedCount: 0,
    }
  }

  const frameById = new Map(workspace.catalog.map((frame) => [frame.id, frame]))
  const selectedProducts = store.selectedFrameIds.map((id) => {
    const frame = frameById.get(id) ?? null
    const issues = frame ? frame.storeReadiness.issues : ['FRAME_NOT_FOUND_OR_INACTIVE']
    return { id, frame, eligible: Boolean(frame?.storeReadiness.storeEligible), issues }
  })
  const missing = selectedProducts.filter((product) => !product.frame)
  const ineligible = selectedProducts.filter((product) => product.frame && !product.eligible)
  const attention: MerchantStoreWorkspaceAttention[] = []
  if (selectedProducts.length === 0) {
    attention.push({
      code: 'STORE_HAS_NO_PRODUCTS',
      title: 'No products selected',
      message: workspace.catalog.some((frame) => frame.storeReadiness.storeEligible)
        ? 'Choose at least one eligible Catalog product so shoppers have something to browse.'
        : 'Add a Store-ready product in Catalog before previewing or publishing this Store.',
    })
  }
  for (const product of missing) {
    attention.push({
      code: 'SELECTED_PRODUCT_MISSING',
      title: 'A selected product is unavailable',
      message: merchantStoreEligibilityMessage(product.issues),
      productId: product.id,
    })
  }
  for (const product of ineligible) {
    attention.push({
      code: 'SELECTED_PRODUCT_INELIGIBLE',
      title: `${product.frame?.name ?? 'A selected product'} needs attention`,
      message: merchantStoreEligibilityMessage(product.issues),
      productId: product.id,
    })
  }

  const eligibleSelectedCount = selectedProducts.filter((product) => product.eligible).length
  const canPublish = store.status !== 'ACTIVE'
    && selectedProducts.length > 0
    && eligibleSelectedCount === selectedProducts.length
  const canPreview = store.status !== 'ACTIVE' && selectedProducts.length > 0 && eligibleSelectedCount > 0

  let primaryAction: MerchantStoreWorkspacePrimaryAction
  if (store.status === 'ACTIVE') primaryAction = 'VIEW_LIVE_STORE'
  else if (missing.length > 0 || ineligible.length > 0) primaryAction = 'REVIEW_CATALOG'
  else if (selectedProducts.length === 0) primaryAction = 'MANAGE_PRODUCTS'
  else primaryAction = 'PREVIEW_STORE'

  return {
    lifecycle: store.status === 'ACTIVE' ? 'LIVE' : 'DRAFT',
    selectedProducts,
    attention,
    primaryAction,
    canPreview,
    canPublish,
    selectedCount: selectedProducts.length,
    eligibleSelectedCount,
  }
}
