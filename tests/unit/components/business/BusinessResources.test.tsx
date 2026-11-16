import React from 'react'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { BusinessResourceStrip, BusinessResourcesPage } from '@/components/business/BusinessResources'
import { businessGuides, inStoreRetailDemo, inStoreRetailWhitepaper, resourceTopics } from '@/config/business-resources'
import { analytics } from '@/lib/analytics'

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children, prefetch: _prefetch, ...props }: { href: string; children: React.ReactNode; prefetch?: boolean }) => <a href={href} {...props}>{children}</a>,
}))

jest.mock('@/lib/analytics', () => ({
  analytics: {
    trackCustomEvent: jest.fn(),
    trackBusinessCtaClicked: jest.fn(),
  },
}))

jest.mock('lucide-react', () => ({
  ArrowRight: () => <span aria-hidden="true" />,
  FileText: () => <span aria-hidden="true" />,
  PlayCircle: () => <span aria-hidden="true" />,
}))

describe('BusinessResources', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('uses the versioned Cloudflare media URLs as the canonical asset contract', () => {
    expect(inStoreRetailWhitepaper.url).toBe('https://media.visutry.com/business/whitepapers/visutry-ai-eyewear-decision-experience-instore-retail-v1.3.pdf')
    expect(inStoreRetailDemo.url).toBe('https://media.visutry.com/business/demos/visutry-instore-retail-product-demo-v2.mp4')
  })

  it('renders the resource hub with lazy video loading and direct white-paper access', () => {
    const { container } = render(<BusinessResourcesPage locale="en" />)

    expect(screen.getByRole('heading', { name: 'VisuTry In-Store Retail Product Demo' })).toBeVisible()
    expect(screen.getByRole('heading', { name: 'AI Eyewear Decision Experience for In-Store Retail' })).toBeVisible()
    expect(screen.getByRole('link', { name: /show the same frames on different face shapes/i })).toHaveAttribute(
      'href', '/en/business/resources/show-eyewear-on-different-face-shapes',
    )

    const video = container.querySelector('video[data-business-resource="instore-retail-demo-v2"]')
    expect(video).toHaveAttribute('preload', 'none')
    expect(video).toHaveAttribute('poster', '/images/business/b2b-vis-03-store-experience-main.png')
    expect(video?.querySelector('source')).toHaveAttribute('src', inStoreRetailDemo.url)
    expect(video?.querySelector('source')).toHaveAttribute('type', 'video/mp4')

    expect(screen.getByRole('link', { name: 'Read the white paper' })).toHaveAttribute('href', inStoreRetailWhitepaper.url)
    expect(screen.getByRole('link', { name: 'Read the white paper' })).toHaveAttribute('target', '_blank')
  })

  it('links each task shortcut to its guides and exposes all 16 merchant destinations exactly once in the directory', () => {
    render(<BusinessResourcesPage locale="en" />)

    const directories = resourceTopics.map((topic) => {
      const shortcut = screen.getByRole('link', { name: topic.shortTitle })
      expect(shortcut.closest('nav')).not.toBeNull()
      expect(shortcut).toHaveAttribute('href', `#${topic.id}`)

      const target = document.getElementById(topic.id)
      expect(target).not.toBeNull()
      const heading = screen.getByRole('heading', { name: topic.title })
      const section = heading.closest('section')
      expect(section).not.toBeNull()
      expect(section).toContainElement(target)
      return within(section!).getAllByRole('link').map((link) => link.getAttribute('href'))
    })

    const owners = [
      ...businessGuides.map((guide) => guide.path),
      '/business/store', '/business/pricing', '/business/integrations', '/business/examples',
      '/business/campaigns', '/business/pilot', '/business/commerce-intelligence',
      '/blog/virtual-try-on-reduce-eyewear-returns',
    ]
    expect(directories.flat().sort()).toEqual(owners.map((path) => `/en${path}`).sort())
  })

  it('records resource and video engagement without changing the asset URL', () => {
    const { container } = render(<BusinessResourcesPage locale="en" />)

    fireEvent.click(screen.getByRole('link', { name: 'Read the white paper' }))
    expect(analytics.trackCustomEvent).toHaveBeenCalledWith('b2b_resource_opened', expect.objectContaining({
      resource_id: 'instore-retail-whitepaper-v1.3',
      resource_type: 'whitepaper',
      placement: 'resources',
    }))

    const video = container.querySelector('video[data-business-resource="instore-retail-demo-v2"]') as HTMLVideoElement
    fireEvent.play(video)
    fireEvent.play(video)
    expect(analytics.trackCustomEvent).toHaveBeenCalledTimes(2)
    expect(analytics.trackCustomEvent).toHaveBeenLastCalledWith('b2b_resource_video_started', expect.objectContaining({
      resource_id: 'instore-retail-demo-v2',
      placement: 'resources',
    }))

    fireEvent.ended(video)
    expect(analytics.trackCustomEvent).toHaveBeenLastCalledWith('b2b_resource_video_completed', expect.objectContaining({
      resource_id: 'instore-retail-demo-v2',
      placement: 'resources',
    }))
  })

  it('uses contextual proof instead of embedding every resource everywhere', () => {
    const { rerender, container } = render(<BusinessResourceStrip locale="en" placement="platform" mode="whitepaper" />)
    expect(screen.getByRole('link', { name: 'Read white paper' })).toHaveAttribute('href', '/en/business/resources#white-paper')
    expect(container.querySelector('video')).toBeNull()

    rerender(<BusinessResourceStrip locale="en" placement="store" mode="video" />)
    expect(container.querySelector('video')).not.toBeNull()
    expect(screen.getByRole('link', { name: 'Explore all resources' })).toHaveAttribute('href', '/en/business/resources')
  })

  it('measures the Resources Pilot CTA without treating it as a submitted lead', () => {
    render(<BusinessResourcesPage locale="en" />)

    fireEvent.click(screen.getByRole('link', { name: 'Start 30-Day Pilot' }))

    expect(analytics.trackBusinessCtaClicked).toHaveBeenCalledWith({ locale: 'en', ctaLocation: 'business_resources', intentType: 'pilot_request' })
  })
})
