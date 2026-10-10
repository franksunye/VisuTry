#!/usr/bin/env node
/**
 * G1-F evidence-only Delivery Factory receipt.
 * Does not apply configuration, access a database, validate storage credentials,
 * certify G2/G4, or accept operator assertions as external integration proof.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'

const SHA = /^[a-f0-9]{40}$/
const SOURCES = ['foundation', 'kiosk']
const EXPECTED_GATES = { foundation: 'G1-F-FOUNDATION', kiosk: 'G1-F-KIOSK-PRIVACY-EXECUTED' }
const NO_RELEASE = 'BLOCKED_PENDING_EXTERNAL_AND_DELIVERY_EVIDENCE'
const isObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v)

function assertReceiptManifest(manifest) {
  if (!isObject(manifest) || manifest.version !== 1
      || manifest.gate !== 'G1-F-DELIVERY-RECEIPT'
      || !Array.isArray(manifest.localScenarios)
      || manifest.localScenarios.length !== 5
      || !Array.isArray(manifest.remainingGates)
      || manifest.remainingGates.length < 4) throw Error('Invalid factory receipt manifest')
  const ids = new Set()
  const pairs = new Set()
  for (const row of manifest.localScenarios) {
    if (!isObject(row) || typeof row.id !== 'string' || !row.id
        || !SOURCES.includes(row.ledger) || typeof row.scenarioId !== 'string'
        || !row.scenarioId || !['MOCK_BOUNDED', 'LOCAL_DB_REAL'].includes(row.evidenceClass)
        || ids.has(row.id) || pairs.has(row.ledger + ':' + row.scenarioId)) throw Error('Invalid duplicate local scenario')
    ids.add(row.id)
    pairs.add(row.ledger + ':' + row.scenarioId)
  }
  for (const row of manifest.remainingGates) {
    if (!isObject(row) || typeof row.id !== 'string' || !row.id
        || typeof row.acceptance !== 'string' || !row.acceptance.trim()
        || ids.has(row.id)) throw Error('Invalid external gate')
    ids.add(row.id)
  }
}

function checkLedger(ledger, source, sourceSha, scenarioManifest) {
  if (!isObject(ledger)) return { status: 'NOT_TESTED', scenarios: new Map() }
  if (ledger.gate !== EXPECTED_GATES[source]
      || !isObject(ledger.evidence) || !SHA.test(ledger.evidence.sourceSha || '')
      || !Array.isArray(ledger.scenarios) || ledger.requiredCount !== scenarioManifest.required.length
      || ledger.scenarios.length !== scenarioManifest.required.length
      || !['MOCK', 'PREPARED_DEMO'].includes(ledger.evidence.mode)
      || !/^LOCAL\|local:(127\.0\.0\.1|localhost|\[::1\]):\d{1,5}\/[A-Za-z0-9_]+$/.test(ledger.evidence.claimedDatabaseMarker || '')) {
    return { status: 'INVALID_EVIDENCE', scenarios: new Map() }
  }
  if (ledger.evidence.sourceSha !== sourceSha) return { status: 'SOURCE_SHA_MISMATCH', scenarios: new Map() }
  const found = new Map()
  for (const scenario of ledger.scenarios) {
    const planned = scenarioManifest.required.find(x => x.id === scenario.id)
    if (!planned || found.has(scenario.id)
        || scenario.file !== planned.file || scenario.title !== planned.title
        || scenario.project !== planned.project) return { status: 'INVALID_EVIDENCE', scenarios: new Map() }
    found.set(scenario.id, scenario)
  }
  if (found.size !== scenarioManifest.required.length) return { status: 'INVALID_EVIDENCE', scenarios: new Map() }
  for (const scenario of found.values()) {
    if (scenario.status !== 'PASS' || scenario.executed !== true
        || scenario.attempts !== 1 || !Number.isFinite(scenario.durationMs)
        || scenario.durationMs < 0) return { status: 'BLOCKED', scenarios: new Map() }
  }
  if (ledger.result !== 'PASS' || ledger.counts?.PASS !== scenarioManifest.required.length
      || Object.entries(ledger.counts).some(([k,v]) => k !== 'PASS' && v !== 0)) {
    return { status: 'INVALID_EVIDENCE', scenarios: new Map() }
  }
  return { status: 'PASS', scenarios: found }
}

export function buildDeliveryFactoryReceipt({ manifest, sourceSha, foundationLedger, kioskLedger, foundationManifest, kioskManifest }) {
  assertReceiptManifest(manifest)
  if (!SHA.test(sourceSha || '')) throw Error('An exact source SHA is required')
  if (foundationManifest?.version !== 1 || foundationManifest.gate !== EXPECTED_GATES.foundation
      || kioskManifest?.version !== 1 || kioskManifest.gate !== EXPECTED_GATES.kiosk
      || !Array.isArray(foundationManifest.required) || !Array.isArray(kioskManifest.required))
    throw Error('Invalid current executable scenario manifests')
  const sourceManifests = { foundation: foundationManifest, kiosk: kioskManifest }
  const plannedPairs = new Set(manifest.localScenarios.map(s => s.ledger+':'+s.scenarioId))
  const currentPairs = new Set(SOURCES.flatMap(source => sourceManifests[source].required.map(row => source+':'+row.id)))
  if (plannedPairs.size !== currentPairs.size || [...currentPairs].some(x => !plannedPairs.has(x)))
    throw Error('Factory plan has drifted from executable RC scenario manifests')
  const inspected = {
    foundation: checkLedger(foundationLedger, 'foundation', sourceSha, foundationManifest),
    kiosk: checkLedger(kioskLedger, 'kiosk', sourceSha, kioskManifest),
  }
  const local = manifest.localScenarios.map(row => ({
    id: row.id,
    evidenceClass: row.evidenceClass,
    status: inspected[row.ledger].status === 'PASS' ? 'PASS' : inspected[row.ledger].status,
    attempts: inspected[row.ledger].scenarios.get(row.scenarioId)?.attempts ?? 0,
    durationMs: inspected[row.ledger].scenarios.get(row.scenarioId)?.durationMs ?? null,
  }))
  const remaining = manifest.remainingGates.map(row => ({
    id: row.id, status: 'NOT_TESTED', requiredAcceptance: row.acceptance,
  }))
  const localEvidenceComplete = local.every(row => row.status === 'PASS')
  return {
    schemaVersion: 1,
    gate: 'G1-F-DELIVERY-RECEIPT',
    sourceSha,
    classification: 'EVIDENCE_ONLY_NO_MUTATION',
    localExecuted: local.filter(x => x.status === 'PASS').length,
    localRequired: local.length,
    localEvidenceComplete,
    local,
    remaining,
    releaseReady: false,
    result: NO_RELEASE,
    caveat: 'LOCAL mock/DB checks cannot certify real Blob, successful public URL, approval/apply, handoff, G2 or G4. Database and paid-provider provenance must be verified independently.',
  }
}

function parseArgs(argv) {
  const options = {}
  for (let i=0; i<argv.length; i+=2) {
    const key = argv[i], value = argv[i+1]
    if (!key?.startsWith('--') || !value) throw Error('Expected --key value arguments')
    if (!['--manifest','--source-sha','--foundation-ledger','--kiosk-ledger','--foundation-manifest','--kiosk-manifest','--output'].includes(key) || options[key])
      throw Error('Unknown or duplicate CLI option')
    options[key.slice(2)] = value
  }
  return options
}
function readJson(path) { return JSON.parse(readFileSync(path, 'utf8')) }
function run() {
  const argv = parseArgs(process.argv.slice(2))
  if (!argv.manifest || !argv['source-sha'] || !argv.output) throw Error('Required --manifest --source-sha --output')
  const receipt = buildDeliveryFactoryReceipt({
    manifest: readJson(argv.manifest), sourceSha: argv['source-sha'],
    foundationLedger: argv['foundation-ledger'] ? readJson(argv['foundation-ledger']) : null,
    kioskLedger: argv['kiosk-ledger'] ? readJson(argv['kiosk-ledger']) : null,
    foundationManifest: readJson(argv['foundation-manifest'] || 'docs/engineering/merchant-rc-foundation.v1.json'),
    kioskManifest: readJson(argv['kiosk-manifest'] || 'docs/engineering/merchant-kiosk-rc.v1.json'),
  })
  writeFileSync(argv.output, JSON.stringify(receipt, null, 2) + '\n', { flag: 'w', mode: 0o600 })
  process.stdout.write(JSON.stringify({ sourceSha: receipt.sourceSha, localExecuted: receipt.localExecuted,
    localRequired: receipt.localRequired, localEvidenceComplete: receipt.localEvidenceComplete,
    releaseReady: false, result: receipt.result }) + '\n')
  // Distinguish evidence generation from pass certification.
  if (!receipt.localEvidenceComplete) process.exitCode = 2
}
if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  try { run() } catch (e) { console.error('DELIVERY_RECEIPT_BLOCKED: ' + (e instanceof Error ? e.message : 'invalid input')); process.exitCode = 2 }
}
