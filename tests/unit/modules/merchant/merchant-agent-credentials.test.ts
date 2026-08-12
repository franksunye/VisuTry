jest.mock('@/lib/prisma', () => ({
  prisma: {
    merchantMembership: { findUnique: jest.fn() },
    merchantAgentCredential: {
      count: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    merchantOperationAudit: { create: jest.fn() },
    $transaction: jest.fn(),
  },
}))

import { prisma } from '@/lib/prisma'
import {
  AgentCredentialLimitError,
  AgentScopeError,
  InvalidAgentCredentialError,
  MERCHANT_AGENT_SCOPES,
  createAgentSecret,
  createMerchantAgentCredential,
  authenticateMerchantAgentCredential,
  listMerchantAgentCredentials,
  normalizeMerchantAgentScopes,
  requireAgentScope,
  revokeMerchantAgentCredential,
  rotateMerchantAgentCredential,
  type MerchantAgentCredentialMetadata,
} from '@/modules/merchant'

const membership = {
  id: 'membership-a-a',
  userId: 'user-a',
  merchantId: 'merchant-a',
  role: 'OWNER' as const,
}

const adminMembership = { ...membership, role: 'ADMIN' as const }

function metadata(input: Partial<MerchantAgentCredentialMetadata> = {}): MerchantAgentCredentialMetadata {
  return {
    id: 'credential-a',
    name: 'ChatGPT',
    prefix: 'vt_live_0123456789abcdef',
    scopes: [...MERCHANT_AGENT_SCOPES],
    status: 'ACTIVE',
    createdAt: new Date('2026-08-12T00:00:00.000Z'),
    lastUsedAt: null,
    revokedAt: null,
    masked: 'vt_live_0123456789abcdef_••••••••',
    ...input,
  }
}

function row(input: Partial<MerchantAgentCredentialMetadata> = {}) {
  const value = metadata(input)
  return { ...value, keyPrefix: value.prefix }
}

const merchantMembership = prisma.merchantMembership as unknown as { findUnique: jest.Mock }
const credentials = prisma.merchantAgentCredential as unknown as {
  count: jest.Mock
  create: jest.Mock
  findMany: jest.Mock
  findFirst: jest.Mock
  findUnique: jest.Mock
  update: jest.Mock
}
const audits = prisma.merchantOperationAudit as unknown as { create: jest.Mock }
const transaction = prisma.$transaction as jest.Mock

function setupTransaction(input: {
  count?: number
  create?: unknown
  findFirst?: unknown
  update?: unknown
}) {
  const tx = {
    merchantAgentCredential: {
      count: jest.fn().mockResolvedValue(input.count ?? 0),
      create: jest.fn().mockResolvedValue(input.create ?? row()),
      findFirst: jest.fn().mockResolvedValue(input.findFirst ?? row()),
      update: jest.fn().mockResolvedValue(input.update ?? row()),
    },
    merchantOperationAudit: { create: jest.fn().mockResolvedValue(undefined) },
  }
  transaction.mockImplementation(async (callback: (client: typeof tx) => Promise<unknown>) => callback(tx))
  return tx
}

describe('Merchant agent credentials', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    merchantMembership.findUnique.mockResolvedValue(membership)
    credentials.findUnique.mockResolvedValue(null)
    credentials.update.mockResolvedValue(undefined)
    audits.create.mockResolvedValue(undefined)
  })

  it('generates unique high-entropy keys with a lookup prefix and no raw secret in the hash', () => {
    const first = createAgentSecret()
    const second = createAgentSecret()

    expect(first.secret).toMatch(/^vt_live_[0-9a-f]{16}_[A-Za-z0-9_-]{43}$/u)
    expect(first.keyPrefix).toMatch(/^vt_live_[0-9a-f]{16}$/u)
    expect(first.secret).not.toBe(second.secret)
    expect(first.secretHash).not.toContain(first.secret)
  })

  it.each([membership, adminMembership])('allows a merchant %s role to create a credential', async (actorMembership) => {
    merchantMembership.findUnique.mockResolvedValue(actorMembership)
    const tx = setupTransaction({ create: row() })

    const result = await createMerchantAgentCredential({
      userId: actorMembership.userId,
      merchantId: actorMembership.merchantId,
      name: 'ChatGPT',
    })

    expect(result.secret).toMatch(/^vt_live_/u)
    expect(result.credential).not.toHaveProperty('secret')
    expect(result.credential).toHaveProperty('prefix')
    expect(tx.merchantAgentCredential.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        merchantId: 'merchant-a',
        createdByUserId: actorMembership.userId,
        secretHash: expect.not.stringContaining(result.secret),
      }),
    }))
    expect(tx.merchantOperationAudit.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ action: 'credential.created', actorType: 'HUMAN' }),
    }))
  })

  it('denies an unrelated user and a global admin without membership', async () => {
    merchantMembership.findUnique.mockResolvedValue(null)

    await expect(createMerchantAgentCredential({ userId: 'unrelated', merchantId: 'merchant-a', name: 'Agent' }))
      .rejects.toMatchObject({ httpStatus: 404 })
    await expect(createMerchantAgentCredential({ userId: 'platform-admin', merchantId: 'merchant-a', name: 'Agent' }))
      .rejects.toMatchObject({ httpStatus: 404 })
    expect(transaction).not.toHaveBeenCalled()
  })

  it('lists only metadata and never returns the secret', async () => {
    credentials.findMany.mockResolvedValue([row()])

    const result = await listMerchantAgentCredentials({ userId: 'user-a', merchantId: 'merchant-a' })

    expect(result).toEqual([metadata()])
    expect(result[0]).not.toHaveProperty('secret')
    expect(result[0]).not.toHaveProperty('secretHash')
    expect(result[0]).not.toHaveProperty('keyPrefix')
  })

  it('authenticates the correct key, rejects the wrong key, and derives tenant from the record', async () => {
    const generated = createAgentSecret()
    const row = {
      id: 'credential-a',
      merchantId: 'merchant-a',
      secretHash: generated.secretHash,
      scopes: ['merchant:read'],
      status: 'ACTIVE' as const,
      lastUsedAt: null,
    }
    credentials.findUnique.mockResolvedValue(row)

    await expect(authenticateMerchantAgentCredential(generated.secret)).resolves.toEqual({
      actorType: 'AGENT_CREDENTIAL',
      actorId: 'credential-a',
      merchantId: 'merchant-a',
      scopes: ['merchant:read'],
    })
    await expect(authenticateMerchantAgentCredential(`${generated.secret}wrong`)).rejects.toBeInstanceOf(InvalidAgentCredentialError)
    expect(credentials.findUnique).toHaveBeenCalledWith(expect.objectContaining({ where: { keyPrefix: generated.keyPrefix } }))
    expect(credentials.update).toHaveBeenCalledTimes(1)
  })

  it('rejects revoked keys and throttles lastUsedAt writes for recently used keys', async () => {
    const generated = createAgentSecret()
    credentials.findUnique.mockResolvedValue({
      id: 'credential-revoked',
      merchantId: 'merchant-a',
      secretHash: generated.secretHash,
      scopes: ['merchant:read'],
      status: 'REVOKED',
      lastUsedAt: null,
    })
    await expect(authenticateMerchantAgentCredential(generated.secret)).rejects.toBeInstanceOf(InvalidAgentCredentialError)

    credentials.findUnique.mockResolvedValue({
      id: 'credential-recent',
      merchantId: 'merchant-a',
      secretHash: generated.secretHash,
      scopes: ['merchant:read'],
      status: 'ACTIVE',
      lastUsedAt: new Date(),
    })
    await expect(authenticateMerchantAgentCredential(generated.secret)).resolves.toMatchObject({ actorId: 'credential-recent' })
    expect(credentials.update).not.toHaveBeenCalled()
  })

  it('rotates atomically, invalidating the old credential and preserving lineage', async () => {
    const current = row({ id: 'credential-old', prefix: 'vt_live_oldoldoldold' })
    const replacement = row({ id: 'credential-new', prefix: 'vt_live_newnewnewnew' })
    const tx = setupTransaction({ findFirst: current, create: replacement })

    const result = await rotateMerchantAgentCredential({ userId: 'user-a', merchantId: 'merchant-a', credentialId: current.id })

    expect(result.credential.id).toBe('credential-new')
    expect(result.secret).toMatch(/^vt_live_/u)
    expect(tx.merchantAgentCredential.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ rotatedFromId: 'credential-old' }),
    }))
    expect(tx.merchantAgentCredential.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'credential-old' },
      data: expect.objectContaining({ status: 'REVOKED' }),
    }))
    expect(tx.merchantOperationAudit.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ action: 'credential.rotated' }),
    }))
  })

  it('makes the old key invalid while a replacement key remains valid after rotation', async () => {
    const oldKey = createAgentSecret()
    const newKey = createAgentSecret()
    credentials.findUnique.mockImplementation(({ where }: { where: { keyPrefix: string } }) => Promise.resolve(
      where.keyPrefix === oldKey.keyPrefix
        ? { id: 'credential-old', merchantId: 'merchant-a', secretHash: oldKey.secretHash, scopes: ['merchant:read'], status: 'REVOKED', lastUsedAt: null }
        : { id: 'credential-new', merchantId: 'merchant-a', secretHash: newKey.secretHash, scopes: ['merchant:read'], status: 'ACTIVE', lastUsedAt: new Date() },
    ))

    await expect(authenticateMerchantAgentCredential(oldKey.secret)).rejects.toBeInstanceOf(InvalidAgentCredentialError)
    await expect(authenticateMerchantAgentCredential(newKey.secret)).resolves.toMatchObject({ actorId: 'credential-new', merchantId: 'merchant-a' })
  })

  it('revokes a credential idempotently and audits the first revocation', async () => {
    const current = row()
    const tx = setupTransaction({ findFirst: current, update: row({ status: 'REVOKED', revokedAt: new Date() }) })

    await expect(revokeMerchantAgentCredential({ userId: 'user-a', merchantId: 'merchant-a', credentialId: current.id }))
      .resolves.toMatchObject({ status: 'REVOKED' })
    expect(tx.merchantOperationAudit.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ action: 'credential.revoked' }),
    }))
  })

  it('enforces five active credentials and allows a revoked slot to be reused', async () => {
    setupTransaction({ count: 5 })
    await expect(createMerchantAgentCredential({ userId: 'user-a', merchantId: 'merchant-a', name: 'Sixth' }))
      .rejects.toBeInstanceOf(AgentCredentialLimitError)

    setupTransaction({ count: 4, create: row() })
    await expect(createMerchantAgentCredential({ userId: 'user-a', merchantId: 'merchant-a', name: 'Replacement' })).resolves.toHaveProperty('secret')
  })

  it('validates the fixed scope contract and centralizes scope authorization', () => {
    expect(normalizeMerchantAgentScopes(['catalog:read'])).toEqual(['catalog:read'])
    expect(() => normalizeMerchantAgentScopes(['catalog:write', 'billing:write'])).toThrow('Invalid agent scope')

    const readOnly = { actorType: 'AGENT_CREDENTIAL' as const, actorId: 'credential-a', merchantId: 'merchant-a', scopes: ['catalog:read' as const] }
    expect(() => requireAgentScope(readOnly, 'catalog:read')).not.toThrow()
    expect(() => requireAgentScope(readOnly, 'catalog:write')).toThrow(AgentScopeError)
  })

  it.each([
    ['catalog:read', 'catalog:write'],
    ['experience:read', 'experience:write'],
  ])('%s does not authorize %s', (readScope, writeScope) => {
    const actor = { actorType: 'AGENT_CREDENTIAL' as const, actorId: 'credential-a', merchantId: 'merchant-a', scopes: [readScope as 'catalog:read' | 'experience:read'] }
    expect(() => requireAgentScope(actor, readScope as 'catalog:read' | 'experience:read')).not.toThrow()
    expect(() => requireAgentScope(actor, writeScope as 'catalog:write' | 'experience:write')).toThrow(AgentScopeError)
  })

  it('recognizes analytics read as an approved scope', () => {
    const actor = { actorType: 'AGENT_CREDENTIAL' as const, actorId: 'credential-a', merchantId: 'merchant-a', scopes: ['analytics:read' as const] }
    expect(() => requireAgentScope(actor, 'analytics:read')).not.toThrow()
  })
})
