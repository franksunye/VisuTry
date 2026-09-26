'use client'

import type { MouseEvent, ReactNode } from 'react'
import type { MerchantHandoff } from '@/modules/store/domain/merchant-handoff'
import { locales } from '@/i18n'

type Props = {
  handoff: MerchantHandoff
  merchantSlug: string
  experienceSlug: string
  experienceType: 'STORE' | 'CAMPAIGN'
  surface: 'DISCOVERY' | 'RESULT'
  locale?: string
  className?: string
  children?: ReactNode
}

export function MerchantHandoffLink({ handoff, merchantSlug, experienceSlug, experienceType, surface, locale, className, children }: Props) {
  const internal = handoff.url.startsWith('/') && !handoff.url.startsWith('//')
  const hasLocalePrefix = locales.some((supportedLocale) => handoff.url === `/${supportedLocale}` || handoff.url.startsWith(`/${supportedLocale}/`))
  const href = internal && locale && !hasLocalePrefix
    ? `/${locale}${handoff.url}`
    : handoff.url

  function invoke(event: MouseEvent<HTMLAnchorElement>) {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    const clientActionId = globalThis.crypto?.randomUUID?.()
    if (!clientActionId) return
    void fetch('/api/store/handoffs/invoke', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      keepalive: true,
      body: JSON.stringify({ merchantSlug, experienceSlug, experienceType, action: handoff.action, surface, clientActionId, locale }),
    }).catch(() => undefined)
  }

  return <a href={href} target={internal ? undefined : '_blank'} rel={internal ? undefined : 'noopener noreferrer'} data-merchant-handoff-action={handoff.action} onClick={invoke} className={className}>{children ?? handoff.label}</a>
}
