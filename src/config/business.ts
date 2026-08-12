import type { Locale } from '@/i18n'
import { localizedBusinessCopy } from '@/config/business-locales'

export type BusinessPageCopy = {
  metaTitle: string
  metaDescription: string
  schemaName: string
  microline: string
  eyebrow: string
  title: string
  description: string
  primaryCta: string
  secondaryCta: string
  visuals: {
    hero: { alt: string; label: string; description: string }
    distribution: { alt: string; label: string; description: string }
    intelligence: { alt: string; description: string }
  }
  shopperJourney: {
    eyebrow: string
    title: string
    description: string
    steps: Array<{ label: string; description: string }>
  }
  experienceTypes: {
    eyebrow: string
    title: string
    description: string
    storeTitle: string
    storeDescription: string
    storeCta: string
    campaignTitle: string
    campaignDescription: string
    campaignCta: string
  }
  distribution: {
    eyebrow: string
    title: string
    description: string
    surfaces: Array<{ label: string; description: string }>
  }
  intelligence: {
    eyebrow: string
    title: string
    description: string
    signals: string[]
    signalNote: string
    signalSrPrefix: string
  }
  proof: {
    eyebrow: string
    title: string
    description: string
    liveLabel: string
    liveDescription: string
    liveCta: string
    referenceLabel: string
    referenceDescription: string
    referenceCta: string
    disclosure: string
  }
  deployment: {
    eyebrow: string
    title: string
    description: string
    steps: Array<{ label: string; description: string }>
    note: string
  }
  closing: {
    eyebrow: string
    title: string
    description: string
    cta: string
  }
}

const baseCopy: Omit<BusinessPageCopy, 'metaTitle' | 'metaDescription'> = {
  schemaName: 'VisuTry for Brands & Retailers',
  microline: 'For brands & retailers · Catalog → Experience → Intent → Intelligence',
  eyebrow: 'For eyewear brands & retailers',
  title: 'Turn your eyewear catalog into an AI shopping experience.',
  description: 'Guide shoppers from discovery to a confident frame decision — while your team sees the intent forming across every Store and Campaign.',
  primaryCta: 'See a live experience',
  secondaryCta: 'Talk to VisuTry',
  visuals: {
    hero: {
      alt: 'Shopper moving from a frame catalog into a guided eyewear experience',
      label: 'Shopper Experience visual',
      description: 'The existing production Store visual is used here as market-facing proof.',
    },
    distribution: {
      alt: 'Guided shopper experience with frame recommendation and comparison steps',
      label: 'Distribution visual',
      description: 'The existing production shopper visual is used as proof of the shared runtime.',
    },
    intelligence: {
      alt: 'Static merchant intelligence dashboard proof showing shopper signals and experience activity',
      description: 'Static Admin intelligence proof. Detailed merchant surfaces remain protected behind authentication.',
    },
  },
  shopperJourney: {
    eyebrow: 'The shopper journey',
    title: 'A clearer path from first impression to shortlist.',
    description: 'VisuTry brings the existing decision steps into one guided experience. Try-On is one capability inside the journey, not the whole product story.',
    steps: [
      { label: 'Discover', description: 'Start with a fit, style, activity, or occasion.' },
      { label: 'Recommendation', description: 'Narrow the catalog to frames worth considering.' },
      { label: 'Try-On', description: 'Preview selected frames on the shopper’s photo.' },
      { label: 'Compare', description: 'Review a shortlist side by side.' },
      { label: 'Decide', description: 'Favorite a frame or continue to the merchant product destination.' },
    ],
  },
  experienceTypes: {
    eyebrow: 'One catalog, multiple journeys',
    title: 'Store for continuity. Campaign for focus.',
    description: 'Both delivery modes use the same merchant catalog and shared shopper runtime.',
    storeTitle: 'Store',
    storeDescription: 'An evergreen, broader catalog experience for shoppers who want to explore the merchant collection.',
    storeCta: 'See the Store product',
    campaignTitle: 'Campaign',
    campaignDescription: 'A focused edit around a collection, fit, style, activity, or launch moment.',
    campaignCta: 'Explore Campaigns',
  },
  distribution: {
    eyebrow: 'Owned distribution',
    title: 'Meet shoppers at the decision they are already making.',
    description: 'VisuTry routes relevant intent from owned discovery surfaces into the right Merchant Experience without promising unverified traffic volume.',
    surfaces: [
      { label: 'Discover', description: 'Editorial, intent-led edits across fit, style, and occasion.' },
      { label: 'Face Analysis', description: 'Continue from a fit result into a focused frame direction.' },
      { label: 'Compare', description: 'Move from side-by-side review into more frame directions.' },
      { label: 'Style Explorer', description: 'Continue a style direction into a point-of-view edit.' },
    ],
  },
  intelligence: {
    eyebrow: 'Merchant intelligence',
    title: 'See what shoppers are trying to decide.',
    description: 'The current Admin surfaces focus on observable shopper behavior and Experience performance — not unsupported outcome claims.',
    signals: [
      'Sessions and engagement',
      'Try-On and Compare activity',
      'Favorites and product clicks',
      'Experience-level performance',
      'Source and surface attribution',
      'Shopper intent signals',
    ],
    signalNote: 'Observable shopper signal',
    signalSrPrefix: 'Signal',
  },
  proof: {
    eyebrow: 'Proof without overclaiming',
    title: 'See the product in real and reference contexts.',
    description: 'Use the current shopper runtime as the proof point. Live merchant surfaces and Reference demonstrations are labeled separately.',
    liveLabel: 'Live Merchant Experience',
    liveDescription: 'Explore Luna Optical’s live hosted Store and the shopper journey it supports.',
    liveCta: 'Open Live Store',
    referenceLabel: 'Reference Experiences',
    referenceDescription: 'Review focused Campaign demonstrations built from publicly available catalog information.',
    referenceCta: 'Open Reference Campaign',
    disclosure: 'Reference Experiences are VisuTry product demonstrations built from publicly available catalog information and do not imply a customer or partner relationship.',
  },
  deployment: {
    eyebrow: 'A practical launch path',
    title: 'Start with the catalog you already have.',
    description: 'VisuTry adds a guided shopping layer around your catalog. It does not replace your ecommerce platform or claim a checkout it does not own.',
    steps: [
      { label: 'Catalog import', description: 'Bring a reviewed selection of active frames.' },
      { label: 'Brand setup', description: 'Set the merchant identity, provenance, and shopper-safe details.' },
      { label: 'Experience configuration', description: 'Shape a Store or focused Campaign from the shared catalog.' },
      { label: 'Launch', description: 'Share a hosted route through your existing channels.' },
      { label: 'Measure', description: 'Review intent and Experience-level signals in Admin.' },
    ],
    note: 'No ecommerce platform replacement required for the hosted Store path.',
  },
  closing: {
    eyebrow: 'Ready to make the catalog easier to choose from?',
    title: 'Start with a focused pilot.',
    description: 'Bring a small collection, a clear shopper question, and the next decision you want to improve.',
    cta: 'Talk to VisuTry',
  },
}

const localizedMeta: Record<Locale, Pick<BusinessPageCopy, 'metaTitle' | 'metaDescription'>> = {
  en: {
    metaTitle: 'AI Eyewear Shopping Experiences for Brands | VisuTry',
    metaDescription: 'Turn an eyewear catalog into guided shopping experiences for discovery, recommendation, try-on, comparison, and measurable shopper intent.',
  },
  id: {
    metaTitle: 'Pengalaman Belanja Kacamata Berbasis AI untuk Merek | VisuTry',
    metaDescription: 'Ubah katalog kacamata menjadi pengalaman belanja terpandu dengan sinyal niat pembeli yang terukur.',
  },
  ar: {
    metaTitle: 'تجارب تسوق ذكية للنظارات للعلامات التجارية | VisuTry',
    metaDescription: 'حوّل كتالوج النظارات إلى تجارب تسوق موجّهة مع إشارات نية قابلة للقياس.',
  },
  ru: {
    metaTitle: 'AI-покупки очков для брендов и ритейлеров | VisuTry',
    metaDescription: 'Превратите каталог очков в понятный путь выбора с измеримым интересом покупателей.',
  },
  de: {
    metaTitle: 'KI-Einkaufserlebnisse für Brillenmarken | VisuTry',
    metaDescription: 'Verwandeln Sie Ihren Brillenkatalog in geführte Einkaufserlebnisse mit messbaren Kaufsignalen.',
  },
  ja: {
    metaTitle: 'ブランド向け AI アイウェアショッピング体験 | VisuTry',
    metaDescription: 'メガネのカタログを、発見・試着・比較・意思決定まで導く体験に変えます。',
  },
  es: {
    metaTitle: 'Experiencias de compra de gafas con IA para marcas | VisuTry',
    metaDescription: 'Convierte tu catálogo de gafas en experiencias guiadas con señales medibles de intención.',
  },
  pt: {
    metaTitle: 'Experiências de compra de óculos com IA para marcas | VisuTry',
    metaDescription: 'Transforme seu catálogo de óculos em jornadas guiadas com sinais mensuráveis de intenção.',
  },
  fr: {
    metaTitle: 'Expériences d’achat de lunettes par IA pour les marques | VisuTry',
    metaDescription: 'Transformez votre catalogue de lunettes en parcours guidés avec des signaux d’intention mesurables.',
  },
}

export function getBusinessCopy(locale: string): BusinessPageCopy {
  const validLocale = (locale in localizedMeta ? locale : 'en') as Locale
  const metadata = localizedMeta[validLocale]
  const body = validLocale === 'en'
    ? baseCopy
    : localizedBusinessCopy[validLocale as Exclude<Locale, 'en'>]
  return { ...body, ...metadata }
}
