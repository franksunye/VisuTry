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

export type ConversionPaywallSource = 'try_on' | 'frame_compare'

interface ConversionPaywallBoundaryProps {
  children: ReactNode
  source: ConversionPaywallSource
}

type ReturnState = 'success' | 'cancelled' | null

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
  selectedFrameLabels: string[]
}

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
  successPending: string
  cancelledTitle: string
  cancelledBody: string
  paymentError: string
}

const COPY: Record<string, { try_on: PaywallCopy; frame_compare: PaywallCopy }> = {
  en: {
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
      successBody: 'Your previous selections are being restored and VisuTry will continue automatically when ready.',
      successPending: 'Payment completed. Your credit balance is still refreshing; your selections have been restored.',
      cancelledTitle: 'Payment not completed',
      cancelledBody: 'Your previous selections have been restored. You can continue whenever you are ready.',
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
      successBody: 'Your photo and frame choices are being restored and VisuTry will continue automatically when ready.',
      successPending: 'Payment completed. Your credit balance is still refreshing; your comparison context has been restored.',
      cancelledTitle: 'Payment not completed',
      cancelledBody: 'Your comparison context has been restored. You can continue whenever you are ready.',
      paymentError: 'Checkout could not be started. Please try again.',
    },
  },
  id: {
    try_on: {
      eyebrow: 'COBA VIRTUAL', title: 'Lanjutkan mencoba', description: 'Tambahkan kredit dan lanjutkan dari posisi terakhir tanpa berlangganan.',
      packTitle: (count) => `${count} Kredit Keputusan`, oneTime: 'Pembelian satu kali',
      benefits: ['Lanjutkan coba virtual', 'Gunakan di seluruh VisuTry', 'Kredit tidak kedaluwarsa', 'Tanpa langganan'],
      continueLabel: (price) => `Lanjutkan dengan ${price}`, processing: 'Membuka pembayaran aman…', regularUse: 'Butuh kredit secara rutin?',
      standardFrom: (price) => `Standard mulai ${price}/bulan`, viewPlans: 'Lihat paket langganan', secureCheckout: 'Pembayaran aman · Pembelian satu kali', close: 'Tutup',
      successTitle: 'Kredit ditambahkan', successBody: 'Pilihan sebelumnya sedang dipulihkan dan VisuTry akan melanjutkan otomatis saat siap.',
      successPending: 'Pembayaran selesai. Saldo kredit masih diperbarui; pilihan Anda telah dipulihkan.',
      cancelledTitle: 'Pembayaran belum selesai', cancelledBody: 'Pilihan sebelumnya telah dipulihkan. Anda dapat melanjutkan kapan saja.', paymentError: 'Pembayaran tidak dapat dimulai. Silakan coba lagi.',
    },
    frame_compare: {
      eyebrow: 'BANDINGKAN FRAME', title: 'Lanjutkan membandingkan pilihan', description: 'Tambahkan kredit untuk membandingkan lebih banyak frame tanpa meninggalkan alur keputusan saat ini.',
      packTitle: (count) => `${count} Kredit Keputusan`, oneTime: 'Pembelian satu kali',
      benefits: ['Bandingkan lebih banyak frame', 'Lanjutkan coba virtual', 'Kredit tidak kedaluwarsa', 'Tanpa langganan'],
      continueLabel: (price) => `Lanjutkan dengan ${price}`, processing: 'Membuka pembayaran aman…', regularUse: 'Butuh kredit secara rutin?',
      standardFrom: (price) => `Standard mulai ${price}/bulan`, viewPlans: 'Lihat paket langganan', secureCheckout: 'Pembayaran aman · Pembelian satu kali', close: 'Tutup',
      successTitle: 'Kredit ditambahkan', successBody: 'Foto dan pilihan frame sedang dipulihkan dan VisuTry akan melanjutkan otomatis saat siap.',
      successPending: 'Pembayaran selesai. Saldo kredit masih diperbarui; konteks perbandingan telah dipulihkan.',
      cancelledTitle: 'Pembayaran belum selesai', cancelledBody: 'Konteks perbandingan telah dipulihkan. Anda dapat melanjutkan kapan saja.', paymentError: 'Pembayaran tidak dapat dimulai. Silakan coba lagi.',
    },
  },
  ar: {
    try_on: {
      eyebrow: 'التجربة الافتراضية', title: 'تابع التجربة', description: 'أضف رصيدًا وتابع من حيث توقفت من دون الاشتراك.',
      packTitle: (count) => `${count} رصيد قرار`, oneTime: 'شراء لمرة واحدة',
      benefits: ['تابع التجربة الافتراضية', 'استخدم الرصيد في VisuTry', 'الرصيد لا تنتهي صلاحيته', 'لا اشتراك'],
      continueLabel: (price) => `تابع مقابل ${price}`, processing: 'جارٍ فتح الدفع الآمن…', regularUse: 'تحتاج رصيدًا بانتظام؟',
      standardFrom: (price) => `تبدأ Standard من ${price}/شهريًا`, viewPlans: 'عرض خطط الاشتراك', secureCheckout: 'دفع آمن · شراء لمرة واحدة', close: 'إغلاق',
      successTitle: 'تمت إضافة الرصيد', successBody: 'تتم استعادة اختياراتك السابقة وسيواصل VisuTry تلقائيًا عند الجاهزية.',
      successPending: 'اكتمل الدفع. ما زال الرصيد قيد التحديث؛ تمت استعادة اختياراتك.',
      cancelledTitle: 'لم يكتمل الدفع', cancelledBody: 'تمت استعادة اختياراتك السابقة. يمكنك المتابعة عندما تكون جاهزًا.', paymentError: 'تعذر بدء الدفع. حاول مرة أخرى.',
    },
    frame_compare: {
      eyebrow: 'مقارنة الإطارات', title: 'تابع مقارنة خياراتك', description: 'أضف رصيدًا لمقارنة المزيد من الإطارات من دون مغادرة مسار القرار الحالي.',
      packTitle: (count) => `${count} رصيد قرار`, oneTime: 'شراء لمرة واحدة',
      benefits: ['قارن المزيد من الإطارات', 'تابع التجربة الافتراضية', 'الرصيد لا تنتهي صلاحيته', 'لا اشتراك'],
      continueLabel: (price) => `تابع مقابل ${price}`, processing: 'جارٍ فتح الدفع الآمن…', regularUse: 'تحتاج رصيدًا بانتظام؟',
      standardFrom: (price) => `تبدأ Standard من ${price}/شهريًا`, viewPlans: 'عرض خطط الاشتراك', secureCheckout: 'دفع آمن · شراء لمرة واحدة', close: 'إغلاق',
      successTitle: 'تمت إضافة الرصيد', successBody: 'تتم استعادة صورتك واختيارات الإطارات وسيواصل VisuTry تلقائيًا عند الجاهزية.',
      successPending: 'اكتمل الدفع. ما زال الرصيد قيد التحديث؛ تمت استعادة سياق المقارنة.',
      cancelledTitle: 'لم يكتمل الدفع', cancelledBody: 'تمت استعادة سياق المقارنة. يمكنك المتابعة عندما تكون جاهزًا.', paymentError: 'تعذر بدء الدفع. حاول مرة أخرى.',
    },
  },
  ru: {
    try_on: {
      eyebrow: 'ВИРТУАЛЬНАЯ ПРИМЕРКА', title: 'Продолжить примерку', description: 'Добавьте кредиты и продолжите с того же места без подписки.',
      packTitle: (count) => `${count} Decision Credits`, oneTime: 'Разовая покупка', benefits: ['Продолжить виртуальную примерку', 'Использовать во всём VisuTry', 'Кредиты не сгорают', 'Без подписки'],
      continueLabel: (price) => `Продолжить за ${price}`, processing: 'Открываем безопасную оплату…', regularUse: 'Нужны кредиты регулярно?',
      standardFrom: (price) => `Standard от ${price}/мес.`, viewPlans: 'Посмотреть подписки', secureCheckout: 'Безопасная оплата · Разовая покупка', close: 'Закрыть',
      successTitle: 'Кредиты добавлены', successBody: 'Предыдущий выбор восстанавливается; VisuTry продолжит автоматически, когда всё будет готово.', successPending: 'Оплата завершена. Баланс ещё обновляется; ваш выбор восстановлен.',
      cancelledTitle: 'Оплата не завершена', cancelledBody: 'Предыдущий выбор восстановлен. Можно продолжить в любой момент.', paymentError: 'Не удалось начать оплату. Попробуйте ещё раз.',
    },
    frame_compare: {
      eyebrow: 'СРАВНЕНИЕ ОПРАВ', title: 'Продолжить сравнение', description: 'Добавьте кредиты для новых сравнений, не покидая текущий сценарий выбора.',
      packTitle: (count) => `${count} Decision Credits`, oneTime: 'Разовая покупка', benefits: ['Сравнить больше оправ', 'Продолжить виртуальную примерку', 'Кредиты не сгорают', 'Без подписки'],
      continueLabel: (price) => `Продолжить за ${price}`, processing: 'Открываем безопасную оплату…', regularUse: 'Нужны кредиты регулярно?',
      standardFrom: (price) => `Standard от ${price}/мес.`, viewPlans: 'Посмотреть подписки', secureCheckout: 'Безопасная оплата · Разовая покупка', close: 'Закрыть',
      successTitle: 'Кредиты добавлены', successBody: 'Фото и выбранные оправы восстанавливаются; VisuTry продолжит автоматически, когда всё будет готово.', successPending: 'Оплата завершена. Баланс ещё обновляется; контекст сравнения восстановлен.',
      cancelledTitle: 'Оплата не завершена', cancelledBody: 'Контекст сравнения восстановлен. Можно продолжить в любой момент.', paymentError: 'Не удалось начать оплату. Попробуйте ещё раз.',
    },
  },
  de: {
    try_on: {
      eyebrow: 'VIRTUELLE ANPROBE', title: 'Weiter anprobieren', description: 'Füge Credits hinzu und mache ohne Abo dort weiter, wo du aufgehört hast.',
      packTitle: (count) => `${count} Decision Credits`, oneTime: 'Einmaliger Kauf', benefits: ['Virtuelle Anprobe fortsetzen', 'In VisuTry verwenden', 'Credits verfallen nicht', 'Kein Abo'],
      continueLabel: (price) => `Für ${price} fortfahren`, processing: 'Sicherer Checkout wird geöffnet…', regularUse: 'Brauchst du regelmäßig Credits?',
      standardFrom: (price) => `Standard ab ${price}/Monat`, viewPlans: 'Abos ansehen', secureCheckout: 'Sicherer Checkout · Einmaliger Kauf', close: 'Schließen',
      successTitle: 'Credits hinzugefügt', successBody: 'Deine vorherige Auswahl wird wiederhergestellt. VisuTry fährt automatisch fort, sobald alles bereit ist.', successPending: 'Zahlung abgeschlossen. Das Guthaben wird noch aktualisiert; deine Auswahl wurde wiederhergestellt.',
      cancelledTitle: 'Zahlung nicht abgeschlossen', cancelledBody: 'Deine vorherige Auswahl wurde wiederhergestellt. Du kannst jederzeit fortfahren.', paymentError: 'Checkout konnte nicht gestartet werden. Bitte versuche es erneut.',
    },
    frame_compare: {
      eyebrow: 'FASSUNGEN VERGLEICHEN', title: 'Vergleich fortsetzen', description: 'Füge Credits für weitere Fassungsvergleiche hinzu, ohne deinen aktuellen Entscheidungsfluss zu verlassen.',
      packTitle: (count) => `${count} Decision Credits`, oneTime: 'Einmaliger Kauf', benefits: ['Mehr Fassungen vergleichen', 'Virtuelle Anprobe fortsetzen', 'Credits verfallen nicht', 'Kein Abo'],
      continueLabel: (price) => `Für ${price} fortfahren`, processing: 'Sicherer Checkout wird geöffnet…', regularUse: 'Brauchst du regelmäßig Credits?',
      standardFrom: (price) => `Standard ab ${price}/Monat`, viewPlans: 'Abos ansehen', secureCheckout: 'Sicherer Checkout · Einmaliger Kauf', close: 'Schließen',
      successTitle: 'Credits hinzugefügt', successBody: 'Foto und Fassungswahl werden wiederhergestellt. VisuTry fährt automatisch fort, sobald alles bereit ist.', successPending: 'Zahlung abgeschlossen. Das Guthaben wird noch aktualisiert; dein Vergleich wurde wiederhergestellt.',
      cancelledTitle: 'Zahlung nicht abgeschlossen', cancelledBody: 'Dein Vergleich wurde wiederhergestellt. Du kannst jederzeit fortfahren.', paymentError: 'Checkout konnte nicht gestartet werden. Bitte versuche es erneut.',
    },
  },
  ja: {
    try_on: {
      eyebrow: 'バーチャル試着', title: '試着を続ける', description: 'クレジットを追加して、サブスクリプションなしで続きから再開できます。',
      packTitle: (count) => `${count} Decision Credits`, oneTime: '1回限りの購入', benefits: ['バーチャル試着を続ける', 'VisuTry 全体で利用可能', 'クレジットは失効しません', 'サブスクリプション不要'],
      continueLabel: (price) => `${price} で続ける`, processing: '安全な決済を開いています…', regularUse: '定期的にクレジットが必要ですか？',
      standardFrom: (price) => `Standard は月額 ${price} から`, viewPlans: 'サブスクリプションを見る', secureCheckout: '安全な決済 · 1回限りの購入', close: '閉じる',
      successTitle: 'クレジットを追加しました', successBody: '前の選択内容を復元しています。準備ができ次第 VisuTry が自動で続行します。', successPending: '支払いは完了しました。残高を更新中です。選択内容は復元されました。',
      cancelledTitle: '支払いは完了していません', cancelledBody: '前の選択内容を復元しました。準備ができたら続けられます。', paymentError: '決済を開始できませんでした。もう一度お試しください。',
    },
    frame_compare: {
      eyebrow: 'フレーム比較', title: '比較を続ける', description: '現在の比較フローを離れずに、クレジットを追加してより多くのフレームを比較できます。',
      packTitle: (count) => `${count} Decision Credits`, oneTime: '1回限りの購入', benefits: ['より多くのフレームを比較', 'バーチャル試着を続ける', 'クレジットは失効しません', 'サブスクリプション不要'],
      continueLabel: (price) => `${price} で続ける`, processing: '安全な決済を開いています…', regularUse: '定期的にクレジットが必要ですか？',
      standardFrom: (price) => `Standard は月額 ${price} から`, viewPlans: 'サブスクリプションを見る', secureCheckout: '安全な決済 · 1回限りの購入', close: '閉じる',
      successTitle: 'クレジットを追加しました', successBody: '写真とフレーム選択を復元しています。準備ができ次第 VisuTry が自動で続行します。', successPending: '支払いは完了しました。残高を更新中です。比較コンテキストは復元されました。',
      cancelledTitle: '支払いは完了していません', cancelledBody: '比較コンテキストを復元しました。準備ができたら続けられます。', paymentError: '決済を開始できませんでした。もう一度お試しください。',
    },
  },
  es: {
    try_on: {
      eyebrow: 'PRUEBA VIRTUAL', title: 'Seguir probando', description: 'Añade créditos y continúa donde lo dejaste sin elegir una suscripción.',
      packTitle: (count) => `${count} Decision Credits`, oneTime: 'Compra única', benefits: ['Continuar la prueba virtual', 'Usar en todo VisuTry', 'Los créditos no caducan', 'Sin suscripción'],
      continueLabel: (price) => `Continuar por ${price}`, processing: 'Abriendo pago seguro…', regularUse: '¿Necesitas créditos con frecuencia?',
      standardFrom: (price) => `Standard desde ${price}/mes`, viewPlans: 'Ver suscripciones', secureCheckout: 'Pago seguro · Compra única', close: 'Cerrar',
      successTitle: 'Créditos añadidos', successBody: 'Estamos restaurando tus selecciones y VisuTry continuará automáticamente cuando estén listas.', successPending: 'Pago completado. El saldo aún se está actualizando; tus selecciones se han restaurado.',
      cancelledTitle: 'Pago no completado', cancelledBody: 'Tus selecciones se han restaurado. Puedes continuar cuando quieras.', paymentError: 'No se pudo iniciar el pago. Inténtalo de nuevo.',
    },
    frame_compare: {
      eyebrow: 'COMPARAR MONTURAS', title: 'Seguir comparando opciones', description: 'Añade créditos para comparar más monturas sin salir de tu flujo de decisión.',
      packTitle: (count) => `${count} Decision Credits`, oneTime: 'Compra única', benefits: ['Comparar más monturas', 'Continuar la prueba virtual', 'Los créditos no caducan', 'Sin suscripción'],
      continueLabel: (price) => `Continuar por ${price}`, processing: 'Abriendo pago seguro…', regularUse: '¿Necesitas créditos con frecuencia?',
      standardFrom: (price) => `Standard desde ${price}/mes`, viewPlans: 'Ver suscripciones', secureCheckout: 'Pago seguro · Compra única', close: 'Cerrar',
      successTitle: 'Créditos añadidos', successBody: 'Estamos restaurando tu foto y monturas; VisuTry continuará automáticamente cuando estén listas.', successPending: 'Pago completado. El saldo aún se está actualizando; el contexto de comparación se ha restaurado.',
      cancelledTitle: 'Pago no completado', cancelledBody: 'El contexto de comparación se ha restaurado. Puedes continuar cuando quieras.', paymentError: 'No se pudo iniciar el pago. Inténtalo de nuevo.',
    },
  },
  pt: {
    try_on: {
      eyebrow: 'PROVA VIRTUAL', title: 'Continue experimentando', description: 'Adicione créditos e continue de onde parou sem escolher uma assinatura.',
      packTitle: (count) => `${count} Decision Credits`, oneTime: 'Compra única', benefits: ['Continuar a prova virtual', 'Usar em todo o VisuTry', 'Créditos não expiram', 'Sem assinatura'],
      continueLabel: (price) => `Continuar por ${price}`, processing: 'Abrindo pagamento seguro…', regularUse: 'Precisa de créditos regularmente?',
      standardFrom: (price) => `Standard a partir de ${price}/mês`, viewPlans: 'Ver assinaturas', secureCheckout: 'Pagamento seguro · Compra única', close: 'Fechar',
      successTitle: 'Créditos adicionados', successBody: 'Suas seleções anteriores estão sendo restauradas e o VisuTry continuará automaticamente quando estiver pronto.', successPending: 'Pagamento concluído. O saldo ainda está atualizando; suas seleções foram restauradas.',
      cancelledTitle: 'Pagamento não concluído', cancelledBody: 'Suas seleções anteriores foram restauradas. Você pode continuar quando quiser.', paymentError: 'Não foi possível iniciar o pagamento. Tente novamente.',
    },
    frame_compare: {
      eyebrow: 'COMPARAR ARMAÇÕES', title: 'Continue comparando opções', description: 'Adicione créditos para comparar mais armações sem sair do seu fluxo atual.',
      packTitle: (count) => `${count} Decision Credits`, oneTime: 'Compra única', benefits: ['Comparar mais armações', 'Continuar a prova virtual', 'Créditos não expiram', 'Sem assinatura'],
      continueLabel: (price) => `Continuar por ${price}`, processing: 'Abrindo pagamento seguro…', regularUse: 'Precisa de créditos regularmente?',
      standardFrom: (price) => `Standard a partir de ${price}/mês`, viewPlans: 'Ver assinaturas', secureCheckout: 'Pagamento seguro · Compra única', close: 'Fechar',
      successTitle: 'Créditos adicionados', successBody: 'Sua foto e escolhas de armação estão sendo restauradas e o VisuTry continuará automaticamente quando estiver pronto.', successPending: 'Pagamento concluído. O saldo ainda está atualizando; o contexto da comparação foi restaurado.',
      cancelledTitle: 'Pagamento não concluído', cancelledBody: 'O contexto da comparação foi restaurado. Você pode continuar quando quiser.', paymentError: 'Não foi possível iniciar o pagamento. Tente novamente.',
    },
  },
  fr: {
    try_on: {
      eyebrow: 'ESSAYAGE VIRTUEL', title: 'Continuer les essayages', description: 'Ajoutez des crédits et reprenez là où vous vous êtes arrêté, sans abonnement.',
      packTitle: (count) => `${count} Decision Credits`, oneTime: 'Achat unique', benefits: ['Continuer l’essayage virtuel', 'Utiliser dans tout VisuTry', 'Les crédits n’expirent pas', 'Sans abonnement'],
      continueLabel: (price) => `Continuer pour ${price}`, processing: 'Ouverture du paiement sécurisé…', regularUse: 'Besoin de crédits régulièrement ?',
      standardFrom: (price) => `Standard à partir de ${price}/mois`, viewPlans: 'Voir les abonnements', secureCheckout: 'Paiement sécurisé · Achat unique', close: 'Fermer',
      successTitle: 'Crédits ajoutés', successBody: 'Vos choix précédents sont restaurés et VisuTry continuera automatiquement dès que tout sera prêt.', successPending: 'Paiement terminé. Le solde est encore en cours de mise à jour ; vos choix ont été restaurés.',
      cancelledTitle: 'Paiement non terminé', cancelledBody: 'Vos choix précédents ont été restaurés. Vous pouvez continuer quand vous le souhaitez.', paymentError: 'Impossible de lancer le paiement. Veuillez réessayer.',
    },
    frame_compare: {
      eyebrow: 'COMPARER LES MONTURES', title: 'Continuer à comparer', description: 'Ajoutez des crédits pour comparer davantage de montures sans quitter votre parcours de décision.',
      packTitle: (count) => `${count} Decision Credits`, oneTime: 'Achat unique', benefits: ['Comparer plus de montures', 'Continuer l’essayage virtuel', 'Les crédits n’expirent pas', 'Sans abonnement'],
      continueLabel: (price) => `Continuer pour ${price}`, processing: 'Ouverture du paiement sécurisé…', regularUse: 'Besoin de crédits régulièrement ?',
      standardFrom: (price) => `Standard à partir de ${price}/mois`, viewPlans: 'Voir les abonnements', secureCheckout: 'Paiement sécurisé · Achat unique', close: 'Fermer',
      successTitle: 'Crédits ajoutés', successBody: 'Votre photo et vos montures sont restaurées et VisuTry continuera automatiquement dès que tout sera prêt.', successPending: 'Paiement terminé. Le solde est encore en cours de mise à jour ; le contexte de comparaison a été restauré.',
      cancelledTitle: 'Paiement non terminé', cancelledBody: 'Le contexte de comparaison a été restauré. Vous pouvez continuer quand vous le souhaitez.', paymentError: 'Impossible de lancer le paiement. Veuillez réessayer.',
    },
  },
}

const CONTEXT_DB = 'visutry-conversion-context'
const CONTEXT_STORE = 'contexts'
const CONTEXT_VERSION = 1

function delay(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}

function getCreditsBalance(session: ReturnType<typeof useSession>['data']) {
  if (!session?.user) return 0
  return Math.max(0, (session.user.creditsPurchased || 0) - (session.user.creditsUsed || 0))
}

function openContextDb(): Promise<IDBDatabase | null> {
  if (typeof window === 'undefined' || !window.indexedDB) return Promise.resolve(null)

  return new Promise((resolve) => {
    const request = window.indexedDB.open(CONTEXT_DB, CONTEXT_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(CONTEXT_STORE)) {
        db.createObjectStore(CONTEXT_STORE)
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => resolve(null)
  })
}

async function writePersistedContext(key: string, context: PersistedConversionContext) {
  try {
    window.sessionStorage.setItem(
      key,
      JSON.stringify({
        source: context.source,
        pathname: context.pathname,
        createdAt: context.createdAt,
        creditsBalanceBefore: context.creditsBalanceBefore,
        selectedFrameLabels: context.selectedFrameLabels,
      }),
    )
  } catch {
    // Session storage is a best-effort fallback only.
  }

  const db = await openContextDb()
  if (!db) return

  await new Promise<void>((resolve) => {
    const transaction = db.transaction(CONTEXT_STORE, 'readwrite')
    transaction.objectStore(CONTEXT_STORE).put(context, key)
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => resolve()
  })
  db.close()
}

async function readPersistedContext(key: string): Promise<PersistedConversionContext | null> {
  const db = await openContextDb()
  if (db) {
    const value = await new Promise<PersistedConversionContext | null>((resolve) => {
      const transaction = db.transaction(CONTEXT_STORE, 'readonly')
      const request = transaction.objectStore(CONTEXT_STORE).get(key)
      request.onsuccess = () => resolve((request.result as PersistedConversionContext | undefined) || null)
      request.onerror = () => resolve(null)
    })
    db.close()
    if (value) return value
  }

  try {
    const raw = window.sessionStorage.getItem(key)
    if (!raw) return null
    const fallback = JSON.parse(raw) as Omit<PersistedConversionContext, 'uploads'>
    return { ...fallback, uploads: [] }
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
    const transaction = db.transaction(CONTEXT_STORE, 'readwrite')
    transaction.objectStore(CONTEXT_STORE).delete(key)
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => resolve()
  })
  db.close()
}

async function fileFromPreview(input: HTMLInputElement, index: number): Promise<File | null> {
  const preview = input.parentElement?.querySelector<HTMLImageElement>('img')
  if (!preview?.src) return null

  try {
    const response = await fetch(preview.src)
    if (!response.ok && !preview.src.startsWith('blob:') && !preview.src.startsWith('data:')) return null
    const blob = await response.blob()
    const extension = blob.type.includes('png') ? 'png' : blob.type.includes('webp') ? 'webp' : 'jpg'
    const baseName = (input.getAttribute('aria-label') || `upload-${index + 1}`)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
    return new File([blob], `${baseName || `upload-${index + 1}`}.${extension}`, {
      type: blob.type || 'image/jpeg',
      lastModified: Date.now(),
    })
  } catch {
    return null
  }
}

async function captureUploads(container: HTMLElement | null): Promise<PersistedUpload[]> {
  if (!container) return []

  const inputs = Array.from(container.querySelectorAll<HTMLInputElement>('input[type="file"]'))
  const uploads: PersistedUpload[] = []

  for (let index = 0; index < inputs.length; index += 1) {
    const input = inputs[index]
    const file = input.files?.[0] || (await fileFromPreview(input, index))
    if (!file) continue
    uploads.push({
      index,
      ariaLabel: input.getAttribute('aria-label'),
      file,
    })
  }

  return uploads
}

function captureSelectedFrameLabels(container: HTMLElement | null) {
  if (!container) return []
  return Array.from(container.querySelectorAll<HTMLButtonElement>('button.border-blue-500'))
    .map((button) => button.textContent?.trim())
    .filter((label): label is string => Boolean(label))
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
      // A browser may block programmatic FileList restoration. In that case the
      // return path still keeps the user on the correct page with fresh credits.
    }
  }

  return restored
}

function restoreFrameSelection(container: HTMLElement | null, selectedLabels: string[]) {
  if (!container) return

  const presetButtons = Array.from(container.querySelectorAll<HTMLButtonElement>('button'))
    .filter((button) => Boolean(button.querySelector('img[alt$="glasses"]')))
  if (presetButtons.length === 0) return

  const selectedNow = presetButtons.filter((button) => button.classList.contains('border-blue-500'))
  if (selectedNow.length > 0) return

  const desired = selectedLabels.length > 0
    ? presetButtons.filter((button) => selectedLabels.includes(button.textContent?.trim() || ''))
    : presetButtons.slice(0, 4)

  desired.forEach((button) => {
    if (!button.disabled) button.click()
  })
}

async function resumeOriginalAction(container: HTMLElement | null, source: ConversionPaywallSource) {
  if (!container) return false

  for (let attempt = 0; attempt < 24; attempt += 1) {
    const buttons = Array.from(container.querySelectorAll<HTMLButtonElement>('button'))
    const action = source === 'frame_compare'
      ? buttons.find((button) => /^Try\s+\d+\s+Frames?$/i.test(button.textContent?.trim() || '') && !button.disabled)
      : buttons.find((button) => (button.textContent?.trim() || '') === 'Try On' && !button.disabled)

    if (action) {
      action.click()
      return true
    }

    await delay(250)
  }

  return false
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

  const copy = COPY[locale]?.[source] || COPY.en[source]
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
      // Ignore malformed links and allow the browser to handle them normally.
    }
  }, [pricingHref, showPaywall])

  const persistCurrentContext = useCallback(async () => {
    const uploads = await captureUploads(boundaryRef.current)
    const selectedFrameLabels = source === 'frame_compare'
      ? captureSelectedFrameLabels(boundaryRef.current)
      : []

    await writePersistedContext(contextKey, {
      source,
      pathname: window.location.pathname,
      createdAt: Date.now(),
      creditsBalanceBefore: currentCreditsBalance,
      uploads,
      selectedFrameLabels,
    })
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

    try {
      await persistCurrentContext()

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
      await delay(150)

      if (payment === 'cancelled') {
        const restored = await restoreUploads(boundaryRef.current, context?.uploads || [])
        if (source === 'frame_compare') {
          await delay(200)
          restoreFrameSelection(boundaryRef.current, context?.selectedFrameLabels || [])
        }
        analytics.trackCustomEvent('checkout_cancelled', {
          source,
          product_type: 'CREDITS_PACK',
          restored_uploads: restored,
        })
        setReturnState('cancelled')
        setReturnMessage(copy.cancelledBody)
        await clearPersistedContext(contextKey)
        cleanReturnParams()
        return
      }

      analytics.trackCustomEvent('checkout_completed', {
        source,
        product_type: 'CREDITS_PACK',
        checkout_session_id: url.searchParams.get('session_id') || undefined,
        value: PRICE_CONFIG.CREDITS_PACK / 100,
      })

      const creditsBefore = context?.creditsBalanceBefore ?? currentCreditsBalance
      let creditsRefreshed = false

      for (let attempt = 0; attempt < 10; attempt += 1) {
        try {
          const balanceResponse = await fetch('/api/user/balance', { cache: 'no-store' })
          const balancePayload = await balanceResponse.json()
          const creditsAfter = Math.max(
            0,
            (balancePayload.data?.creditsPurchased || 0) - (balancePayload.data?.creditsUsed || 0),
          )
          if (balanceResponse.ok && balancePayload.success && creditsAfter > creditsBefore) {
            creditsRefreshed = true
            break
          }
        } catch {
          // Webhook propagation can be briefly delayed; retry below.
        }
        await delay(700)
      }

      try {
        await update()
      } catch {
        // Keep the user in context even if session refresh is temporarily unavailable.
      }

      await delay(250)
      const restoredUploads = await restoreUploads(boundaryRef.current, context?.uploads || [])
      if (source === 'frame_compare') {
        await delay(250)
        restoreFrameSelection(boundaryRef.current, context?.selectedFrameLabels || [])
      }

      let resumed = false
      if (creditsRefreshed && restoredUploads > 0) {
        resumed = await resumeOriginalAction(boundaryRef.current, source)
      }

      analytics.trackCustomEvent('conversion_context_restored', {
        source,
        product_type: 'CREDITS_PACK',
        credits_refreshed: creditsRefreshed,
        restored_uploads: restoredUploads,
        original_action_resumed: resumed,
      })
      if (resumed) {
        analytics.trackCustomEvent('original_action_resumed', {
          source,
          product_type: 'CREDITS_PACK',
        })
      }

      setReturnState('success')
      setReturnMessage(creditsRefreshed ? copy.successBody : copy.successPending)
      await clearPersistedContext(contextKey)
      cleanReturnParams()
    }

    void restoreReturnContext()
  }, [contextKey, copy.cancelledBody, copy.successBody, copy.successPending, currentCreditsBalance, source, update])

  return (
    <>
      <div ref={boundaryRef} onClickCapture={handleBoundaryClickCapture}>
        {children}
      </div>

      {returnState && returnMessage && (
        <div
          className={`fixed left-4 right-4 top-4 z-[90] mx-auto max-w-xl rounded-xl border px-4 py-3 shadow-lg ${
            returnState === 'success'
              ? 'border-green-200 bg-green-50 text-green-900'
              : 'border-amber-200 bg-amber-50 text-amber-900'
          }`}
          role="status"
          aria-live="polite"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-bold">
                {returnState === 'success' ? copy.successTitle : copy.cancelledTitle}
              </p>
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
