import { randomUUID } from 'node:crypto'

type RequestRow = {
  id: string
  tryOnTaskId: string
  origin: string
  userId: string | null
  merchantId: string | null
  storeId: string | null
  campaignId: string | null
  clientSubmissionId: string | null
  generationType: string
  requestedModel: string | null
  requestedProvider: string | null
  finalStatus: string
  startedAt: Date
  completedAt: Date | null
  endToEndDurationMs: number | null
  attemptCount: number
  finalErrorCode: string | null
  createdAt: Date
  updatedAt: Date
}

type AttemptRow = {
  id: string
  requestId: string
  attemptNumber: number
  provider: string
  model: string
  providerTaskId: string | null
  submittedAt: Date
  completedAt: Date | null
  submitDurationMs: number | null
  providerDurationMs: number | null
  status: string
  errorCode: string | null
  errorMessageNormalized: string | null
  isTimeout: boolean
  createdAt: Date
  updatedAt: Date
}

function matchesWhere(row: Record<string, unknown>, where: Record<string, unknown> = {}): boolean {
  return Object.entries(where).every(([key, expected]) => {
    const actual = row[key]
    if (expected && typeof expected === 'object' && !Array.isArray(expected) && !(expected instanceof Date)) {
      const clause = expected as Record<string, unknown>
      if ('in' in clause) return (clause.in as unknown[]).includes(actual)
      if ('not' in clause) return actual !== clause.not
      if ('notIn' in clause) return !(clause.notIn as unknown[]).includes(actual)
    }
    return actual === expected
  })
}

function applyData<T extends Record<string, unknown>>(row: T, data: Record<string, unknown>): T {
  const next = { ...row } as T & { updatedAt: Date }
  for (const [key, value] of Object.entries(data)) {
    if (value && typeof value === 'object' && 'increment' in (value as object)) {
      ;(next as Record<string, unknown>)[key] = Number(row[key] ?? 0) + Number((value as { increment: number }).increment)
    } else {
      ;(next as Record<string, unknown>)[key] = value
    }
  }
  next.updatedAt = new Date()
  return next
}

export function createInMemoryGenerationPrisma() {
  const requests: RequestRow[] = []
  const attempts: AttemptRow[] = []

  const generationRequest = {
    findUnique: jest.fn(async ({ where, select }: any) => {
      const row = where.id
        ? requests.find((item) => item.id === where.id)
        : requests.find((item) => item.tryOnTaskId === where.tryOnTaskId)
      if (!row) return null
      if (!select) return { ...row, attempts: attempts.filter((item) => item.requestId === row.id) }
      const projected: Record<string, unknown> = {}
      for (const key of Object.keys(select)) {
        if (key === 'attempts') {
          const attemptSelect = select.attempts
          let rows = attempts.filter((item) => item.requestId === row.id)
          if (attemptSelect?.where) rows = rows.filter((item) => matchesWhere(item as unknown as Record<string, unknown>, attemptSelect.where))
          if (attemptSelect?.orderBy?.attemptNumber === 'desc') rows.sort((a, b) => b.attemptNumber - a.attemptNumber)
          if (attemptSelect?.orderBy?.attemptNumber === 'asc') rows.sort((a, b) => a.attemptNumber - b.attemptNumber)
          if (attemptSelect?.take) rows = rows.slice(0, attemptSelect.take)
          projected.attempts = rows.map((item) => ({ ...item }))
        } else if (select[key]) {
          projected[key] = (row as Record<string, unknown>)[key]
        }
      }
      return projected
    }),
    findMany: jest.fn(async ({ where, select, orderBy }: any = {}) => {
      let rows = [...requests]
      if (where?.startedAt?.gte) rows = rows.filter((item) => item.startedAt >= where.startedAt.gte)
      if (where?.startedAt?.lt) rows = rows.filter((item) => item.startedAt < where.startedAt.lt)
      if (orderBy?.startedAt === 'asc') rows.sort((a, b) => a.startedAt.getTime() - b.startedAt.getTime())
      return rows.map((row) => {
        if (!select) return { ...row, attempts: attempts.filter((item) => item.requestId === row.id) }
        const projected: Record<string, unknown> = {}
        for (const key of Object.keys(select)) {
          if (key === 'attempts') {
            projected.attempts = attempts
              .filter((item) => item.requestId === row.id)
              .sort((a, b) => a.attemptNumber - b.attemptNumber)
              .map((item) => ({ ...item }))
          } else if (select[key]) {
            projected[key] = (row as Record<string, unknown>)[key]
          }
        }
        return projected
      })
    }),
    create: jest.fn(async ({ data, select }: any) => {
      if (requests.some((item) => item.tryOnTaskId === data.tryOnTaskId)) {
        const error = new Error('Unique constraint') as Error & { code: string }
        error.code = 'P2002'
        throw error
      }
      const now = new Date()
      const row: RequestRow = {
        id: data.id ?? randomUUID(),
        tryOnTaskId: data.tryOnTaskId,
        origin: data.origin,
        userId: data.userId ?? null,
        merchantId: data.merchantId ?? null,
        storeId: data.storeId ?? null,
        campaignId: data.campaignId ?? null,
        clientSubmissionId: data.clientSubmissionId ?? null,
        generationType: data.generationType,
        requestedModel: data.requestedModel ?? null,
        requestedProvider: data.requestedProvider ?? null,
        finalStatus: data.finalStatus ?? 'STARTED',
        startedAt: data.startedAt ?? now,
        completedAt: data.completedAt ?? null,
        endToEndDurationMs: data.endToEndDurationMs ?? null,
        attemptCount: data.attemptCount ?? 0,
        finalErrorCode: data.finalErrorCode ?? null,
        createdAt: now,
        updatedAt: now,
      }
      requests.push(row)
      if (!select) return { ...row }
      const projected: Record<string, unknown> = {}
      for (const key of Object.keys(select)) {
        if (select[key]) projected[key] = (row as Record<string, unknown>)[key]
      }
      return projected
    }),
    updateMany: jest.fn(async ({ where, data }: any) => {
      let count = 0
      for (let i = 0; i < requests.length; i += 1) {
        if (!matchesWhere(requests[i] as unknown as Record<string, unknown>, where)) continue
        requests[i] = applyData(requests[i], data)
        count += 1
      }
      return { count }
    }),
  }

  const generationAttempt = {
    findFirst: jest.fn(async ({ where, orderBy }: any) => {
      let rows = attempts.filter((item) => matchesWhere(item as unknown as Record<string, unknown>, where))
      if (orderBy?.attemptNumber === 'desc') rows.sort((a, b) => b.attemptNumber - a.attemptNumber)
      return rows[0] ? { ...rows[0] } : null
    }),
    create: jest.fn(async ({ data }: any) => {
      if (attempts.some((item) => item.requestId === data.requestId && item.attemptNumber === data.attemptNumber)) {
        const error = new Error('Unique constraint') as Error & { code: string }
        error.code = 'P2002'
        throw error
      }
      const now = new Date()
      const row: AttemptRow = {
        id: data.id ?? randomUUID(),
        requestId: data.requestId,
        attemptNumber: data.attemptNumber,
        provider: data.provider,
        model: data.model,
        providerTaskId: data.providerTaskId ?? null,
        submittedAt: data.submittedAt ?? now,
        completedAt: data.completedAt ?? null,
        submitDurationMs: data.submitDurationMs ?? null,
        providerDurationMs: data.providerDurationMs ?? null,
        status: data.status ?? 'STARTED',
        errorCode: data.errorCode ?? null,
        errorMessageNormalized: data.errorMessageNormalized ?? null,
        isTimeout: data.isTimeout ?? false,
        createdAt: now,
        updatedAt: now,
      }
      attempts.push(row)
      return { ...row }
    }),
    updateMany: jest.fn(async ({ where, data }: any) => {
      let count = 0
      for (let i = 0; i < attempts.length; i += 1) {
        if (!matchesWhere(attempts[i] as unknown as Record<string, unknown>, where)) continue
        attempts[i] = applyData(attempts[i], data)
        count += 1
      }
      return { count }
    }),
  }

  return {
    generationRequest,
    generationAttempt,
    _requests: requests,
    _attempts: attempts,
  }
}
