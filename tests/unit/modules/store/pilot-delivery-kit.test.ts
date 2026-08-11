import {
  assertPilotCatalogSourceOwnership,
  experiencePolicyForPilotConfig,
  normalizePilotCatalog,
  parsePilotCsv,
  validatePilotConfig,
  type PilotMerchantConfig,
} from '@/modules/store/application/pilot-delivery-kit'

const config: PilotMerchantConfig = {
  merchantSlug: 'example-eyewear',
  displayName: 'Example Eyewear',
  pilotType: 'REFERENCE' as const,
  referenceData: true,
  catalogMode: 'CURATED' as const,
  defaultLocale: 'en',
  theme: { logoUrl: null, brandName: 'Example Eyewear', accentToken: 'neutral' },
  measurement: {
    referenceTraffic: true,
    defaultSource: 'reference',
    defaultCampaign: 'pilot',
  },
  experience: {
    tryOnEnabled: true,
    compareEnabled: true,
    maxCompareFrames: 2,
  },
  commerce: {
    inquiryEnabled: false,
  },
}

describe('Pilot Delivery Kit catalog contract', () => {
  it('parses quoted CSV values and normalizes prices/lists', () => {
    const records = parsePilotCsv(
      'external_id,name,brand,product_url,image_url,product_type,status,price,currency,style_tags\n' +
        'v-1,"Frame, One",Example,https://example.com/p,https://example.com/i,SUNGLASSES,ACTIVE,80.00,USD,"classic|petite-fit"',
    )
    const [row] = normalizePilotCatalog(records)
    expect(row).toMatchObject({
      externalId: 'v-1',
      name: 'Frame, One',
      price: 8000,
      currency: 'usd',
      styleTags: ['classic', 'petite-fit'],
    })
  })

  it('rejects missing catalog contract columns', () => {
    expect(() => parsePilotCsv('external_id,name\nv-1,Frame')).toThrow('brand')
  })

  it('rejects extra and missing values before constructing records', () => {
    const header = 'external_id,name,brand,product_url,image_url,product_type,status'
    expect(() => parsePilotCsv(`${header}\nv-1,Frame,Example,https://example.com/p,https://example.com/i,SUNGLASSES,ACTIVE,extra`)).toThrow(
      'row 2: column count does not match header',
    )
    expect(() => parsePilotCsv(`${header}\nv-1,Frame,Example,https://example.com/p`)).toThrow(
      'row 2: column count does not match header',
    )
  })

  it('fails fast when an incoming SKU belongs to a non-CSV source', () => {
    expect(() =>
      assertPilotCatalogSourceOwnership(
        [
          { sku: 'manual-1', source: 'MANUAL' },
          { sku: 'csv-1', source: 'CSV' },
        ],
        ['manual-1', 'csv-1'],
      ),
    ).toThrow('manual-1 (MANUAL)')

    expect(() =>
      assertPilotCatalogSourceOwnership([{ sku: 'csv-1', source: 'CSV' }], ['csv-1']),
    ).not.toThrow()
  })

  it('requires explicit provenance for reference pilots', () => {
    expect(() => validatePilotConfig({ ...config, referenceData: false })).toThrow('referenceData=true')
    expect(() => validatePilotConfig({ ...config, measurement: { ...config.measurement, referenceTraffic: false } })).toThrow(
      'referenceTraffic=true',
    )
  })

  it.each([2, 3, 4] as const)('accepts maxCompareFrames=%i', (maxCompareFrames) => {
    expect(() => validatePilotConfig({ ...config, experience: { ...config.experience, maxCompareFrames } })).not.toThrow()
  })

  it.each([1, 5])('rejects maxCompareFrames=%i', (maxCompareFrames) => {
    expect(() => validatePilotConfig({ ...config, experience: { ...config.experience, maxCompareFrames: maxCompareFrames as 2 } })).toThrow(
      'maxCompareFrames must be 2, 3, or 4',
    )
  })

  it('maps the standard merchant policy into importer fields', () => {
    expect(experiencePolicyForPilotConfig(config)).toEqual({
      tryOnEnabled: true,
      compareEnabled: true,
      maxCompareFrames: 2,
      inquiryEnabled: false,
    })
  })
})
