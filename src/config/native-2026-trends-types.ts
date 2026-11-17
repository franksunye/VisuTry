/**
 * Strict editorial parity with the long-form EN 16-style article.
 * Four groups, six style intents, 16 illustrated cards, six steps, six
 * fit limitations and four FAQs are required for every published locale.
 */
export type NativeTrendsText = {
  title: string
  description: string
  category: string
  readTime: string
  lead: string
  overview: string
  groupTitles: readonly string[]
  groupIntros: readonly string[]
  intentTitle: string
  intentIntro: string
  intents: readonly string[]
  stepsTitle: string
  steps: readonly string[]
  limitsTitle: string
  limits: readonly string[]
  whyTitle: string
  why: string
  faq: readonly [question: string, answer: string][]
  labels: {
    optical: string
    sunglasses: string
    bestFor: string
    intensity: string
    intentPick: string
    direction: string
    sources: string
    styles: string
    detector: string
    compare: string
    ctaTitle: string
    ctaBody: string
    tags: readonly string[]
  }
}
