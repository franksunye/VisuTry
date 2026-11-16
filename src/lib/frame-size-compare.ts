/** Two printed frame-marking triplets, not a physical fit or outer-width estimator. */
export type FrameMark = Readonly<{
  lensWidth: number
  bridgeWidth: number
  templeLength: number
}>

export type FrameDifference = Readonly<{
  lensWidth: number
  bridgeWidth: number
  templeLength: number
}>

const TRIPLET = /^\s*(\d{2})\s*[-–—□×x\s]+\s*(\d{2})\s*[-–—□×x\s]+\s*(\d{3})\s*$/

/** Accept common arm markings: "52-18-145", "52 □ 18 – 145", "52 18 145". */
export function parseFrameMark(value: string): FrameMark | null {
  const match = TRIPLET.exec(value)
  if (!match) return null

  const lensWidth = Number(match[1])
  const bridgeWidth = Number(match[2])
  const templeLength = Number(match[3])

  // Broad plausibility check rejects typos, not an optician's fit assessment.
  if (lensWidth < 30 || lensWidth > 80 ||
      bridgeWidth < 8 || bridgeWidth > 35 ||
      templeLength < 100 || templeLength > 180) {
    return null
  }
  return { lensWidth, bridgeWidth, templeLength }
}

/** Candidate minus current, millimetres. Never interpret these as fit/PD. */
export function compareFrameMarks(current: FrameMark, candidate: FrameMark): FrameDifference {
  return {
    lensWidth: candidate.lensWidth - current.lensWidth,
    bridgeWidth: candidate.bridgeWidth - current.bridgeWidth,
    templeLength: candidate.templeLength - current.templeLength,
  }
}
