/**
 * Pure helpers for Store try-on result delivery URLs (no Blob SDK imports).
 */

export function buildStoreTryOnResultDeliveryUrl(input: {
  taskId: string
  merchantSlug: string
  merchantSessionId: string
}): string {
  const params = new URLSearchParams({
    merchantSlug: input.merchantSlug,
    merchantSessionId: input.merchantSessionId,
  })
  return `/api/store/sessions/try-on/${input.taskId}/result?${params.toString()}`
}
