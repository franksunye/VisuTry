import type { CombinationSearchPage } from '@/config/search-combination-pages'

type Topic = { face?: string; frame?: string }

const decisionTopics: Record<string, Topic> = {
  'do-round-glasses-suit-a-round-face': { face: 'round', frame: 'round' },
  'do-aviators-suit-an-oval-face': { face: 'oval', frame: 'aviator' },
  'are-cat-eye-glasses-good-for-round-faces': { face: 'round', frame: 'cat-eye' },
}

const fitGuides = [
  'how-should-glasses-fit-your-face',
  'how-wide-should-glasses-be-for-my-face',
  'should-glasses-cover-your-eyebrows',
] as const

function topicFor(page: CombinationSearchPage): Topic {
  const [type, face, frame] = page.queryCluster.split(':')
  const normalizedFace = face?.replace('-shaped', '')
  if (type === 'face-frame') return { face: normalizedFace, frame }
  if (type === 'gender-style') return { face: normalizedFace }
  return decisionTopics[page.slug] ?? {}
}

/** Select related decisions from stable topic metadata, preserving the caller's localized copy. */
export function getRelatedCombinationPages(
  page: CombinationSearchPage,
  pages: readonly CombinationSearchPage[],
  limit = 4,
): CombinationSearchPage[] {
  const topic = topicFor(page)
  const isGeneralFitQuestion = fitGuides.some((slug) => slug === page.slug)

  return pages
    .filter((candidate) => candidate.slug !== page.slug)
    .map((candidate) => {
      const other = topicFor(candidate)
      const fitIndex = fitGuides.findIndex((slug) => slug === candidate.slug)
      let relevance = 0

      if (isGeneralFitQuestion) {
        // Two useful fit links beat padding the section with unrelated face-shape pages.
        relevance = fitIndex >= 0 ? 20 - fitIndex : 0
      } else {
        const sameFace = Boolean(topic.face && topic.face === other.face)
        const sameFrame = Boolean(topic.frame && topic.frame === other.frame)
        if (sameFace && sameFrame) relevance = 120
        else if (sameFace) relevance = 90
        else if (sameFrame) relevance = 35
        else if (fitIndex >= 0) relevance = 20 - fitIndex
      }

      return { candidate, relevance }
    })
    .filter(({ relevance }) => relevance > 0)
    .sort((a, b) => b.relevance - a.relevance || a.candidate.slug.localeCompare(b.candidate.slug))
    .slice(0, Math.max(0, limit))
    .map(({ candidate }) => candidate)
}
