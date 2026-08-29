import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BusinessPricingPage } from '@/components/business/BusinessPricingPage'

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children, prefetch: _prefetch, ...props }: { href: string; children: React.ReactNode; prefetch?: boolean }) => <a href={href} {...props}>{children}</a>,
}))

jest.mock('lucide-react', () => ({
  ArrowRight: () => <span aria-hidden="true" />,
  Check: () => <span aria-hidden="true" />,
  Info: () => <span aria-hidden="true" />,
  ShieldCheck: () => <span aria-hidden="true" />,
}))

describe('BusinessPricingPage v1.1 information architecture', () => {
  it('keeps Free, Pilot, and Enterprise visible while limiting primary cards to Launch, Growth, and Scale', () => {
    const { container } = render(<BusinessPricingPage locale="en" />)

    expect(container.querySelectorAll('[data-primary-plan="true"]')).toHaveLength(3)
    expect(container.querySelector('[data-plan-code="LAUNCH"][data-primary-plan="true"]')).not.toBeNull()
    expect(container.querySelector('[data-plan-code="GROWTH"][data-primary-plan="true"]')).not.toBeNull()
    expect(container.querySelector('[data-plan-code="SCALE"][data-primary-plan="true"]')).not.toBeNull()
    expect(container.querySelector('[data-free-entry="true"]')).not.toBeNull()
    expect(screen.getByText('$149 / 30 days')).toBeVisible()
    expect(screen.getByRole('heading', { name: /Custom scale for larger commerce programs/i })).toBeVisible()
    expect(screen.getByRole('columnheader', { name: 'Free' })).toBeVisible()
    expect(screen.getByRole('columnheader', { name: 'Enterprise' })).toBeVisible()
  })

  it('keeps canonical prices, promises, routes, and accessible explanatory tooltips', async () => {
    const user = userEvent.setup()
    render(<BusinessPricingPage locale="en" />)

    expect(screen.getAllByText('$199/month')).not.toHaveLength(0)
    expect(screen.getAllByText('$499/month')).not.toHaveLength(0)
    expect(screen.getAllByText('$999/month')).not.toHaveLength(0)
    expect(screen.getByText(/No surprise billing/)).toBeVisible()
    expect(screen.getByText('One-time · 30 days · No auto-renew')).toBeVisible()
    expect(screen.getByRole('link', { name: 'Choose Launch' })).toHaveAttribute('href', '/en/business/pilot?plan=launch')
    expect(screen.getByRole('link', { name: 'Choose Growth' })).toHaveAttribute('href', '/en/business/pilot?plan=growth')
    expect(screen.getByRole('link', { name: 'Choose Scale' })).toHaveAttribute('href', '/en/business/pilot?plan=scale')
    expect(screen.getByRole('link', { name: 'Contact Sales' })).toHaveAttribute('href', '/en/business/pilot?plan=enterprise')

    expect(screen.getAllByRole('button', { name: /explanation$/i })).toHaveLength(5)
    await user.click(screen.getByRole('button', { name: 'AI Commerce Sessions explanation' }))
    expect(screen.getByRole('tooltip')).toHaveTextContent(/1 AI Commerce Session/i)
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })
})
