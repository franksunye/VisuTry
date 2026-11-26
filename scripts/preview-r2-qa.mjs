import { execFileSync, spawnSync } from 'node:child_process'
import { createHash, randomUUID } from 'node:crypto'
import { existsSync, lstatSync, mkdtempSync, readFileSync, readdirSync, realpathSync, rmSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const candidate = 'cbad83eb2afda96c36e5375a3b6fd26480094473'
const branch = 'codex/consumer-media-r2'
const database = 'visutry_r2_preview_qa'
const role = 'visutry_r2_qa_owner'
const identity = 'neon:steep-silence-18355430:br-empty-dew-adt2q51f'
const directHost = 'ep-broad-darkness-ad7lemwv.c-2.us-east-1.aws.neon.tech'
const pooledHost = 'ep-broad-darkness-ad7lemwv-pooler.c-2.us-east-1.aws.neon.tech'
const bucket = 'visutry-r2-preview-qa'
const buildCommand = 'node scripts/preview-r2-qa.mjs'
const root = fileURLToPath(new URL('..', import.meta.url))
const requireRepo = createRequire(resolve(root, 'package.json'))

class Refusal extends Error {}

function requireCheck(condition, reason) {
  if (!condition) throw new Refusal(reason)
}

const gitEnvironment = {
  PATH: process.env.PATH,
  LC_ALL: 'C',
  GIT_NO_REPLACE_OBJECTS: '1',
  GIT_OPTIONAL_LOCKS: '0',
  GIT_CONFIG_NOSYSTEM: '1',
  GIT_CONFIG_GLOBAL: '/dev/null',
  GIT_TERMINAL_PROMPT: '0',
}
const workflowTest = 'tests/integration/consumer-media-preview-workflow.test.ts'
const allowedDifferences = ['A', 'scripts/preview-r2-qa.mjs', 'A', workflowTest, 'M', 'vercel.json']
const diagnosticPaths = new Set(['scripts/preview-r2-qa.mjs', workflowTest, 'vercel.json', 'package.json', 'package-lock.json',
  '.npmrc', 'prisma.config.ts', 'prisma/schema.prisma'])
const checkoutOptions = ['-c', 'core.hooksPath=/dev/null', '-c', 'core.autocrlf=false']

function gitBytes(...args) {
  try {
    return execFileSync('git', [...checkoutOptions, ...args], {
      cwd: root,
      env: gitEnvironment,
      stdio: ['ignore', 'pipe', 'ignore'],
    })
  } catch {
    throw new Refusal('git-metadata-unavailable')
  }
}

function git(...args) {
  return gitBytes(...args).toString().trim()
}

function nulFields(...args) {
  const output = gitBytes(...args).toString()
  if (output === '') return []
  requireCheck(output.endsWith('\0'), 'unexpected-git-field-format')
  return output.slice(0, -1).split('\0')
}

function makeReporter(log) {
  return (step, data) => log(JSON.stringify({ qa: 'VISUTRY_R2_PREVIEW', step, ...data }))
}

function sourceCommit(env, report) {
  requireCheck(env.VERCEL === '1' && env.VERCEL_ENV === 'preview' &&
    (!env.VERCEL_TARGET_ENV || env.VERCEL_TARGET_ENV === 'preview') &&
    (!env.APP_ENV || env.APP_ENV === 'preview'), 'preview-environment-required')
  requireCheck(env.VERCEL_GIT_PROVIDER === 'github' &&
    env.VERCEL_GIT_REPO_OWNER?.toLowerCase() === 'franksunye' &&
    env.VERCEL_GIT_REPO_SLUG?.toLowerCase() === 'visutry' &&
    env.VERCEL_GIT_COMMIT_REF === branch, 'wrong-git-branch-or-repository')
  const head = git('rev-parse', '--verify', 'HEAD')
  requireCheck(/^[a-f0-9]{40}$/.test(head) && head === env.VERCEL_GIT_COMMIT_SHA, 'git-head-mismatch')
  const parents = git('cat-file', '-p', head).split('\n\n')[0].split('\n')
    .filter(line => line.startsWith('parent '))
  requireCheck(parents.length === 1 && parents[0] === 'parent ' + candidate, 'wrong-candidate-parent')
  const fields = nulFields('diff-tree', '--no-commit-id', '--name-status', '--no-renames', '--no-relative',
    '--no-color', '-r', '-z', candidate, head)
  const entries = []
  for (let i = 0; i < fields.length; i += 2) entries.push(fields.slice(i, i + 2))
  entries.sort((a, b) => a[1]?.localeCompare(b[1]))
  const matches = JSON.stringify(entries.flat()) === JSON.stringify(allowedDifferences)
  report('source-commit-diff', { matches, count: entries.length,
    expectedPaths: entries.map(([, path]) => path).filter(path => diagnosticPaths.has(path)) })
  requireCheck(matches, 'unexpected-commit-diff')
  return head
}

function trackedState() {
  const status = nulFields('status', '--porcelain=v1', '--untracked-files=no', '--no-renames', '-z')
  return {
    count: status.length,
    expectedChanges: status.filter(entry => diagnosticPaths.has(entry.slice(3)))
      .map(entry => ({ status: entry.slice(0, 2), path: entry.slice(3) })),
  }
}

function verifySnapshot(report) {
  const state = trackedState()
  report('snapshot-tracked-state', state)
  requireCheck(state.count === 0, 'snapshot-tracked-worktree-dirty')
  requireCheck(!['.env', '.env.local'].some(file => existsSync(resolve(root, file))), 'dotenv-file-present')
  const inventory = nulFields('ls-tree', '-r', '--full-tree', '-z', 'HEAD')
  requireCheck(inventory.length > 0, 'snapshot-inventory-empty')
  for (const entry of inventory) {
    const [, mode, object, path] = /^(100644|100755) blob ([0-9a-f]{40})\t([\s\S]+)$/.exec(entry) ?? []
    requireCheck(object && path, 'snapshot-unsupported-tree-entry')
    const file = join(root, path)
    const stat = lstatSync(file)
    requireCheck(stat.isFile() && Boolean(stat.mode & 0o111) === (mode === '100755'), 'snapshot-mode-mismatch')
    const bytes = readFileSync(file)
    const actual = createHash('sha1').update('blob ' + bytes.length + '\0').update(bytes).digest('hex')
    requireCheck(actual === object, 'snapshot-blob-mismatch')
  }
  report('snapshot-blob-verification-pass', { trackedFiles: inventory.length })
}

async function runBuild(env = process.env, log = console.log) {
  const report = makeReporter(log)
  let temporary
  try {
    const head = sourceCommit(env, report)
    const top = git('rev-parse', '--show-toplevel')
    requireCheck(realpathSync(top) === realpathSync(root), 'builder-wrong-git-root')
    report('builder-tracked-state', trackedState())
    requireCheck(gitBytes('show', head + ':scripts/preview-r2-qa.mjs')
      .equals(readFileSync(fileURLToPath(import.meta.url))), 'builder-harness-blob-mismatch')
    temporary = mkdtempSync(join(tmpdir(), 'visutry-r2-qa-'))
    const snapshot = join(temporary, 'snapshot')
    try {
      gitBytes('clone', '--shared', '--no-checkout', '--', top, snapshot)
      gitBytes('-C', snapshot, 'checkout', '--detach', head)
    } catch {
      throw new Refusal('snapshot-checkout-failed')
    }
    const script = pathToFileURL(join(snapshot, 'scripts/preview-r2-qa.mjs')).href
    const allowedEnvironment = [
      'PATH', 'HOME', 'VERCEL', 'VERCEL_ENV', 'VERCEL_TARGET_ENV', 'APP_ENV',
      'VERCEL_GIT_PROVIDER', 'VERCEL_GIT_REPO_OWNER', 'VERCEL_GIT_REPO_SLUG', 'VERCEL_GIT_COMMIT_REF',
      'VERCEL_GIT_COMMIT_SHA', 'VISUTRY_DATABASE_IDENTITY', 'DATABASE_URL', 'DATABASE_URL_UNPOOLED',
      'CONSUMER_MEDIA_R2_BUCKET', 'CONSUMER_MEDIA_R2_ACCOUNT_ID', 'CONSUMER_MEDIA_R2_ACCESS_KEY_ID',
      'CONSUMER_MEDIA_R2_SECRET_ACCESS_KEY',
    ]
    const childEnvironment = Object.fromEntries(allowedEnvironment
      .filter(key => env[key] !== undefined).map(key => [key, env[key]]))
    const child = spawnSync(process.execPath, ['--input-type=module', '-e',
      'const { runQa } = await import(process.argv[1]); process.exitCode = await runQa()', script], {
      cwd: snapshot, env: childEnvironment, stdio: ['ignore', 'inherit', 'ignore'], timeout: 840_000,
    })
    requireCheck(child.status === 1 || child.status === 42, 'snapshot-runner-did-not-complete')
    return child.status
  } catch (error) {
    report('fail', { stage: 'source-bootstrap', reason: error instanceof Refusal ? error.message : 'operation-failed' })
    return 1
  } finally {
    if (temporary) rmSync(temporary, { recursive: true, force: true })
  }
}

function pinnedUrl(value, host, label) {
  let url
  try { url = new URL(value) } catch { throw new Refusal(label) }
  const keys = [...url.searchParams.keys()]
  requireCheck(['postgres:', 'postgresql:'].includes(url.protocol) &&
    url.hostname === host && (!url.port || url.port === '5432') &&
    url.pathname === '/' + database && url.username === role && Boolean(url.password) && !url.hash &&
    ['require', 'verify-full'].includes(url.searchParams.get('sslmode')) &&
    (url.searchParams.get('channel_binding') === null || url.searchParams.get('channel_binding') === 'require') &&
    keys.length === new Set(keys).size && keys.every(key => ['sslmode', 'channel_binding'].includes(key)), label)
  return value
}

function sourceTargets(env, report) {
  const head = sourceCommit(env, report)
  verifySnapshot(report)
  const expectedConfig = {
    framework: null,
    installCommand: '',
    buildCommand,
    ignoreCommand: 'if [ "$VERCEL_ENV" = preview ] && [ "${VERCEL_TARGET_ENV:-preview}" = preview ] && [ "$VERCEL_GIT_COMMIT_REF" = codex/consumer-media-r2 ]; then exit 1; fi; exit 0',
    outputDirectory: 'qa-build-intentionally-no-output',
  }
  const config = JSON.parse(readFileSync(resolve(root, 'vercel.json'), 'utf8'))
  requireCheck(Object.keys(config).length === Object.keys(expectedConfig).length &&
    Object.entries(expectedConfig).every(([key, value]) => JSON.stringify(value) === JSON.stringify(config[key])),
  'unexpected-vercel-config')
  return head
}

function databaseTarget(env) {
  requireCheck(env.VISUTRY_DATABASE_IDENTITY === identity, 'wrong-database-identity')
  const direct = pinnedUrl(env.DATABASE_URL_UNPOOLED, directHost, 'wrong-direct-database')
  const pooled = pinnedUrl(env.DATABASE_URL, pooledHost, 'wrong-pooled-database')
  return { direct, pooled }
}

function checkR2Target(env) {
  requireCheck(env.CONSUMER_MEDIA_R2_BUCKET === bucket &&
    /^[a-f0-9]{32}$/.test(env.CONSUMER_MEDIA_R2_ACCOUNT_ID ?? '') &&
    Boolean(env.CONSUMER_MEDIA_R2_ACCESS_KEY_ID?.trim()) &&
    Boolean(env.CONSUMER_MEDIA_R2_SECRET_ACCESS_KEY?.trim()), 'wrong-r2-target-or-missing-bindings')
}

function subprocess(command, args, env, timeout) {
  return spawnSync(command, args, { cwd: root, env, timeout, stdio: 'ignore' }).status === 0
}

function install() {
  const env = {
    PATH: process.env.PATH,
    HOME: process.env.HOME,
    CI: '1',
    CHECKPOINT_DISABLE: '1',
    PRISMA_HIDE_UPDATE_MESSAGE: '1',
  }
  requireCheck(subprocess('npm', ['ci', '--no-audit', '--no-fund', '--userconfig=/dev/null', '--globalconfig=/dev/stdin'],
    env, 240_000), 'dependency-install-failed')
}

async function withClient(connectionString, run) {
  const { Client } = requireRepo('pg')
  const client = new Client({ connectionString, connectionTimeoutMillis: 6000, statement_timeout: 8000 })
  try {
    await client.connect()
    return await run(client)
  } finally {
    await client.end().catch(() => {})
  }
}

function expectedMigrations() {
  const path = resolve(root, 'prisma/migrations')
  const entries = readdirSync(path, { withFileTypes: true }).filter(entry => entry.isDirectory())
  requireCheck(entries.length === 5, 'unexpected-migration-count-in-candidate')
  return new Map(entries.map(({ name }) => [name,
    createHash('sha256').update(readFileSync(resolve(path, name, 'migration.sql'))).digest('hex')]))
}

async function verifyMigrations(db, expected) {
  await db.query('BEGIN READ ONLY')
  const { rows } = await db.query('SELECT migration_name, checksum, finished_at, rolled_back_at FROM "_prisma_migrations"')
  const { rows: [marker] } = await db.query(
    'SELECT environment, "databaseIdentity", current_database() AS name, current_user AS role FROM "EnvironmentMetadata" WHERE id=$1',
    ['primary'],
  )
  await db.query('ROLLBACK')
  requireCheck(rows.length === expected.size && [...expected].every(([name, checksum]) =>
    rows.filter(row => row.migration_name === name && row.checksum === checksum &&
      row.finished_at && !row.rolled_back_at).length === 1), 'migration-ledger-checksum-mismatch')
  requireCheck(marker?.environment === 'PREVIEW' && marker.databaseIdentity === identity &&
    marker.name === database && marker.role === role, 'database-marker-mismatch')
}

async function fixtureCounts(db) {
  const { rows: [counts] } = await db.query(`
    SELECT
      (SELECT count(*)::int FROM "User") AS users,
      (SELECT count(*)::int FROM "TryOnTask") AS tryon,
      (SELECT count(*)::int FROM "FaceAnalysisTask") AS face,
      (SELECT count(*)::int FROM "ConsumerMediaStaging") AS staging,
      (SELECT count(*)::int FROM "GenerationRequest") AS requests,
      (SELECT count(*)::int FROM "GenerationAttempt") AS attempts
  `)
  return counts
}

function workflowProcess(env, config, run, journal) {
  return subprocess(process.execPath, ['node_modules/jest/bin/jest.js', '--runInBand', '--no-cache',
    '--runTestsByPath', workflowTest], {
    PATH: env.PATH, HOME: env.HOME, CI: '1', NODE_ENV: 'test',
    APP_ENV: 'preview', VERCEL_ENV: 'preview', VISUTRY_WORKFLOW_MODE: 'preview',
    VISUTRY_WORKFLOW_RUN: run, VISUTRY_WORKFLOW_JOURNAL: journal,
    DATABASE_URL: config.pooled,
    CONSUMER_MEDIA_R2_ACCOUNT_ID: env.CONSUMER_MEDIA_R2_ACCOUNT_ID,
    CONSUMER_MEDIA_R2_BUCKET: bucket,
    CONSUMER_MEDIA_R2_ACCESS_KEY_ID: env.CONSUMER_MEDIA_R2_ACCESS_KEY_ID,
    CONSUMER_MEDIA_R2_SECRET_ACCESS_KEY: env.CONSUMER_MEDIA_R2_SECRET_ACCESS_KEY,
    NEXT_TELEMETRY_DISABLED: '1',
  }, 300_000)
}

function bucketClient(env) {
  const sdk = requireRepo('@aws-sdk/client-s3')
  const client = new sdk.S3Client({
    region: 'auto',
    endpoint: 'https://' + env.CONSUMER_MEDIA_R2_ACCOUNT_ID + '.r2.cloudflarestorage.com',
    credentials: {
      accessKeyId: env.CONSUMER_MEDIA_R2_ACCESS_KEY_ID,
      secretAccessKey: env.CONSUMER_MEDIA_R2_SECRET_ACCESS_KEY,
    },
    forcePathStyle: true,
    requestChecksumCalculation: 'WHEN_REQUIRED',
    responseChecksumValidation: 'WHEN_REQUIRED',
  })
  const send = command => client.send(command, { abortSignal: AbortSignal.timeout(15_000) })
  return {
    async count() {
      const info = await send(new sdk.ListObjectsV2Command({ Bucket: bucket, MaxKeys: 100 }))
      return typeof info.KeyCount === 'number' && !info.IsTruncated ? info.KeyCount : 101
    },
    async remove(key) {
      await send(new sdk.DeleteObjectCommand({ Bucket: bucket, Key: key }))
    },
    close() { client.destroy() },
  }
}

async function recoverWorkflow(db, storage, journal, run, report) {
  const refs = existsSync(journal) ? [...new Set(readFileSync(journal, 'utf8').split('\n').filter(Boolean))] : []
  requireCheck(refs.length <= 20 && refs.every(ref =>
    /^r2:(?:(?:tryon\/(?:user|item)|face-analysis)\/[a-f0-9-]{36}|tryon\/result\/[a-z0-9]{20,32})$/.test(ref)),
  'unexpected-workflow-journal')
  const results = await Promise.allSettled(refs.map(ref => storage.remove(ref.slice(3))))
  requireCheck(results.every(result => result.status === 'fulfilled') && await storage.count() === 0,
    'workflow-object-recovery-incomplete')
  const ids = ['owner', 'other', 'admin'].map(role => 'qa-workflow-' + role + '-' + run)
  await db.query('BEGIN')
  try {
    await db.query('DELETE FROM "ConsumerMediaStaging" WHERE reference = ANY($1::text[])', [refs])
    await db.query('DELETE FROM "GenerationRequest" WHERE "userId" = ANY($1::text[])', [ids])
    await db.query('DELETE FROM "User" WHERE id = ANY($1::text[])', [ids])
    await db.query('COMMIT')
  } catch (error) {
    await db.query('ROLLBACK').catch(() => {})
    throw error
  }
  report('failed-workflow-recovery-pass', { journaled: refs.length })
}

export async function runQa(env = process.env, log = console.log) {
  const report = makeReporter(log)
  let stage = 'source'
  let fixtures
  let storage
  try {
    const head = sourceTargets(env, report)
    checkR2Target(env)
    const config = databaseTarget(env)
    const expected = expectedMigrations()
    report('guards-pass', { candidate, head })
    stage = 'install'
    install()
    stage = 'postinstall-source'
    verifySnapshot(report)
    stage = 'preflight'
    storage = bucketClient(env)
    await withClient(config.direct, async direct => {
      const { rows: [lock] } = await direct.query('SELECT pg_try_advisory_lock($1::bigint) AS acquired', [498061126])
      requireCheck(lock?.acquired, 'database-qa-lock-held')
      await verifyMigrations(direct, expected)
      await withClient(config.pooled, db => verifyMigrations(db, expected))
      requireCheck(Object.values(await fixtureCounts(direct)).every(count => count === 0), 'workflow-database-not-empty')
      requireCheck(await storage.count() === 0, 'workflow-bucket-not-empty')
      report('workflow-preflight-pass', { schemaChecksums: expected.size, connections: 2, r2Objects: 0 })
      stage = 'workflow'
      fixtures = mkdtempSync(join(tmpdir(), 'visutry-test-journal-'))
      const journal = join(fixtures, 'attempted.txt')
      const run = randomUUID()
      report('workflow-start', { run })
      const passed = workflowProcess(env, config, run, journal)
      const milestones = ['target-verified', 'both-submitted', 'pinned-result-and-owner-reads',
        'role-boundaries', 'rollback-and-legacy-blob', 'objects-and-database-clean']
      const progressPath = journal + '.progress'
      const progress = existsSync(progressPath) ? readFileSync(progressPath, 'utf8').split('\n') : []
      report('workflow-progress', { milestones: milestones.filter(name => progress.includes(name)) })
      if (!passed) {
        stage = 'fixture-recovery'
        await recoverWorkflow(direct, storage, journal, run, report)
      }
      stage = 'fixture-verification'
      const after = await fixtureCounts(direct)
      const remaining = await storage.count()
      report('workflow-fixture-verification', { r2Objects: remaining, ...after })
      requireCheck(remaining === 0 && Object.values(after).every(count => count === 0), 'workflow-fixtures-remain')
      requireCheck(passed && milestones.every(name => progress.includes(name)), 'candidate-workflow-test-failed')
    })
    report('VISUTRY_R2_PREVIEW_WORKFLOW_PASS_INTENTIONAL_STOP', { exitCode: 42 })
    return 42
  } catch (error) {
    const status = error?.$metadata?.httpStatusCode
    report('fail', { stage, reason: error instanceof Refusal ? error.message : 'operation-failed',
      ...([403, 404, 429, 500, 503].includes(status) ? { httpStatus: status } : {}) })
    return 1
  } finally {
    storage?.close()
    if (fixtures) rmSync(fixtures, { recursive: true, force: true })
  }
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  if (process.argv.length !== 2) {
    console.log('{"qa":"VISUTRY_R2_PREVIEW","step":"fail","stage":"guards","reason":"unexpected-arguments"}')
    process.exitCode = 1
  } else {
    process.exitCode = await runBuild()
  }
}
