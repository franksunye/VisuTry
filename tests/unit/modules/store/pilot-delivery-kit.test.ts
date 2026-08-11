import {
  normalizePilotCatalog,
  parsePilotCsv,
  validatePilotConfig,
} from '@/modules/store/application/pilot-delivery-kit'

const config = {
  merchantSlug: 'example-eyewear',
  displayName: 'Example Eyewear',
  pilotType: 'REFERENCE' as const,
  referenceData: true,
  catalogMode: 'CURATED' as const,
  defaultLocale: 'en',
  theme: { logoUrl: null, brandName: 'Example Eyewear', accentToken: 'neutral' },
  commerce: { primaryIntent: 'PRODUCT_CLICK' as const, inquiryEnabled: true },
  experience: {
    recommendationEnabled: true,
    tryOnEnabled: true,
    compareEnabled: true,
    maxCompareFrames: 4,
  },
  measurement: {
    referenceTraffic: true,
    defaultSource: 'reference',
    defaultCampaign: 'pilot',
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

  it('requires explicit provenance for reference pilots', () => {
    expect(() => validatePilotConfig({ ...config, referenceData: false })).toThrow('referenceData=true')
    expect(() => validatePilotConfig({ ...config, measurement: { ...config.measurement, referenceTraffic: false } })).toThrow(
      'referenceTraffic=true',
    )
  })
})
