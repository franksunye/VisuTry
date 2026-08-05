import {
  buildStoreEventIdempotencyKey,
  buildStoreGenerationIdempotencyKey,
  evaluateStoreDemoAllowance,
  DEFAULT_STORE_DEMO_LIMITS,
  selectUsagePolicy,
  usagePolicyTouchesConsumerCredits,
  createMerchantSessionCapability,
  verifySessionCapability,
  hashSessionCapability,
  isSessionOperable,
  sanitizeEventMetadata,
  isSensitiveMetadataKey,
  rankMerchantFrames,
  STORE_RANKING_VERSION,
  isHttpOrHttpsUrl,
} from '@/modules/store/domain'
import {
  parseCreateSessionRequest,
  parseProductRedirectRequest,
  parseRecordIntentRequest,
  normalizeCurrency,
  parsePriceMinorUnits,
} from '@/modules/store/contracts'

describe('Store domain — actor / usage policy', () => {
  it('selects consumer_quota for consumer actors', () => {
    const policy = selectUsagePolicy({ kind: 'consumer', userId: 'u1' })
    expect(policy).toEqual({ kind: 'consumer_quota' })
    expect(usagePolicyTouchesConsumerCredits(policy)).toBe(true)
  })

  it('selects store_demo_allowance for Store Demo actors (server-owned)', () => {
    const policy = selectUsagePolicy(
      {
        kind: 'store',
        merchantId: 'm1',
        merchantSessionId: 's1',
        merchantFrameId: 'f1',
      },
      'STORE_DEMO',
    )
    expect(policy).toEqual({ kind: 'store_demo_allowance', merchantId: 'm1' })
    expect(usagePolicyTouchesConsumerCredits(policy)).toBe(false)
  })

  it('selects merchant_allowance for pilot origin', () => {
    const policy = selectUsagePolicy(
      {
        kind: 'store',
        merchantId: 'm1',
        merchantSessionId: 's1',
        merchantFrameId: 'f1',
      },
      'STORE_PILOT',
    )
    expect(policy).toEqual({ kind: 'merchant_allowance', merchantId: 'm1' })
  })

  it('enforces demo allowance limits', () => {
    const denied = evaluateStoreDemoAllowance(DEFAULT_STORE_DEMO_LIMITS, {
      merchantSuccessfulRenders: 500,
      sessionSuccessfulRenders: 0,
      sessionAttempts: 0,
    })
    expect(denied.allowed).toBe(false)
    if (!denied.allowed) {
      expect(denied.code).toBe('MERCHANT_ALLOWANCE_EXCEEDED')
    }
  })
})

describe('Store domain — session capability', () => {
  it('issues opaque capability and verifies hash without storing plaintext', () => {
    const { token, tokenHash } = createMerchantSessionCapability()
    expect(token).toBeTruthy()
    expect(tokenHash).toBe(hashSessionCapability(token))
    expect(tokenHash).not.toBe(token)
    expect(verifySessionCapability(token, tokenHash)).toBe(true)
    expect(verifySessionCapability('wrong', tokenHash)).toBe(false)
  })

  it('rejects expired or non-active sessions for new generation', () => {
    expect(
      isSessionOperable({
        status: 'ACTIVE',
        expiresAt: new Date(Date.now() + 60_000),
      }),
    ).toBe(true)
    expect(
      isSessionOperable({
        status: 'EXPIRED',
        expiresAt: new Date(Date.now() + 60_000),
      }),
    ).toBe(false)
    expect(
      isSessionOperable({
        status: 'ACTIVE',
        expiresAt: new Date(Date.now() - 1000),
      }),
    ).toBe(false)
  })
})

describe('Store domain — idempotency', () => {
  it('builds stable generation idempotency keys', () => {
    expect(
      buildStoreGenerationIdempotencyKey({
        merchantSessionId: 's1',
        merchantFrameId: 'f1',
        clientSubmissionId: 'c1',
      }),
    ).toBe('store:s1:f1:c1')
  })

  it('builds stable event idempotency keys', () => {
    expect(
      buildStoreEventIdempotencyKey({
        type: 'merchant_tryon_completed',
        merchantId: 'm1',
        merchantSessionId: 's1',
        merchantFrameId: 'f1',
        tryOnTaskId: 't1',
      }),
    ).toBe('evt:merchant_tryon_completed:m1:s1:f1:t1:-')
  })
})

describe('Store domain — privacy', () => {
  it('strips sensitive fields from event metadata', () => {
    expect(isSensitiveMetadataKey('imageUrl')).toBe(true)
    const sanitized = sanitizeEventMetadata({
      imageUrl: 'https://secret/photo.jpg',
      email: 'a@b.com',
      deviceClass: 'mobile',
      rankingVersion: 'store-rank-v1',
    })
    expect(sanitized).toEqual({
      deviceClass: 'mobile',
      rankingVersion: 'store-rank-v1',
    })
  })

  it('validates product URLs as http(s) only', () => {
    expect(isHttpOrHttpsUrl('https://luna.example/frames/1')).toBe(true)
    expect(isHttpOrHttpsUrl('javascript:alert(1)')).toBe(false)
  })
})

describe('Store domain — ranking', () => {
  const frames = [
    {
      id: 'f-round',
      merchantId: 'm1',
      name: 'Round One',
      shape: 'round',
      widthClass: 'medium',
      styleTags: ['classic'],
    },
    {
      id: 'f-rect',
      merchantId: 'm1',
      name: 'Rect One',
      shape: 'rectangle',
      widthClass: 'medium',
      styleTags: ['minimal'],
    },
    {
      id: 'f-other-merchant',
      merchantId: 'm2',
      name: 'Leak',
      shape: 'round',
      styleTags: [],
    },
  ]

  it('returns deterministic ranking for one version and stays tenant-scoped', () => {
    const a = rankMerchantFrames(
      frames,
      { faceShape: 'square', preferredWidthClass: 'medium', styleHints: ['classic'] },
      { merchantId: 'm1', limit: 6 },
    )
    const b = rankMerchantFrames(
      frames,
      { faceShape: 'square', preferredWidthClass: 'medium', styleHints: ['classic'] },
      { merchantId: 'm1', limit: 6 },
    )
    expect(a.rankingVersion).toBe(STORE_RANKING_VERSION)
    expect(a).toEqual(b)
    expect(a.frames.every((f) => f.frameId !== 'f-other-merchant')).toBe(true)
    expect(a.frames[0]?.frameId).toBe('f-round')
  })

  it('tolerates sparse metadata and returns fewer than 4 when catalog is small', () => {
    const result = rankMerchantFrames(
      [{ id: 'only', merchantId: 'm1', name: 'Only', shape: '', styleTags: [] }],
      {},
      { merchantId: 'm1' },
    )
    expect(result.frames).toHaveLength(1)
    expect(result.frames[0]?.reason).toBeTruthy()
  })
})

describe('Store contracts — runtime validation', () => {
  it('parses create-session requests', () => {
    const result = parseCreateSessionRequest({ merchantSlug: 'luna-optical' })
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.data.merchantSlug).toBe('luna-optical')
  })

  it('rejects invalid intent payloads', () => {
    const result = parseRecordIntentRequest({ merchantSlug: 'luna' })
    expect(result.ok).toBe(false)
  })

  it('rejects non-http product URLs', () => {
    const result = parseProductRedirectRequest({ productUrl: 'ftp://x' })
    expect(result.ok).toBe(false)
  })

  it('normalizes price minor units and currency', () => {
    expect(parsePriceMinorUnits(12900)).toBe(12900)
    expect(parsePriceMinorUnits(12.9)).toBeNull()
    expect(normalizeCurrency('USD')).toBe('usd')
    expect(normalizeCurrency('us')).toBeNull()
  })
})
