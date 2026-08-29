/** Shopper photo URLs that are safe to keep in same-tab resume storage. */

export function isPersistablePreviewUrl(value: string): boolean {
  return !value.startsWith('data:') && (value.startsWith('/') || value.startsWith('https://'))
}
