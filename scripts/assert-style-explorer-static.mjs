import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

// Next.js prerender-manifest is the authoritative output, not a source-code
// `dynamic = 'force-static'` declaration that may still be defeated elsewhere.
const manifest = JSON.parse(readFileSync('.next/prerender-manifest.json', 'utf8'))
const locales = ['en', 'id', 'ar', 'ru', 'de', 'ja', 'es', 'pt', 'fr']

for (const locale of locales) {
  const route = `/${locale}/style-explorer`
  assert.ok(manifest.routes[route], `${route} did not prerender as a static HTML route`)
  assert.equal(manifest.routes[route].initialRevalidateSeconds, false,
    `${route} should not trigger ISR regeneration`)
}

console.log(`PASS: ${locales.length} Style Explorer locales have static prerender entries`)
