import fs from 'node:fs'
import { spawnSync } from 'node:child_process'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const dotenv = require('dotenv')
const { loadEnvConfig } = require('@next/env')
const root = process.cwd()
const processValues = { ...process.env }
const envFiles = ['.env.development.local', '.env.local', '.env.development', '.env']
const fileValues = new Map()
for (const file of envFiles) {
  const filePath = `${root}/${file}`
  if (fs.existsSync(filePath)) fileValues.set(file, dotenv.parse(fs.readFileSync(filePath)))
}

loadEnvConfig(root, true)

function sourceFor(key) {
  if (processValues[key]) return 'process environment'
  for (const file of envFiles) {
    if (fileValues.get(file)?.[key]) return file
  }
  return 'ABSENT'
}

function hostFor(value) {
  if (!value) return 'ABSENT'
  try { return new URL(value).hostname } catch { return 'INVALID' }
}

const localChecks = [
  ['APP_ENV', process.env.APP_ENV === 'local' && !process.env.VERCEL_ENV],
  ['NEXTAUTH_URL', hostFor(process.env.NEXTAUTH_URL) === '127.0.0.1'],
  ['NEXT_PUBLIC_SITE_URL', hostFor(process.env.NEXT_PUBLIC_SITE_URL) === '127.0.0.1'],
  ['MediaPipe WASM URL', process.env.NEXT_PUBLIC_MEDIAPIPE_WASM_BASE_URL === 'http://127.0.0.1:4100/0.10.35/wasm'],
  ['MediaPipe model URL', process.env.NEXT_PUBLIC_MEDIAPIPE_MODEL_URL === 'http://127.0.0.1:4100/0.10.35/models/face_landmarker.task'],
  ['Stripe billing mode', process.env.STRIPE_MERCHANT_BILLING_MODE?.toLowerCase() === 'test'],
  ['Stripe secret mode', !process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY.startsWith('sk_test_')],
  ['Local Demo runtime marker', process.env.VISUTRY_LOCAL_DEMO_RUNTIME === '1'],
]

console.log('LOCAL DEMO RUNTIME PREFLIGHT')
for (const [label, passed] of localChecks) console.log(`${label}: ${passed ? 'PASS' : 'FAIL'}`)

const providerRows = [
  ['GRSAI_API_KEY', process.env.GRSAI_API_KEY],
  ['GRSAI_BASE_URL', process.env.GRSAI_BASE_URL],
  ['GEMINI_API_KEY fallback', process.env.GEMINI_API_KEY],
  ['GEMINI_API_BASE_URL fallback', process.env.GEMINI_API_BASE_URL],
]
for (const [label, value] of providerRows) {
  const key = label.replace(' fallback', '')
  const source = sourceFor(key)
  const detail = value ? `PRESENT — ${source}${label.includes('BASE_URL') ? `, host ${hostFor(value)}` : ''}` : 'ABSENT'
  console.log(`${label}: ${detail}`)
}
console.log(`Blob token: ${process.env.BLOB_READ_WRITE_TOKEN ? `PRESENT — ${sourceFor('BLOB_READ_WRITE_TOKEN')}` : 'ABSENT'}`)
console.log('Store photo/result storage: filesystem-backed Local MOCK; startup makes no provider calls.')

if (localChecks.some(([, passed]) => !passed)) {
  process.exitCode = 1
} else {
  const schemaCheck = spawnSync('npx', [
    'prisma', 'migrate', 'diff', '--from-config-datasource', '--to-schema',
    'prisma/schema.prisma', '--exit-code',
  ], { encoding: 'utf8', env: process.env })
  const schemaReady = schemaCheck.status === 0
  console.log(`SCHEMA PARITY: ${schemaReady ? 'PASS' : 'FAIL'} — ${schemaReady ? 'Prisma schema matches Local PostgreSQL' : 'Run: npm run demo:local:bootstrap'}`)
  if (!schemaReady) process.exitCode = 1

  const providerCheck = spawnSync('npx', ['tsx', 'scripts/preflight-local-demo-provider.ts'], {
    encoding: 'utf8', env: process.env,
  })
  if (providerCheck.stdout) process.stdout.write(providerCheck.stdout)
  if (providerCheck.stderr) process.stderr.write(providerCheck.stderr)
  if (providerCheck.status !== 0) process.exitCode = 1
}
