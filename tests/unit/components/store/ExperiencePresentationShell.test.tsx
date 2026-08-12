import { render, screen } from '@testing-library/react'
import { ExperiencePresentationShell, type ExperiencePresentationCopy, type PresentationMerchant } from '@/components/store/ExperiencePresentationShell'

/* eslint-disable @next/next/no-img-element */
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => <img {...props} alt={props.alt || ''} />,
}))

jest.mock('lucide-react', () => {
  const Icon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} />
  return {
    ArrowRight: Icon,
    Glasses: Icon,
    LockKeyhole: Icon,
    ShieldCheck: Icon,
    Sparkles: Icon,
  }
})

const copy: ExperiencePresentationCopy = {
  storeLabel: 'Curated collection',
  campaignLabel: 'The edit',
  storeSubhead: 'A focused collection, ready to explore',
  storeHero: 'One photo. Your best frames.',
  heroBody: 'Shortlist a few looks.',
  referenceCatalog: 'Reference catalog',
  liveCatalog: 'Live catalog',
  featuredEyebrow: 'Featured from the collection',
  featuredTitle: 'Start with a few strong directions',
  featuredDescription: 'A compact starting point.',
  storeCta: 'Explore the collection',
  campaignCta: 'Explore the edit',
  actionCta: 'Start with my photo',
  ctaSupport: 'Your photo stays within this shopping session',
  privacyTitle: 'Privacy & photo retention',
  privacyBody: 'Your photo is used for this session.',
  privacyPoint1: 'Stored temporarily.',
  privacyPoint2: 'Expired photos are deleted.',
  privacyPoint3: 'Visual decision support.',
  privacyPublicNoticeLabel: 'Early-access storage notice',
  privacyPublicNotice: 'Temporary storage.',
  privacyAccept: 'I understand — continue',
  privacyStarting: 'Starting session…',
  privacyHint: 'Review privacy details before continuing.',
  poweredBy: 'Powered by VisuTry',
  uploadTitle: 'Upload your photo',
  recommendTitle: 'Get recommendations',
  tryOnTitle: 'Try on your shortlist',
}

const merchant: PresentationMerchant = {
  name: 'ello sunglasses',
  logoUrl: null,
  referenceData: true,
  activeFrameCount: 2,
  experience: {
    type: 'CAMPAIGN',
    name: 'Petite Fit',
    headline: 'Find smaller-face frames',
    description: 'An editorial fit-focused selection.',
    heroAssetUrl: null,
  },
}

const frames = [{
  id: 'frame-1',
  name: 'Harper',
  imageUrl: null,
  shape: 'round',
  color: 'black',
  productBrand: 'ello',
}]

function renderShell(mode: 'ACTION_FIRST' | 'PRODUCT_FIRST' | 'EDITORIAL_FIRST') {
  return render(
    <ExperiencePresentationShell
      mode={mode}
      merchant={merchant}
      accent="#1F4B5A"
      featuredFrames={frames}
      copy={copy}
      publicPocStorage={false}
      sessionStarting={false}
      errorMessage={null}
      onStartRuntime={jest.fn()}
      onShoppingCta={jest.fn()}
    />,
  )
}

describe('ExperiencePresentationShell', () => {
  it('renders the editorial hierarchy and provenance badge', () => {
    renderShell('EDITORIAL_FIRST')
    const shell = screen.getByRole('main')
    expect(shell).toHaveAttribute('data-presentation-mode', 'EDITORIAL_FIRST')
    expect(screen.getByText('Reference catalog')).toBeInTheDocument()
    expect(screen.getAllByText('An editorial fit-focused selection.')).not.toHaveLength(0)
    expect(screen.getByText('Harper')).toBeInTheDocument()
    expect(screen.getByText('Harper').compareDocumentPosition(screen.getByText('Privacy & photo retention')) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('keeps action-first runtime entry explicit and singular', () => {
    renderShell('ACTION_FIRST')
    expect(screen.getByRole('main')).toHaveAttribute('data-presentation-mode', 'ACTION_FIRST')
    expect(screen.getAllByRole('button', { name: /start with my photo/i })).toHaveLength(1)
    expect(screen.getByText('Review privacy details before continuing.')).toBeInTheDocument()
  })
})
