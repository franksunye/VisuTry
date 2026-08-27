# JS-heavy Merchant Catalog Rendering

The Human Merchant catalog inspector is URL-first, not URL-only. It first tries deterministic extraction in this order:

1. Shopify product JSON
2. JSON-LD and other structured ecommerce data
3. Sitemap/product URL discovery
4. Server-rendered HTML
5. Cloudflare Browser Rendering, when explicitly configured

If the renderer is not configured or fails, inspection remains read-only and the UI offers CSV or Manual import.

## Production configuration

VisuTry's Next/Vercel runtime calls Cloudflare Browser Rendering's REST content endpoint. Configure the following as Vercel **Production** environment variables:

```text
MERCHANT_BROWSER_RENDERING_ENABLED=true
CLOUDFLARE_BROWSER_RENDERING_ACCOUNT_ID=<Cloudflare account ID>
CLOUDFLARE_BROWSER_RENDERING_API_TOKEN=<scoped token>
```

Create a scoped Cloudflare API token for the account that owns Browser Rendering. Grant only the Browser Rendering write/edit permission required by the content endpoint. Do not put the token in the repository, browser code, `NEXT_PUBLIC_*` variables, logs, or support screenshots.

After adding or rotating the variables, redeploy the Production target. Vercel applies environment variables to new deployments; an existing deployment will not receive a newly added token.

## Runtime safeguards

The adapter sends only the merchant's public URL and does not forward cookies, authorization headers, or user credentials. It validates the URL before the provider call, requires same-origin final URLs and redirect-chain URLs, rechecks the final hostname, bounds navigation and response size, and converts provider failures into the normal CSV/Manual fallback.

The renderer is deliberately used only after deterministic extraction fails, including when the initial server-side fetch is blocked by a store's bot protection. It is not a universal crawler and does not make an AI call during discovery. AI/vision enrichment, if added later, must operate on the approved canonical product facts.

## Verification

Use a controlled JS-heavy test store and confirm:

- URL inspection reports a preview rather than writing immediately.
- The preview contains canonical name, image, product URL, SKU/variant where available, and price/currency where available.
- Cross-origin redirects and private/reserved destinations are rejected.
- Renderer timeout/error returns `Upload CSV` and `Add manually`.
- Approval imports only the ready subset and a repeated approval does not create a duplicate frame.
