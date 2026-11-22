/** @jest-environment node */

import {
  buildCatalogInspectionProposal,
  extractCatalogProductsFromShopifyJson,
  extractShopifyAjaxProduct,
  enrichCatalogProduct,
  inferShapeFromProductMetadata,
  parseCatalogCsv,
  reviewShopifyCandidate,
  type CatalogSourceDocument,
} from '@/modules/merchant/application/merchant-catalog-source-shared'
import { inspectCatalogUrlProgressively } from '@/modules/merchant/application/merchant-catalog-url-progressive'

function document(url: string, body: string, contentType = 'text/html', options: Partial<CatalogSourceDocument> = {}): CatalogSourceDocument {
  return { url, body, contentType, ...options }
}

function shopifyAjaxProduct(variantCount = 2) {
  return {
    id: 88442,
    title: 'Lemtosh Round',
    handle: 'lemtosh',
    vendor: 'MOSCOT',
    featured_image: 'https://cdn.shopify.com/s/files/lemtosh.jpg',
    images: Array.from({ length: 97 }, (_, index) => `https://cdn.shopify.com/s/files/image-${index}.jpg`),
    options: [{ name: 'Color', values: ['Tortoise'] }, { name: 'Size', values: ['46', '49'] }],
    variants: Array.from({ length: variantCount }, (_, index) => ({
      id: 90000 + index,
      title: `Tortoise / ${46 + index}`,
      available: index !== variantCount - 1,
      sku: `LEMTOSH-${46 + index}`,
      price: 34000 + index * 100,
      option1: 'Tortoise',
      option2: String(46 + index),
      featured_image: { src: `https://cdn.shopify.com/s/files/variant-${index}.jpg` },
    })),
  }
}

describe('human catalog progressive source intake', () => {
  it('parses a practical CSV shape without dropping quoted values', () => {
    const parsed = parseCatalogCsv([
      'sku,name,shape,imageUrl,price,brand',
      'VT-1,"Round, acetate",round,https://cdn.example.test/1.jpg,129.00,VisuTry',
    ].join('\n'))

    expect(parsed.issues).toEqual([])
    expect(parsed.products[0]).toMatchObject({ sku: 'VT-1', name: 'Round, acetate', price: 12900, source: 'CSV' })
  })

  it('normalizes CSV header aliases and keeps invalid prices out of the importable subset', () => {
    const parsed = parseCatalogCsv([
      'id,product_name,shape,image,price',
      'VT-2,Alias Frame,oval,https://cdn.example.test/2.jpg,not-a-price',
    ].join('\n'))

    expect(parsed.products[0]).toMatchObject({ sku: 'VT-2', name: 'Alias Frame', imageUrl: 'https://cdn.example.test/2.jpg' })
    expect(parsed.products[0].sourceIssues).toContain('INVALID_PRICE')
    expect(parsed.issues).toEqual(expect.arrayContaining([expect.objectContaining({ code: 'INVALID_PRICE' })]))
  })

  it('uses the Shopify adapter before page parsing', async () => {
    const calls: string[] = []
    const result = await inspectCatalogUrlProgressively({
      sourceUrl: 'https://shop.example.test',
      maxProducts: 20,
      fetchSource: async (url) => {
        calls.push(url)
        if (url.endsWith('/products.json?limit=250')) return document(url, JSON.stringify({ products: [{ id: 1, title: 'Round Acetate', handle: 'round-acetate', vendor: 'VisuTry', image: { src: 'https://cdn.example.test/round.jpg' }, variants: [{ id: 2, sku: 'VT-1', price: '129.00' }] }] }), 'application/json')
        return document(url, '<html><head><script src="https://cdn.shopify.com/shop.js"></script></head><body></body></html>')
      },
    })

    expect(result.platform).toBe('SHOPIFY')
    expect(result.candidates[0]).toMatchObject({ sku: 'VT-1', name: 'Round Acetate', price: 12900 })
    expect(calls).toEqual(['https://shop.example.test', 'https://shop.example.test/products.json?limit=250'])
  })

  it('falls through to a sitemap and still returns a partial-success proposal', async () => {
    const result = await buildCatalogInspectionProposal({
      sourceUrls: ['https://catalog.example.test'],
      existing: [],
      fetchSource: async (url) => {
        if (url === 'https://catalog.example.test' || url === 'https://catalog.example.test/') return document(url, '<html><body><h1>Eyewear</h1></body></html>')
        if (url.endsWith('/sitemap.xml')) return document(url, '<urlset><url><loc>https://catalog.example.test/products/round</loc></url></urlset>', 'application/xml')
        return document(url, '<script type="application/ld+json">{"@type":"Product","name":"Round","sku":"VT-1","image":"https://cdn.example.test/round.jpg","shape":"round"}</script>')
      },
      inspectSource: (sourceUrl, maxProducts) => inspectCatalogUrlProgressively({
        sourceUrl,
        maxProducts,
        fetchSource: async (url) => {
          if (url === 'https://catalog.example.test' || url === 'https://catalog.example.test/') return document(url, '<html><body><h1>Eyewear</h1></body></html>')
          if (url.endsWith('/sitemap.xml')) return document(url, '<urlset><url><loc>https://catalog.example.test/products/round</loc></url></urlset>', 'application/xml')
          return document(url, '<script type="application/ld+json">{"@type":"Product","name":"Round","sku":"VT-1","image":"https://cdn.example.test/round.jpg","shape":"round"}</script>')
        },
      }),
    })

    expect(result.sourceSummary.platforms).toEqual(['SITEMAP'])
    expect(result.sourceSummary.readyToImport).toBe(1)
    expect(result.importReady[0]).toMatchObject({ sku: 'VT-1', source: 'EXTERNAL' })
  })

  it('returns a friendly fallback issue when deterministic extraction is unavailable', async () => {
    const result = await inspectCatalogUrlProgressively({
      sourceUrl: 'https://catalog.example.test',
      maxProducts: 20,
      fetchSource: async (url) => document(url, '<html><body><div id="app"></div></body></html>'),
    })
    expect(result.candidates).toEqual([])
    expect(result.issues).toEqual(expect.arrayContaining([expect.objectContaining({ code: 'NO_PRODUCTS_FOUND', message: expect.stringContaining('Upload CSV') })]))
  })

  it('uses browser rendering when the initial source fetch times out', async () => {
    const result = await inspectCatalogUrlProgressively({
      sourceUrl: 'https://catalog.example.test',
      maxProducts: 20,
      fetchSource: async () => {
        throw Object.assign(new Error('The source request timed out.'), { code: 'SOURCE_TIMEOUT' })
      },
      renderedFetch: async (url) => document(url, '<script type="application/ld+json">{"@type":"Product","name":"Rendered Round Frame","sku":"R-1","image":"https://cdn.example.test/round.jpg","shape":"round","offers":{"price":"99","priceCurrency":"USD"}}</script>'),
    })

    expect(result.platform).toBe('BROWSER_RENDER')
    expect(result.candidates[0]).toMatchObject({ sku: 'R-1', name: 'Rendered Round Frame', shape: 'round', price: 9900 })
    expect(result.issues).toEqual([])
  })

  it('renders discovered product pages when the rendered landing page has no structured products', async () => {
    const renderedUrls: string[] = []
    const result = await inspectCatalogUrlProgressively({
      sourceUrl: 'https://catalog.example.test',
      maxProducts: 20,
      fetchSource: async () => {
        throw Object.assign(new Error('The source request timed out.'), { code: 'SOURCE_TIMEOUT' })
      },
      renderedFetch: async (url) => {
        renderedUrls.push(url)
        if (url === 'https://catalog.example.test') return document(url, '<html><body><a href="/products/rendered-round">Round frame</a></body></html>')
        return document(url, '<script type="application/ld+json">{"@type":"Product","name":"Rendered Round Frame","sku":"R-1","image":"https://cdn.example.test/round.jpg","shape":"round","offers":{"price":"99","priceCurrency":"USD"}}</script>')
      },
    })

    expect(result.platform).toBe('BROWSER_RENDER')
    expect(result.candidates[0]).toMatchObject({ sku: 'R-1', name: 'Rendered Round Frame' })
    expect(renderedUrls).toEqual(['https://catalog.example.test', 'https://catalog.example.test/products/rendered-round'])
  })

  it.each([
    ['SOURCE_ACCESS_DENIED', 'This website blocked automated inspection. Add the product manually or upload a CSV.'],
    ['SOURCE_RATE_LIMITED', 'This website is temporarily limiting automated inspection. Try Manual or CSV instead.'],
    ['UNSAFE_SOURCE_URL', 'This URL is not a safe public product page. Check the link or add the product manually.'],
    ['SOURCE_REDIRECT_REJECTED', 'A cross-origin redirect was refused.'],
  ])('does not bypass %s using paid browser rendering', async (code, message) => {
    const renderedFetch = jest.fn()
    const result = await inspectCatalogUrlProgressively({
      sourceUrl: 'https://catalog.example.test',
      maxProducts: 20,
      fetchSource: async () => { throw Object.assign(new Error(message), { code }) },
      renderedFetch,
    })
    expect(renderedFetch).not.toHaveBeenCalled()
    expect(result.candidates).toEqual([])
    expect(result.issues).toEqual([{ sourceUrl: 'https://catalog.example.test', code, message }])
  })

  it('uses the product-scoped Shopify Ajax endpoint and returns one candidate for a 111-variant item', async () => {
    const sourceUrl = 'https://moscot.com/products/lemtosh?variant=9988'
    const ajaxUrl = 'https://moscot.com/products/lemtosh.js'
    const calls: string[] = []
    const result = await inspectCatalogUrlProgressively({
      sourceUrl,
      maxProducts: 250,
      fetchSource: async (url) => {
        calls.push(url)
        if (url === sourceUrl) return document(url, '<html><title>Lemtosh – MOSCOT</title></html>', 'text/html', { platformHint: 'SHOPIFY' })
        if (url === ajaxUrl) return document(url, JSON.stringify(shopifyAjaxProduct(111)), 'text/javascript')
        throw new Error(`Unexpected fetch: ${url}`)
      },
    })

    expect(calls).toEqual([sourceUrl, ajaxUrl])
    expect(result.platform).toBe('SHOPIFY')
    expect(result.candidates).toHaveLength(1)
    expect(result.candidates[0]).toMatchObject({ name: 'Lemtosh Round', brand: 'MOSCOT', productUrl: sourceUrl, shape: null })
    expect(result.candidates[0].shopifyReview?.variantOptions).toHaveLength(111)
    expect(result.fetchedUrls).not.toContain('https://cdn.shopify.com/s/files/image-96.jpg')
  })

  it('requires variant, currency, price, image, and missing shape confirmation while preserving Shopify minor units', () => {
    const sourceUrl = 'https://moscot.com/products/lemtosh?campaign=frame'
    const extracted = extractShopifyAjaxProduct(shopifyAjaxProduct(), sourceUrl)
    expect(extracted).toMatchObject({ productUrl: sourceUrl, shape: null, shopifyReview: { selectedVariantId: null } })

    const initialProposal = {
      sku: null, name: extracted.name ?? null, brand: extracted.brand ?? null, variant: null,
      imageUrl: null, productUrl: extracted.productUrl ?? null, price: null, currency: null,
      shape: null, material: null, color: null, widthClass: null, styleTags: [], collectionTags: [],
      source: 'EXTERNAL' as const, externalId: extracted.externalId ?? null, identity: null,
      shapeSource: 'NONE' as const, shapeConfidence: null, importReady: false, recommendationReady: false,
      recommendationIssues: ['MISSING_SHAPE'], readiness: 'NEEDS_REVIEW' as const, status: 'NEEDS_REVIEW' as const,
      dedupeStatus: 'NEW' as const, issues: [], shopifyReview: extracted.shopifyReview,
    }
    let candidate = reviewShopifyCandidate(initialProposal, { selectedVariantId: '90000' })
    expect(candidate).toMatchObject({ productUrl: sourceUrl, price: 34000, currency: null, shape: null, importReady: false })
    expect(candidate.issues).toEqual(expect.arrayContaining([
      'SHOPIFY_CURRENCY_REQUIRED', 'SHOPIFY_PRICE_CONFIRMATION_REQUIRED',
      'SHOPIFY_IMAGE_CONFIRMATION_REQUIRED', 'MISSING_SHAPE',
    ]))
    expect(candidate.price).toBe(34000)

    candidate = reviewShopifyCandidate(candidate, { currencyCode: 'USD' })
    expect(candidate.issues).toContain('SHOPIFY_PRICE_CONFIRMATION_REQUIRED')
    candidate = reviewShopifyCandidate(candidate, { priceConfirmed: true })
    candidate = reviewShopifyCandidate(candidate, { imageDecoded: true })
    candidate = reviewShopifyCandidate(candidate, { imageConfirmed: true })
    expect(candidate.importReady).toBe(false)
    candidate = reviewShopifyCandidate(candidate, { shape: 'round' })
    expect(candidate).toMatchObject({ price: 34000, currency: 'usd', shape: 'round', shapeSource: 'MERCHANT_CONFIRMED', importReady: true })
    expect(candidate.productUrl).toBe(sourceUrl)
    expect(candidate.shopifyReview?.variantOptions).toHaveLength(2)
    expect(candidate.shopifyReview?.variantOptions[0].imageUrl).toBe('https://cdn.shopify.com/s/files/variant-0.jpg')
    expect(candidate.shopifyReview?.variantOptions[1].available).toBe(false)

    const priorPrice = candidate.price
    candidate = reviewShopifyCandidate(candidate, { currencyCode: 'EUR' })
    expect(candidate.price).toBe(priorPrice)
    expect(candidate.issues).toContain('SHOPIFY_PRICE_CONFIRMATION_REQUIRED')
    expect(candidate.shopifyReview?.priceConfirmed).toBe(false)

    candidate = reviewShopifyCandidate(candidate, { selectedVariantId: '90001' })
    expect(candidate).toMatchObject({ price: 34100, shape: null, importReady: false, status: 'NEEDS_REVIEW' })
    expect(candidate.shopifyReview).toMatchObject({ imageDecoded: false, imageConfirmed: false, priceConfirmed: false })
    expect(candidate.issues).toEqual(expect.arrayContaining(['SHOPIFY_VARIANT_UNAVAILABLE', 'SHOPIFY_IMAGE_CONFIRMATION_REQUIRED', 'MISSING_SHAPE']))
  })

  it.each([
    ['403', 403, 'SOURCE_ACCESS_DENIED'],
    ['429', 429, 'SOURCE_RATE_LIMITED'],
  ])('does not render or retry the Shopify endpoint after HTTP %s', async (_label, status, code) => {
    const sourceUrl = 'https://moscot.com/products/lemtosh'
    const calls: string[] = []
    const renderedFetch = jest.fn()
    const result = await inspectCatalogUrlProgressively({
      sourceUrl,
      maxProducts: 20,
      fetchSource: async (url) => {
        calls.push(url)
        if (url === sourceUrl) return document(url, '<html><title>Lemtosh</title></html>', 'text/html', { platformHint: 'SHOPIFY' })
        throw Object.assign(new Error(`HTTP ${status}`), { code })
      },
      renderedFetch,
    })
    expect(result.issues[0]).toMatchObject({ code, message: expect.not.stringContaining('HTTP') })
    expect(calls).toEqual([sourceUrl, 'https://moscot.com/products/lemtosh.js'])
    expect(renderedFetch).not.toHaveBeenCalled()
  })

  it('treats a Shopify soft-404 as not found and does not try its Ajax endpoint or browser rendering', async () => {
    const sourceUrl = 'https://shop.example.test/products/no-such-frame'
    const calls: string[] = []
    const renderedFetch = jest.fn()
    const result = await inspectCatalogUrlProgressively({
      sourceUrl,
      maxProducts: 20,
      fetchSource: async (url) => {
        calls.push(url)
        return document(url, '<html><head><title>404 Page Not Found – Shop</title></head><body>Not found</body></html>')
      },
      renderedFetch,
    })
    expect(result.issues).toEqual([expect.objectContaining({ code: 'SOURCE_NOT_FOUND' })])
    expect(calls).toEqual([sourceUrl])
    expect(renderedFetch).not.toHaveBeenCalled()
  })

  it('treats malformed Ajax JSON as incomplete data and offers manual recovery', async () => {
    const sourceUrl = 'https://shop.example.test/products/lemtosh'
    const result = await inspectCatalogUrlProgressively({
      sourceUrl,
      maxProducts: 20,
      fetchSource: async (url) => url === sourceUrl
        ? document(url, '<html><title>Lemtosh</title></html>', 'text/html', { platformHint: 'SHOPIFY' })
        : document(url, '{not-json', 'text/javascript'),
      renderedFetch: jest.fn(),
    })
    expect(result.candidates).toEqual([])
    expect(result.issues).toEqual([expect.objectContaining({ code: 'SHOPIFY_PRODUCT_DATA_INCOMPLETE', message: expect.stringMatching(/Manual|CSV/) })])
  })

  it('rejects malformed or incorrectly formatted Ajax prices without import readiness', () => {
    const invalid = { ...shopifyAjaxProduct(), variants: [{ ...shopifyAjaxProduct().variants[0], price: '340.00' }] }
    const extracted = extractShopifyAjaxProduct(invalid, 'https://moscot.com/products/lemtosh')
    const review = extracted.shopifyReview!
    expect(review.variantOptions[0].priceMinor).toBeNull()
    expect(reviewShopifyCandidate({
      sku: null, name: extracted.name ?? null, brand: extracted.brand ?? null, variant: null,
      imageUrl: null, productUrl: extracted.productUrl ?? null, price: null, currency: null,
      shape: null, material: null, color: null, widthClass: null, styleTags: [], collectionTags: [],
      source: 'EXTERNAL', externalId: extracted.externalId ?? null, identity: null, shapeSource: 'NONE',
      shapeConfidence: null, importReady: false, recommendationReady: false, recommendationIssues: ['MISSING_SHAPE'],
      readiness: 'NEEDS_REVIEW', status: 'NEEDS_REVIEW', dedupeStatus: 'NEW', issues: [], shopifyReview: review,
    }, { selectedVariantId: '90000' }).issues).toContain('SHOPIFY_PRICE_UNAVAILABLE')
  })

  it('rejects Ajax data whose product handle does not match the requested URL', () => {
    expect(() => extractShopifyAjaxProduct({ ...shopifyAjaxProduct(), handle: 'different-product' }, 'https://moscot.com/products/lemtosh'))
      .toThrow(expect.objectContaining({ code: 'SHOPIFY_PRODUCT_DATA_INCOMPLETE' }))
  })

  it('uses a named Shopify variant option for shape only when the source labels it as shape', () => {
    const product = shopifyAjaxProduct()
    const extracted = extractShopifyAjaxProduct({
      ...product,
      options: ['Frame Shape', 'Size'],
      variants: [{ ...product.variants[0], option1: 'Round' }],
    }, 'https://moscot.com/products/lemtosh')

    expect(extracted.shopifyReview?.variantOptions[0].shape).toBe('Round')
    expect(extracted.shape).toBeNull()
  })

  it('maps Shopify variants into canonical product facts without AI guessing', () => {
    const products = extractCatalogProductsFromShopifyJson({ products: [{ id: 1, title: 'Frame', handle: 'frame', image: { src: 'https://cdn.example.test/frame.jpg' }, options: [{ name: 'Shape', values: ['oval'] }], variants: [{ id: 2, sku: 'F-1', price: '99.50' }] }] }, 'https://shop.example.test/')
    expect(products[0]).toMatchObject({ sku: 'F-1', shape: 'oval', price: 9950, source: 'EXTERNAL' })
  })

  it('preserves a missing Shopify SKU and uses option/tag enrichment instead', () => {
    const products = extractCatalogProductsFromShopifyJson({ products: [{ id: 1, title: 'Everyday eyewear', handle: 'everyday-eyewear', image: { src: 'https://cdn.example.test/frame.jpg' }, tags: ['eyewear', 'round'], variants: [{ id: 2, price: '99.50' }] }] }, 'https://shop.example.test/')
    expect(products[0]).toMatchObject({ sku: null, externalId: '1:2', shape: 'round', shapeSource: 'SHOPIFY_OPTION_OR_TAG' })
  })

  it('imports a stable product without merchant SKU or shape while keeping it out of recommendations', async () => {
    const result = await buildCatalogInspectionProposal({
      sourceUrls: ['https://shop.example.test/products/eyewear'],
      existing: [],
      fetchSource: async (url) => document(url, '<script type="application/ld+json">{"@type":"Product","name":"Everyday Eyewear","image":"https://cdn.example.test/frame.jpg","url":"https://shop.example.test/products/eyewear"}</script>'),
      maxProducts: 20,
    })

    expect(result.sourceSummary).toMatchObject({ foundCount: 1, importReady: 1, readyToImport: 1, recommendationReady: 0, needsReview: 0, invalid: 0, reasonDistribution: { MISSING_SHAPE: 1 } })
    expect(result.candidates[0]).toMatchObject({ sku: null, shape: null, readiness: 'IMPORT_READY', importReady: true, recommendationReady: false, recommendationIssues: ['MISSING_SHAPE'] })
    expect(result.importReady[0]).toMatchObject({ sku: null, shape: null, productUrl: 'https://shop.example.test/products/eyewear' })
  })

  it('uses deterministic metadata before the optional AI/vision hook and records confidence', () => {
    expect(inferShapeFromProductMetadata({ name: 'Round Acetate Frame', variant: null, brand: null, styleTags: [], collectionTags: [] })).toMatchObject({ shape: 'round', confidence: 0.92 })
    expect(enrichCatalogProduct({ name: 'Round Acetate Frame', imageUrl: 'https://cdn.example.test/frame.jpg', sourceUrl: 'https://shop.example.test/products/round' })).toMatchObject({ shape: 'round', shapeSource: 'PRODUCT_METADATA', shapeConfidence: 0.92 })
    expect(enrichCatalogProduct({ name: 'Unclassified Eyewear', imageUrl: 'https://cdn.example.test/frame.jpg', sourceUrl: 'https://shop.example.test/products/unknown', visionShape: 'oval', visionShapeConfidence: 0.88 })).toMatchObject({ shape: 'oval', shapeSource: 'AI_VISION', shapeConfidence: 0.88 })
  })
})
