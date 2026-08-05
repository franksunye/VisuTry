/**
 * Deterministic merchant-frame ranking adapter (pure, unit-testable).
 * Does not make medical, prescription, PD, or guaranteed-fit claims.
 */

export const STORE_RANKING_VERSION = 'store-rank-v1'

export type ShopperAnalysisSignals = {
  faceShape?: string | null
  preferredWidthClass?: 'narrow' | 'medium' | 'wide' | null
  styleHints?: string[]
}

export type RankableMerchantFrame = {
  id: string
  merchantId: string
  name: string
  shape: string
  material?: string | null
  color?: string | null
  widthClass?: string | null
  styleTags: string[]
}

export type RankedMerchantFrame = {
  frameId: string
  score: number
  reason: string
}

export type RankingResult = {
  rankingVersion: string
  frames: RankedMerchantFrame[]
}

const FACE_SHAPE_PREFERRED_SHAPES: Record<string, string[]> = {
  round: ['rectangle', 'square', 'geometric', 'browline'],
  square: ['round', 'oval', 'aviator', 'cat-eye'],
  oval: ['rectangle', 'aviator', 'cat-eye', 'browline', 'geometric'],
  heart: ['cat-eye', 'aviator', 'round', 'browline'],
  oblong: ['aviator', 'round', 'cat-eye', 'browline'],
  diamond: ['oval', 'round', 'aviator', 'cat-eye'],
  triangle: ['aviator', 'cat-eye', 'browline', 'geometric'],
}

function normalize(value: string | null | undefined): string {
  return (value ?? '').trim().toLowerCase()
}

function scoreFrame(
  frame: RankableMerchantFrame,
  signals: ShopperAnalysisSignals,
): { score: number; reason: string } {
  let score = 10
  const reasons: string[] = []
  const shape = normalize(frame.shape)
  const faceShape = normalize(signals.faceShape)

  if (faceShape && FACE_SHAPE_PREFERRED_SHAPES[faceShape]?.includes(shape)) {
    score += 40
    reasons.push(`Balances a ${faceShape} face shape with a ${shape} frame`)
  } else if (shape) {
    score += 15
    reasons.push(`Offers a ${shape} silhouette from this collection`)
  }

  const preferredWidth = normalize(signals.preferredWidthClass)
  const frameWidth = normalize(frame.widthClass)
  if (preferredWidth && frameWidth) {
    if (preferredWidth === frameWidth) {
      score += 25
      reasons.push(`Matches a ${frameWidth} visual width direction`)
    } else {
      score += 5
    }
  } else if (frameWidth) {
    score += 8
  }

  const hints = (signals.styleHints ?? []).map(normalize).filter(Boolean)
  const tags = frame.styleTags.map(normalize)
  const tagHits = hints.filter((hint) => tags.includes(hint) || tags.some((t) => t.includes(hint)))
  if (tagHits.length > 0) {
    score += 10 * Math.min(tagHits.length, 3)
    reasons.push(`Aligns with ${tagHits.slice(0, 2).join(' / ')} style cues`)
  } else if (tags.length > 0) {
    score += 4
  }

  if (frame.material) score += 3
  if (frame.color) score += 3

  const reason =
    reasons[0] ??
    'A strong option from this merchant catalog based on available style signals'

  return { score, reason }
}

/**
 * Rank active merchant frames for one tenant.
 * Tolerates sparse metadata. Returns 4–8 frames when enough candidates exist.
 */
export function rankMerchantFrames(
  frames: RankableMerchantFrame[],
  signals: ShopperAnalysisSignals,
  options?: { limit?: number; merchantId?: string },
): RankingResult {
  const limit = Math.min(Math.max(options?.limit ?? 6, 4), 8)
  const merchantId = options?.merchantId

  const candidates = frames.filter((frame) => {
    if (merchantId && frame.merchantId !== merchantId) return false
    return Boolean(frame.id)
  })

  const ranked = candidates
    .map((frame) => {
      const { score, reason } = scoreFrame(frame, signals)
      return { frameId: frame.id, score, reason }
    })
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score
      return a.frameId.localeCompare(b.frameId)
    })
    .slice(0, Math.min(limit, rankedLengthOrAll(candidates.length, limit)))

  return {
    rankingVersion: STORE_RANKING_VERSION,
    frames: ranked,
  }
}

function rankedLengthOrAll(available: number, limit: number): number {
  if (available <= 0) return 0
  if (available < 4) return available
  return limit
}
