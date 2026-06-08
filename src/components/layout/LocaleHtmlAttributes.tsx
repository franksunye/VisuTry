'use client'

import { useEffect } from 'react'
import { localeDirections, type Locale } from '@/i18n'

interface LocaleHtmlAttributesProps {
  locale: Locale
}

export function LocaleHtmlAttributes({ locale }: LocaleHtmlAttributesProps) {
  useEffect(() => {
    document.documentElement.lang = locale
    document.documentElement.dir = localeDirections[locale]
  }, [locale])

  return null
}
