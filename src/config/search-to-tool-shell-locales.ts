import { defaultLocale, isValidLocale, type Locale } from '@/i18n'

export type SearchToToolShellCopy = {
  commonQuestions: string
  nextStep: string
  detector: string
  tryOn: string
  compare: string
  advisor: string
}

const copies: Record<Locale, SearchToToolShellCopy> = {
  en: {
    commonQuestions: 'Common questions',
    nextStep: 'Next step',
    detector: 'Detect my face shape',
    tryOn: 'Open virtual try-on',
    compare: 'Compare frames',
    advisor: 'Get glasses advice',
  },
  id: {
    commonQuestions: 'Pertanyaan umum',
    nextStep: 'Langkah berikutnya',
    detector: 'Deteksi bentuk wajah saya',
    tryOn: 'Buka coba virtual',
    compare: 'Bandingkan frame',
    advisor: 'Dapatkan saran kacamata',
  },
  ar: {
    commonQuestions: 'أسئلة شائعة',
    nextStep: 'الخطوة التالية',
    detector: 'اكتشف شكل وجهي',
    tryOn: 'افتح التجربة الافتراضية',
    compare: 'قارن الإطارات',
    advisor: 'احصل على نصيحة للنظارات',
  },
  ru: {
    commonQuestions: 'Частые вопросы',
    nextStep: 'Следующий шаг',
    detector: 'Определить форму лица',
    tryOn: 'Открыть виртуальную примерку',
    compare: 'Сравнить оправы',
    advisor: 'Получить совет по очкам',
  },
  de: {
    commonQuestions: 'Häufige Fragen',
    nextStep: 'Nächster Schritt',
    detector: 'Gesichtsform erkennen',
    tryOn: 'Virtuelle Anprobe öffnen',
    compare: 'Brillen vergleichen',
    advisor: 'Brillenberatung erhalten',
  },
  ja: {
    commonQuestions: 'よくある質問',
    nextStep: '次のステップ',
    detector: '顔型を診断する',
    tryOn: 'バーチャル試着を開く',
    compare: 'フレームを比較する',
    advisor: 'メガネ提案を見る',
  },
  es: {
    commonQuestions: 'Preguntas frecuentes',
    nextStep: 'Siguiente paso',
    detector: 'Detectar la forma de mi cara',
    tryOn: 'Abrir prueba virtual',
    compare: 'Comparar monturas',
    advisor: 'Obtener consejo sobre gafas',
  },
  pt: {
    commonQuestions: 'Perguntas frequentes',
    nextStep: 'Próximo passo',
    detector: 'Detectar o formato do meu rosto',
    tryOn: 'Abrir prova virtual',
    compare: 'Comparar armações',
    advisor: 'Receber recomendação de óculos',
  },
  fr: {
    commonQuestions: 'Questions fréquentes',
    nextStep: 'Étape suivante',
    detector: 'Détecter la forme de mon visage',
    tryOn: 'Ouvrir l’essayage virtuel',
    compare: 'Comparer les montures',
    advisor: 'Obtenir des conseils lunettes',
  },
}

export function getSearchToToolShellCopy(locale: string): SearchToToolShellCopy {
  const resolved = isValidLocale(locale) ? locale : defaultLocale
  return copies[resolved]
}
