/**
 * VisuTry Store modular monolith boundary.
 *
 * Layout:
 *   domain/          entities, enums, invariants, pure policies
 *   application/     use cases and ports
 *   infrastructure/  Prisma, Blob, config adapters
 *   contracts/       validated API DTOs and runtime parsers
 *
 * Dependency rules (ADR-006 / engineering foundation):
 * - domain MUST NOT import Next.js, React, Prisma, Blob, GA, or provider SDKs
 * - application MAY depend on domain + ports; MUST NOT depend on routes/React
 * - infrastructure implements ports
 * - API routes validate → authorize → one use case → HTTP
 * - UI MUST NOT call Prisma or decide usage policy
 * - non-Store code MUST NOT import Store infrastructure
 */

export * as storeDomain from './domain'
export * as storeApplication from './application'
export * as storeContracts from './contracts'
