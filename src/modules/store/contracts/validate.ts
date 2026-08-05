/**
 * Runtime validation approach for Store APIs:
 * Typed contract validators in `src/modules/store/contracts` (no Zod dependency).
 * API routes MUST validate with these helpers before calling application use cases.
 */

export type ValidationIssue = {
  path: string
  message: string
}

export type ValidationResult<T> =
  | { ok: true; data: T }
  | { ok: false; issues: ValidationIssue[] }

export function ok<T>(data: T): ValidationResult<T> {
  return { ok: true, data }
}

export function fail<T = never>(issues: ValidationIssue[]): ValidationResult<T> {
  return { ok: false, issues }
}

export function isNonEmptyString(value: unknown, max = 500): value is string {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= max
}

export function isOptionalString(value: unknown, max = 2000): value is string | null | undefined {
  return value === undefined || value === null || (typeof value === 'string' && value.length <= max)
}

export function requireString(
  value: unknown,
  path: string,
  max = 500,
): ValidationIssue | null {
  if (!isNonEmptyString(value, max)) {
    return { path, message: `${path} is required` }
  }
  return null
}

export function requireEnum<T extends string>(
  value: unknown,
  path: string,
  allowed: readonly T[],
): ValidationIssue | null {
  if (typeof value !== 'string' || !allowed.includes(value as T)) {
    return { path, message: `${path} must be one of: ${allowed.join(', ')}` }
  }
  return null
}

/** Normalize currency to lowercase ISO-style code; price stays integer minor units. */
export function normalizeCurrency(value: string | null | undefined): string | null {
  if (!value) return null
  const normalized = value.trim().toLowerCase()
  if (!/^[a-z]{3}$/.test(normalized)) return null
  return normalized
}

export function parsePriceMinorUnits(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null
  if (typeof value === 'number' && Number.isInteger(value) && value >= 0) return value
  if (typeof value === 'string' && /^\d+$/.test(value)) return Number(value)
  return null
}
