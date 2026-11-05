/** Public URL scraping is paused by default. Explicit opt-in requires a rebuild for the UI. */
export function isMerchantPublicUrlImportEnabled(): boolean {
  return process.env.NEXT_PUBLIC_MERCHANT_PUBLIC_URL_IMPORT_ENABLED === 'true'
}
