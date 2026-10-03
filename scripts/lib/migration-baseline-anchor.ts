export type MigrationBaselineLedgerCounts = {
  total: string | number
  finished: string | number
  rolledBack: string | number
  unfinished: string | number
  checksumMatches: string | number
}

export type MigrationBaselineLedgerState = 'absent' | 'applied' | 'invalid'

function parseCount(value: string | number): number | null {
  const text = String(value)
  if (!/^\d+$/.test(text)) return null
  const parsed = Number(text)
  return Number.isSafeInteger(parsed) ? parsed : null
}

export function classifyMigrationBaselineLedger(
  counts: MigrationBaselineLedgerCounts,
): MigrationBaselineLedgerState {
  const total = parseCount(counts.total)
  const finished = parseCount(counts.finished)
  const rolledBack = parseCount(counts.rolledBack)
  const unfinished = parseCount(counts.unfinished)
  const checksumMatches = parseCount(counts.checksumMatches)

  if ([total, finished, rolledBack, unfinished, checksumMatches].some((value) => value === null)) {
    return 'invalid'
  }

  if (
    total === 0 &&
    finished === 0 &&
    rolledBack === 0 &&
    unfinished === 0 &&
    checksumMatches === 0
  ) {
    return 'absent'
  }
  if (
    total === 1 &&
    finished === 1 &&
    rolledBack === 0 &&
    unfinished === 0 &&
    checksumMatches === 1
  ) {
    return 'applied'
  }
  return 'invalid'
}
