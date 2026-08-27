/** @jest-environment node */

import {
  buildCatalogInspectionProposal,
  extractCatalogProductsFromShopifyJson,
  parseCatalogCsv,
  type CatalogSourceDocument,
} from '@/modules/merchant/application/merchant-catalog-source-shared'
import { inspectCatalogUrlProgressively } from '@/modules/merchant/application/merchant-catalog-url-progressive'

function document(url: string, body: string, contentType = 'text/html'): CatalogSourceDocument {
  return { url, body, contentType }
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

  it('uses browser rendering when the initial source fetch is blocked', async () => {
    const result = await inspectCatalogUrlProgressively({
      sourceUrl: 'https://catalog.example.test',
      maxProducts: 20,
      fetchSource: async () => {
        throw Object.assign(new Error('The source returned HTTP 403.'), { code: 'SOURCE_UNREACHABLE' })
      },
      renderedFetch: async (url) => document(url, '<script type="application/ld+json">{"@type":"Product","name":"Rendered Round Frame","sku":"R-1","image":"https://cdn.example.test/round.jpg","shape":"round","offers":{"price":"99","priceCurrency":"USD"}}</script>'),
    })

    expect(result.platform).toBe('BROWSER_RENDER')
    expect(result.candidates[0]).toMatchObject({ sku: 'R-1', name: 'Rendered Round Frame', shape: 'round', price: 9900 })
    expect(result.issues).toEqual([])
  })

  it('maps Shopify variants into canonical product facts without AI guessing', () => {
    const products = extractCatalogProductsFromShopifyJson({ products: [{ id: 1, title: 'Frame', handle: 'frame', image: { src: 'https://cdn.example.test/frame.jpg' }, options: [{ name: 'Shape', values: ['oval'] }], variants: [{ id: 2, sku: 'F-1', price: '99.50' }] }] }, 'https://shop.example.test/')
    expect(products[0]).toMatchObject({ sku: 'F-1', shape: 'oval', price: 9950, source: 'EXTERNAL' })
  })
})
