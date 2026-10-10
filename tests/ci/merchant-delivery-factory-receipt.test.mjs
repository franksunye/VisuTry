import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { buildDeliveryFactoryReceipt } from '../../scripts/merchant-delivery-factory-receipt.mjs'

const src = 'a'.repeat(40)
const manifest = JSON.parse(readFileSync('docs/engineering/merchant-delivery-factory-receipt.v1.json','utf8'))
const foundationManifest = JSON.parse(readFileSync('docs/engineering/merchant-rc-foundation.v1.json','utf8'))
const kioskManifest = JSON.parse(readFileSync('docs/engineering/merchant-kiosk-rc.v1.json','utf8'))
function ledger(m, sourceSha=src) {
  return { schemaVersion:1, gate:m.gate, requiredCount:m.required.length, result:'PASS',
    evidence:{sourceSha,claimedDatabaseMarker:'LOCAL|local:127.0.0.1:5432/visutry_merchant_rc',mode:'MOCK'},
    counts:{PASS:m.required.length,FAILED:0,SKIPPED:0,NOT_TESTED:0,FLAKY:0,AMBIGUOUS:0},
    scenarios:m.required.map(row=>({...row,status:'PASS',executed:true,attempts:1,durationMs:1000})),
  }
}
const evaluate=(f=ledger(foundationManifest),k=ledger(kioskManifest), overrides={}) =>
  buildDeliveryFactoryReceipt({manifest,sourceSha:src,foundationLedger:f,kioskLedger:k,
    foundationManifest,kioskManifest,...overrides})
test('same-source real browser ledgers produce local complete but never commercial release ready',()=>{
  const r=evaluate()
  assert.equal(r.localExecuted,5)
  assert.equal(r.localEvidenceComplete,true)
  assert.equal(r.releaseReady,false)
  assert.equal(r.result,'BLOCKED_PENDING_EXTERNAL_AND_DELIVERY_EVIDENCE')
  assert.ok(r.remaining.some(g=>g.id==='qa-blob-upload'&&g.status==='NOT_TESTED'))
  assert.equal(r.local.find(x=>x.id==='native-photo-mock-blob').evidenceClass,'MOCK_BOUNDED')
  assert.equal(JSON.stringify(r).includes('claimedDatabaseMarker'),false)
})
test('no ledgers fail closed and cannot fabricate a local pass',()=>{
  const r=evaluate(null,null)
  assert.equal(r.localExecuted,0)
  assert.ok(r.local.every(s=>s.status==='NOT_TESTED'))
  assert.equal(r.localEvidenceComplete,false)
})
test('old PR ledgers are not accepted as evidence for a different main SHA',()=>{
  const r=evaluate(ledger(foundationManifest,'b'.repeat(40)),ledger(kioskManifest))
  assert.equal(r.localExecuted,1)
  assert.equal(r.local[0].status,'SOURCE_SHA_MISMATCH')
})
test('skip, retry, missing scenario, wrong test title and invalid gate never count',()=>{
  const skipped=ledger(foundationManifest)
  skipped.scenarios[0].status='SKIPPED'
  assert.equal(evaluate(skipped).localExecuted,1)
  const retried=ledger(foundationManifest)
  retried.scenarios[0].attempts=2
  assert.equal(evaluate(retried).localExecuted,1)
  const wrong=ledger(foundationManifest)
  wrong.scenarios[0].title='another scenario'
  assert.equal(evaluate(wrong).localExecuted,1)
  const evil=ledger(kioskManifest)
  evil.gate='G4-COMMERCIAL-READY'
  assert.equal(evaluate(ledger(foundationManifest),evil).localExecuted,4)
})
test('rejects contract drift, unknown extra scenarios, and malformed expected SHA',()=>{
  const corrupted=structuredClone(manifest)
  corrupted.localScenarios[0].scenarioId='renamed'
  assert.throws(()=>evaluate(undefined,undefined,{manifest:corrupted}),/drift/)
  const duplicate=structuredClone(manifest)
  duplicate.localScenarios[1].id=duplicate.localScenarios[0].id
  assert.throws(()=>evaluate(undefined,undefined,{manifest:duplicate}),/duplicate/)
  assert.throws(()=>evaluate(undefined,undefined,{sourceSha:'main'}),/exact source SHA/)
})
