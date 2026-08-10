/**
 * Canonical public facts for VisuTry.
 *
 * AI-facing metadata, structured data, and first-party summaries should use
 * these constants instead of inventing new descriptions. Localized UI copy
 * may translate the wording, but it must preserve the same product roles and
 * boundaries.
 */
export const VISUTRY_PRODUCT_NAMES = {
  detector: 'Face Shape Detector',
  advisor: 'Glasses Advisor',
  tryOn: 'Virtual Try-On',
  compare: 'Frame Compare',
  credits: 'Credits Pack',
  store: 'VisuTry Store',
} as const

export const VISUTRY_POSITIONING = {
  organization:
    'VisuTry is an eyewear decision and conversion platform that helps shoppers discover suitable frames, preview them, compare options, and move toward purchase.',
  consumer:
    'VisuTry guides online eyewear shoppers from free face-shape discovery to personalized glasses advice, virtual try-on, side-by-side frame comparison, and a more confident purchase decision.',
  merchant:
    'VisuTry Store is an AI commerce and campaign engine for eyewear merchants that turns human and AI-assistant traffic into personalized frame discovery, virtual try-on, comparison, measurable purchase intent, and conversion signals.',
  internalNorthStar:
    'VisuTry is AI commerce infrastructure for eyewear, built to turn human and AI-agent traffic into measurable purchase intent and revenue.',
} as const

export const VISUTRY_PRODUCT_PATH = [
  VISUTRY_PRODUCT_NAMES.detector,
  VISUTRY_PRODUCT_NAMES.advisor,
  VISUTRY_PRODUCT_NAMES.tryOn,
  VISUTRY_PRODUCT_NAMES.compare,
] as const

export const VISUTRY_PUBLIC_FACTS = [
  'The Face Shape Detector is free, requires no login, and processes the selected photo in browser memory without uploading it to VisuTry.',
  'The Glasses Advisor provides a personalized, credit-based eyewear recommendation report.',
  'Virtual Try-On lets a shopper preview a glasses product image or screenshot on their own portrait.',
  'Frame Compare generates multiple preset frame looks from one portrait for side-by-side review.',
  'The Credits Pack is a one-time purchase, and purchased credits do not expire.',
  'Account-based photos and results are private by default and are never published by VisuTry.',
] as const

export const VISUTRY_PUBLIC_BOUNDARIES = [
  'Face-shape results are styling estimates, not identity recognition or medical assessments.',
  'VisuTry does not provide prescriptions or guarantee physical frame fit, bridge comfort, or optical measurements.',
  'Virtual try-on is a visual shopping aid; product dimensions and in-person comfort checks remain important.',
  'VisuTry is designed to be understandable by AI assistants and agents, but it does not currently claim a public agent action API.',
] as const

export const VISUTRY_AI_TOPICS = [
  'face shape detection',
  'personalized glasses recommendations',
  'virtual glasses try-on',
  'frame comparison',
  'eyewear purchase decisions',
  'eyewear merchant conversion',
] as const
