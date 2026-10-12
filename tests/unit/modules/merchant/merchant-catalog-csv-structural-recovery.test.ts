/** @jest-environment node */
import {
  buildCatalogInspectionProposal,
  parseCatalogCsv,
} from '@/modules/merchant/application/merchant-catalog-source-shared'

const header = 'sku,name,imageUrl,productUrl,shape,brand,price'
const complete = 'GOOD-1,Good frame,https://cdn.example.test/good.jpg,https://shop.example.test/products/good,round,Example,89.00'
const shifted = 'BAD-2,Shifted frame,https://cdn.example.test/bad.jpg,https://shop.example.test/products/bad,round,Example,99.00,unexpected'
const shortened = 'BAD-3,Short frame,https://cdn.example.test/short.jpg,https://shop.example.test/products/short,round,Example'

async function review(text: string) {
  const parsed = parseCatalogCsv(text)
  const result = await buildCatalogInspectionProposal({
    manualProducts: parsed.products,
    existing: [],
    fetchSource: async () => { throw new Error('CSV inspection must not fetch network resources.') },
    initialSourceIssues: parsed.issues.map((item) => ({
      sourceUrl: 'csv://merchant-upload', code: item.code,
      message: `Row ${item.row}: ${item.message}`,
    })),
  })
  return { parsed, result }
}

describe('First Value CSV structural recovery', () => {
  it('rejects shifted-column rows from approval while preserving valid rows for explicit review', async () => {
    const { parsed, result } = await review([header, complete, shifted].join('\n'))
    expect(parsed.issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ row: 3, code: 'CSV_COLUMN_MISMATCH' }),
    ]))
    expect(result.candidates).toEqual(expect.arrayContaining([
      expect.objectContaining({ sku: 'BAD-2', importReady: false,
        issues: expect.arrayContaining(['CSV_COLUMN_MISMATCH']) }),
      expect.objectContaining({ sku: 'GOOD-1', importReady: true }),
    ]))
    expect(result.importReady).toEqual([expect.objectContaining({ sku: 'GOOD-1' })])
    expect(result.sourceSummary.sourceIssues).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'CSV_COLUMN_MISMATCH' }),
    ]))
    expect(result.writePerformed).toBe(false)
    expect(result.requiresApproval).toBe(true)
  })

  it('does not silently import a truncated row with otherwise sufficient product identity', async () => {
    const { parsed, result } = await review([header, shortened].join('\n'))
    expect(parsed.products[0]).toMatchObject({
      sku: 'BAD-3', sourceIssues: expect.arrayContaining(['CSV_COLUMN_MISMATCH']),
    })
    expect(result.importReady).toHaveLength(0)
    expect(result.candidates[0]).toMatchObject({ importReady: false, readiness: 'NEEDS_REVIEW' })
    expect(result.writePerformed).toBe(false)
  })

  it('marks an unclosed quoted data row as malformed even if required values are otherwise present', async () => {
    const text = [header, complete,
      'BAD-4,"Unclosed name,https://cdn.example.test/f.jpg,https://shop.example.test/products/bad,round,Example,99.00',
    ].join('\n')
    const { parsed, result } = await review(text)
    expect(parsed.issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ row: 3, code: 'CSV_MALFORMED' }),
    ]))
    expect(result.candidates[1]).toMatchObject({
      importReady: false, issues: expect.arrayContaining(['CSV_MALFORMED']),
    })
    expect(result.importReady).toEqual([expect.objectContaining({ sku: 'GOOD-1' })])
  })

  it('continues to accept correctly quoted commas as one column', async () => {
    const line = 'OK-5,"Modern, round frame",https://cdn.example.test/ok.jpg,https://shop.example.test/products/ok,round,Example,69.00'
    const { parsed, result } = await review([header, line].join('\n'))
    expect(parsed.issues).toEqual([])
    expect(parsed.products[0].name).toBe('Modern, round frame')
    expect(result.importReady).toEqual([expect.objectContaining({ sku: 'OK-5' })])
  })

  it('rejects malformed header quoting rather than guessing which column a value belongs to', () => {
    expect(() => parseCatalogCsv('"sku,name,imageUrl\nGOOD-1,Frame,https://cdn.example.test/f.jpg'))
      .toThrow('CSV header contains an unclosed quoted field')
  })
})
