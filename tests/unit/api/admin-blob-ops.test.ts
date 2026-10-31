/** @jest-environment node */

jest.mock('@/lib/api-auth', () => ({ requireAdmin: jest.fn() }))
import { requireAdmin } from '@/lib/api-auth'
import { POST as deleteBlobs } from '@/app/api/admin/blob/delete/route'
import { POST as cleanupBlobs } from '@/app/api/admin/blob/cleanup/route'

const requireAdminMock = requireAdmin as jest.Mock

beforeEach(() => {
  requireAdminMock.mockReset()
})

it.each([
  ['manual deletion', deleteBlobs],
  ['generic orphan sweep', cleanupBlobs],
])('%s fails closed for admin without mutating any Blob', async (_name, handler) => {
  requireAdminMock.mockResolvedValue({ ok: true, userId: 'admin' })
  const response = await handler()
  expect(response.status).toBe(409)
  expect((await response.json()).success).toBe(false)
})

it('preserves authorization before returning the fail-closed response', async () => {
  requireAdminMock.mockResolvedValue({
    ok: false,
    response: Response.json({ error: 'Unauthorized' }, { status: 401 }),
  })
  expect((await deleteBlobs()).status).toBe(401)
  expect((await cleanupBlobs()).status).toBe(401)
})
