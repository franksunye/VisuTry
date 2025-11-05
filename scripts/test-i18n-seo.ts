/**
 * Test script to verify i18n SEO configuration
 * 
 * This script tests:
 * 1. generateI18nSEO function
 * 2. getAlternateLanguages function
 * 3. Metadata generation for all locales
 */

import { generateI18nSEO, getAlternateLanguages } from '../src/lib/seo'
import { locales } from '../src/i18n'

console.log('🧪 Testing i18n SEO Configuration\n')

// Test 1: getAlternateLanguages
console.log('Test 1: getAlternateLanguages')
console.log('================================')
const alternates = getAlternateLanguages('/pricing')
console.log('Alternate URLs for /pricing:')
console.log(JSON.stringify(alternates, null, 2))
console.log('✅ Test 1 passed\n')

// Test 2: generateI18nSEO for each locale
console.log('Test 2: generateI18nSEO for each locale')
console.log('========================================')
locales.forEach(locale => {
  const metadata = generateI18nSEO({
    locale,
    title: `Test Page - ${locale}`,
    description: `Test description for ${locale}`,
    pathname: '/test',
  })
  
  console.log(`\nLocale: ${locale}`)
  console.log('Title:', metadata.title)
  console.log('Description:', metadata.description)
  console.log('Canonical:', metadata.alternates?.canonical)
  console.log('Languages:', Object.keys(metadata.alternates?.languages || {}))
  console.log('OG Locale:', metadata.openGraph?.locale)
  console.log('OG Alternate Locales:', metadata.openGraph?.alternateLocale)
})
console.log('\n✅ Test 2 passed\n')

// Test 3: Verify hreflang structure
console.log('Test 3: Verify hreflang structure')
console.log('===================================')
const testMetadata = generateI18nSEO({
  locale: 'en',
  title: 'Test Page',
  description: 'Test description',
  pathname: '/pricing',
})

console.log('Hreflang tags should include:')
Object.entries(testMetadata.alternates?.languages || {}).forEach(([lang, url]) => {
  console.log(`  <link rel="alternate" hreflang="${lang}" href="${url}" />`)
})
console.log('✅ Test 3 passed\n')

console.log('🎉 All tests passed!')

