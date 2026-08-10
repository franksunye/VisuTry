'use client'

import {
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { Check, Loader2, X } from 'lucide-react'
import { useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { analytics, getAcquisitionContext } from '@/lib/analytics'
import { localizedPath } from '@/lib/localized-path'
import { PRICE_CONFIG, QUOTA_CONFIG } from '@/config/pricing'
import { TOP_PICK_GLASSES_PRESETS } from '@/config/glasses-presets'

export type ConversionPaywallSource = 'try_on' | 'frame_compare'

interface ConversionPaywallBoundaryProps {
  children: ReactNode
  source: ConversionPaywallSource
}

type ReturnState = 'success' | 'cancelled' | 'pending' | 'failed' | null

type PersistedUpload = {
  index: number
  ariaLabel: string | null
  file: File
}

type PersistedConversionContext = {
  source: ConversionPaywallSource
  pathname: string
  createdAt: number
  creditsBalanceBefore: number
  uploads: PersistedUpload[]
  selectedFrameIds: string[]
}

type PersistedConversionMetadata = Omit<PersistedConversionContext, 'uploads'>

type PaywallCopy = {
  eyebrow: string
  title: string
  description: string
  packTitle: (count: number) => string
  oneTime: string
  benefits: string[]
  continueLabel: (price: string) => string
  processing: string
  regularUse: string
  standardFrom: (price: string) => string
  viewPlans: string
  secureCheckout: string
  close: string
  successTitle: string
  successBody: string
  cancelledTitle: string
  cancelledBody: string
  paymentError: string
}

const EN_COPY: Record<ConversionPaywallSource, PaywallCopy> = {
  try_on: {
    eyebrow: 'TRY-ON',
    title: 'Keep trying',
    description: 'Add credits and continue where you left off without choosing a subscription.',
    packTitle: (count) => `${count} Decision Credits`,
    oneTime: 'One-time purchase',
    benefits: ['Continue virtual try-on', 'Use across VisuTry', 'Credits do not expire', 'No subscription'],
    continueLabel: (price) => `Continue for ${price}`,
    processing: 'Opening secure checkout…',
    regularUse: 'Need credits regularly?',
    standardFrom: (price) => `Standard starts at ${price}/month`,
    viewPlans: 'View subscription plans',
    secureCheckout: 'Secure checkout · One-time purchase',
    close: 'Close',
    successTitle: 'Credits added',
    successBody: 'Your credits are verified. Your previous selections have been restored when the browser allowed it.',
    cancelledTitle: 'Payment not completed',
    cancelledBody: 'Your previous selections have been restored when possible. You can continue whenever you are ready.',
    paymentError: 'Checkout could not be started. Please try again.',
  },
  frame_compare: {
    eyebrow: 'FRAME COMPARE',
    title: 'Keep comparing your options',
    description: 'Add credits for more frame comparisons without leaving your current decision flow.',
    packTitle: (count) => `${count} Decision Credits`,
    oneTime: 'One-time purchase',
    benefits: ['Compare more frames', 'Continue virtual try-on', 'Credits do not expire', 'No subscription'],
    continueLabel: (price) => `Continue for ${price}`,
    processing: 'Opening secure checkout…',
    regularUse: 'Need credits regularly?',
    standardFrom: (price) => `Standard starts at ${price}/month`,
    viewPlans: 'View subscription plans',
    secureCheckout: 'Secure checkout · One-time purchase',
    close: 'Close',
    successTitle: 'Credits added',
    successBody: 'Your credits are verified. Review your restored photo and frame choices, then start the comparison when ready.',
    cancelledTitle: 'Payment not completed',
    cancelledBody: 'Your comparison context has been restored when possible. You can continue whenever you are ready.',
    paymentError: 'Checkout could not be started. Please try again.',
  },
}

const LOCALIZED_COPY: Record<string, Partial<Record<ConversionPaywallSource, Partial<PaywallCopy>>>> = {
  id: {
    try_on: {
      eyebrow: 'COBA VIRTUAL', title: 'Lanjutkan mencoba', description: 'Tambahkan kredit dan lanjutkan dari posisi terakhir tanpa berlangganan.',
      packTitle: (count) => `${count} Kredit Keputusan`, oneTime: 'Pembelian satu kali',
      benefits: ['Lanjutkan coba virtual', 'Gunakan di seluruh VisuTry', 'Kredit tidak kedaluwarsa', 'Tanpa langganan'],
      continueLabel: (price) => `Lanjutkan dengan ${price}`, processing: 'Membuka pembayaran aman…', regularUse: 'Butuh kredit secara rutin?',
      standardFrom: (price) => `Standard mulai ${price}/bulan`, viewPlans: 'Lihat paket langganan', secureCheckout: 'Pembayaran aman · Pembelian satu kali', close: 'Tutup',
      successTitle: 'Kredit ditambahkan', cancelledTitle: 'Pembayaran belum selesai', paymentError: 'Pembayaran tidak dapat dimulai. Silakan coba lagi.',
    },
    frame_compare: {
      eyebrow: 'BANDINGKAN FRAME', title: 'Lanjutkan membandingkan pilihan', description: 'Tambahkan kredit untuk membandingkan lebih banyak frame tanpa meninggalkan alur keputusan saat ini.',
      packTitle: (count) => `${count} Kredit Keputusan`, oneTime: 'Pembelian satu kali',
      benefits: ['Bandingkan lebih banyak frame', 'Lanjutkan coba virtual', 'Kredit tidak kedaluwarsa', 'Tanpa langganan'],
      continueLabel: (price) => `Lanjutkan dengan ${price}`, processing: 'Membuka pembayaran aman…', regularUse: 'Butuh kredit secara rutin?',
      standardFrom: (price) => `Standard mulai ${price}/bulan`, viewPlans: 'Lihat paket langganan', secureCheckout: 'Pembayaran aman · Pembelian satu kali', close: 'Tutup',
      successTitle: 'Kredit ditambahkan', cancelledTitle: 'Pembayaran belum selesai', paymentError: 'Pembayaran tidak dapat dimulai. Silakan coba lagi.',
    },
  },
  ar: {
    try_on: {
      eyebrow: 'التجربة الافتراضية', title: 'تابع التجربة', description: 'أضف رصيدًا وتابع من حيث توقفت من دون الاشتراك.',
      packTitle: (count) => `${count} رصيد قرار`, oneTime: 'شراء لمرة واحدة',
      benefits: ['تابع التجربة الافتراضية', 'استخدم الرصيد في VisuTry', 'الرصيد لا تنتهي صلاحيته', 'لا اشتراك'],
      continueLabel: (price) => `تابع مقابل ${price}`, processing: 'جارٍ فتح الدفع الآمن…', regularUse: 'تحتاج رصيدًا بانتظام؟',
      standardFrom: (price) => `تبدأ Standard من ${price}/شهريًا`, viewPlans: 'عرض خطط الاشتراك', secureCheckout: 'دفع آمن · شراء لمرة واحدة', close: 'إغلاق',
      successTitle: 'تمت إضافة الرصيد', cancelledTitle: 'لم يكتمل الدفع', paymentError: 'تعذر بدء الدفع. حاول مرة أخرى.',
    },
    frame_compare: {
      eyebrow: 'مقارنة الإطارات', title: 'تابع مقارنة خياراتك', description: 'أضف رصيدًا لمقارنة المزيد من الإطارات من دون مغادرة مسار القرار الحالي.',
      packTitle: (count) => `${count} رصيد قرار`, oneTime: 'شراء لمرة واحدة',
      benefits: ['قارن المزيد من الإطارات', 'تابع التجربة الافتراضية', 'الرصيد لا تنتهي صلاحيته', 'لا اشتراك'],
      continueLabel: (price) => `تابع مقابل ${price}`, processing: 'جارٍ فتح الدفع الآمن…', regularUse: 'تحتاج رصيدًا بانتظام؟',
      standardFrom: (price) => `تبدأ Standard من ${price}/شهريًا`, viewPlans: 'عرض خطط الاشتراك', secureCheckout: 'دفع آمن · شراء لمرة واحدة', close: 'إغلاق',
      successTitle: 'تمت إضافة الرصيد', cancelledTitle: 'لم يكتمل الدفع', paymentError: 'تعذر بدء الدفع. حاول مرة أخرى.',
    },
  },
  ru: {
    try_on: {
      eyebrow: 'ВИРТУАЛЬНАЯ ПРИМЕРКА', title: 'Продолжить примерку', description: 'Добавьте кредиты и продолжите с того же места без подписки.',
      oneTime: 'Разовая покупка', benefits: ['Продолжить виртуальную примерку', 'Использовать во всём VisuTry', 'Кредиты не сгорают', 'Без подписки'],
      continueLabel: (price) => `Продолжить за ${price}`, processing: 'Открываем безопасную оплату…', regularUse: 'Нужны кредиты регулярно?',
      standardFrom: (price) => `Standard от ${price}/мес.`, viewPlans: 'Посмотреть подписки', secureCheckout: 'Безопасная оплата · Разовая покупка', close: 'Закрыть',
      successTitle: 'Кредиты добавлены', cancelledTitle: 'Оплата не завершена', paymentError: 'Не удалось начать оплату. Попробуйте ещё раз.',
    },
    frame_compare: {
      eyebrow: 'СРАВНЕНИЕ ОПРАВ', title: 'Продолжить сравнение', description: 'Добавьте кредиты для новых сравнений, не покидая текущий сценарий выбора.',
      oneTime: 'Разовая покупка', benefits: ['Сравнить больше оправ', 'Продолжить виртуальную примерку', 'Кредиты не сгорают', 'Без подписки'],
      continueLabel: (price) => `Продолжить за ${price}`, processing: 'Открываем безопасную оплату…', regularUse: 'Нужны кредиты регулярно?',
      standardFrom: (price) => `Standard от ${price}/мес.`, viewPlans: 'Посмотреть подписки', secureCheckout: 'Безопасная оплата · Разовая покупка', close: 'Закрыть',
      successTitle: 'Кредиты добавлены', cancelledTitle: 'Оплата не завершена', paymentError: 'Не удалось начать оплату. Попробуйте ещё раз.',
    },
  },
  de: {
    try_on: {
      eyebrow: 'VIRTUELLE ANPROBE', title: 'Weiter anprobieren', description: 'Füge Credits hinzu und mache ohne Abo dort weiter, wo du aufgehört hast.',
      oneTime: 'Einmaliger Kauf', benefits: ['Virtuelle Anprobe fortsetzen', 'In VisuTry verwenden', 'Credits verfallen nicht', 'Kein Abo'],
      continueLabel: (price) => `Für ${price} fortfahren`, processing: 'Sicherer Checkout wird geöffnet…', regularUse: 'Brauchst du regelmäßig Credits?',
      standardFrom: (price) => `Standard ab ${price}/Monat`, viewPlans: 'Abos ansehen', secureCheckout: 'Sicherer Checkout · Einmaliger Kauf', close: 'Schließen',
      successTitle: 'Credits hinzugefügt', cancelledTitle: 'Zahlung nicht abgeschlossen', paymentError: 'Checkout konnte nicht gestartet werden. Bitte versuche es erneut.',
    },
    frame_compare: {
      eyebrow: 'FASSUNGEN VERGLEICHEN', title: 'Vergleich fortsetzen', description: 'Füge Credits für weitere Fassungsvergleiche hinzu, ohne deinen aktuellen Entscheidungsfluss zu verlassen.',
      oneTime: 'Einmaliger Kauf', benefits: ['Mehr Fassungen vergleichen', 'Virtuelle Anprobe fortsetzen', 'Credits verfallen nicht', 'Kein Abo'],
      continueLabel: (price) => `Für ${price} fortfahren`, processing: 'Sicherer Checkout wird geöffnet…', regularUse: 'Brauchst du regelmäßig Credits?',
      standardFrom: (price) => `Standard ab ${price}/Monat`, viewPlans: 'Abos ansehen', secureCheckout: 'Sicherer Checkout · Einmaliger Kauf', close: 'Schließen',
      successTitle: 'Credits hinzugefügt', cancelledTitle: 'Zahlung nicht abgeschlossen', paymentError: 'Checkout konnte nicht gestartet werden. Bitte versuche es erneut.',
    },
  },
  ja: {
    try_on: {
      eyebrow: 'バーチャル試着', title: '試着を続ける', description: 'クレジットを追加して、サブスクリプションなしで続きから再開できます。', oneTime: '1回限りの購入',
      benefits: ['バーチャル試着を続ける', 'VisuTry 全体で利用可能', 'クレジットは失効しません', 'サブスクリプション不要'],
      continueLabel: (price) => `${price} で続ける`, processing: '安全な決済を開いています…', regularUse: '定期的にクレジットが必要ですか？',
      standardFrom: (price) => `Standard は月額 ${price} から`, viewPlans: 'サブスクリプションを見る', secureCheckout: '安全な決済 · 1回限りの購入', close: '閉じる',
      successTitle: 'クレジットを追加しました', cancelledTitle: '支払いは完了していません', paymentError: '決済を開始できませんでした。もう一度お試しください。',
    },
    frame_compare: {
      eyebrow: 'フレーム比較', title: '比較を続ける', description: '現在の比較フローを離れずに、クレジットを追加してより多くのフレームを比較できます。', oneTime: '1回限りの購入',
      benefits: ['より多くのフレームを比較', 'バーチャル試着を続ける', 'クレジットは失効しません', 'サブスクリプション不要'],
      continueLabel: (price) => `${price} で続ける`, processing: '安全な決済を開いています…', regularUse: '定期的にクレジットが必要ですか？',
      standardFrom: (price) => `Standard は月額 ${price} から`, viewPlans: 'サブスクリプションを見る', secureCheckout: '安全な決済 · 1回限りの購入', close: '閉じる',
      successTitle: 'クレジットを追加しました', cancelledTitle: '支払いは完了していません', paymentError: '決済を開始できませんでした。もう一度お試しください。',
    },
  },
  es: {
    try_on: {
      eyebrow: 'PRUEBA VIRTUAL', title: 'Seguir probando', description: 'Añade créditos y continúa donde lo dejaste sin elegir una suscripción.', oneTime: 'Compra única',
      benefits: ['Continuar la prueba virtual', 'Usar en todo VisuTry', 'Los créditos no caducan', 'Sin suscripción'], continueLabel: (price) => `Continuar por ${price}`,
      processing: 'Abriendo pago seguro…', regularUse: '¿Necesitas créditos con frecuencia?', standardFrom: (price) => `Standard desde ${price}/mes`,
      viewPlans: 'Ver suscripciones', secureCheckout: 'Pago seguro · Compra única', close: 'Cerrar', successTitle: 'Créditos añadidos', cancelledTitle: 'Pago no completado', paymentError: 'No se pudo iniciar el pago. Inténtalo de nuevo.',
    },
    frame_compare: {
      eyebrow: 'COMPARAR MONTURAS', title: 'Seguir comparando opciones', description: 'Añade créditos para comparar más monturas sin salir de tu flujo de decisión.', oneTime: 'Compra única',
      benefits: ['Comparar más monturas', 'Continuar la prueba virtual', 'Los créditos no caducan', 'Sin suscripción'], continueLabel: (price) => `Continuar por ${price}`,
      processing: 'Abriendo pago seguro…', regularUse: '¿Necesitas créditos con frecuencia?', standardFrom: (price) => `Standard desde ${price}/mes`,
      viewPlans: 'Ver suscripciones', secureCheckout: 'Pago seguro · Compra única', close: 'Cerrar', successTitle: 'Créditos añadidos', cancelledTitle: 'Pago no completado', paymentError: 'No se pudo iniciar el pago. Inténtalo de nuevo.',
    },
  },
  pt: {
    try_on: {
      eyebrow: 'PROVA VIRTUAL', title: 'Continue experimentando', description: 'Adicione créditos e continue de onde parou sem escolher uma assinatura.', oneTime: 'Compra única',
      benefits: ['Continuar a prova virtual', 'Usar em todo o VisuTry', 'Créditos não expiram', 'Sem assinatura'], continueLabel: (price) => `Continuar por ${price}`,
      processing: 'Abrindo pagamento seguro…', regularUse: 'Precisa de créditos regularmente?', standardFrom: (price) => `Standard a partir de ${price}/mês`,
      viewPlans: 'Ver assinaturas', secureCheckout: 'Pagamento seguro · Compra única', close: 'Fechar', successTitle: 'Créditos adicionados', cancelledTitle: 'Pagamento não concluído', paymentError: 'Não foi possível iniciar o pagamento. Tente novamente.',
    },
    frame_compare: {
      eyebrow: 'COMPARAR ARMAÇÕES', title: 'Continue comparando opções', description: 'Adicione créditos para comparar mais armações sem sair do seu fluxo atual.', oneTime: 'Compra única',
      benefits: ['Comparar mais armações', 'Continuar a prova virtual', 'Créditos não expiram', 'Sem assinatura'], continueLabel: (price) => `Continuar por ${price}`,
      processing: 'Abrindo pagamento seguro…', regularUse: 'Precisa de créditos regularmente?', standardFrom: (price) => `Standard a partir de ${price}/mês`,
      viewPlans: 'Ver assinaturas', secureCheckout: 'Pagamento seguro · Compra única', close: 'Fechar', successTitle: 'Créditos adicionados', cancelledTitle: 'Pagamento não concluído', paymentError: 'Não foi possível iniciar o pagamento. Tente novamente.',
    },
  },
  fr: {
    try_on: {
      eyebrow: 'ESSAYAGE VIRTUEL', title: 'Continuer les essayages', description: 'Ajoutez des crédits et reprenez là où vous vous êtes arrêté, sans abonnement.', oneTime: 'Achat unique',
      benefits: ['Continuer l’essayage virtuel', 'Utiliser dans tout VisuTry', 'Les crédits n’expirent pas', 'Sans abonnement'], continueLabel: (price) => `Continuer pour ${price}`,
      processing: 'Ouverture du paiement sécurisé…', regularUse: 'Besoin de crédits régulièrement ?', standardFrom: (price) => `Standard à partir de ${price}/mois`,
      viewPlans: 'Voir les abonnements', secureCheckout: 'Paiement sécurisé · Achat unique', close: 'Fermer', successTitle: 'Crédits ajoutés', cancelledTitle: 'Paiement non terminé', paymentError: 'Impossible de lancer le paiement. Veuillez réessayer.',
    },
    frame_compare: {
      eyebrow: 'COMPARER LES MONTURES', title: 'Continuer à comparer', description: 'Ajoutez des crédits pour comparer davantage de montures sans quitter votre parcours de décision.', oneTime: 'Achat unique',
      benefits: ['Comparer plus de montures', 'Continuer l’essayage virtuel', 'Les crédits n’expirent pas', 'Sans abonnement'], continueLabel: (price) => `Continuer pour ${price}`,
      processing: 'Ouverture du paiement sécurisé…', regularUse: 'Besoin de crédits régulièrement ?', standardFrom: (price) => `Standard à partir de ${price}/mois`,
      viewPlans: 'Voir les abonnements', secureCheckout: 'Paiement sécurisé · Achat unique', close: 'Fermer', successTitle: 'Crédits ajoutés', cancelledTitle: 'Paiement non terminé', paymentError: 'Impossible de lancer le paiement. Veuillez réessayer.',
    },
  },
}

const CONTEXT_DB = 'visutry-conversion-context'
const CONTEXT_STORE = 'contexts'
const CONTEXT_VERSION = 1
const CONTEXT_IO_TIMEOUT_MS = 250
const PAYMENT_VERIFY_ATTEMPTS = 24
const PAYMENT_VERIFY_DELAY_MS = 1250

function delay(ms: number) {
  return new Promise<void>((resolve) => window.setTimeout(resolve, ms))
}

function getCopy(locale: string, source: ConversionPaywallSource): PaywallCopy {
  return {
    ...EN_COPY[source],
    ...(LOCALIZED_COPY[locale]?.[source] || {}),
  }
}

function getCreditsBalance(session: ReturnType<typeof useSession>['data']) {
  if (!session?.user) return 0
  return Math.max(0, (session.user.creditsPurchased || 0) - (session.user.creditsUsed || 0))
}

function openContextDb(): Promise<IDBDatabase | null> {
  if (typeof window === 'undefined' || !window.indexedDB) return Promise.resolve(null)

  return new Promise((resolve) => {
    let settled = false
    let request: IDBOpenDBRequest

    const finish = (db: IDBDatabase | null) => {
      if (settled) {
        db?.close()
        return
      }
      settled = true
      window.clearTimeout(timeoutId)
      resolve(db)
    }

    const timeoutId = window.setTimeout(() => finish(null), CONTEXT_IO_TIMEOUT_MS)

    try {
      request = window.indexedDB.open(CONTEXT_DB, CONTEXT_VERSION)
    } catch {
      finish(null)
      return
    }

    request.onupgradeneeded = () => {
      try {
        const db = request.result
        if (!db.objectStoreNames.contains(CONTEXT_STORE)) db.createObjectStore(CONTEXT_STORE)
      } catch {
        // Persistence is optional and must never affect Checkout.
      }
    }
    request.onsuccess = () => finish(request.result)
    request.onerror = () => finish(null)
    request.onblocked = () => finish(null)
  })
}

function writeSessionMetadata(key: string, context: PersistedConversionContext) {
  const metadata: PersistedConversionMetadata = {
    source: context.source,
    pathname: context.pathname,
    createdAt: context.createdAt,
    creditsBalanceBefore: context.creditsBalanceBefore,
    selectedFrameIds: context.selectedFrameIds,
  }

  try {
    window.sessionStorage.setItem(key, JSON.stringify(metadata))
  } catch {
    // Best effort only.
  }
}

async function writeContextToDb(key: string, context: PersistedConversionContext) {
  const db = await openContextDb()
  if (!db) return

  await new Promise<void>((resolve) => {
    let settled = false
    const finish = () => {
      if (settled) return
      settled = true
      window.clearTimeout(timeoutId)
      resolve()
    }
    const timeoutId = window.setTimeout(finish, CONTEXT_IO_TIMEOUT_MS)

    try {
      const transaction = db.transaction(CONTEXT_STORE, 'readwrite')
      transaction.objectStore(CONTEXT_STORE).put(context, key)
      transaction.oncomplete = finish
      transaction.onerror = finish
      transaction.onabort = finish
    } catch {
      finish()
    }
  })

  db.close()
}

async function readPersistedContext(key: string): Promise<PersistedConversionContext | null> {
  const db = await openContextDb()
  if (db) {
    const value = await new Promise<PersistedConversionContext | null>((resolve) => {
      let settled = false
      const finish = (context: PersistedConversionContext | null) => {
        if (settled) return
        settled = true
        window.clearTimeout(timeoutId)
        resolve(context)
      }
      const timeoutId = window.setTimeout(() => finish(null), CONTEXT_IO_TIMEOUT_MS)

      try {
        const transaction = db.transaction(CONTEXT_STORE, 'readonly')
        const request = transaction.objectStore(CONTEXT_STORE).get(key)
        request.onsuccess = () => finish((request.result as PersistedConversionContext | undefined) || null)
        request.onerror = () => finish(null)
      } catch {
        finish(null)
      }
    })
    db.close()
    if (value) return value
  }

  try {
    const raw = window.sessionStorage.getItem(key)
    if (!raw) return null
    const metadata = JSON.parse(raw) as PersistedConversionMetadata
    return { ...metadata, uploads: [] }
  } catch {
    return null
  }
}

async function clearPersistedContext(key: string) {
  try {
    window.sessionStorage.removeItem(key)
  } catch {
    // Best effort only.
  }

  const db = await openContextDb()
  if (!db) return

  await new Promise<void>((resolve) => {
    let settled = false
    const finish = () => {
      if (settled) return
      settled = true
      window.clearTimeout(timeoutId)
      resolve()
    }
    const timeoutId = window.setTimeout(finish, CONTEXT_IO_TIMEOUT_MS)

    try {
      const transaction = db.transaction(CONTEXT_STORE, 'readwrite')
      transaction.objectStore(CONTEXT_STORE).delete(key)
      transaction.oncomplete = finish
      transaction.onerror = finish
      transaction.onabort = finish
    } catch {
      finish()
    }
  })

  db.close()
}

function captureUploads(container: HTMLElement | null): PersistedUpload[] {
  if (!container) return []

  return Array.from(container.querySelectorAll<HTMLInputElement>('input[type="file"]'))
    .map((input, index) => {
      const file = input.files?.[0]
      return file
        ? { index, ariaLabel: input.getAttribute('aria-label'), file }
        : null
    })
    .filter((upload): upload is PersistedUpload => Boolean(upload))
}

function getFrameButtonEntries(container: HTMLElement | null) {
  if (!container) return []
  const presetIdByAlt = new Map(
    TOP_PICK_GLASSES_PRESETS.map((preset) => [`${preset.name} glasses`, preset.id]),
  )

  return Array.from(container.querySelectorAll<HTMLButtonElement>('button'))
    .map((button) => {
      const alt = button.querySelector<HTMLImageElement>('img[alt$="glasses"]')?.alt
      const presetId = alt ? presetIdByAlt.get(alt) : undefined
      return presetId ? { button, presetId } : null
    })
    .filter((entry): entry is { button: HTMLButtonElement; presetId: string } => Boolean(entry))
}

function captureSelectedFrameIds(container: HTMLElement | null) {
  return getFrameButtonEntries(container)
    .filter(({ button }) => button.classList.contains('border-blue-500'))
    .map(({ presetId }) => presetId)
}

async function restoreUploads(container: HTMLElement | null, uploads: PersistedUpload[]) {
  if (!container || uploads.length === 0 || typeof DataTransfer === 'undefined') return 0

  const inputs = Array.from(container.querySelectorAll<HTMLInputElement>('input[type="file"]'))
  let restored = 0

  for (const upload of uploads) {
    const input = upload.ariaLabel
      ? inputs.find((candidate) => candidate.getAttribute('aria-label') === upload.ariaLabel) || inputs[upload.index]
      : inputs[upload.index]
    if (!input) continue

    try {
      const transfer = new DataTransfer()
      transfer.items.add(upload.file)
      input.files = transfer.files
      input.dispatchEvent(new Event('change', { bubbles: true }))
      restored += 1
      await delay(80)
    } catch {
      // Browser restrictions may prevent FileList restoration. Never treat that
      // as a payment failure and never auto-submit with partial state.
    }
  }

  return restored
}

function sameStringSet(a: string[], b: string[]) {
  if (a.length !== b.length) return false
  const left = [...a].sort()
  const right = [...b].sort()
  return left.every((value, index) => value === right[index])
}

async function restoreExactFrameSelection(container: HTMLElement | null, desiredIds: string[]) {
  if (!container || desiredIds.length === 0) return false
  const desired = new Set(desiredIds)

  let entries = getFrameButtonEntries(container)
  if (entries.length === 0) return false

  for (const { button, presetId } of entries) {
    const selected = button.classList.contains('border-blue-500')
    if (selected && !desired.has(presetId) && !button.disabled) button.click()
  }

  await delay(120)

  for (const desiredId of desiredIds) {
    entries = getFrameButtonEntries(container)
    const entry = entries.find(({ presetId }) => presetId === desiredId)
    if (!entry) return false
    const selected = entry.button.classList.contains('border-blue-500')
    if (!selected) {
      if (entry.button.disabled) return false
      entry.button.click()
      await delay(90)
    }
  }

  for (let attempt = 0; attempt < 12; attempt += 1) {
    const selectedNow = captureSelectedFrameIds(container)
    if (sameStringSet(selectedNow, desiredIds)) return true
    await delay(80)
  }

  return false
}

async function resumeTryOnAction(container: HTMLElement | null) {
  if (!container) return false

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const action = Array.from(container.querySelectorAll<HTMLButtonElement>('button'))
      .find((button) => (button.textContent?.trim() || '') === 'Try On' && !button.disabled)
    if (action) {
      action.click()
      return true
    }
    await delay(200)
  }

  return false
}

type PaymentVerification = 'completed' | 'failed' | 'pending'

async function verifyPayment(sessionId: string): Promise<PaymentVerification> {
  for (let attempt = 0; attempt < PAYMENT_VERIFY_ATTEMPTS; attempt += 1) {
    try {
      const response = await fetch(
        `/api/payment/conversion?session_id=${encodeURIComponent(sessionId)}`,
        { cache: 'no-store' },
      )
      const payload = await response.json().catch(() => null)

      if (response.ok && payload?.status === 'completed') {
        const productType = payload.data?.productType
        const verifiedProduct = productType === 'CREDITS_PACK' || productType === 'CREDITS_PACK_PROMO_60'
        if (payload.data?.transactionId === sessionId && verifiedProduct) return 'completed'
        return 'failed'
      }

      if (response.ok && (payload?.status === 'failed' || payload?.status === 'refunded')) {
        return 'failed'
      }
    } catch {
      // Network and webhook propagation failures are retried below.
    }

    if (attempt < PAYMENT_VERIFY_ATTEMPTS - 1) await delay(PAYMENT_VERIFY_DELAY_MS)
  }

  return 'pending'
}

export function ConversionPaywallBoundary({ children, source }: ConversionPaywallBoundaryProps) {
  const params = useParams()
  const locale = typeof params.locale === 'string' ? params.locale : 'en'
  const { data: session, update } = useSession()
  const boundaryRef = useRef<HTMLDivElement>(null)
  const primaryButtonRef = useRef<HTMLButtonElement>(null)
  const paywallTrackedRef = useRef(false)
  const returnHandledRef = useRef(false)
  const [open, setOpen] = useState(false)
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [checkoutError, setCheckoutError] = useState<string | null>(null)
  const [returnState, setReturnState] = useState<ReturnState>(null)
  const [returnMessage, setReturnMessage] = useState<string | null>(null)

  const copy = useMemo(() => getCopy(locale, source), [locale, source])
  const pricingHref = localizedPath(locale, '/pricing')
  const creditsCount = QUOTA_CONFIG.CREDITS_PACK
  const creditsPrice = `$${(PRICE_CONFIG.CREDITS_PACK / 100).toFixed(2)}`
  const monthlyPrice = `$${(PRICE_CONFIG.MONTHLY_SUBSCRIPTION / 100).toFixed(2)}`
  const contextKey = `visutry_conversion_context_${source}`
  const currentCreditsBalance = useMemo(() => getCreditsBalance(session), [session])

  const trackPaywallView = useCallback(() => {
    if (paywallTrackedRef.current) return
    paywallTrackedRef.current = true
    analytics.trackCustomEvent('paywall_view', {
      source,
      trigger: 'quota_or_credits_cta',
      remaining_quota: session?.user?.remainingTrials ?? 0,
      credits_balance: currentCreditsBalance,
      product_type: 'CREDITS_PACK',
      credits_count: creditsCount,
      price: PRICE_CONFIG.CREDITS_PACK / 100,
    })
  }, [creditsCount, currentCreditsBalance, session?.user?.remainingTrials, source])

  const showPaywall = useCallback(() => {
    setCheckoutError(null)
    setOpen(true)
    trackPaywallView()
  }, [trackPaywallView])

  const handleBoundaryClickCapture = useCallback((event: ReactMouseEvent<HTMLDivElement>) => {
    if (typeof window === 'undefined') return
    const target = event.target
    if (!(target instanceof Element)) return
    const anchor = target.closest<HTMLAnchorElement>('a[href]')
    if (!anchor) return

    try {
      const destination = new URL(anchor.href, window.location.origin)
      if (destination.origin !== window.location.origin || destination.pathname !== pricingHref) return
      event.preventDefault()
      event.stopPropagation()
      showPaywall()
    } catch {
      // Malformed links should fall through to normal browser handling.
    }
  }, [pricingHref, showPaywall])

  const persistCurrentContext = useCallback(() => {
    const context: PersistedConversionContext = {
      source,
      pathname: window.location.pathname,
      createdAt: Date.now(),
      creditsBalanceBefore: currentCreditsBalance,
      uploads: captureUploads(boundaryRef.current),
      selectedFrameIds: source === 'frame_compare' ? captureSelectedFrameIds(boundaryRef.current) : [],
    }

    writeSessionMetadata(contextKey, context)
    return writeContextToDb(contextKey, context).catch(() => undefined)
  }, [contextKey, currentCreditsBalance, source])

  const handleCheckout = useCallback(async () => {
    if (checkoutLoading || typeof window === 'undefined') return

    setCheckoutLoading(true)
    setCheckoutError(null)

    analytics.trackCustomEvent('credits_purchase_click', {
      source,
      product_type: 'CREDITS_PACK',
      credits_count: creditsCount,
      value: PRICE_CONFIG.CREDITS_PACK / 100,
      remaining_quota: session?.user?.remainingTrials ?? 0,
      credits_balance: currentCreditsBalance,
    })

    // Context persistence is deliberately fire-and-bounded. Stripe Checkout is
    // started independently so storage/IndexedDB/browser quirks can never block payment.
    const persistencePromise = Promise.resolve()
      .then(() => persistCurrentContext())
      .catch(() => undefined)

    try {
      const returnBase = `${window.location.origin}${window.location.pathname}`
      const response = await fetch('/api/payment/create-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productType: 'CREDITS_PACK',
          successUrl: `${returnBase}?payment=success&conversion=${source}&session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: `${returnBase}?payment=cancelled&conversion=${source}`,
          attribution: getAcquisitionContext(),
          locale,
        }),
      })
      const payload = await response.json()

      if (!response.ok || !payload.success || !payload.data?.url) {
        throw new Error(payload.error || copy.paymentError)
      }

      analytics.trackCustomEvent('checkout_started', {
        source,
        product_type: 'CREDITS_PACK',
        checkout_session_id: payload.data.sessionId,
        value: PRICE_CONFIG.CREDITS_PACK / 100,
      })

      // Give IndexedDB a tiny opportunity to finish only after Checkout exists.
      // The hard timeout means it can never hold the customer on this page.
      await Promise.race([persistencePromise, delay(CONTEXT_IO_TIMEOUT_MS)])
      window.location.assign(payload.data.url)
    } catch (error) {
      console.error('Contextual checkout failed:', error)
      setCheckoutError(error instanceof Error ? error.message : copy.paymentError)
      setCheckoutLoading(false)
    }
  }, [checkoutLoading, copy.paymentError, creditsCount, currentCreditsBalance, locale, persistCurrentContext, session?.user?.remainingTrials, source])

  useEffect(() => {
    if (!open) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !checkoutLoading) setOpen(false)
    }
    document.addEventListener('keydown', onKeyDown)
    window.setTimeout(() => primaryButtonRef.current?.focus(), 20)

    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [checkoutLoading, open])

  useEffect(() => {
    if (returnHandledRef.current || typeof window === 'undefined') return

    const url = new URL(window.location.href)
    const payment = url.searchParams.get('payment')
    const conversion = url.searchParams.get('conversion')
    if ((payment !== 'success' && payment !== 'cancelled') || conversion !== source) return

    returnHandledRef.current = true

    const cleanReturnParams = () => {
      url.searchParams.delete('payment')
      url.searchParams.delete('conversion')
      url.searchParams.delete('session_id')
      window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`)
    }

    const restoreReturnContext = async () => {
      const context = await readPersistedContext(contextKey)
      await delay(120)

      if (payment === 'cancelled') {
        const restoredUploads = await restoreUploads(boundaryRef.current, context?.uploads || [])
        const framesRestored = source === 'frame_compare'
          ? await restoreExactFrameSelection(boundaryRef.current, context?.selectedFrameIds || [])
          : true

        analytics.trackCustomEvent('checkout_cancelled', {
          source,
          product_type: 'CREDITS_PACK',
          restored_uploads: restoredUploads,
          restored_frames_exactly: framesRestored,
        })
        setReturnState('cancelled')
        setReturnMessage(copy.cancelledBody)
        await clearPersistedContext(contextKey)
        cleanReturnParams()
        return
      }

      const sessionId = url.searchParams.get('session_id')?.trim() || ''
      if (!sessionId.startsWith('cs_')) {
        setReturnState('pending')
        setReturnMessage('We could not verify this Checkout return yet. No automatic action was started. Your saved context is being kept for a retry.')
        return
      }

      setReturnState('pending')
      setReturnMessage('Confirming your payment with VisuTry. Your saved selections will only be resumed after the server verifies the purchase.')

      const verification = await verifyPayment(sessionId)
      if (verification === 'pending') {
        // Keep both the return parameters and persisted context. A refresh can
        // safely continue verification later without losing the user's state.
        setReturnState('pending')
        setReturnMessage('Payment is still being confirmed. Your saved selections are safe. Refresh this page in a moment if the balance has not updated yet.')
        return
      }

      if (verification === 'failed') {
        const restoredUploads = await restoreUploads(boundaryRef.current, context?.uploads || [])
        if (source === 'frame_compare') {
          await restoreExactFrameSelection(boundaryRef.current, context?.selectedFrameIds || [])
        }
        setReturnState('failed')
        setReturnMessage('This Checkout was not verified as a completed Credits Pack purchase. No automatic try-on or comparison was started.')
        await clearPersistedContext(contextKey)
        cleanReturnParams()
        return
      }

      // Only a server-verified COMPLETED Payment reaches this point.
      analytics.trackCustomEvent('checkout_completed', {
        source,
        product_type: 'CREDITS_PACK',
        checkout_session_id: sessionId,
        value: PRICE_CONFIG.CREDITS_PACK / 100,
      })

      const creditsBefore = context?.creditsBalanceBefore ?? currentCreditsBalance
      let sessionFresh = false
      for (let attempt = 0; attempt < 3; attempt += 1) {
        try {
          const refreshed = await update()
          if (getCreditsBalance(refreshed) > creditsBefore) {
            sessionFresh = true
            break
          }
        } catch {
          // Payment is already verified. Session refresh failure only disables auto-resume.
        }
        await delay(300)
      }

      const expectedUploads = context?.uploads.length || 0
      const restoredUploads = await restoreUploads(boundaryRef.current, context?.uploads || [])
      const uploadsRestoredExactly = expectedUploads > 0 && restoredUploads === expectedUploads
      const framesRestoredExactly = source === 'frame_compare'
        ? await restoreExactFrameSelection(boundaryRef.current, context?.selectedFrameIds || [])
        : true

      // Frame Compare intentionally requires a final user click after payment.
      // This prevents restored/default frame mismatches from spending credits.
      let resumed = false
      if (source === 'try_on' && sessionFresh && uploadsRestoredExactly) {
        resumed = await resumeTryOnAction(boundaryRef.current)
      }

      analytics.trackCustomEvent('conversion_context_restored', {
        source,
        product_type: 'CREDITS_PACK',
        payment_verified: true,
        session_fresh: sessionFresh,
        restored_uploads: restoredUploads,
        expected_uploads: expectedUploads,
        restored_frames_exactly: framesRestoredExactly,
        original_action_resumed: resumed,
        compare_requires_confirmation: source === 'frame_compare',
      })
      if (resumed) {
        analytics.trackCustomEvent('original_action_resumed', {
          source,
          product_type: 'CREDITS_PACK',
        })
      }

      setReturnState('success')
      setReturnMessage(copy.successBody)
      await clearPersistedContext(contextKey)
      cleanReturnParams()
    }

    void restoreReturnContext()
  }, [contextKey, copy.cancelledBody, copy.successBody, currentCreditsBalance, source, update])

  const returnTitle = returnState === 'success'
    ? copy.successTitle
    : returnState === 'cancelled'
      ? copy.cancelledTitle
      : returnState === 'failed'
        ? 'Payment not verified'
        : 'Confirming payment'

  const returnTone = returnState === 'success'
    ? 'border-green-200 bg-green-50 text-green-900'
    : returnState === 'cancelled'
      ? 'border-amber-200 bg-amber-50 text-amber-900'
      : returnState === 'failed'
        ? 'border-red-200 bg-red-50 text-red-900'
        : 'border-blue-200 bg-blue-50 text-blue-900'

  return (
    <>
      <div ref={boundaryRef} onClickCapture={handleBoundaryClickCapture}>
        {children}
      </div>

      {returnState && returnMessage && (
        <div
          className={`fixed left-4 right-4 top-4 z-[90] mx-auto max-w-xl rounded-xl border px-4 py-3 shadow-lg ${returnTone}`}
          role="status"
          aria-live="polite"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-bold">{returnTitle}</p>
              <p className="mt-1 text-sm leading-5 opacity-90">{returnMessage}</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setReturnState(null)
                setReturnMessage(null)
              }}
              className="rounded-md p-1 opacity-70 transition hover:bg-white/70 hover:opacity-100"
              aria-label={copy.close}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-[80] bg-slate-950/45 backdrop-blur-[1px] sm:flex sm:items-center sm:justify-center sm:p-6">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby={`conversion-paywall-${source}`}
            className="flex min-h-full w-full flex-col overflow-y-auto bg-slate-50 sm:min-h-0 sm:max-h-[92vh] sm:max-w-[500px] sm:rounded-2xl sm:border sm:border-slate-200 sm:shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4 sm:rounded-t-2xl">
              <span className="text-sm font-bold tracking-tight text-slate-950">VisuTry</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={checkoutLoading}
                className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 disabled:opacity-40"
                aria-label={copy.close}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-5 py-7 sm:px-7 sm:py-8">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-600">{copy.eyebrow}</p>
              <h2 id={`conversion-paywall-${source}`} className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
                {copy.title}
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">{copy.description}</p>

              <div className="mt-6 rounded-2xl border border-blue-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-950">{copy.packTitle(creditsCount)}</h3>
                    <p className="mt-1 text-xs font-medium text-slate-500">{copy.oneTime}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold tracking-tight text-slate-950">{creditsPrice}</div>
                  </div>
                </div>

                <ul className="mt-5 space-y-3">
                  {copy.benefits.map((benefit) => (
                    <li key={benefit} className="flex items-start gap-3 text-sm text-slate-700">
                      <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-green-50 text-green-600">
                        <Check className="h-3.5 w-3.5" />
                      </span>
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>

                {checkoutError && (
                  <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
                    {checkoutError}
                  </div>
                )}

                <button
                  ref={primaryButtonRef}
                  type="button"
                  onClick={handleCheckout}
                  disabled={checkoutLoading}
                  className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-blue-600 px-4 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-blue-400"
                >
                  {checkoutLoading ? (
                    <>
                      <Loader2 className="me-2 h-4 w-4 animate-spin" />
                      {copy.processing}
                    </>
                  ) : (
                    copy.continueLabel(creditsPrice)
                  )}
                </button>
              </div>

              <div className="mt-5 rounded-xl border border-slate-200 bg-white px-4 py-3.5">
                <p className="text-sm font-semibold text-slate-800">{copy.regularUse}</p>
                <div className="mt-1 flex flex-wrap items-center justify-between gap-2 text-sm">
                  <span className="text-slate-500">{copy.standardFrom(monthlyPrice)}</span>
                  <a href={pricingHref} className="font-semibold text-blue-600 hover:text-blue-700 hover:underline">
                    {copy.viewPlans} →
                  </a>
                </div>
              </div>

              <p className="mt-auto pt-6 text-center text-xs text-slate-400">{copy.secureCheckout}</p>
            </div>
          </section>
        </div>
      )}
    </>
  )
}
