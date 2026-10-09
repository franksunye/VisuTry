import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { createHash } from 'node:crypto'
import { createMerchantSessionCapability } from '@/modules/store/domain/session'
import { presentPreparedDemoResult } from '@/modules/store/application/present-prepared-demo-result'

jest.mock('@vercel/blob', () => ({ get: jest.fn() }))

describe('presentPreparedDemoResult', () => {
  const capability = createMerchantSessionCapability()
  const shopperPhoto = () => readFile(path.resolve('docs/assets/local-demo/visutry-demo-shopper-v1.png'))
  const future = new Date(Date.now() + 60_000)
  const merchant = {
    id: 'demo-merchant',
    slug: 'visutry-demo-optical',
    name: 'VisuTry Demo Optical',
    status: 'ACTIVE',
    classification: 'TEST',
    pilotType: 'DEMO',
    commercialExceptionCode: 'VISUTRY_DEMO',
    tryOnEnabled: true,
    compareEnabled: true,
  }
  const frame = {
    id: 'rowan-frame',
    merchantId: 'demo-merchant',
    sku: 'VT-DEMO-001',
    name: 'VT Rowan',
    brand: 'VisuTry Demo',
    imageUrl: '/demo/rowan.png',
    productUrl: null,
    price: null,
    currency: null,
    shape: 'square',
  }

  async function setup(overrides: {
    merchant?: Record<string, unknown>
    frame?: typeof frame | null
    photo?: Buffer
    decisionResultSaved?: boolean
    experience?: {
      id: string
      type: 'STORE' | 'CAMPAIGN'
      status: 'ACTIVE'
      frameIds: string[]
      journeyPolicy?: unknown
    }
  } = {}) {
    const photo = overrides.photo ?? await shopperPhoto()
    const recordPreparedDemoResult = jest.fn().mockResolvedValue(overrides.decisionResultSaved ?? true)
    const input = {
      merchants: { findBySlug: jest.fn().mockResolvedValue({ ...merchant, ...overrides.merchant }) },
      frames: { findActiveByMerchantAndId: jest.fn().mockResolvedValue(overrides.frame === undefined ? frame : overrides.frame) },
      sessions: {
        findByMerchantAndId: jest.fn().mockResolvedValue({
          id: 'demo-session',
          merchantId: 'demo-merchant',
          experienceId: overrides.experience?.id ?? null,
          photoAssetId: 'photo-asset',
          capabilityTokenHash: capability.tokenHash,
          status: 'ACTIVE',
          expiresAt: future,
        }),
      },
      experiences: {
        findByMerchantAndId: jest.fn().mockResolvedValue(overrides.experience ?? null),
      },
      decisionResults: { recordPreparedDemoResult },
      assets: {
        assertAccess: jest.fn().mockResolvedValue({ purpose: 'SHOPPER_PHOTO', retentionStatus: 'ACTIVE' }),
        getBytes: jest.fn().mockResolvedValue({ body: photo, contentType: 'image/png', storageKey: 'local/photo.png' }),
      },
      slug: 'visutry-demo-optical',
      merchantSessionId: 'demo-session',
      capabilityToken: capability.token,
      shareToken: 'private-result-token',
      merchantFrameId: 'rowan-frame',
      env: { APP_ENV: 'local', VISUTRY_LOCAL_DEMO_RUNTIME: '1', VERCEL_ENV: undefined },
    }
    return { input, recordPreparedDemoResult }
  }

  it('records a sourced prepared item for the canonical photo and frame without generation services', async () => {
    const { input, recordPreparedDemoResult } = await setup()
    const result = await presentPreparedDemoResult(input as never)
    expect(result).toMatchObject({
      source: 'PREPARED_DEMO',
      merchantFrameId: 'rowan-frame',
      disclosure: 'PREPARED_DEMO',
      sourceRef: { assetKey: 'visutry-demo-v1-vt-rowan-approved-local' },
      frame: { name: 'VT Rowan' },
    })
    expect(recordPreparedDemoResult).toHaveBeenCalledWith(expect.objectContaining({
      merchantId: 'demo-merchant',
      merchantSessionId: 'demo-session',
      shareToken: 'private-result-token',
      reference: expect.objectContaining({ source: 'PREPARED_DEMO', frameId: 'rowan-frame' }),
    }))
    expect(JSON.stringify(result)).not.toContain('tryOnTaskId')
    expect(JSON.stringify(result)).not.toContain('providerTaskId')
  })

  it('allows an active canonical Demo Campaign only for a selected in-tenant prepared frame', async () => {
    const { input, recordPreparedDemoResult } = await setup({
      experience: {
        id: 'demo-campaign',
        type: 'CAMPAIGN',
        status: 'ACTIVE',
        frameIds: ['rowan-frame'],
      },
    })

    const result = await presentPreparedDemoResult(input as never)
    expect(result).toMatchObject({ source: 'PREPARED_DEMO', merchantFrameId: 'rowan-frame' })
    expect(recordPreparedDemoResult).toHaveBeenCalledWith(expect.objectContaining({
      merchantId: 'demo-merchant',
      merchantSessionId: 'demo-session',
      reference: expect.objectContaining({ source: 'PREPARED_DEMO', frameId: 'rowan-frame' }),
    }))
  })

  it.each(['STORE', 'CAMPAIGN'] as const)('supports approved Try-On without Compare for %s', async (type) => {
    const { input, recordPreparedDemoResult } = await setup({
      experience: {
        id: 'demo-experience',
        type,
        status: 'ACTIVE',
        frameIds: ['rowan-frame'],
        journeyPolicy: { enabledStages: ['FACE_ANALYSIS', 'RECOMMENDATION', 'TRY_ON'] },
      },
    })
    const result = await presentPreparedDemoResult(input as never)
    expect(result).toMatchObject({ source: 'PREPARED_DEMO', merchantFrameId: 'rowan-frame' })
    expect(JSON.stringify(result)).not.toContain('tryOnTaskId')
    expect(recordPreparedDemoResult).toHaveBeenCalledWith(expect.objectContaining({
      merchantId: 'demo-merchant',
      reference: expect.objectContaining({ source: 'PREPARED_DEMO', frameId: 'rowan-frame' }),
    }))
  })

  it.each([
    ['Journey omits Try-On', { enabledStages: ['FACE_ANALYSIS', 'RECOMMENDATION'] }, {}],
    ['merchant disables Try-On', { enabledStages: ['FACE_ANALYSIS', 'RECOMMENDATION', 'TRY_ON'] }, { tryOnEnabled: false }],
  ])('rejects prepared result if %s', async (_label, journeyPolicy, merchantOverrides) => {
    const { input, recordPreparedDemoResult } = await setup({
      merchant: merchantOverrides,
      experience: {
        id: 'demo-experience',
        type: 'CAMPAIGN',
        status: 'ACTIVE',
        frameIds: ['rowan-frame'],
        journeyPolicy,
      },
    })
    await expect(presentPreparedDemoResult(input as never)).rejects.toMatchObject({ code: 'CAPABILITY_DISABLED' })
    expect(recordPreparedDemoResult).not.toHaveBeenCalled()
    expect(input.assets.getBytes).not.toHaveBeenCalled()
  })

  it('refuses a prepared frame outside the active Demo Campaign selection', async () => {
    const { input, recordPreparedDemoResult } = await setup({
      experience: {
        id: 'demo-campaign',
        type: 'CAMPAIGN',
        status: 'ACTIVE',
        frameIds: ['another-frame'],
      },
    })

    await expect(presentPreparedDemoResult(input as never)).rejects.toMatchObject({ code: 'FRAME_INACTIVE' })
    expect(recordPreparedDemoResult).not.toHaveBeenCalled()
  })

  it('requires all three explicit canonical Demo markers', async () => {
    const { input, recordPreparedDemoResult } = await setup({ merchant: { pilotType: null } })
    await expect(presentPreparedDemoResult(input as never)).rejects.toMatchObject({ code: 'CAPABILITY_DISABLED' })
    expect(recordPreparedDemoResult).not.toHaveBeenCalled()
  })

  it('requires exact canonical shopper photo bytes and refuses mismatches', async () => {
    const { input, recordPreparedDemoResult } = await setup({ photo: Buffer.from('some other synthetic image') })
    await expect(presentPreparedDemoResult(input as never)).rejects.toMatchObject({ code: 'VALIDATION_ERROR' })
    expect(recordPreparedDemoResult).not.toHaveBeenCalled()
  })

  it('refuses missing or wrong-tenant selected frames', async () => {
    const { input, recordPreparedDemoResult } = await setup({ frame: null })
    await expect(presentPreparedDemoResult(input as never)).rejects.toMatchObject({ code: 'FRAME_INACTIVE' })
    expect(recordPreparedDemoResult).not.toHaveBeenCalled()
  })

  it('refuses an invalid session capability before reading shopper bytes', async () => {
    const { input, recordPreparedDemoResult } = await setup()
    input.capabilityToken = 'invalid-token'
    await expect(presentPreparedDemoResult(input as never)).rejects.toMatchObject({ code: 'SESSION_UNAUTHORIZED' })
    expect(input.assets.getBytes).not.toHaveBeenCalled()
    expect(recordPreparedDemoResult).not.toHaveBeenCalled()
  })

  it('does not record when the existing private result token is revoked or expired', async () => {
    const { input } = await setup({ decisionResultSaved: false })
    await expect(presentPreparedDemoResult(input as never)).rejects.toMatchObject({ code: 'SESSION_UNAUTHORIZED' })
  })
})
