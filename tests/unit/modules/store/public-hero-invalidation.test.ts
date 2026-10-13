/** @jest-environment node */
jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
  revalidateTag: jest.fn(),
}))
jest.mock('@/i18n', () => ({ locales: ['en'] }))
jest.mock('@/lib/cloudflare-public-html-purge', () => ({
  purgePublicHtmlTags: jest.fn().mockResolvedValue({ attempted: true, success: true, tagCount: 1 }),
}))

import { revalidatePath, revalidateTag } from 'next/cache'
import { purgePublicHtmlTags } from '@/lib/cloudflare-public-html-purge'
import { withPublicDiscoveryInvalidation } from '@/modules/store/application/public-discovery-invalidation'

beforeEach(() => {
  jest.clearAllMocks()
  ;(purgePublicHtmlTags as jest.Mock).mockResolvedValue({ attempted: true, success: true, tagCount: 1 })
})

describe('Hero canonical Experience → public Store/Campaign cache invalidation', () => {
  it('invalidates the Store public discovery tag, HTML path and precise Cloudflare tag after the write', async () => {
    const order: string[] = []
    ;(revalidateTag as jest.Mock).mockImplementation(() => order.push('tag'))
    const result = await withPublicDiscoveryInvalidation({
      target: { kind: 'experience', merchantSlug: 'luna-optical', experienceSlug: null },
      mutation: async () => {
        order.push('write')
        return { id: 'store-a', slug: 'store' }
      },
    })
    expect(result.id).toBe('store-a')
    expect(order[0]).toBe('write')
    expect(revalidateTag).toHaveBeenCalledWith('public-discovery:experience:luna-optical:store')
    expect(revalidatePath).toHaveBeenCalledWith('/en/store/luna-optical')
    expect(purgePublicHtmlTags).toHaveBeenCalledWith([
      'visutry:public-html:store:en:luna-optical',
    ])
  })

  it('invalidates the exact Campaign public route and tag after an approved Hero change', async () => {
    await withPublicDiscoveryInvalidation({
      target: { kind: 'experience', merchantSlug: 'luna-optical', experienceSlug: 'fall-frames' },
      mutation: async () => ({ slug: 'fall-frames' }),
    })
    expect(revalidateTag).toHaveBeenCalledWith('public-discovery:experience:luna-optical:fall-frames')
    expect(revalidatePath).toHaveBeenCalledWith('/en/c/luna-optical/fall-frames')
    expect(purgePublicHtmlTags).toHaveBeenCalledWith([
      'visutry:public-html:campaign:en:luna-optical:fall-frames',
    ])
  })

  it('does not refresh public or Cloudflare caches when canonical persistence rejects', async () => {
    await expect(withPublicDiscoveryInvalidation({
      target: { kind: 'experience', merchantSlug: 'luna-optical', experienceSlug: null },
      mutation: async () => { throw new Error('write rolled back') },
    })).rejects.toThrow('write rolled back')
    expect(revalidateTag).not.toHaveBeenCalled()
    expect(revalidatePath).not.toHaveBeenCalled()
    expect(purgePublicHtmlTags).not.toHaveBeenCalled()
  })
})
