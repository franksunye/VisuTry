/** Fail closed when CRON_SECRET has not been configured. */
export function isAuthorizedCronRequest(
  request: Pick<Request, 'headers'>,
  secret: string | undefined = process.env.CRON_SECRET,
): boolean {
  const expected = secret?.trim()
  return Boolean(expected && request.headers.get('authorization') === `Bearer ${expected}`)
}
