import type { Locale } from '@/i18n'

export const DISCOVER_FEATURED_EXPERIENCES = [
  {
    merchantSlug: 'ello-sunglasses',
    experienceSlug: 'petite-fit',
    intentLabel: 'Petite / smaller-face fit',
  },
  {
    merchantSlug: 'article-one',
    experienceSlug: 'find-your-fit',
    intentLabel: 'Find your fit',
  },
  {
    merchantSlug: 'article-one',
    experienceSlug: 'active-eyewear',
    intentLabel: 'Active eyewear',
  },
  {
    merchantSlug: 'akila',
    experienceSlug: 'statement-frames',
    intentLabel: 'Statement eyewear',
  },
  {
    merchantSlug: 'lowercase-nyc',
    experienceSlug: 'sunglasses-edit',
    intentLabel: 'Sunglasses',
  },
  {
    merchantSlug: 'framed-ewe',
    experienceSlug: 'find-your-frames',
    intentLabel: 'Multi-brand discovery',
  },
] as const

export const DISCOVER_MERCHANT_SLUGS = [
  'ello-sunglasses',
  'lowercase-nyc',
  'akila',
  'article-one',
  'framed-ewe',
] as const

export type DiscoverPageCopy = {
  metaTitle: string
  metaDescription: string
  eyebrow: string
  title: string
  description: string
  featuredTitle: string
  featuredDescription: string
  merchantsTitle: string
  merchantsDescription: string
  referenceDisclosure: string
  referenceLabel: string
  liveLabel: string
  exploreEdit: string
  openStore: string
  frames: string
}

const baseCopy: Omit<DiscoverPageCopy, 'metaTitle' | 'metaDescription'> = {
  eyebrow: 'VisuTry Discover',
  title: 'Find eyewear experiences for your fit, style, and occasion.',
  description: 'Start with the choice you are making, then move into a focused collection where you can explore, compare, and try frames on.',
  featuredTitle: 'Start with the choice you are making',
  featuredDescription: 'Curated edits for the moments when a broad catalog is less useful than a clear direction.',
  merchantsTitle: 'Explore Brands & Retailers',
  merchantsDescription: 'Browse each hosted Store when you already know whose collection you want to explore.',
  referenceDisclosure: 'Reference Experiences are product demonstrations built from publicly available catalog information. They do not imply a customer or partner relationship.',
  referenceLabel: 'Reference Experience',
  liveLabel: 'Live Merchant',
  exploreEdit: 'Explore this edit',
  openStore: 'Open hosted Store',
  frames: 'frames',
}

const localizedMeta: Record<Locale, Pick<DiscoverPageCopy, 'metaTitle' | 'metaDescription'>> = {
  en: {
    metaTitle: 'Discover Eyewear for Your Fit, Style & Occasion | VisuTry',
    metaDescription: 'Explore focused eyewear experiences for fit, style, activity, and occasion, then continue into a real Store or Campaign journey.',
  },
  id: {
    metaTitle: 'Temukan Kacamata untuk Bentuk, Gaya, dan Acara Anda | VisuTry',
    metaDescription: 'Jelajahi pengalaman kacamata terkurasi untuk ukuran, gaya, aktivitas, dan acara Anda.',
  },
  ar: {
    metaTitle: 'اكتشف النظارات المناسبة لملاءمتك وأسلوبك ومناسبتك | VisuTry',
    metaDescription: 'استكشف تجارب نظارات منسقة للملاءمة والأسلوب والنشاط والمناسبة.',
  },
  ru: {
    metaTitle: 'Найдите очки для вашей посадки, стиля и повода | VisuTry',
    metaDescription: 'Изучайте подборки очков для посадки, стиля, активности и разных случаев.',
  },
  de: {
    metaTitle: 'Brillen für Passform, Stil und Anlass entdecken | VisuTry',
    metaDescription: 'Entdecke kuratierte Brillenerlebnisse für Passform, Stil, Aktivität und Anlass.',
  },
  ja: {
    metaTitle: '顔立ち・スタイル・シーンに合うメガネを探す | VisuTry',
    metaDescription: 'フィット、スタイル、アクティビティ、シーン別のメガネ体験を見つけましょう。',
  },
  es: {
    metaTitle: 'Descubre gafas para tu ajuste, estilo y ocasión | VisuTry',
    metaDescription: 'Explora experiencias de gafas seleccionadas para tu ajuste, estilo, actividad y ocasión.',
  },
  pt: {
    metaTitle: 'Descubra óculos para o seu ajuste, estilo e ocasião | VisuTry',
    metaDescription: 'Explore experiências de óculos selecionadas para ajuste, estilo, atividade e ocasião.',
  },
  fr: {
    metaTitle: 'Trouvez des lunettes adaptées à votre style et à chaque occasion | VisuTry',
    metaDescription: 'Explorez des expériences de lunettes sélectionnées pour la forme, le style et l’occasion.',
  },
}

export function getDiscoverCopy(locale: string): DiscoverPageCopy {
  const metadata = localizedMeta[locale as Locale] ?? localizedMeta.en
  return { ...baseCopy, ...metadata }
}
