import { issueSignedToken, presignUrl } from '@vercel/blob'
import {
  createPrivateBlobGetUrl,
  pathnameFromPrivateBlobUrl,
} from '@/lib/blob/private-signed-url'

jest.mock('@vercel/blob', () => ({
  issueSignedToken: jest.fn(),
  presignUrl: jest.fn(),
}))

describe('private Blob signed GET grants', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(issueSignedToken as jest.Mock).mockResolvedValue({
      delegationToken: 'delegation',
      clientSigningToken: 'client-signing',
      validUntil: 1_700_000_120_000,
    })
    ;(presignUrl as jest.Mock).mockResolvedValue({
      presignedUrl: 'https://store.private.blob.vercel-storage.com/path?signature=1',
    })
  })

  it('scopes the grant to one exact pathname, GET, and the shorter business expiry', async () => {
    const result = await createPrivateBlobGetUrl({
      pathname: 'store/merchant-a/sessions/session-a/photo.jpg',
      now: 1_700_000_000_000,
      businessExpiresAt: new Date(1_700_000_030_000),
    })

    expect(result).toEqual({
      url: 'https://store.private.blob.vercel-storage.com/path?signature=1',
      validUntil: 1_700_000_030_000,
    })
    expect(issueSignedToken).toHaveBeenCalledWith({
      pathname: 'store/merchant-a/sessions/session-a/photo.jpg',
      operations: ['get'],
      validUntil: 1_700_000_030_000,
    })
    expect(presignUrl).toHaveBeenCalledWith(
      expect.objectContaining({ delegationToken: 'delegation', clientSigningToken: 'client-signing' }),
      {
        access: 'private',
        operation: 'get',
        pathname: 'store/merchant-a/sessions/session-a/photo.jpg',
        validUntil: 1_700_000_030_000,
      },
    )
  })

  it.each(['*', 'store/*/photo.jpg', '/absolute/path'])('rejects non-exact pathname %s', async (pathname) => {
    await expect(createPrivateBlobGetUrl({ pathname })).rejects.toThrow(
      'Private Blob grants require one exact relative pathname',
    )
    expect(issueSignedToken).not.toHaveBeenCalled()
  })

  it('does not issue a grant after business expiry', async () => {
    await expect(createPrivateBlobGetUrl({
      pathname: 'face-analysis/user-a/photo.jpg',
      now: 1_700_000_000_000,
      businessExpiresAt: new Date(1_699_999_999_999),
    })).rejects.toThrow('Private Blob grant has expired')
    expect(issueSignedToken).not.toHaveBeenCalled()
  })

  it('only derives pathnames from private Blob hosts', () => {
    expect(pathnameFromPrivateBlobUrl(
      'https://store.private.blob.vercel-storage.com/store/a/photo.jpg',
    )).toBe('store/a/photo.jpg')
    expect(pathnameFromPrivateBlobUrl(
      'https://store.public.blob.vercel-storage.com/store/a/photo.jpg',
    )).toBeNull()
  })
})
