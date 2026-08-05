/**
 * Shared Store API contracts and runtime validators.
 *
 * Validation approach (D0-0): typed contract parsers in this folder.
 * Routes validate input → resolve auth/context → call one use case → map to HTTP.
 * Responses MUST NOT return Prisma records directly.
 */

export * from './validate'
export * from './requests'
