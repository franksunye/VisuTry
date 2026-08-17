/**
 * Normalize the operator-provided Auth0 issuer before NextAuth appends its
 * discovery suffix.
 */
export function normalizeAuth0Issuer(value: string | undefined): string | undefined {
  return value?.replace(/\/+$/, '')
}
