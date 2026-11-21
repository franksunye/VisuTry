import { getCanaryDiscoveryFrame, getCanaryDiscoveryFrames } from '@/modules/store/application/get-canary-discovery-frames'
import { getPublicExperienceDiscoveryContentForRoute } from '@/modules/store/application/get-public-experience-discovery-route'
import { makeCanaryEditorialDiscovery } from '../../../fixtures/merchant-discovery-editorial'

jest.mock('react', () => ({ ...jest.requireActual('react'), cache: (fn: unknown) => fn }))
jest.mock('@/modules/store/application/get-public-experience-discovery-route', () => ({
  getPublicExperienceDiscoveryContentForRoute: jest.fn(),
}))

const readSource = jest.mocked(getPublicExperienceDiscoveryContentForRoute)

describe('bounded Canary detail reader', () => {
  beforeEach(() => jest.clearAllMocks())

  it('reads only the admitted default Store and Everyday Fit through the existing public cache', async () => {
    const store = makeCanaryEditorialDiscovery()
    store.experience.type = 'STORE'
    store.experience.slug = 'store'
    const campaign = makeCanaryEditorialDiscovery()
    readSource.mockImplementation(async (_slug, experienceSlug) => experienceSlug ? campaign : store)
    const frames = await getCanaryDiscoveryFrames()
    expect(frames).toHaveLength(6)
    expect(readSource).toHaveBeenCalledTimes(2)
    expect(readSource).toHaveBeenCalledWith('visutry-demo', null, 'en')
    expect(readSource).toHaveBeenCalledWith('visutry-demo', 'everyday-fit', 'en')
    expect(await getCanaryDiscoveryFrame('canary-round')).toMatchObject({ name: 'Canary round', canonicalPath: '/en/discover/frames/canary-round' })
    expect(await getCanaryDiscoveryFrame('another-tenant-frame')).toBeNull()
  })

  it('rejects malformed IDs before reading sources and missing sources without a fallback catalog lookup', async () => {
    expect(await getCanaryDiscoveryFrame('../private')).toBeNull()
    expect(readSource).not.toHaveBeenCalled()
    readSource.mockResolvedValue(null)
    expect(await getCanaryDiscoveryFrame('canary-round')).toBeNull()
  })
})
