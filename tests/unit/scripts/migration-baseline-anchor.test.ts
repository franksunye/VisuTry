import { classifyMigrationBaselineLedger } from '../../../scripts/lib/migration-baseline-anchor'

describe('classifyMigrationBaselineLedger', () => {
  it('accepts exactly one finished, non-rolled-back baseline adoption row', () => {
    expect(
      classifyMigrationBaselineLedger({
        total: '1',
        finished: '1',
        rolledBack: '0',
        unfinished: '0',
        checksumMatches: '1',
      }),
    ).toBe('applied')
  })

  it('distinguishes a genuinely absent anchor', () => {
    expect(
      classifyMigrationBaselineLedger({
        total: '0',
        finished: '0',
        rolledBack: '0',
        unfinished: '0',
        checksumMatches: '0',
      }),
    ).toBe('absent')
  })

  it.each([
    ['rolled back only', { total: '1', finished: '0', rolledBack: '1', unfinished: '0', checksumMatches: '0' }],
    ['unfinished/failed only', { total: '1', finished: '0', rolledBack: '0', unfinished: '1', checksumMatches: '0' }],
    ['finished plus rolled-back duplicate', { total: '2', finished: '1', rolledBack: '1', unfinished: '0', checksumMatches: '1' }],
    ['duplicate finished rows', { total: '2', finished: '2', rolledBack: '0', unfinished: '0', checksumMatches: '2' }],
    ['finished checksum mismatch', { total: '1', finished: '1', rolledBack: '0', unfinished: '0', checksumMatches: '0' }],
    ['contradictory empty aggregate', { total: '0', finished: '1', rolledBack: '0', unfinished: '0', checksumMatches: '0' }],
    ['malformed count', { total: 'unknown', finished: '0', rolledBack: '0', unfinished: '0', checksumMatches: '0' }],
  ])('fails closed for %s', (_label, counts) => {
    expect(classifyMigrationBaselineLedger(counts)).toBe('invalid')
  })
})
