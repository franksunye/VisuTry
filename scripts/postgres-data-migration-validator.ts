import type { PrismaClient } from '@prisma/client'
import {
  assertPostgresConnectionString,
  assertReadinessTargetSafety,
  countValue,
  createReadinessPrismaClient,
  jsonSafe,
  printJson,
  quoteIdentifier,
  queryOne,
  queryRows,
  redactErrorMessage,
  redactPostgresConnectionString,
  requireEnvironmentVariable,
  requireLocalReadinessEnvironment,
  type ReadinessSqlRow,
} from './lib/postgres-readiness'
import {
  assertSchemaContract,
  compareSchemaContracts,
  inspectSchemaContract,
  type SchemaContract,
} from './lib/postgres-schema-contract'

type ForeignKeyRow = {
  name: string
  child_table: string
  parent_table: string
  child_columns: string[]
  parent_columns: string[]
}
type UniqueIndexRow = {
  index_name: string
  table_name: string
  columns: string[]
}
type RequiredColumnRow = { table_name: string; column_name: string }
type TypedColumnRow = { table_name: string; column_name: string; data_type: string }
type TimestampColumnRow = TypedColumnRow

type CountRow = ReadinessSqlRow & { count: bigint }

type BusinessMetrics = {
  user: {
    rows: number
    accounts: number
    sessions: number
    creditsPurchased: number
    creditsUsed: number
    premiumUsers: number
    subscriptionTypes: Record<string, number>
  }
  payment: {
    rows: number
    statuses: Record<string, number>
    amountSum: number
    creditsRevokedSum: number
  }
  tryOn: {
    rows: number
    statuses: Record<string, number>
    origins: Record<string, number>
    merchantOwnershipOrphans: number
    settledRows: number
    quotaSourceRows: number
  }
  merchantUsage: {
    rows: number
    byKind: Record<string, number>
    byMerchantRowCounts: number[]
  }
  sponsoredUsage: {
    rows: number
    byStatus: Record<string, number>
    byType: Record<string, number>
  }
  generation: {
    requests: number
    attempts: number
    orphanAttempts: number
    requestAttemptCountMismatches: number
  }
}

type DataValidationResult = {
  pass: boolean
  issues: string[]
  source: {
    target: string
    schema: PublicSchemaContract
  }
  target: {
    target: string
    schema: PublicSchemaContract
  }
  tableRows: Array<{ table: string; sourceRows: number; targetRows: number; match: boolean }>
  foreignKeyOrphans: { source: number; target: number; match: boolean }
  uniqueViolations: { source: number; target: number; match: boolean }
  requiredNullViolations: { source: number; target: number; match: boolean }
  checkViolations: { source: number; target: number; match: boolean }
  typedValueFingerprints: { source: number; target: number; match: boolean }
  timestamps: { source: number; target: number; match: boolean }
  defaults: { source: number; target: number; match: boolean }
  sequences: { source: number; target: number; match: boolean }
  business: { source: BusinessMetrics; target: BusinessMetrics; match: boolean } | null
}

type BusinessValidationResult = {
  pass: boolean
  issues: string[]
  source: { target: string; business: BusinessMetrics }
  target: { target: string; business: BusinessMetrics }
}

type PublicSchemaContract = Omit<SchemaContract, 'rawSqlInvariantDefinitions'>

function publicSchemaContract(contract: SchemaContract): PublicSchemaContract {
  const { rawSqlInvariantDefinitions: _definitions, ...publicContract } = contract
  return publicContract
}

async function countQuery(client: PrismaClient, sql: string): Promise<number> {
  return countValue(await queryOne<CountRow>(client, sql), 'count')
}

async function rowCounts(
  client: PrismaClient,
  tables: string[],
): Promise<Record<string, number>> {
  const result: Record<string, number> = {}
  for (const table of tables) {
    result[table] = await countQuery(
      client,
      `SELECT COUNT(*)::bigint AS count FROM ${quoteIdentifier(table)}`,
    )
  }
  return result
}

async function foreignKeyOrphans(client: PrismaClient): Promise<number> {
  const foreignKeys = await queryRows<ForeignKeyRow>(
    client,
    `SELECT c.conname::text AS name,
            child.relname::text AS child_table,
            parent.relname::text AS parent_table,
            ARRAY(
              SELECT child_attr.attname::text
                FROM unnest(c.conkey) WITH ORDINALITY AS child_key(attnum, position)
                JOIN pg_catalog.pg_attribute child_attr
                  ON child_attr.attrelid = c.conrelid
                 AND child_attr.attnum = child_key.attnum
               WHERE NOT child_attr.attisdropped
               ORDER BY child_key.position
            ) AS child_columns,
            ARRAY(
              SELECT parent_attr.attname::text
                FROM unnest(c.confkey) WITH ORDINALITY AS parent_key(attnum, position)
                JOIN pg_catalog.pg_attribute parent_attr
                  ON parent_attr.attrelid = c.confrelid
                 AND parent_attr.attnum = parent_key.attnum
               WHERE NOT parent_attr.attisdropped
               ORDER BY parent_key.position
            ) AS parent_columns
       FROM pg_catalog.pg_constraint c
       JOIN pg_catalog.pg_class child ON child.oid = c.conrelid
       JOIN pg_catalog.pg_class parent ON parent.oid = c.confrelid
       JOIN pg_catalog.pg_namespace child_ns ON child_ns.oid = child.relnamespace
       JOIN pg_catalog.pg_namespace parent_ns ON parent_ns.oid = parent.relnamespace
      WHERE c.contype = 'f'
        AND child_ns.nspname = 'public'
        AND parent_ns.nspname = 'public'
      ORDER BY c.conname`,
  )
  let total = 0
  for (const foreignKey of foreignKeys) {
    if (
      foreignKey.child_columns.length === 0 ||
      foreignKey.child_columns.length !== foreignKey.parent_columns.length
    ) {
      throw new Error(`Could not inspect foreign-key columns for ${foreignKey.name}.`)
    }
    const child = quoteIdentifier(foreignKey.child_table)
    const parent = quoteIdentifier(foreignKey.parent_table)
    const join = foreignKey.child_columns
      .map((column, index) => `child.${quoteIdentifier(column)} = parent.${quoteIdentifier(foreignKey.parent_columns[index]!)}`)
      .join(' AND ')
    const nonNull = foreignKey.child_columns
      .map((column) => `child.${quoteIdentifier(column)} IS NOT NULL`)
      .join(' AND ')
    total += await countQuery(
      client,
      `SELECT COUNT(*)::bigint AS count
         FROM ${child} AS child
         LEFT JOIN ${parent} AS parent ON ${join}
        WHERE ${nonNull}
          AND parent.${quoteIdentifier(foreignKey.parent_columns[0]!)} IS NULL`,
    )
  }
  return total
}

async function uniqueViolations(client: PrismaClient): Promise<number> {
  const indexes = await queryRows<UniqueIndexRow>(
    client,
    `SELECT idx.relname::text AS index_name,
            table_rel.relname::text AS table_name,
            ARRAY(
              SELECT attribute.attname::text
                FROM unnest(index_data.indkey) WITH ORDINALITY AS index_key(attnum, position)
                JOIN pg_catalog.pg_attribute attribute
                  ON attribute.attrelid = index_data.indrelid
                 AND attribute.attnum = index_key.attnum
               WHERE NOT attribute.attisdropped
                 AND index_key.position <= index_data.indnkeyatts
               ORDER BY index_key.position
            ) AS columns
       FROM pg_catalog.pg_index index_data
       JOIN pg_catalog.pg_class idx ON idx.oid = index_data.indexrelid
       JOIN pg_catalog.pg_class table_rel ON table_rel.oid = index_data.indrelid
       JOIN pg_catalog.pg_namespace namespace ON namespace.oid = table_rel.relnamespace
      WHERE index_data.indisunique
        AND index_data.indpred IS NULL
        AND index_data.indexprs IS NULL
        AND NOT (0 = ANY(index_data.indkey))
        AND table_rel.relkind = 'r'
        AND namespace.nspname = 'public'
      ORDER BY table_rel.relname, idx.relname`,
  )
  let total = 0
  for (const index of indexes) {
    const columns = index.columns.map((column) => quoteIdentifier(column))
    if (columns.length === 0) continue
    const table = quoteIdentifier(index.table_name)
    const nonNull = columns.map((column) => `${column} IS NOT NULL`).join(' AND ')
    total += await countQuery(
      client,
      `SELECT COUNT(*)::bigint AS count
         FROM (
           SELECT ${columns.join(', ')}, COUNT(*)
             FROM ${table}
            WHERE ${nonNull}
            GROUP BY ${columns.join(', ')}
           HAVING COUNT(*) > 1
         ) AS duplicate_groups`,
    )
  }
  return total
}

async function requiredNullViolations(client: PrismaClient): Promise<number> {
  const columns = await queryRows<RequiredColumnRow>(
    client,
    `SELECT table_name, column_name
       FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name <> '_prisma_migrations'
        AND is_nullable = 'NO'
      ORDER BY table_name, ordinal_position`,
  )
  let total = 0
  for (const column of columns) {
    total += await countQuery(
      client,
      `SELECT COUNT(*)::bigint AS count
         FROM ${quoteIdentifier(column.table_name)}
        WHERE ${quoteIdentifier(column.column_name)} IS NULL`,
    )
  }
  return total
}

async function typedValueFingerprintRows(client: PrismaClient): Promise<Record<string, string>> {
  const columns = await queryRows<TypedColumnRow>(
    client,
    `SELECT table_name, column_name, data_type
       FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name <> '_prisma_migrations'
        AND (data_type IN ('json', 'jsonb') OR data_type = 'ARRAY')
      ORDER BY table_name, ordinal_position`,
  )
  const result: Record<string, string> = {}
  for (const column of columns) {
    const table = quoteIdentifier(column.table_name)
    const field = quoteIdentifier(column.column_name)
    const expression = `COALESCE(${field}::text, '<NULL>')`
    const row = await queryOne<ReadinessSqlRow>(
      client,
      `SELECT COUNT(*)::bigint AS rows,
              COUNT(*) FILTER (WHERE ${field} IS NOT NULL)::bigint AS non_null,
              COALESCE(
                md5(string_agg(md5(${expression}), ',' ORDER BY md5(${expression}), ${expression})),
                md5('')
              ) AS digest
         FROM ${table}`,
    )
    result[`${column.table_name}.${column.column_name}`] = [
      String(row.rows),
      String(row.non_null),
      String(row.digest),
    ].join(':')
  }
  return result
}

async function timestampFingerprintRows(client: PrismaClient): Promise<Record<string, string>> {
  const columns = await queryRows<TimestampColumnRow>(
    client,
    `SELECT table_name, column_name, data_type
       FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name <> '_prisma_migrations'
        AND column_name IN (
          'createdAt', 'updatedAt', 'startedAt', 'completedAt', 'submittedAt',
          'expiresAt', 'lastActiveAt', 'reservedAt', 'consumedAt', 'releasedAt'
        )
        AND data_type LIKE 'timestamp%'
      ORDER BY table_name, ordinal_position`,
  )
  const result: Record<string, string> = {}
  for (const column of columns) {
    const table = quoteIdentifier(column.table_name)
    const field = quoteIdentifier(column.column_name)
    const row = await queryOne<ReadinessSqlRow>(
      client,
      `SELECT COUNT(*)::bigint AS rows,
              COUNT(${field})::bigint AS non_null,
              COALESCE(MIN(${field})::text, '') AS min_value,
              COALESCE(MAX(${field})::text, '') AS max_value
         FROM ${table}`,
    )
    result[`${column.table_name}.${column.column_name}`] = [
      String(row.rows),
      String(row.non_null),
      String(row.min_value),
      String(row.max_value),
    ].join(':')
  }
  return result
}

async function defaultRows(client: PrismaClient): Promise<string[]> {
  const rows = await queryRows<ReadinessSqlRow>(
    client,
    `SELECT table_name, column_name, COALESCE(column_default, '') AS column_default
       FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name <> '_prisma_migrations'
      ORDER BY table_name, ordinal_position`,
  )
  return rows.map((row) => `${row.table_name}.${row.column_name}=${row.column_default}`)
}

async function sequenceRows(client: PrismaClient): Promise<string[]> {
  const rows = await queryRows<ReadinessSqlRow>(
    client,
    `SELECT schemaname::text, sequencename::text, data_type::text,
            start_value::text, increment_by::text, min_value::text,
            max_value::text, cycle::text, cache_size::text, last_value::text
       FROM pg_catalog.pg_sequences
      WHERE schemaname = 'public'
      ORDER BY sequencename`,
  )
  return rows.map((row) => JSON.stringify(jsonSafe(row)))
}

async function rawCheckViolations(client: PrismaClient): Promise<number> {
  const tryOnTask = await countQuery(
    client,
    `SELECT COUNT(*)::bigint AS count
       FROM "TryOnTask"
      WHERE NOT (
        ("origin"::text = 'CONSUMER'
          AND "userId" IS NOT NULL
          AND "merchantId" IS NULL
          AND "merchantSessionId" IS NULL
          AND "merchantFrameId" IS NULL)
        OR
        ("origin"::text IN ('STORE_DEMO', 'STORE_PILOT')
          AND "merchantId" IS NOT NULL
          AND "merchantSessionId" IS NOT NULL
          AND "merchantFrameId" IS NOT NULL)
      )`,
  )
  const maxCompareFrames = await countQuery(
    client,
    `SELECT COUNT(*)::bigint AS count
       FROM "Merchant"
      WHERE "maxCompareFrames" NOT IN (2, 3, 4)`,
  )
  const activeStores = await countQuery(
    client,
    `SELECT COUNT(*)::bigint AS count
       FROM (
         SELECT "merchantId"
           FROM "Experience"
          WHERE "type"::text = 'STORE'
            AND "status"::text = 'ACTIVE'
          GROUP BY "merchantId"
         HAVING COUNT(*) > 1
       ) AS duplicate_active_stores`,
  )
  return tryOnTask + maxCompareFrames + activeStores
}

async function distribution(
  client: PrismaClient,
  tableName: string,
  columnName: string,
): Promise<Record<string, number>> {
  const rows = await queryRows<ReadinessSqlRow>(
    client,
    `SELECT COALESCE(${quoteIdentifier(columnName)}::text, '<NULL>') AS key,
            COUNT(*)::bigint AS count
       FROM ${quoteIdentifier(tableName)}
      GROUP BY ${quoteIdentifier(columnName)}
      ORDER BY key`,
  )
  return Object.fromEntries(rows.map((row) => [String(row.key), countValue(row, 'count')]))
}

async function businessMetrics(client: PrismaClient): Promise<BusinessMetrics> {
  const paymentTotals = await queryOne<ReadinessSqlRow>(
    client,
    `SELECT COUNT(*)::bigint AS rows,
            COALESCE(SUM("amount"), 0)::bigint AS amount_sum,
            COALESCE(SUM("creditsRevoked"), 0)::bigint AS credits_revoked_sum
       FROM "Payment"`,
  )
  const userTotals = await queryOne<ReadinessSqlRow>(
    client,
    `SELECT COUNT(*)::bigint AS rows,
            COALESCE(SUM("creditsPurchased"), 0)::bigint AS credits_purchased,
            COALESCE(SUM("creditsUsed"), 0)::bigint AS credits_used,
            COUNT(*) FILTER (WHERE "isPremium")::bigint AS premium_users,
            COUNT(*) FILTER (WHERE "currentSubscriptionType" IS NOT NULL)::bigint AS subscription_users
       FROM "User"`,
  )
  const tryOnOwnership = await countQuery(
    client,
    `SELECT COUNT(*)::bigint AS count
       FROM "TryOnTask" task
       LEFT JOIN "Merchant" merchant ON merchant."id" = task."merchantId"
      WHERE task."merchantId" IS NOT NULL
        AND merchant."id" IS NULL`,
  )
  const tryOnSettlement = await queryOne<ReadinessSqlRow>(
    client,
    `SELECT COUNT(*) FILTER (WHERE "quotaSettledAt" IS NOT NULL)::bigint AS settled_rows,
            COUNT(*) FILTER (WHERE "quotaSource" IS NOT NULL)::bigint AS quota_source_rows
       FROM "TryOnTask"`,
  )
  const merchantGroups = await queryRows<ReadinessSqlRow>(
    client,
    `SELECT COUNT(*)::bigint AS row_count
       FROM "MerchantUsageLedger"
      GROUP BY "merchantId"
      ORDER BY row_count`,
  )
  const generationLinkage = await queryOne<ReadinessSqlRow>(
    client,
    `SELECT COUNT(*) FILTER (WHERE request."id" IS NULL)::bigint AS orphan_attempts
       FROM "GenerationAttempt" attempt
       LEFT JOIN "GenerationRequest" request ON request."id" = attempt."requestId"`,
  )
  const generationMismatches = await countQuery(
    client,
    `SELECT COUNT(*)::bigint AS count
       FROM "GenerationRequest" request
      WHERE request."attemptCount" <> (
        SELECT COUNT(*)
          FROM "GenerationAttempt" attempt_count
         WHERE attempt_count."requestId" = request."id"
      )`,
  )
  const requestCount = await countQuery(client, `SELECT COUNT(*)::bigint AS count FROM "GenerationRequest"`)
  const attemptCount = await countQuery(client, `SELECT COUNT(*)::bigint AS count FROM "GenerationAttempt"`)
  const rows = await queryOne<ReadinessSqlRow>(
    client,
    `SELECT COUNT(*)::bigint AS rows,
            COUNT(DISTINCT "merchantId")::bigint AS merchants
       FROM "MerchantUsageLedger"`,
  )
  const sponsoredRows = await queryOne<ReadinessSqlRow>(
    client,
    `SELECT COUNT(*)::bigint AS rows FROM "MerchantSponsoredUsage"`,
  )

  return {
    user: {
      rows: countValue(userTotals, 'rows'),
      accounts: await countQuery(client, `SELECT COUNT(*)::bigint AS count FROM "Account"`),
      sessions: await countQuery(client, `SELECT COUNT(*)::bigint AS count FROM "Session"`),
      creditsPurchased: countValue(userTotals, 'credits_purchased'),
      creditsUsed: countValue(userTotals, 'credits_used'),
      premiumUsers: countValue(userTotals, 'premium_users'),
      subscriptionTypes: await distribution(client, 'User', 'currentSubscriptionType'),
    },
    payment: {
      rows: countValue(paymentTotals, 'rows'),
      statuses: await distribution(client, 'Payment', 'status'),
      amountSum: countValue(paymentTotals, 'amount_sum'),
      creditsRevokedSum: countValue(paymentTotals, 'credits_revoked_sum'),
    },
    tryOn: {
      rows: await countQuery(client, `SELECT COUNT(*)::bigint AS count FROM "TryOnTask"`),
      statuses: await distribution(client, 'TryOnTask', 'status'),
      origins: await distribution(client, 'TryOnTask', 'origin'),
      merchantOwnershipOrphans: tryOnOwnership,
      settledRows: countValue(tryOnSettlement, 'settled_rows'),
      quotaSourceRows: countValue(tryOnSettlement, 'quota_source_rows'),
    },
    merchantUsage: {
      rows: countValue(rows, 'rows'),
      byKind: await distribution(client, 'MerchantUsageLedger', 'kind'),
      byMerchantRowCounts: merchantGroups.map((row) => countValue(row, 'row_count')),
    },
    sponsoredUsage: {
      rows: countValue(sponsoredRows, 'rows'),
      byStatus: await distribution(client, 'MerchantSponsoredUsage', 'status'),
      byType: await distribution(client, 'MerchantSponsoredUsage', 'usageType'),
    },
    generation: {
      requests: requestCount,
      attempts: attemptCount,
      orphanAttempts: countValue(generationLinkage, 'orphan_attempts'),
      requestAttemptCountMismatches: generationMismatches,
    },
  }
}

async function validateData(
  sourceClient: PrismaClient,
  targetClient: PrismaClient,
  sourceLabel: string,
  targetLabel: string,
  includeBusiness = true,
): Promise<DataValidationResult> {
  const [sourceSchema, targetSchema] = await Promise.all([
    inspectSchemaContract(sourceClient),
    inspectSchemaContract(targetClient),
  ])
  assertSchemaContract(sourceSchema, 'Source PostgreSQL database')
  assertSchemaContract(targetSchema, 'Target PostgreSQL database')
  const schemaDiff = compareSchemaContracts(sourceSchema, targetSchema)
  const tables = Array.from(new Set([...sourceSchema.tables, ...targetSchema.tables])).sort()
  const [sourceRows, targetRows] = await Promise.all([
    rowCounts(sourceClient, sourceSchema.tables),
    rowCounts(targetClient, targetSchema.tables),
  ])
  const tableRows = tables.map((table) => ({
    table,
    sourceRows: sourceRows[table] ?? 0,
    targetRows: targetRows[table] ?? 0,
    match: (sourceRows[table] ?? 0) === (targetRows[table] ?? 0),
  }))
  const [
    sourceForeignKeys,
    targetForeignKeys,
    sourceUnique,
    targetUnique,
    sourceRequiredNulls,
    targetRequiredNulls,
    sourceChecks,
    targetChecks,
    sourceTyped,
    targetTyped,
    sourceTimestamps,
    targetTimestamps,
    sourceDefaults,
    targetDefaults,
    sourceSequences,
    targetSequences,
  ] = await Promise.all([
    foreignKeyOrphans(sourceClient),
    foreignKeyOrphans(targetClient),
    uniqueViolations(sourceClient),
    uniqueViolations(targetClient),
    requiredNullViolations(sourceClient),
    requiredNullViolations(targetClient),
    rawCheckViolations(sourceClient),
    rawCheckViolations(targetClient),
    typedValueFingerprintRows(sourceClient),
    typedValueFingerprintRows(targetClient),
    timestampFingerprintRows(sourceClient),
    timestampFingerprintRows(targetClient),
    defaultRows(sourceClient),
    defaultRows(targetClient),
    sequenceRows(sourceClient),
    sequenceRows(targetClient),
  ])

  const [sourceBusiness, targetBusiness] = includeBusiness
    ? await Promise.all([businessMetrics(sourceClient), businessMetrics(targetClient)])
    : [null, null]

  const typedMatch = JSON.stringify(sourceTyped) === JSON.stringify(targetTyped)
  const timestampMatch = JSON.stringify(sourceTimestamps) === JSON.stringify(targetTimestamps)
  const defaultsMatch = JSON.stringify(sourceDefaults) === JSON.stringify(targetDefaults)
  const sequencesMatch = JSON.stringify(sourceSequences) === JSON.stringify(targetSequences)
  const businessMatch =
    sourceBusiness && targetBusiness
      ? JSON.stringify(sourceBusiness) === JSON.stringify(targetBusiness)
      : true
  const issues = [...schemaDiff.issues]
  if (tableRows.some((row) => !row.match)) issues.push('table row counts differ')
  if (sourceForeignKeys !== 0 || targetForeignKeys !== 0) issues.push('foreign-key orphan rows found')
  if (sourceUnique !== 0 || targetUnique !== 0) issues.push('unique constraint violations found')
  if (sourceRequiredNulls !== 0 || targetRequiredNulls !== 0) issues.push('required NULL rows found')
  if (sourceChecks !== 0 || targetChecks !== 0) issues.push('CHECK invariant violations found')
  if (!typedMatch) issues.push('JSON/JSONB/array values differ')
  if (!timestampMatch) issues.push('timestamp values differ')
  if (!defaultsMatch) issues.push('column defaults differ')
  if (!sequencesMatch) issues.push('sequence state differs')
  if (!businessMatch) issues.push('business metrics differ')

  return {
    pass: issues.length === 0,
    issues,
    source: { target: sourceLabel, schema: publicSchemaContract(sourceSchema) },
    target: { target: targetLabel, schema: publicSchemaContract(targetSchema) },
    tableRows,
    foreignKeyOrphans: { source: sourceForeignKeys, target: targetForeignKeys, match: sourceForeignKeys === targetForeignKeys },
    uniqueViolations: { source: sourceUnique, target: targetUnique, match: sourceUnique === targetUnique },
    requiredNullViolations: { source: sourceRequiredNulls, target: targetRequiredNulls, match: sourceRequiredNulls === targetRequiredNulls },
    checkViolations: { source: sourceChecks, target: targetChecks, match: sourceChecks === targetChecks },
    typedValueFingerprints: { source: Object.keys(sourceTyped).length, target: Object.keys(targetTyped).length, match: typedMatch },
    timestamps: { source: Object.keys(sourceTimestamps).length, target: Object.keys(targetTimestamps).length, match: timestampMatch },
    defaults: { source: sourceDefaults.length, target: targetDefaults.length, match: defaultsMatch },
    sequences: { source: sourceSequences.length, target: targetSequences.length, match: sequencesMatch },
    business: sourceBusiness && targetBusiness
      ? { source: sourceBusiness, target: targetBusiness, match: businessMatch }
      : null,
  }
}

async function validateBusinessOnly(
  sourceClient: PrismaClient,
  targetClient: PrismaClient,
  sourceLabel: string,
  targetLabel: string,
): Promise<BusinessValidationResult> {
  const [source, target] = await Promise.all([
    businessMetrics(sourceClient),
    businessMetrics(targetClient),
  ])
  const match = JSON.stringify(source) === JSON.stringify(target)
  return {
    pass: match,
    issues: match ? [] : ['business metrics differ'],
    source: { target: sourceLabel, business: source },
    target: { target: targetLabel, business: target },
  }
}

async function main(): Promise<void> {
  requireLocalReadinessEnvironment()
  if (process.env.P3_READINESS_CONFIRM !== '1') {
    throw new Error('Set P3_READINESS_CONFIRM=1 to run the PostgreSQL data validator.')
  }
  const sourceUrl = assertPostgresConnectionString(
    'P3_SOURCE_DATABASE_URL',
    requireEnvironmentVariable('P3_SOURCE_DATABASE_URL'),
  )
  const targetUrl = assertPostgresConnectionString(
    'P3_TARGET_DATABASE_URL',
    requireEnvironmentVariable('P3_TARGET_DATABASE_URL'),
  )
  if (sourceUrl === targetUrl) throw new Error('Source and target PostgreSQL URLs must be different.')
  const validationMode = process.env.P3_VALIDATION_MODE ?? 'all'
  if (validationMode !== 'all' && validationMode !== 'structural' && validationMode !== 'business') {
    throw new Error('P3_VALIDATION_MODE must be all, structural, or business.')
  }
  const sourceClient = createReadinessPrismaClient(sourceUrl)
  const targetClient = createReadinessPrismaClient(targetUrl)
  try {
    await Promise.all([
      assertReadinessTargetSafety(sourceClient, sourceUrl),
      assertReadinessTargetSafety(targetClient, targetUrl),
    ])
    const sourceLabel = redactPostgresConnectionString(sourceUrl)
    const targetLabel = redactPostgresConnectionString(targetUrl)
    const result = validationMode === 'business'
      ? await validateBusinessOnly(sourceClient, targetClient, sourceLabel, targetLabel)
      : await validateData(
          sourceClient,
          targetClient,
          sourceLabel,
          targetLabel,
          validationMode !== 'structural',
        )
    printJson(result)
    if (!result.pass) process.exitCode = 1
  } finally {
    await Promise.all([sourceClient.$disconnect(), targetClient.$disconnect()])
  }
}

main().catch((error) => {
  console.error(`PostgreSQL data validation failed: ${redactErrorMessage(error)}`)
  process.exitCode = 1
})
