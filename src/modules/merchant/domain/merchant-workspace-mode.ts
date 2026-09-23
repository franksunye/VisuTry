export type MerchantWorkspaceMode = 'ACTIVATION' | 'OPERATING'

export type MerchantWorkspaceModeReason =
  | 'STORE_PREVIEWED'
  | 'STORE_PUBLISHED'
  | 'ACTIVE_STORE'
  | 'FIRST_VALUE_NOT_REACHED'

export type MerchantWorkspaceModeResolution = {
  mode: MerchantWorkspaceMode
  reason: MerchantWorkspaceModeReason
}

export function resolveMerchantWorkspaceMode(input: {
  hasStorePreviewedEvent: boolean
  hasStorePublishedEvent: boolean
  storeStatus: string | null
}): MerchantWorkspaceModeResolution {
  if (input.hasStorePreviewedEvent) {
    return { mode: 'OPERATING', reason: 'STORE_PREVIEWED' }
  }

  if (input.hasStorePublishedEvent) {
    return { mode: 'OPERATING', reason: 'STORE_PUBLISHED' }
  }

  if (input.storeStatus === 'ACTIVE') {
    return { mode: 'OPERATING', reason: 'ACTIVE_STORE' }
  }

  return { mode: 'ACTIVATION', reason: 'FIRST_VALUE_NOT_REACHED' }
}
