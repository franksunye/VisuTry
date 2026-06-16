import { defaultLocale, isValidLocale } from '@/i18n'

export function localizedPath(locale: string | undefined, path: string) {
  const safeLocale = locale && isValidLocale(locale) ? locale : defaultLocale
  const normalizedPath = path.startsWith('/') ? path : `/${path}`

  if (normalizedPath === '/') {
    return `/${safeLocale}`
  }

  return `/${safeLocale}${normalizedPath}`
}
