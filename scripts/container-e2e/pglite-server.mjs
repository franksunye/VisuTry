import { createRequire } from 'node:module'
import { resolve } from 'node:path'

// A disposable, localhost-only database for browser UI/SSR verification.
// Not a replacement for native PostgreSQL concurrency and billing gates.
const dataDir = process.env.VISUTRY_CONTAINER_PGDATA
const depsDir = process.env.VISUTRY_CONTAINER_PGLITE_DEPS_DIR
const database = 'visutry_local_container_e2e'
if (!dataDir || !depsDir) throw new Error('Container E2E PGlite paths are required')

const requireFromDeps = createRequire(resolve(depsDir, 'package.json'))
const { PGlite } = requireFromDeps('@electric-sql/pglite')
const { PGLiteSocketServer } = requireFromDeps('@electric-sql/pglite-socket')

const initializer = await PGlite.create(dataDir)
const existing = await initializer.query('SELECT 1 FROM pg_database WHERE datname = $1', [database])
if (existing.rows.length === 0) await initializer.exec(`CREATE DATABASE ${database}`)
await initializer.close()

const db = await PGlite.create({ dataDir, database })
const server = new PGLiteSocketServer({
  db,
  host: '127.0.0.1',
  port: 5439,
  maxConnections: 12,
})
await server.start()
console.log(`CONTAINER_E2E_DB_READY=${database}`)

let stopping = false
const stop = async () => {
  if (stopping) return
  stopping = true
  await server.stop()
  await db.close()
  process.exit(0)
}
process.on('SIGINT', stop)
process.on('SIGTERM', stop)
