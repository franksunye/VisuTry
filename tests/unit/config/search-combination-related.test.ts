import { getRelatedCombinationPages } from '@/config/search-combination-related'
import { getLocalizedCombinationSearchPages } from '@/config/search-combination-locales'

function related(locale: string, slug: string) {
  const pages = getLocalizedCombinationSearchPages(locale)
  const page = pages.find((item) => item.slug === slug)!
  return getRelatedCombinationPages(page, pages)
}

describe('related eyewear decisions', () => {
  test('oval pages prioritize oval alternatives, independent of inventory order', () => {
    const pages = getLocalizedCombinationSearchPages('en')
    const page = pages.find((item) => item.slug === 'best-cat-eye-glasses-for-oval-face')!
    const selected = getRelatedCombinationPages(page, pages)
    expect(selected).toHaveLength(4)
    expect(selected.every((item) => item.queryCluster.split(':')[1] === 'oval' || item.slug === 'do-aviators-suit-an-oval-face')).toBe(true)
    expect(getRelatedCombinationPages(page, [...pages].reverse())).toEqual(selected)
  })

  test('a specific question links first to the matching face and frame guide', () => {
    expect(related('en', 'are-cat-eye-glasses-good-for-round-faces')[0].slug)
      .toBe('best-cat-eye-glasses-for-round-face')
  })

  test('heart and heart-shaped labels are the same face topic', () => {
    const selected = related('en', 'glasses-for-heart-shaped-face-women')
    expect(selected.slice(0, 2).map((item) => item.relatedOwnerPath))
      .toEqual(['/style/heart-face', '/style/heart-face'])
  })

  test('general fit questions offer useful fit links without unrelated padding', () => {
    const selected = related('en', 'should-glasses-cover-your-eyebrows')
    expect(selected.map((item) => item.slug)).toEqual([
      'how-should-glasses-fit-your-face',
      'how-wide-should-glasses-be-for-my-face',
    ])
  })

  test.each(['ja', 'es'])('%s retains localized destinations and copy', (locale) => {
    const slug = 'best-browline-glasses-for-diamond-face'
    const selected = related(locale, slug)
    const english = related('en', slug)
    expect(selected.map((item) => item.slug)).toEqual(english.map((item) => item.slug))
    expect(selected.every((item, index) => item.title !== english[index].title)).toBe(true)
    expect(new Set(selected.map((item) => item.slug)).size).toBe(selected.length)
    expect(selected.some((item) => item.slug === slug)).toBe(false)
  })
})
