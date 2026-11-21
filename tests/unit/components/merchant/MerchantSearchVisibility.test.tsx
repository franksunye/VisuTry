import { render, screen } from '@testing-library/react'
import { MerchantSearchVisibility } from '@/components/merchant/MerchantSearchVisibility'
import type { ExperienceSearchReadiness } from '@/modules/store/domain/experience-search-visibility'

function status(overrides: Partial<ExperienceSearchReadiness> = {}): ExperienceSearchReadiness {
  return { visibility: 'PUBLIC_INDEX', reasons: [], indexableLocale: 'en', activeFrameCount: 4, minimumFrameCount: 4, ...overrides }
}

describe('Merchant search visibility guidance', () => {
  it('distinguishes eligibility from a search engine indexing decision', () => {
    render(<MerchantSearchVisibility status={status()} />)
    const panel = screen.getByRole('region', { name: 'Search visibility' })
    expect(panel).toHaveTextContent('Public · eligible for search')
    expect(panel).toHaveTextContent('English public page')
    expect(panel).toHaveTextContent('Search engines decide whether and when to include it in results.')
    expect(panel).not.toHaveTextContent(/indexed by Google|already indexed|PUBLIC_INDEX/i)
  })

  it('explains why a public page does not yet meet search requirements', () => {
    render(<MerchantSearchVisibility status={status({ visibility: 'PUBLIC_NOINDEX', activeFrameCount: 2, reasons: ['INSUFFICIENT_FRAMES', 'MISSING_DESTINATION'] })} />)
    expect(screen.getByText('Public · not eligible for search')).toBeInTheDocument()
    expect(screen.getByText('Select at least 4 active products for this collection. Currently: 2.')).toBeInTheDocument()
    expect(screen.getByText('Add a valid merchant website or a product destination link.')).toBeInTheDocument()
  })

  it('keeps a ready draft private until publishing', () => {
    render(<MerchantSearchVisibility status={status({ visibility: 'PRIVATE', reasons: ['DRAFT'] })} />)
    expect(screen.getByText('Private')).toBeInTheDocument()
    expect(screen.getByText('Publish the saved page to make it publicly available.')).toBeInTheDocument()
    expect(screen.queryByText('Public · eligible for search')).not.toBeInTheDocument()
  })

  it('explains an intentional reference exclusion without exposing internal policy', () => {
    render(<MerchantSearchVisibility status={status({ visibility: 'PUBLIC_NOINDEX', reasons: ['REFERENCE'] })} />)
    expect(screen.getByRole('region', { name: 'Search visibility' })).toHaveTextContent('Reference collections are available by link and excluded from search.')
    expect(screen.getByRole('region', { name: 'Search visibility' })).not.toHaveTextContent(/VISUTRY_OWNED|classification|billing/i)
  })
})
