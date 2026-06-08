import { buildGoogleFrameSearchUrl, getFrameSearchStyles } from '@/lib/face-search'

describe('face-search', () => {
  it('builds Google search URL with English query', () => {
    const url = buildGoogleFrameSearchUrl('round', 'clubmaster')
    expect(url).toContain('google.com/search')
    expect(decodeURIComponent(url)).toContain('best clubmaster glasses for round face')
  })

  it('returns catalog styles when provided', () => {
    expect(getFrameSearchStyles(['clubmaster', 'aviator', 'round', 'square', 'cat-eye'])).toEqual([
      'clubmaster',
      'aviator',
      'round',
      'square',
    ])
  })

  it('falls back when catalog styles missing', () => {
    expect(getFrameSearchStyles(undefined, 'oval')).toEqual(['aviator', 'clubmaster'])
  })
})
