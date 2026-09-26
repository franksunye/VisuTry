import { Prisma } from '@prisma/client'
import { randomBytes } from 'node:crypto'
import { prisma } from '@/lib/prisma'
import { hashSessionCapability } from '../../domain/session'
import {
  emptyDecisionResultPayload,
  sanitizeDecisionResultPayload,
  uniqueBounded,
  type CanonicalDecisionResultPayload,
} from '../../domain/decision-result'
import type { DecisionResultRepository } from '../../application/ports/repositories'

function newShareToken(): { token: string; tokenHash: string } {
  const token = randomBytes(32).toString('base64url')
  return { token, tokenHash: hashSessionCapability(token) }
}

export function createPrismaDecisionResultRepository(): DecisionResultRepository {
  return {
    async upsertRecommendation(input) {
      const share = newShareToken()
      const row = await prisma.$transaction(async (tx) => {
        const existing = await tx.decisionResult.findUnique({
          where: { merchantId_merchantSessionId: { merchantId: input.merchantId, merchantSessionId: input.merchantSessionId } },
        })
        // A recommendation is the new canonical baseline for this session.
        // Selection, favorites, Try-On references, and Compare state all belong
        // to the previous baseline and must not leak into the new Result.
        const payload: CanonicalDecisionResultPayload = {
          ...emptyDecisionResultPayload(input.journey),
          faceFit: input.faceFit,
          recommendation: {
            rankingVersion: input.rankingVersion,
            frames: input.frames,
          },
        }
        const result = existing
          ? await tx.decisionResult.update({
              where: { id: existing.id },
              data: { experienceId: input.experienceId ?? null, payload: payload as Prisma.InputJsonValue, expiresAt: input.expiresAt },
            })
          : await tx.decisionResult.create({
              data: {
                merchantId: input.merchantId,
                experienceId: input.experienceId ?? null,
                merchantSessionId: input.merchantSessionId,
                schemaVersion: payload.schemaVersion,
                payload: payload as Prisma.InputJsonValue,
                expiresAt: input.expiresAt,
              },
          })
        if (existing) {
          // Shares point to the canonical row, so retaining an old bearer token
          // would silently make it reveal the next recommendation cycle.
          await tx.decisionResultShare.updateMany({
            where: { merchantId: input.merchantId, decisionResultId: result.id, revokedAt: null },
            data: { revokedAt: new Date() },
          })
        }
        await tx.decisionResultShare.create({
          data: {
            merchantId: input.merchantId,
            decisionResultId: result.id,
            tokenHash: share.tokenHash,
            expiresAt: input.expiresAt,
          },
        })
        return result
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable })
      return { resultId: row.id, shareToken: share.token, expiresAt: input.expiresAt }
    },

    async updateSessionSnapshot(input) {
      await prisma.$transaction(async (tx) => {
        const existing = await tx.decisionResult.findUnique({
          where: { merchantId_merchantSessionId: { merchantId: input.merchantId, merchantSessionId: input.merchantSessionId } },
        })
        if (!existing) return
        const payload: CanonicalDecisionResultPayload = (() => {
          const next = sanitizeDecisionResultPayload(existing.payload)
          if (input.selectedFrameIds) next.selectedFrameIds = uniqueBounded(input.selectedFrameIds, 12)
          if (input.favoriteFrameId) next.favoriteFrameIds = uniqueBounded([...next.favoriteFrameIds, input.favoriteFrameId], 12)
          if (input.tryOnResult) {
            next.tryOnResults = [...next.tryOnResults.filter((result) => result.taskId !== input.tryOnResult?.taskId), input.tryOnResult].slice(0, 12)
          }
          if (input.compare) next.compare = input.compare
          return next
        })()
        await tx.decisionResult.update({
          where: { id: existing.id },
          data: { payload: payload as Prisma.InputJsonValue },
        })
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable })
    },
  }
}
