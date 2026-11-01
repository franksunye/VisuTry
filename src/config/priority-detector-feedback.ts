const english = {
  photoTipTitle: 'For the clearest result',
  unsupportedFile: 'Choose a JPG, PNG, or WebP image.',
  oversizedFile: 'Choose an image smaller than 10 MB.',
}

const localized = {
  ja: {
    photoTipTitle: '顔型を判定しやすい写真のポイント',
    unsupportedFile: 'JPG・PNG・WebP形式の画像を選んでください。',
    oversizedFile: '10MB未満の画像を選んでください。',
  },
  es: {
    photoTipTitle: 'Consejos para obtener un resultado más claro',
    unsupportedFile: 'Elige una imagen JPG, PNG o WebP.',
    oversizedFile: 'Elige una imagen de menos de 10 MB.',
  },
} as const

/** UI-only translation: the canonical analytics failure reason remains stable English. */
export function getPriorityDetectorFeedback(locale: string) {
  if (locale === 'ja' || locale === 'es') return localized[locale]
  return english
}
