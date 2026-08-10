'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { PRICE_CONFIG, QUOTA_CONFIG } from '@/config/pricing'
import { localizedPath } from '@/lib/localized-path'

export type CreditExhaustedKind = 'try_on' | 'style_explorer' | 'frame_compare'

type Copy = {
  title: Record<CreditExhaustedKind, string>
  needed: (shortfall: number, required: number, available: number) => string
  cta: (price: string) => string
  pack: (count: number) => string
}

const EN: Copy = {
  title: {
    try_on: 'Continue your try-on',
    style_explorer: 'Create these 4 looks',
    frame_compare: 'Complete your 4-frame comparison',
  },
  needed: (shortfall, required, available) => `${shortfall} ${shortfall === 1 ? 'credit' : 'credits'} needed · ${available} available · ${required} required`,
  cta: (price) => `Get Credits · ${price}`,
  pack: (count) => `${count} non-expiring credits`,
}

const COPY: Record<string, Partial<Copy>> = {
  id: {
    title: { try_on: 'Lanjutkan coba virtual', style_explorer: 'Buat 4 tampilan ini', frame_compare: 'Selesaikan perbandingan 4 frame' },
    needed: (s, r, a) => `Butuh ${s} kredit · ${a} tersedia · ${r} diperlukan`,
    cta: (price) => `Dapatkan Kredit · ${price}`,
    pack: (count) => `${count} kredit tanpa kedaluwarsa`,
  },
  ar: {
    title: { try_on: 'تابع التجربة', style_explorer: 'أنشئ هذه الإطلالات الأربع', frame_compare: 'أكمل مقارنة 4 إطارات' },
    needed: (s, r, a) => `تحتاج ${s} رصيد · المتاح ${a} · المطلوب ${r}`,
    cta: (price) => `احصل على رصيد · ${price}`,
    pack: (count) => `${count} رصيد لا تنتهي صلاحيته`,
  },
  ru: {
    title: { try_on: 'Продолжить примерку', style_explorer: 'Создать эти 4 образа', frame_compare: 'Завершить сравнение 4 оправ' },
    needed: (s, r, a) => `Нужно ещё ${s} · доступно ${a} · требуется ${r}`,
    cta: (price) => `Получить кредиты · ${price}`,
    pack: (count) => `${count} бессрочных кредитов`,
  },
  de: {
    title: { try_on: 'Anprobe fortsetzen', style_explorer: 'Diese 4 Looks erstellen', frame_compare: '4-Fassungen-Vergleich abschließen' },
    needed: (s, r, a) => `${s} Credits fehlen · ${a} verfügbar · ${r} benötigt`,
    cta: (price) => `Credits holen · ${price}`,
    pack: (count) => `${count} Credits ohne Verfall`,
  },
  ja: {
    title: { try_on: '試着を続ける', style_explorer: 'この4つのルックを作成', frame_compare: '4フレーム比較を完了' },
    needed: (s, r, a) => `あと${s}クレジット · 利用可能${a} · 必要${r}`,
    cta: (price) => `クレジットを追加 · ${price}`,
    pack: (count) => `有効期限なし ${count} クレジット`,
  },
  es: {
    title: { try_on: 'Continuar la prueba', style_explorer: 'Crear estos 4 looks', frame_compare: 'Completar la comparación de 4 monturas' },
    needed: (s, r, a) => `Faltan ${s} créditos · ${a} disponibles · ${r} necesarios`,
    cta: (price) => `Obtener créditos · ${price}`,
    pack: (count) => `${count} créditos sin caducidad`,
  },
  pt: {
    title: { try_on: 'Continuar a prova', style_explorer: 'Criar estes 4 looks', frame_compare: 'Concluir a comparação de 4 armações' },
    needed: (s, r, a) => `Faltam ${s} créditos · ${a} disponíveis · ${r} necessários`,
    cta: (price) => `Obter créditos · ${price}`,
    pack: (count) => `${count} créditos sem expiração`,
  },
  fr: {
    title: { try_on: 'Continuer l’essayage', style_explorer: 'Créer ces 4 looks', frame_compare: 'Terminer la comparaison de 4 montures' },
    needed: (s, r, a) => `${s} crédits manquants · ${a} disponibles · ${r} requis`,
    cta: (price) => `Obtenir des crédits · ${price}`,
    pack: (count) => `${count} crédits sans expiration`,
  },
}

function getCopy(locale: string): Copy {
  const localized = COPY[locale]
  return {
    title: localized?.title || EN.title,
    needed: localized?.needed || EN.needed,
    cta: localized?.cta || EN.cta,
    pack: localized?.pack || EN.pack,
  }
}

function creditSourceParam(kind: CreditExhaustedKind) {
  return kind.split('_').join('-')
}

export function CreditExhaustedBar({
  kind,
  availableCredits,
  requiredCredits,
  packCredits = QUOTA_CONFIG.CREDITS_PACK,
}: {
  kind: CreditExhaustedKind
  availableCredits: number
  requiredCredits: number
  packCredits?: number
}) {
  const params = useParams()
  const locale = typeof params.locale === 'string' ? params.locale : 'en'
  const copy = getCopy(locale)
  const available = Math.max(0, availableCredits)
  const shortfall = Math.max(0, requiredCredits - available)
  const price = `$${(PRICE_CONFIG.CREDITS_PACK / 100).toFixed(2)}`
  const pricingHref = `${localizedPath(locale, '/pricing')}?source=${creditSourceParam(kind)}&requiredCredits=${requiredCredits}`

  if (shortfall <= 0) return null

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/98 px-4 pt-3 shadow-[0_-8px_24px_rgba(15,23,42,0.08)] backdrop-blur md:hidden"
      style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}
      role="region"
      aria-label="Credits required"
      dir={locale === 'ar' ? 'rtl' : 'ltr'}
    >
      <div className="mx-auto flex max-w-md items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-slate-950">{copy.title[kind]}</p>
          <p className="mt-0.5 text-xs leading-4 text-slate-500">
            {copy.needed(shortfall, requiredCredits, available)}
          </p>
          <p className="mt-0.5 text-[11px] font-medium text-slate-400">{copy.pack(packCredits)}</p>
        </div>
        <Link
          href={pricingHref}
          data-credit-exhausted-cta
          className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl bg-blue-600 px-4 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          {copy.cta(price)}
        </Link>
      </div>
    </div>
  )
}

export function CreditExhaustedSurface({
  kind,
  availableCredits,
  requiredCredits,
  children,
}: {
  kind: CreditExhaustedKind
  availableCredits: number
  requiredCredits: number
  children: React.ReactNode
}) {
  const exhausted = availableCredits < requiredCredits

  return (
    <div
      data-credit-exhausted-surface={exhausted ? kind : undefined}
      className={exhausted ? 'pb-28 md:pb-0' : undefined}
    >
      {children}
      {exhausted && (
        <CreditExhaustedBar
          kind={kind}
          availableCredits={availableCredits}
          requiredCredits={requiredCredits}
        />
      )}
      <style jsx global>{`
        @media (max-width: 767px) {
          [data-credit-exhausted-surface="try_on"] .sticky.bottom-0 {
            display: none !important;
          }
          [data-credit-exhausted-surface="style_explorer"] a[href*="/pricing"]:not([data-credit-exhausted-cta]),
          [data-credit-exhausted-surface="frame_compare"] a[href*="/pricing"]:not([data-credit-exhausted-cta]) {
            display: none !important;
          }
          [data-credit-exhausted-surface="style_explorer"] .border-amber-200.bg-amber-50,
          [data-credit-exhausted-surface="frame_compare"] .border-amber-200.bg-amber-50 {
            border-color: rgb(226 232 240) !important;
            background: rgb(248 250 252) !important;
            color: rgb(71 85 105) !important;
          }
          [data-credit-exhausted-surface="frame_compare"] button[class*="disabled:bg-gray-300"]:disabled {
            display: none !important;
          }
        }
      `}</style>
    </div>
  )
}
