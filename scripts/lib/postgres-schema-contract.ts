import type { PrismaClient } from '@prisma/client'
import {
  countValue,
  EXPECTED_APPLICATION_TABLE_COUNT,
  queryRows,
  RAW_SQL_INVARIANTS,
  type ReadinessSqlRow,
} from './postgres-readiness'

type TableRow = ReadinessSqlRow & { name: string }
type EnumRow = ReadinessSqlRow & { name: string; labels: string[] }
type IndexRow = ReadinessSqlRow & { name: string; definition: string; partial: boolean }

export type SchemaContract = {
  tables: string[]
  tableCount: number
  enumLabels: Record<string, string[]>
  primaryKeyCount: number
  foreignKeyCount: number
  uniqueConstraintCount: number
  uniqueIndexCount: number
  checkConstraintCount: number
  rawSqlInvariants: string[]
  missingRawSqlInvariants: string[]
  rawSqlInvariantDefinitions: Record<string, string>
}

export type SchemaContractDiff = {
  issues: string[]
  source: SchemaContract
  target: SchemaContract
}

export async function inspectSchemaContract(client: PrismaClient): Promise<SchemaContract> {
  const tables = await queryRows<TableRow>(
    client,
    `SELECT tablename::text AS name
       FROM pg_catalog.pg_tables
      WHERE schemaname = 'public'
        AND tablename <> '_prisma_migrations'
      ORDER BY tablename`,
  )
  const enums = await queryRows<EnumRow>(
    client,
    `SELECT t.typname::text AS name,
            array_agg(e.enumlabel::text ORDER BY e.enumsortorder)::text[] AS labels
       FROM pg_catalog.pg_type t
       JOIN pg_catalog.pg_enum e ON e.enumtypid = t.oid
       JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
      WHERE n.nspname = 'public'
      GROUP BY t.typname
      ORDER BY t.typname`,
  )
  const constraintCounts = await queryRows<ReadinessSqlRow>(
    client,
    `SELECT contype::text AS type, COUNT(*)::bigint AS count
       FROM pg_catalog.pg_constraint c
       JOIN pg_catalog.pg_namespace n ON n.oid = c.connamespace
      WHERE n.nspname = 'public'
        AND contype IN ('p', 'f', 'u', 'c')
      GROUP BY contype`,
  )
  const invariantConstraints = await queryRows<ReadinessSqlRow>(
    client,
    `SELECT conname::text AS name, pg_get_constraintdef(c.oid, false)::text AS definition
       FROM pg_catalog.pg_constraint c
       JOIN pg_catalog.pg_namespace n ON n.oid = c.connamespace
      WHERE n.nspname = 'public'
        AND conname IN ('try_on_task_actor_check', 'Merchant_maxCompareFrames_check')`,
  )
  const invariantIndexes = await queryRows<IndexRow>(
    client,
    `SELECT index_rel.relname::text AS name,
            pg_get_indexdef(index_rel.oid)::text AS definition,
            (index_data.indpred IS NOT NULL) AS partial
       FROM pg_catalog.pg_index index_data
       JOIN pg_catalog.pg_class index_rel ON index_rel.oid = index_data.indexrelid
       JOIN pg_catalog.pg_class table_rel ON table_rel.oid = index_data.indrelid
       JOIN pg_catalog.pg_namespace n ON n.oid = table_rel.relnamespace
      WHERE n.nspname = 'public'
        AND index_rel.relname IN (
          'Experience_one_active_store_per_merchant_idx',
          'StoreAsset_deletedAt_deleteFailCount_lastDeleteAttemptAt_idx',
          'MerchantUsageLedger_merchantId_kind_createdAt_idx',
          'Merchant_commercialStatus_idx',
          'MerchantSession_merchantId_billableAICommerceSession_idx'
        )`,
  )
  const uniqueIndexes = await queryRows<ReadinessSqlRow>(
    client,
    `SELECT COUNT(*)::bigint AS count
       FROM pg_catalog.pg_index i
       JOIN pg_catalog.pg_class table_rel ON table_rel.oid = i.indrelid
       JOIN pg_catalog.pg_namespace n ON n.oid = table_rel.relnamespace
      WHERE i.indisunique
        AND n.nspname = 'public'
        AND table_rel.relkind = 'r'`,
  )

  const countByType = (type: string): number => {
    const row = constraintCounts.find((candidate) => candidate.type === type)
    return row ? countValue(row, 'count') : 0
  }
  const definitions = Object.fromEntries(
    [...invariantConstraints, ...invariantIndexes].map((row) => [
      String(row.name),
      String(row.definition),
    ]),
  )
  const present = RAW_SQL_INVARIANTS.filter((name) => {
    const definition = definitions[name]
    if (!definition) return false
    if (name !== 'Experience_one_active_store_per_merchant_idx') return true
    return invariantIndexes.some((index) => index.name === name && index.partial)
  })

  return {
    tables: tables.map((row) => row.name),
    tableCount: tables.length,
    enumLabels: Object.fromEntries(
      enums.map((row) => [row.name, [...(row.labels ?? [])]]),
    ),
    primaryKeyCount: countByType('p'),
    foreignKeyCount: countByType('f'),
    uniqueConstraintCount: countByType('u'),
    uniqueIndexCount: countValue(uniqueIndexes[0]!, 'count'),
    checkConstraintCount: countByType('c'),
    rawSqlInvariants: present,
    missingRawSqlInvariants: RAW_SQL_INVARIANTS.filter((name) => !present.includes(name)),
    rawSqlInvariantDefinitions: definitions,
  }
}

export function assertSchemaContract(
  contract: SchemaContract,
  label = 'PostgreSQL database',
): void {
  const issues: string[] = []
  if (contract.tableCount !== EXPECTED_APPLICATION_TABLE_COUNT) {
    issues.push(
      `${label} has ${contract.tableCount} application tables; expected ${EXPECTED_APPLICATION_TABLE_COUNT}.`,
    )
  }
  if (contract.primaryKeyCount === 0) issues.push(`${label} has no primary keys.`)
  if (contract.foreignKeyCount === 0) issues.push(`${label} has no foreign keys.`)
  if (contract.uniqueConstraintCount === 0 && contract.uniqueIndexCount === 0) {
    issues.push(`${label} has no unique constraints or unique indexes.`)
  }
  if (contract.missingRawSqlInvariants.length > 0) {
    issues.push(
      `${label} is missing raw SQL invariants: ${contract.missingRawSqlInvariants.join(', ')}.`,
    )
  }
  if (issues.length > 0) throw new Error(issues.join(' '))
}

export function compareSchemaContracts(
  source: SchemaContract,
  target: SchemaContract,
): SchemaContractDiff {
  const issues: string[] = []
  if (JSON.stringify(source.tables) !== JSON.stringify(target.tables)) {
    issues.push('application table names differ')
  }
  if (JSON.stringify(source.enumLabels) !== JSON.stringify(target.enumLabels)) {
    issues.push('enum labels differ')
  }
  for (const [name, sourceDefinition] of Object.entries(source.rawSqlInvariantDefinitions)) {
    if (target.rawSqlInvariantDefinitions[name] !== sourceDefinition) {
      issues.push(`raw SQL invariant definition differs: ${name}`)
    }
  }
  if (source.primaryKeyCount !== target.primaryKeyCount) issues.push('primary-key counts differ')
  if (source.foreignKeyCount !== target.foreignKeyCount) issues.push('foreign-key counts differ')
  if (source.uniqueConstraintCount !== target.uniqueConstraintCount) issues.push('unique-constraint counts differ')
  if (source.uniqueIndexCount !== target.uniqueIndexCount) issues.push('unique-index counts differ')
  if (source.checkConstraintCount !== target.checkConstraintCount) issues.push('check-constraint counts differ')
  return { issues, source, target }
}
