import { fireEvent, render, screen } from '@testing-library/react'
import dynamic from 'next/dynamic'
import { InteractiveCommerceLauncher } from '@/components/store/InteractiveCommerceLauncher'
import { appendMerchantContinuation, createMerchantContinuation } from '@/modules/store/domain/merchant-continuation'

jest.mock('next/dynamic', () => ({
  __esModule: true,
  default: jest.fn(() => function MockLazyRuntime() {
    return <div data-testid="lazy-runtime">interactive runtime</div>
  }),
}))

describe('InteractiveCommerceLauncher', () => {
  afterEach(() => {
    window.history.replaceState({}, '', '/')
  })

  it('does not render the interactive runtime before an explicit click', () => {
    render(
      <InteractiveCommerceLauncher
        merchantSlug="luna-optical"
        locale="en"
        publicPocStorage={false}
      />,
    )

    expect(screen.queryByTestId('lazy-runtime')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /try on your photo/i })).toBeInTheDocument()
    expect(dynamic).toHaveBeenCalledWith(expect.any(Function), expect.objectContaining({ ssr: false }))
  })

  it('mounts the lazy runtime only after the CTA is activated', () => {
    render(
      <InteractiveCommerceLauncher
        merchantSlug="luna-optical"
        experienceSlug="petite-fit"
        locale="en"
        publicPocStorage={false}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /try on your photo/i }))
    expect(screen.getByTestId('lazy-runtime')).toBeInTheDocument()
    expect(screen.getByRole('dialog', { name: /try-on workspace/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /close try-on workspace/i })).toBeInTheDocument()
  })

  it('keeps the page behind the workspace and closes on Escape', () => {
    render(
      <InteractiveCommerceLauncher
        merchantSlug="luna-optical"
        locale="en"
        publicPocStorage={false}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /try on your photo/i }))
    expect(document.body.style.overflow).toBe('hidden')

    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' })

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(document.body.style.overflow).toBe('')
  })

  it('reopens the workspace for a validated merchant continuation return', () => {
    const context = createMerchantContinuation({
      locale: 'en',
      merchantSlug: 'luna-optical',
      experienceType: 'STORE',
    })!
    window.history.replaceState({}, '', appendMerchantContinuation(context.canonicalReturnPath, context))

    render(
      <InteractiveCommerceLauncher
        merchantSlug="luna-optical"
        locale="en"
        publicPocStorage={false}
      />,
    )

    expect(screen.getByTestId('lazy-runtime')).toBeInTheDocument()
    expect(screen.getByRole('dialog', { name: /try-on workspace/i })).toBeInTheDocument()
  })
})
