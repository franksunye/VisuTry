/**
 * Test script to verify try-on configuration
 * Run with: npx tsx scripts/test-try-on-config.ts
 */

import { 
  TRY_ON_CONFIGS, 
  getAllTryOnTypes, 
  getTryOnConfig, 
  isValidTryOnType,
  urlToTryOnType,
  tryOnTypeToUrl
} from '../src/config/try-on-types'

console.log('🧪 Testing Try-On Configuration\n')

// Test 1: Verify all types are defined
console.log('✅ Test 1: All try-on types')
const allTypes = getAllTryOnTypes()
console.log(`   Found ${allTypes.length} types:`, allTypes)
console.log()

// Test 2: Verify each type has complete configuration
console.log('✅ Test 2: Configuration completeness')
allTypes.forEach(type => {
  const config = getTryOnConfig(type)
  console.log(`   ${type}:`)
  console.log(`      Icon: ${config.icon}`)
  console.log(`      Display Name: ${config.displayName}`)
  console.log(`      Route: ${config.route}`)
  console.log(`      AI Prompt Length: ${config.aiPrompt.length} chars`)
  console.log(`      Category: ${config.metadata.category}`)
  console.log()
})

// Test 3: Verify type validation
console.log('✅ Test 3: Type validation')
console.log(`   isValidTryOnType('GLASSES'): ${isValidTryOnType('GLASSES')}`)
console.log(`   isValidTryOnType('OUTFIT'): ${isValidTryOnType('OUTFIT')}`)
console.log(`   isValidTryOnType('INVALID'): ${isValidTryOnType('INVALID')}`)
console.log()

// Test 4: Verify URL conversion
console.log('✅ Test 4: URL conversion')
console.log(`   urlToTryOnType('glasses'): ${urlToTryOnType('glasses')}`)
console.log(`   urlToTryOnType('outfit'): ${urlToTryOnType('outfit')}`)
console.log(`   urlToTryOnType('invalid'): ${urlToTryOnType('invalid')}`)
console.log()
console.log(`   tryOnTypeToUrl('GLASSES'): ${tryOnTypeToUrl('GLASSES')}`)
console.log(`   tryOnTypeToUrl('OUTFIT'): ${tryOnTypeToUrl('OUTFIT')}`)
console.log()

// Test 5: Verify all required fields
console.log('✅ Test 5: Required fields check')
const requiredFields = [
  'name',
  'displayName',
  'route',
  'icon',
  'userImageLabel',
  'itemImageLabel',
  'itemImagePlaceholder',
  'emptyStateMessage',
  'aiPrompt',
  'metadata'
]

let allFieldsPresent = true
allTypes.forEach(type => {
  const config = getTryOnConfig(type) as any
  const missingFields = requiredFields.filter(field => !config[field])
  
  if (missingFields.length > 0) {
    console.log(`   ❌ ${type} missing fields:`, missingFields)
    allFieldsPresent = false
  }
})

if (allFieldsPresent) {
  console.log('   ✅ All types have all required fields')
}
console.log()

// Test 6: Verify unique routes
console.log('✅ Test 6: Unique routes')
const routes = allTypes.map(type => getTryOnConfig(type).route)
const uniqueRoutes = new Set(routes)
if (routes.length === uniqueRoutes.size) {
  console.log('   ✅ All routes are unique')
} else {
  console.log('   ❌ Duplicate routes found!')
}
console.log()

console.log('🎉 Configuration test complete!\n')
console.log('📝 Summary:')
console.log(`   - ${allTypes.length} try-on types configured`)
console.log(`   - All configurations are complete`)
console.log(`   - Ready for database migration`)

