import { existsSync } from 'node:fs'
import { resolve } from 'node:path'

import {
  assertPilotCatalogSourceOwnership,
  buildPilotPreflightReport,
  experiencePolicyForPilotConfig,
  isSyntacticallyValidDestinationUrl,
  isSyntacticallyValidHttpUrl,
  normalizePilotCatalog,
  parsePilotCsv,
  readPilotPackage,
  validatePilotConfig,
  validatePilotExperienceConfig,
  type PilotMerchantConfig,
  type PilotExperienceConfig,
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
      brand: 'Example',
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

  it('loads ello as one Store and two Campaign experiences without merchant branches', async () => {
    const pkg = await readPilotPackage('pilot/ello-sunglasses')
    expect(pkg.catalog).toHaveLength(12)
    expect(pkg.config.sponsoredUsagePolicyKey).toBe('VISUTRY_OWNED')
    expect(pkg.experiences.map((item) => item.experienceSlug)).toEqual([
      'petite-fit',
      'default',
      'summer-sunglasses',
    ])
  })

  it('rejects unknown sponsored policy keys instead of importing ambiguous entitlement', () => {
    expect(() => validatePilotConfig({
      ...config,
      sponsoredUsagePolicyKey: 'UNSAFE_FALLBACK',
    })).toThrow('Unsupported sponsoredUsagePolicyKey')
  })

  it('keeps reference experience descriptions shopper-facing', async () => {
    const referencePackages = [
      'pilot/ello-sunglasses',
      'pilot/akila',
      'pilot/article-one',
      'pilot/framed-ewe',
      'pilot/lowercase-nyc',
    ]

    for (const packageDir of referencePackages) {
      const pkg = await readPilotPackage(packageDir)
      for (const experience of pkg.experiences) {
        expect(experience.description ?? '').not.toMatch(
          /reference|simulation|operator|source facts?|fit guarantee|technical details/i,
        )
      }
    }
  })

  it('keeps every reference Store/Campaign hero mapped to a checked-in asset', async () => {
    const referencePackages = [
      'pilot/ello-sunglasses',
      'pilot/akila',
      'pilot/article-one',
      'pilot/framed-ewe',
      'pilot/lowercase-nyc',
    ]

    for (const packageDir of referencePackages) {
      const pkg = await readPilotPackage(packageDir)
      for (const experience of pkg.experiences) {
        expect(experience.heroAsset).toMatch(/^\/experience-heroes\/[a-z0-9-]+\.jpg$/)
        expect(existsSync(resolve(process.cwd(), 'public', experience.heroAsset!.slice(1)))).toBe(true)
      }
    }
  })

  it('validates catalog selection and stable Store slug', () => {
    const base: PilotExperienceConfig = {
      experienceSlug: 'default',
      type: 'STORE',
      name: 'Store',
      status: 'ACTIVE',
      catalogSelection: 'ALL_ACTIVE',
    }
    expect(() => validatePilotExperienceConfig(base)).not.toThrow()
    expect(() => validatePilotExperienceConfig({ ...base, experienceSlug: 'hosted-store' })).toThrow('slug default')
    expect(() => validatePilotExperienceConfig({ ...base, catalogSelection: ['frame-1', 'frame-1'] })).toThrow('duplicate')
  })

  it('preflights active Store/Campaign selection and reference reporting', () => {
    const catalog = normalizePilotCatalog(parsePilotCsv(
      'external_id,name,brand,product_url,image_url,product_type,status\n' +
      'frame-1,Frame One,Example,https://example.com/p1,https://example.com/i1,SUNGLASSES,ACTIVE\n' +
      'frame-2,Frame Two,Example,https://example.com/p2,https://example.com/i2,SUNGLASSES,INACTIVE',
    ))
    const report = buildPilotPreflightReport({
      config,
      catalog,
      experiences: [
        { ...baseExperience(), experienceSlug: 'default', type: 'STORE', catalogSelection: 'ALL_ACTIVE' },
        { ...baseExperience(), experienceSlug: 'campaign', type: 'CAMPAIGN', catalogSelection: ['frame-1'] },
      ],
    })
    expect(report.errors).toEqual([])
    expect(report.summary).toMatchObject({ catalogRows: 2, activeRows: 1, storeCount: 1, campaignCount: 1 })
    expect(report.summary.selectedFrameCounts).toEqual([
      { slug: 'default', type: 'STORE', count: 1 },
      { slug: 'campaign', type: 'CAMPAIGN', count: 1 },
    ])
    expect(report.warnings).toContain('referenceData=true: treat all resulting traffic as Reference Pilot / Simulation, not live merchant traffic')
  })

  it('preflight rejects multiple active Stores and inactive selections', () => {
    const catalog = normalizePilotCatalog(parsePilotCsv(
      'external_id,name,brand,product_url,image_url,product_type,status\n' +
      'frame-1,Frame One,Example,https://example.com/p1,https://example.com/i1,SUNGLASSES,INACTIVE',
    ))
    const report = buildPilotPreflightReport({
      config,
      catalog,
      experiences: [
        { ...baseExperience(), experienceSlug: 'default', type: 'STORE', catalogSelection: 'ALL_ACTIVE' },
        { ...baseExperience(), experienceSlug: 'second-store', type: 'STORE', catalogSelection: ['frame-1'] },
      ],
    })
    expect(report.errors).toEqual(expect.arrayContaining([
      expect.stringContaining('At most one ACTIVE STORE'),
      expect.stringContaining('ALL_ACTIVE resolves to zero ACTIVE catalog rows'),
      expect.stringContaining('selected catalog row is not ACTIVE'),
    ]))
  })

  it('validates product and destination URL syntax without following or writing URLs', () => {
    expect(isSyntacticallyValidHttpUrl('https://example.com/products/frame')).toBe(true)
    expect(isSyntacticallyValidHttpUrl('javascript:alert(1)')).toBe(false)
    expect(isSyntacticallyValidHttpUrl('https://example.com/\nframe')).toBe(false)
    expect(isSyntacticallyValidDestinationUrl('/en/store/example')).toBe(true)
    expect(isSyntacticallyValidDestinationUrl('//evil.example')).toBe(false)
    expect(isSyntacticallyValidDestinationUrl('http://example.com')).toBe(false)
    expect(isSyntacticallyValidDestinationUrl('https://example.com/product')).toBe(true)
  })
})

function baseExperience(): PilotExperienceConfig {
  return {
    experienceSlug: 'experience',
    type: 'CAMPAIGN',
    name: 'Experience',
    status: 'ACTIVE',
    catalogSelection: ['frame-1'],
  }
}
