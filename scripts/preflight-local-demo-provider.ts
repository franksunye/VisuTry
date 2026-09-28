import { resolveLocalDemoProviderPolicy } from '../src/lib/local-demo-provider-policy'

const policy = resolveLocalDemoProviderPolicy()
console.log('\nLOCAL DEMO PROVIDER GATE')
console.log(`RUNTIME: ${process.env.VISUTRY_LOCAL_DEMO_RUNTIME === '1' ? 'PASS' : 'FAIL'}`)
console.log(`MODE: ${process.env.VISUTRY_LOCAL_DEMO_PROVIDER_MODE?.trim().toLowerCase() || 'blocked (default)'}`)

if (policy.kind === 'blocked') {
  console.log('PROVIDER DISPATCH: BLOCKED')
  console.log('GEMINI FALLBACK: DISABLED')
  console.log('PROVIDER CALLS: 0')
} else if (policy.kind === 'grsai') {
  console.log('PROVIDER DISPATCH: EXPLICIT GRSAI ARM VALID')
  console.log('GRSAI KEY: PRESENT (value hidden)')
  console.log(`GRSAI HOST: ${new URL(policy.baseUrl).hostname}`)
  console.log('GEMINI FALLBACK: DISABLED')
  console.log('PROVIDER CALLS: 0 (preflight only)')
} else {
  console.error(`PROVIDER GATE: FAIL — ${policy.kind === 'misconfigured' ? policy.reason : 'Local Demo runtime is not enabled.'}`)
  process.exitCode = 1
}
