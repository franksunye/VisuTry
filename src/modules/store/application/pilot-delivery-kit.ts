import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { assertMaxCompareFrames, type MaxCompareFrames } from '../domain/experience-policy'

export type PilotMerchantConfig = {
  merchantSlug: string
  displayName: string
  pilotType: 'REFERENCE' | 'DEMO' | 'LIVE'
  referenceData: boolean
  catalogMode: 'CURATED' | 'FULL'
  defaultLocale: string
  theme: {
    logoUrl: string | null
    brandName: string
    accentToken: string
  }
  measurement: {
    referenceTraffic: boolean
    defaultSource: string
    defaultCampaign: string
  }
  experience: {
    tryOnEnabled: boolean
    compareEnabled: boolean
    maxCompareFrames: MaxCompareFrames
  }
  commerce: {
    inquiryEnabled: boolean
  }
  websiteUrl?: string | null
}

export type PilotCatalogRow = {
  externalId: string
  sku: string
  name: string
  brand: string
  productUrl: string
  imageUrl: string
  productType: string
  status: 'ACTIVE' | 'INACTIVE' | 'DRAFT'
  variant: string | null
  color: string | null
  price: number | null
  currency: string | null
  shape: string
  material: string | null
  lensWidthMm: number | null
  bridgeWidthMm: number | null
  templeLengthMm: number | null
  frameWidthMm: number | null
  widthClass: string | null
  styleTags: string[]
  collectionTags: string[]
  sourceNotes: string | null
}

const REQUIRED_COLUMNS = [
  'external_id',
  'name',
  'brand',
  'product_url',
  'image_url',
  'product_type',
  'status',
]

const ACCENT_TOKENS: Record<string, string> = {
  neutral: '#1F4B5A',
  slate: '#334155',
  sky: '#1D4ED8',
  sand: '#6B4F3A',
  rose: '#9F1239',
}

export type ExistingPilotFrame = {
  sku: string | null
  source: string
}

function clean(value: string | undefined): string {
  return (value ?? '').trim()
}

function optionalString(value: string | undefined): string | null {
  const result = clean(value)
  return result || null
}

function optionalInteger(value: string | undefined, field: string, rowNumber: number): number | null {
  const result = clean(value)
  if (!result) return null
  if (!/^\d+$/.test(result)) {
    throw new Error(`Catalog row ${rowNumber}: ${field} must be a non-negative integer`)
  }
  return Number(result)
}

function optionalPrice(value: string | undefined, currency: string | null, rowNumber: number): number | null {
  const result = clean(value)
  if (!result) return null
  const amount = Number(result)
  if (!Number.isFinite(amount) || amount < 0) {
    throw new Error(`Catalog row ${rowNumber}: price must be a non-negative number`)
  }
  if (!currency) {
    throw new Error(`Catalog row ${rowNumber}: currency is required when price is present`)
  }
  return Math.round(amount * 100)
}

function listValue(value: string | undefined): string[] {
  return clean(value)
    .split('|')
    .map((item) => item.trim())
    .filter(Boolean)
}

/** Small RFC 4180-compatible parser for the assisted pilot CSV contract. */
export function parsePilotCsv(csv: string): Record<string, string>[] {
  const rows: string[][] = []
  let row: string[] = []
  let cell = ''
  let quoted = false

  for (let index = 0; index < csv.length; index += 1) {
    const char = csv[index]
    const next = csv[index + 1]
    if (quoted) {
      if (char === '"' && next === '"') {
        cell += '"'
        index += 1
      } else if (char === '"') {
        quoted = false
      } else {
        cell += char
      }
    } else if (char === '"') {
      quoted = true
    } else if (char === ',') {
      row.push(cell)
      cell = ''
    } else if (char === '\n') {
      row.push(cell.replace(/\r$/, ''))
      rows.push(row)
      row = []
      cell = ''
    } else {
      cell += char
    }
  }
  if (quoted) throw new Error('Catalog CSV contains an unterminated quoted field')
  if (cell.length > 0 || row.length > 0) {
    row.push(cell)
    rows.push(row)
  }

  const header = rows.shift()?.map((value) => value.trim()) ?? []
  if (header.length === 0) throw new Error('Catalog CSV is empty')
  const duplicates = header.filter((name, index) => header.indexOf(name) !== index)
  if (duplicates.length > 0) throw new Error(`Catalog CSV has duplicate columns: ${duplicates.join(', ')}`)
  for (const column of REQUIRED_COLUMNS) {
    if (!header.includes(column)) throw new Error(`Catalog CSV is missing required column: ${column}`)
  }

  return rows.filter((values) => values.some((value) => value.trim().length > 0)).map((values, index) => {
    if (values.length !== header.length) {
      throw new Error(`Catalog row ${index + 2}: column count does not match header`)
    }
    return Object.fromEntries(header.map((name, columnIndex) => [name, values[columnIndex]]))
  })
}

export function assertPilotCatalogSourceOwnership(
  existingFrames: ExistingPilotFrame[],
  incomingSkus: Iterable<string>,
): void {
  const incomingSkuSet = new Set(incomingSkus)
  const conflicts = existingFrames
    .filter((frame) => frame.sku && incomingSkuSet.has(frame.sku) && frame.source !== 'CSV')
    .map((frame) => `${frame.sku} (${frame.source})`)
    .sort()

  if (conflicts.length > 0) {
    throw new Error(
      `Pilot catalog import would overwrite non-CSV frame(s): ${conflicts.join(', ')}. Resolve source ownership before importing.`,
    )
  }
}

export function validatePilotConfig(config: PilotMerchantConfig): void {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(config.merchantSlug)) {
    throw new Error('merchantSlug must be URL-safe kebab-case')
  }
  if (!config.displayName.trim()) throw new Error('displayName is required')
  if (config.pilotType === 'REFERENCE' && !config.referenceData) {
    throw new Error('REFERENCE pilots must set referenceData=true')
  }
  if (config.referenceData && !config.measurement.referenceTraffic) {
    throw new Error('referenceData requires measurement.referenceTraffic=true')
  }
  if (!ACCENT_TOKENS[config.theme.accentToken]) {
    throw new Error(`Unsupported accentToken: ${config.theme.accentToken}`)
  }
  if (!config.experience || typeof config.experience.tryOnEnabled !== 'boolean' || typeof config.experience.compareEnabled !== 'boolean') {
    throw new Error('experience.tryOnEnabled and experience.compareEnabled must be booleans')
  }
  try {
    assertMaxCompareFrames(config.experience.maxCompareFrames)
  } catch {
    throw new Error('experience.maxCompareFrames must be 2, 3, or 4')
  }
  if (!config.commerce || typeof config.commerce.inquiryEnabled !== 'boolean') {
    throw new Error('commerce.inquiryEnabled must be a boolean')
  }
}

export function normalizePilotCatalog(records: Record<string, string>[]): PilotCatalogRow[] {
  const seenExternalIds = new Set<string>()
  const seenSkus = new Set<string>()

  return records.map((record, index) => {
    const rowNumber = index + 2
    const externalId = clean(record.external_id)
    const sku = clean(record.sku) || externalId
    const name = clean(record.name)
    const productUrl = clean(record.product_url)
    const imageUrl = clean(record.image_url)
    const currency = optionalString(record.currency)?.toLowerCase() ?? null
    const status = clean(record.status).toUpperCase() as PilotCatalogRow['status']
    if (!externalId || !name || !sku) throw new Error(`Catalog row ${rowNumber}: external_id, sku, and name are required`)
    if (seenExternalIds.has(externalId)) throw new Error(`Catalog row ${rowNumber}: duplicate external_id ${externalId}`)
    if (seenSkus.has(sku)) throw new Error(`Catalog row ${rowNumber}: duplicate sku ${sku}`)
    if (!/^https?:\/\//.test(productUrl)) throw new Error(`Catalog row ${rowNumber}: product_url must be http(s)`)
    if (!/^https?:\/\//.test(imageUrl)) throw new Error(`Catalog row ${rowNumber}: image_url must be http(s)`)
    if (!['ACTIVE', 'INACTIVE', 'DRAFT'].includes(status)) throw new Error(`Catalog row ${rowNumber}: unsupported status ${status}`)
    seenExternalIds.add(externalId)
    seenSkus.add(sku)

    return {
      externalId,
      sku,
      name,
      brand: clean(record.brand),
      productUrl,
      imageUrl,
      productType: clean(record.product_type),
      status,
      variant: optionalString(record.variant),
      color: optionalString(record.color),
      price: optionalPrice(record.price, currency, rowNumber),
      currency,
      shape: clean(record.shape) || 'unknown',
      material: optionalString(record.material),
      lensWidthMm: optionalInteger(record.lens_width_mm, 'lens_width_mm', rowNumber),
      bridgeWidthMm: optionalInteger(record.bridge_width_mm, 'bridge_width_mm', rowNumber),
      templeLengthMm: optionalInteger(record.temple_length_mm, 'temple_length_mm', rowNumber),
      frameWidthMm: optionalInteger(record.frame_width_mm, 'frame_width_mm', rowNumber),
      widthClass: optionalString(record.width_class),
      styleTags: listValue(record.style_tags),
      collectionTags: listValue(record.collection_tags),
      sourceNotes: optionalString(record.source_notes),
    }
  })
}

export function accentColorForToken(token: string): string {
  const color = ACCENT_TOKENS[token]
  if (!color) throw new Error(`Unsupported accentToken: ${token}`)
  return color
}

export function experiencePolicyForPilotConfig(config: PilotMerchantConfig) {
  return {
    tryOnEnabled: config.experience.tryOnEnabled,
    compareEnabled: config.experience.compareEnabled,
    maxCompareFrames: config.experience.maxCompareFrames,
    inquiryEnabled: config.commerce.inquiryEnabled,
  }
}

export async function readPilotPackage(packageDir: string): Promise<{
  config: PilotMerchantConfig
  catalog: PilotCatalogRow[]
}> {
  const config = JSON.parse(await readFile(join(packageDir, 'merchant.json'), 'utf8')) as PilotMerchantConfig
  validatePilotConfig(config)
  const csv = await readFile(join(packageDir, 'catalog.csv'), 'utf8')
  const catalog = normalizePilotCatalog(parsePilotCsv(csv))
  if (catalog.length < 8 || catalog.length > 50) {
    throw new Error(`Catalog must contain 8–50 rows; received ${catalog.length}`)
  }
  return { config, catalog }
}
