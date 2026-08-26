export const MERCHANT_CLASSIFICATIONS = [
  'REAL',
  'POSSIBLE_EXTERNAL',
  'INTERNAL',
  'TEST',
  'AUTOMATION',
  'REFERENCE',
  'SUSPICIOUS',
  'UNKNOWN',
] as const

export type MerchantClassification = (typeof MERCHANT_CLASSIFICATIONS)[number]

export const MERCHANT_PORTFOLIO_FILTERS = [
  'COMMERCIAL',
  'POSSIBLE_EXTERNAL',
  'ALL',
  'INTERNAL_TEST',
  'REFERENCE',
  'SUSPICIOUS',
  'UNKNOWN',
] as const

export type MerchantPortfolioFilter = (typeof MERCHANT_PORTFOLIO_FILTERS)[number]

export const MERCHANT_CLASSIFICATION_LABELS: Record<MerchantClassification, string> = {
  REAL: 'Commercial',
  POSSIBLE_EXTERNAL: 'Possible external',
  INTERNAL: 'Internal',
  TEST: 'Test',
  AUTOMATION: 'Automation',
  REFERENCE: 'Reference',
  SUSPICIOUS: 'Suspicious',
  UNKNOWN: 'Unknown',
}

export const MERCHANT_PORTFOLIO_FILTER_LABELS: Record<MerchantPortfolioFilter, string> = {
  COMMERCIAL: 'Commercial',
  POSSIBLE_EXTERNAL: 'Possible external',
  ALL: 'All',
  INTERNAL_TEST: 'Internal / test',
  REFERENCE: 'Reference',
  SUSPICIOUS: 'Suspicious',
  UNKNOWN: 'Unknown',
}

export const PUBLIC_SELF_SERVICE_MERCHANT_CLASSIFICATION: MerchantClassification = 'POSSIBLE_EXTERNAL'
export const PUBLIC_SELF_SERVICE_MERCHANT_CLASSIFICATION_SOURCE = 'SELF_SERVICE_SIGNUP'
export const PUBLIC_SELF_SERVICE_MERCHANT_CLASSIFICATION_REASON =
  'Created through authenticated self-service signup; commercial activation is not yet verified.'

export const AUTOMATED_TEST_MERCHANT_CLASSIFICATION: MerchantClassification = 'AUTOMATION'
export const AUTOMATED_TEST_MERCHANT_CLASSIFICATION_SOURCE = 'AUTOMATED_TEST'

export type MerchantClassificationCarrier = {
  classification?: string | null
}

export function isMerchantClassification(value: unknown): value is MerchantClassification {
  return typeof value === 'string' && (MERCHANT_CLASSIFICATIONS as readonly string[]).includes(value)
}

export function normalizeMerchantClassification(value: unknown): MerchantClassification {
  return isMerchantClassification(value) ? value : 'UNKNOWN'
}

/** REAL is the only class admitted to commercial KPIs. Classification never grants access. */
export function isCommercialMerchant(
  merchant: MerchantClassificationCarrier | MerchantClassification | string | null | undefined,
): boolean {
  const value = typeof merchant === 'string' || merchant == null ? merchant : merchant.classification
  return value === 'REAL'
}

export function merchantMatchesPortfolioFilter(
  merchant: MerchantClassificationCarrier,
  filter: MerchantPortfolioFilter,
): boolean {
  const classification = normalizeMerchantClassification(merchant.classification)
  switch (filter) {
    case 'COMMERCIAL':
      return isCommercialMerchant(classification)
    case 'POSSIBLE_EXTERNAL':
      return classification === 'POSSIBLE_EXTERNAL'
    case 'INTERNAL_TEST':
      return classification === 'INTERNAL' || classification === 'TEST' || classification === 'AUTOMATION'
    case 'REFERENCE':
      return classification === 'REFERENCE'
    case 'SUSPICIOUS':
      return classification === 'SUSPICIOUS'
    case 'UNKNOWN':
      return classification === 'UNKNOWN'
    case 'ALL':
      return true
  }
}

export function isMerchantPortfolioFilter(value: unknown): value is MerchantPortfolioFilter {
  return typeof value === 'string' && (MERCHANT_PORTFOLIO_FILTERS as readonly string[]).includes(value)
}

export function filterMerchantPortfolioRows<T extends MerchantClassificationCarrier>(
  rows: readonly T[],
  filter: MerchantPortfolioFilter = 'COMMERCIAL',
): T[] {
  return rows.filter((row) => merchantMatchesPortfolioFilter(row, filter))
}

export type MerchantPortfolioAggregateRow = MerchantClassificationCarrier & {
  status: string
  _count: {
    experiences: number
    frames: number
    sessions: number
    intents: number
  }
}

export type MerchantPortfolioSummary = {
  active: number
  experiences: number
  frames: number
  sessions: number
  intents: number
}

/** Aggregates relations reached through Merchant rows; it never infers ownership from names or PII. */
export function summarizeMerchantPortfolio(
  rows: readonly MerchantPortfolioAggregateRow[],
  filter: MerchantPortfolioFilter = 'COMMERCIAL',
): MerchantPortfolioSummary {
  return filterMerchantPortfolioRows(rows, filter).reduce(
    (totals, merchant) => ({
      active: totals.active + (merchant.status === 'ACTIVE' ? 1 : 0),
      experiences: totals.experiences + merchant._count.experiences,
      frames: totals.frames + merchant._count.frames,
      sessions: totals.sessions + merchant._count.sessions,
      intents: totals.intents + merchant._count.intents,
    }),
    { active: 0, experiences: 0, frames: 0, sessions: 0, intents: 0 },
  )
}

export function classificationForPilotConfig(input: {
  pilotType?: string | null
  referenceData?: boolean | null
}): MerchantClassification {
  const pilotType = input.pilotType?.toUpperCase()
  if (input.referenceData || pilotType === 'REFERENCE') return 'REFERENCE'
  if (pilotType === 'DEMO' || pilotType === 'INTERNAL') return 'INTERNAL'
  // A generic LIVE package is not proof of a paying or verified merchant.
  if (pilotType === 'LIVE') return 'POSSIBLE_EXTERNAL'
  return 'UNKNOWN'
}
