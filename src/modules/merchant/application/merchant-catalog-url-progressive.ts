import {
  extractCatalogProductLinksFromHtml,
  extractCatalogProductsFromHtml,
  extractCatalogProductsFromShopifyJson,
  extractCatalogSitemapUrls,
  extractShopifyAjaxProduct,
  type CatalogSourceDocument,
  type ExtractedProduct,
  type ProgressiveSourceInspection,
  type SourceIssue,
} from './merchant-catalog-source-shared'

const MAX_GENERIC_PRODUCT_PAGES = 40

type FetchSource = (url: string) => Promise<CatalogSourceDocument>

function issue(sourceUrl: string, code: string, message: string): SourceIssue {
  return { sourceUrl, code, message }
}

function platformFor(html: string): 'SHOPIFY' | undefined {
  const source = html.toLowerCase()
  return source.includes('cdn.shopify.com') || source.includes('/cdn/shop/') || source.includes('shopify.theme') || source.includes('shopify.routes') || source.includes('powered by shopify')
    ? 'SHOPIFY'
    : undefined
}

function isHtml(document: CatalogSourceDocument): boolean {
  const contentType = document.contentType.split(';')[0].trim().toLowerCase()
  return !contentType || ['text/html', 'application/xhtml+xml'].includes(contentType)
}

function isXml(document: CatalogSourceDocument): boolean {
  const contentType = document.contentType.split(';')[0].trim().toLowerCase()
  return ['application/xml', 'text/xml', 'application/xhtml+xml'].includes(contentType) || /\.xml$/iu.test(new URL(document.url).pathname)
}

function isJson(document: CatalogSourceDocument): boolean {
  const contentType = document.contentType.split(';')[0].trim().toLowerCase()
  return contentType === 'application/json' || contentType.endsWith('+json') || document.body.trimStart().startsWith('{')
}

function productPageUrl(value: string): boolean {
  try {
    return /(?:^|\/)(?:product|products|item|items|p)(?:\/|$)/iu.test(new URL(value).pathname)
  } catch {
    return false
  }
}

function shopifyProductHandle(value: string): string | null {
  try {
    const parts = new URL(value).pathname.split('/').filter(Boolean)
    const productsIndex = parts.lastIndexOf('products')
    if (productsIndex < 0 || productsIndex !== parts.length - 2) return null
    const handle = parts[productsIndex + 1]
    return handle && /^[a-z0-9][a-z0-9-]*$/iu.test(handle) ? handle : null
  } catch {
    return null
  }
}

function shopifyAjaxProductUrl(value: string): string | null {
  const handle = shopifyProductHandle(value)
  if (!handle) return null
  const url = new URL(value)
  url.pathname = `${url.pathname.replace(/\/+$/u, '')}.js`
  url.search = ''
  url.hash = ''
  return url.toString()
}

function isSoftNotFoundProductPage(html: string): boolean {
  const title = html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/iu)?.[1]
    ?? html.match(/<meta\b[^>]*(?:property|name)=["']og:title["'][^>]*content=["']([^"']*)["'][^>]*>/iu)?.[1]
    ?? ''
  const normalized = title.replace(/<[^>]*>/gu, ' ').replace(/&nbsp;|&#160;/giu, ' ').replace(/\s+/gu, ' ').trim()
  return /^(?:404\b|page not found\b|product not found\b|not found\b)/iu.test(normalized)
}

function publicSourceFailure(error: unknown, fallbackCode = 'SOURCE_UNREACHABLE') {
  const code = error && typeof error === 'object' && 'code' in error ? String((error as { code: unknown }).code) : fallbackCode
  const messages: Record<string, string> = {
    SOURCE_ACCESS_DENIED: 'This website blocked automated inspection. Add the product manually or upload a CSV.',
    SOURCE_RATE_LIMITED: 'This website is temporarily limiting automated inspection. Try Manual or CSV instead.',
    SOURCE_NOT_FOUND: 'The product page could not be found. Check the link or add the product manually.',
    SOURCE_TOO_LARGE: 'This product page is larger than the safe inspection limit. Try Manual or CSV instead.',
    SHOPIFY_PRODUCT_DATA_INCOMPLETE: 'The product did not provide complete variant data. Add it manually or upload a CSV.',
    SHOPIFY_PRODUCT_ENDPOINT_UNAVAILABLE: 'Shopify product data was unavailable. Add the product manually or upload a CSV.',
    SOURCE_TIMEOUT: 'The product page took too long to respond. Try Manual or CSV instead.',
    TOO_MANY_REDIRECTS: 'The product page redirected too many times. Check the link or use Manual or CSV instead.',
    UNSAFE_SOURCE_URL: 'This URL is not a safe public product page. Check the link or add the product manually.',
  }
  const message = error && typeof error === 'object' && 'message' in error ? String((error as { message: unknown }).message) : 'The source could not be inspected.'
  return { code, message: messages[code] ?? message }
}

function sitemapUrl(value: string): boolean {
  try {
    return /(?:^|\/)sitemap[^/]*\.xml$/iu.test(new URL(value).pathname)
  } catch {
    return false
  }
}

async function jsonProducts(document: CatalogSourceDocument, sourceUrl: string, maxProducts: number): Promise<ExtractedProduct[]> {
  if (!isJson(document)) return []
  try {
    return extractCatalogProductsFromShopifyJson(JSON.parse(document.body), sourceUrl, maxProducts)
  } catch {
    return []
  }
}

async function inspectWithBrowserRender(input: {
  sourceUrl: string
  maxProducts: number
  renderedFetch?: (url: string) => Promise<CatalogSourceDocument | null>
}, fetchedUrls: string[], issues: SourceIssue[]): Promise<ExtractedProduct[] | null> {
  if (!input.renderedFetch) return null
  try {
    const rendered = await input.renderedFetch(input.sourceUrl)
    if (!rendered || !isHtml(rendered)) return null
    fetchedUrls.push(rendered.url)
    const directCandidates = extractCatalogProductsFromHtml(rendered.body, rendered.url)
    if (directCandidates.length > 0) return directCandidates.slice(0, input.maxProducts)

    const renderedProductUrls = extractCatalogProductLinksFromHtml(rendered.body, rendered.url, input.maxProducts)
    const candidates: ExtractedProduct[] = []
    for (const productUrl of renderedProductUrls.slice(0, Math.min(input.maxProducts, MAX_GENERIC_PRODUCT_PAGES))) {
      try {
        const productPage = await input.renderedFetch(productUrl)
        if (!productPage || !isHtml(productPage)) continue
        fetchedUrls.push(productPage.url)
        candidates.push(...extractCatalogProductsFromHtml(productPage.body, productPage.url))
        if (candidates.length >= input.maxProducts) break
      } catch {
        issues.push(issue(productUrl, 'PRODUCT_PAGE_RENDER_FAILED', 'Some rendered product pages could not be inspected.'))
      }
    }
    return candidates.slice(0, input.maxProducts)
  } catch {
    issues.push(issue(input.sourceUrl, 'BROWSER_RENDER_FAILED', 'The rendered page could not be inspected.'))
    return null
  }
}

export async function inspectCatalogUrlProgressively(input: {
  sourceUrl: string
  maxProducts: number
  fetchSource: FetchSource
  renderedFetch?: (url: string) => Promise<CatalogSourceDocument | null>
}): Promise<ProgressiveSourceInspection> {
  const fetchedUrls: string[] = []
  const issues: SourceIssue[] = []
  const fetch = async (url: string) => {
    const document = await input.fetchSource(url)
    fetchedUrls.push(document.url)
    return document
  }
  const inspectShopifyProduct = async (sourceUrl: string): Promise<ProgressiveSourceInspection> => {
    const ajaxUrl = shopifyAjaxProductUrl(sourceUrl)
    if (!ajaxUrl) return { candidates: [], fetchedUrls, issues: [issue(sourceUrl, 'SHOPIFY_PRODUCT_DATA_INCOMPLETE', 'Paste a specific Shopify product URL, or add the product manually or with CSV.')], platform: 'SHOPIFY' }
    try {
      const document = await fetch(ajaxUrl)
      if (document.status === 401 || document.status === 403) {
        return { candidates: [], fetchedUrls, issues: [issue(sourceUrl, 'SOURCE_ACCESS_DENIED', 'This website blocked automated inspection. Add the product manually or upload a CSV.')], platform: 'SHOPIFY' }
      }
      if (document.status === 429) {
        return { candidates: [], fetchedUrls, issues: [issue(sourceUrl, 'SOURCE_RATE_LIMITED', 'This website is temporarily limiting automated inspection. Try Manual or CSV instead.')], platform: 'SHOPIFY' }
      }
      if (document.status === 404) {
        return { candidates: [], fetchedUrls, issues: [issue(sourceUrl, 'SOURCE_NOT_FOUND', 'The product page could not be found. Check the link or add it manually or with CSV.')], platform: 'SHOPIFY' }
      }
      if (document.status != null && (document.status < 200 || document.status >= 300)) {
        return { candidates: [], fetchedUrls, issues: [issue(sourceUrl, 'SHOPIFY_PRODUCT_ENDPOINT_UNAVAILABLE', 'Shopify product data was unavailable. Add the product manually or upload a CSV.')], platform: 'SHOPIFY' }
      }
      if (!isJson(document)) {
        return { candidates: [], fetchedUrls, issues: [issue(sourceUrl, 'SHOPIFY_PRODUCT_ENDPOINT_UNAVAILABLE', 'Shopify product data was unavailable. Add the product manually or upload a CSV.')], platform: 'SHOPIFY' }
      }
      let payload: unknown
      try {
        payload = JSON.parse(document.body)
      } catch {
        return { candidates: [], fetchedUrls, issues: [issue(sourceUrl, 'SHOPIFY_PRODUCT_DATA_INCOMPLETE', 'Shopify product data was incomplete. Add the product manually or upload a CSV.')], platform: 'SHOPIFY' }
      }
      const candidate = extractShopifyAjaxProduct(payload, sourceUrl)
      return { candidates: [candidate], fetchedUrls, issues: [], platform: 'SHOPIFY' }
    } catch (error) {
      const failure = publicSourceFailure(error)
      return { candidates: [], fetchedUrls, issues: [issue(sourceUrl, failure.code, failure.message)], platform: 'SHOPIFY' }
    }
  }
  let landing: CatalogSourceDocument
  try {
    landing = await fetch(input.sourceUrl)
  } catch (error) {
    const failure = publicSourceFailure(error)
    // Source denial, throttling and unsafe targets are terminal. Do not retry
    // them through a paid browser provider; that can bypass the source's
    // explicit access controls and spend quota for a forbidden inspection.
    if (['SOURCE_ACCESS_DENIED', 'SOURCE_RATE_LIMITED', 'SOURCE_NOT_FOUND', 'UNSAFE_SOURCE_URL', 'SOURCE_REDIRECT_REJECTED', 'TOO_MANY_REDIRECTS'].includes(failure.code)) {
      return { candidates: [], fetchedUrls, issues: [issue(input.sourceUrl, failure.code, failure.message)] }
    }
    const errorHint = error && typeof error === 'object' && 'platformHint' in error ? (error as { platformHint?: unknown }).platformHint : undefined
    if (failure.code === 'SOURCE_TOO_LARGE' && errorHint === 'SHOPIFY' && shopifyProductHandle(input.sourceUrl)) {
      return inspectShopifyProduct(input.sourceUrl)
    }
    if (failure.code === 'SOURCE_TOO_LARGE') {
      return { candidates: [], fetchedUrls, issues: [issue(input.sourceUrl, failure.code, failure.message)] }
    }
    const renderedCandidates = await inspectWithBrowserRender(input, fetchedUrls, issues)
    if (renderedCandidates !== null) {
      if (renderedCandidates.length > 0) return { candidates: renderedCandidates, fetchedUrls, issues, platform: 'BROWSER_RENDER' }
      return { candidates: [], fetchedUrls, issues: [issue(input.sourceUrl, 'NO_PRODUCTS_FOUND', 'We could not reliably find product data. Try Upload CSV or Add manually.')], platform: 'BROWSER_RENDER' }
    }
    return { candidates: [], fetchedUrls, issues: [issue(input.sourceUrl, failure.code, failure.message), ...issues] }
  }

  if (landing.status === 401 || landing.status === 403) {
    return { candidates: [], fetchedUrls, issues: [issue(input.sourceUrl, 'SOURCE_ACCESS_DENIED', 'This website blocked automated inspection. Add the product manually or upload a CSV.')] }
  }
  if (landing.status === 429) {
    return { candidates: [], fetchedUrls, issues: [issue(input.sourceUrl, 'SOURCE_RATE_LIMITED', 'This website is temporarily limiting automated inspection. Try Manual or CSV instead.')] }
  }
  if (landing.status === 404 || (isHtml(landing) && shopifyProductHandle(input.sourceUrl) && isSoftNotFoundProductPage(landing.body))) {
    return { candidates: [], fetchedUrls, issues: [issue(input.sourceUrl, 'SOURCE_NOT_FOUND', 'The product page could not be found. Check the link or add it manually or with CSV.')] }
  }

  const detectedPlatform = landing.platformHint ?? (isHtml(landing) ? platformFor(landing.body) : undefined)
  const candidates: ExtractedProduct[] = []
  if (detectedPlatform === 'SHOPIFY' && shopifyProductHandle(input.sourceUrl)) {
    return inspectShopifyProduct(input.sourceUrl)
  }
  if (detectedPlatform === 'SHOPIFY') {
    try {
      const shopifyUrl = new URL('/products.json?limit=250', landing.url).toString()
      const shopifyDocument = await fetch(shopifyUrl)
      candidates.push(...await jsonProducts(shopifyDocument, landing.url, input.maxProducts))
      if (candidates.length > 0) return { candidates, fetchedUrls, issues, platform: 'SHOPIFY' }
    } catch {
      issues.push(issue(input.sourceUrl, 'SHOPIFY_ADAPTER_UNAVAILABLE', 'Shopify product data was not available; continuing with standard ecommerce extraction.'))
    }
  }

  if (isHtml(landing)) {
    candidates.push(...extractCatalogProductsFromHtml(landing.body, landing.url).slice(0, input.maxProducts))
    if (candidates.length > 0) return { candidates, fetchedUrls, issues, platform: detectedPlatform ? 'SHOPIFY' : 'STRUCTURED_DATA' }
  }

  const sitemapDocuments: CatalogSourceDocument[] = []
  if (isXml(landing)) {
    sitemapDocuments.push(landing)
  } else {
    const sitemapUrls = [new URL('/sitemap.xml', landing.url).toString()]
    if (isHtml(landing)) {
      const linked = landing.body.match(/<link\b[^>]*rel=["']sitemap["'][^>]*href=["']([^"']+)["']/iu)?.[1]
        ?? landing.body.match(/<link\b[^>]*href=["']([^"']+)["'][^>]*rel=["']sitemap["']/iu)?.[1]
      if (linked) sitemapUrls.unshift(new URL(linked, landing.url).toString())
    }
    for (const sitemap of [...new Set(sitemapUrls)]) {
      try {
        const document = await fetch(sitemap)
        if (isXml(document)) sitemapDocuments.push(document)
      } catch {
        // A missing sitemap is expected on many valid stores.
      }
    }
  }

  const productUrls = new Set<string>()
  for (const sitemap of sitemapDocuments) {
    const entries = extractCatalogSitemapUrls(sitemap.body, sitemap.url, input.maxProducts * 3)
    const nested = entries.filter(sitemapUrl).slice(0, 3)
    for (const nestedUrl of nested) {
      try {
        const nestedDocument = await fetch(nestedUrl)
        for (const entry of extractCatalogSitemapUrls(nestedDocument.body, nestedDocument.url, input.maxProducts * 3)) if (productPageUrl(entry)) productUrls.add(entry)
      } catch {
        issues.push(issue(input.sourceUrl, 'SITEMAP_ENTRY_UNAVAILABLE', 'Some sitemap entries could not be inspected.'))
      }
    }
    for (const entry of entries) if (productPageUrl(entry)) productUrls.add(entry)
  }
  if (productUrls.size > 0) {
    if (productUrls.size > MAX_GENERIC_PRODUCT_PAGES) issues.push(issue(input.sourceUrl, 'PARTIAL_SOURCE', `The source exposed more products than this review can inspect at once; the first ${MAX_GENERIC_PRODUCT_PAGES} were checked.`))
    for (const productUrl of [...productUrls].slice(0, Math.min(input.maxProducts, MAX_GENERIC_PRODUCT_PAGES))) {
      try {
        const document = await fetch(productUrl)
        if (!isHtml(document)) continue
        candidates.push(...extractCatalogProductsFromHtml(document.body, document.url))
        if (candidates.length >= input.maxProducts) break
      } catch {
        issues.push(issue(input.sourceUrl, 'PRODUCT_PAGE_UNAVAILABLE', 'Some product pages could not be inspected.'))
      }
    }
    if (candidates.length > 0) return { candidates: candidates.slice(0, input.maxProducts), fetchedUrls, issues, platform: 'SITEMAP' }
  }

  if (isHtml(landing)) {
    const discoveredLinks = extractCatalogProductLinksFromHtml(landing.body, landing.url, input.maxProducts)
    if (discoveredLinks.length > MAX_GENERIC_PRODUCT_PAGES) issues.push(issue(input.sourceUrl, 'PARTIAL_SOURCE', `The source exposed more product links than this review can inspect at once; the first ${MAX_GENERIC_PRODUCT_PAGES} were checked.`))
    for (const productUrl of discoveredLinks.slice(0, MAX_GENERIC_PRODUCT_PAGES)) {
      try {
        const document = await fetch(productUrl)
        if (!isHtml(document)) continue
        candidates.push(...extractCatalogProductsFromHtml(document.body, document.url))
        if (candidates.length >= input.maxProducts) break
      } catch {
        issues.push(issue(input.sourceUrl, 'PRODUCT_PAGE_UNAVAILABLE', 'Some discovered product pages could not be inspected.'))
      }
    }
    if (candidates.length > 0) return { candidates: candidates.slice(0, input.maxProducts), fetchedUrls, issues, platform: detectedPlatform ? 'SHOPIFY' : 'GENERIC_HTML' }
  }

  const renderedCandidates = await inspectWithBrowserRender(input, fetchedUrls, issues)
  if (renderedCandidates && renderedCandidates.length > 0) return { candidates: renderedCandidates, fetchedUrls, issues, platform: 'BROWSER_RENDER' }
  issues.push(issue(input.sourceUrl, 'NO_PRODUCTS_FOUND', 'We could not reliably find product data. Try Upload CSV or Add manually.'))
  return { candidates: [], fetchedUrls, issues, platform: detectedPlatform }
}
