/**
 * Compatibility re-export. New Consumer/shared callers must import from
 * `@/lib/commerce-handoff/merchant-continuation` so ADR-007 Consumer surfaces
 * do not depend on `src/modules/store/**`.
 */
export * from '@/lib/commerce-handoff/merchant-continuation'
