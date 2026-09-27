import React from 'react'
import { render, screen, within } from '@testing-library/react'
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

describe('BusinessPricingPage v2 product-market narrative', () => {
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

  it('frames the Merchant Experience as a discovery-to-action journey without over-promising integrations', () => {
    render(<BusinessPricingPage locale="en" />)

    expect(screen.getByRole('heading', { name: /One journey from discovery to a confident decision/i })).toBeVisible()
    expect(screen.getByText('Guided Decision Journey')).toBeVisible()
    expect(screen.getByText('Decision Result')).toBeVisible()
    expect(screen.getByText('Continue to Action')).toBeVisible()
    expect(screen.getByText('Web & In-Store Delivery')).toBeVisible()
    expect(screen.getByText(/do not add a second usage meter/i)).toBeVisible()
    expect(screen.getByText('Custom integration scope')).toBeVisible()
    expect(screen.getByText('Scoped')).toBeVisible()
    expect(screen.queryByText('API / Integrations')).not.toBeInTheDocument()
    expect(screen.queryByText('API / integrations')).not.toBeInTheDocument()
  })

  it('compares the agreed capability packaging without changing capacity or presenting scoped integrations as included', () => {
    render(<BusinessPricingPage locale="en" />)
    const table = screen.getByRole('table', { name: 'Merchant plan comparison' })
    const values = (label: string) => {
      const rowHeader = within(table).getByText(label, { selector: 'th' })
      return rowHeader.closest('tr')!.querySelectorAll('td')
    }

    expect(Array.from(values('AI Commerce Sessions'), (cell) => cell.textContent)).toEqual(['Not applicable', '1,000', '5,000', '10,000', 'Custom'])
    expect(Array.from(values('Decision Result \+ mobile continuation'), (cell) => cell.textContent)).toEqual(['—', '✓ Included', '✓ Included', '✓ Included', '✓ Included'])
    expect(Array.from(values('Merchant Actions'), (cell) => cell.textContent)).toEqual(['Basic product links', '✓ Included', '✓ Included', '✓ Included', '✓ Included'])
    expect(Array.from(values('In-store Kiosk Mode'), (cell) => cell.textContent)).toEqual(['—', 'Add-on', 'Add-on', 'Included', 'Custom'])
    expect(Array.from(values('Commerce analytics & attribution'), (cell) => cell.textContent)).toEqual(['Basic', 'Standard', 'Advanced', 'Advanced', 'Custom'])
    expect(Array.from(values('Custom integration scope'), (cell) => cell.textContent)).toEqual(['—', '—', '—', '—', 'Scoped'])
    expect(Array.from(values('Support / SLA'), (cell) => cell.textContent)).toEqual(['Self-service', 'Standard', 'Priority', 'Priority', 'Custom SLA'])
  })

  it('keeps the pricing story in the intended decision-first order', () => {
    const { container } = render(<BusinessPricingPage locale="en" />)
    const sections = Array.from(container.querySelectorAll('[data-pricing-section]'))
      .map((section) => section.getAttribute('data-pricing-section'))

    expect(sections).toEqual([
      'plans',
      'usage-model',
      'decision-journey',
      'pilot',
      'comparison',
      'enterprise',
      'proof',
      'faq',
    ])
    expect(screen.getByText('Recommendation + Try-On + Compare + Decision Result')).toBeVisible()
    expect(screen.getByText('Advanced commerce analytics included')).toBeVisible()
    expect(screen.getByText('In-store Kiosk Mode included')).toBeVisible()
    expect(screen.getByRole('link', { name: 'Open Reference Experience' })).toHaveAttribute('href', '/en/c/akila/statement-frames')
    expect(screen.getByRole('link', { name: 'Explore Product Examples' })).toHaveAttribute('href', '/en/business/examples')
  })

  it('keeps canonical prices, promises, routes, and accessible explanatory tooltips', async () => {
    const user = userEvent.setup()
    render(<BusinessPricingPage locale="en" />)

    expect(screen.getAllByText('$199/month')).not.toHaveLength(0)
    expect(screen.getAllByText('$499/month')).not.toHaveLength(0)
    expect(screen.getAllByText('$999/month')).not.toHaveLength(0)
    expect(screen.getByText(/No surprise billing/)).toBeVisible()
    expect(screen.getByText('One-time · 30 days · No auto-renew')).toBeVisible()
    expect(screen.getByRole('link', { name: 'Choose Launch' })).toHaveAttribute('href', '/en/merchant?commercialIntent=LAUNCH')
    expect(screen.getByRole('link', { name: 'Choose Growth' })).toHaveAttribute('href', '/en/merchant?commercialIntent=GROWTH')
    expect(screen.getByRole('link', { name: 'Choose Scale' })).toHaveAttribute('href', '/en/merchant?commercialIntent=SCALE')
    expect(screen.getByRole('link', { name: 'Start Free' })).toHaveAttribute('href', '/en/merchant?commercialIntent=FREE')
    expect(screen.getByRole('link', { name: 'Start 30-Day Pilot' })).toHaveAttribute('href', '/en/merchant?commercialIntent=FOUNDING_PILOT')
    expect(screen.getByRole('link', { name: 'Contact Sales' })).toHaveAttribute('href', '/en/business/pilot?plan=enterprise')

    expect(screen.getAllByRole('button', { name: /explanation$/i })).toHaveLength(9)
    await user.click(screen.getByRole('button', { name: 'AI Commerce Sessions explanation' }))
    expect(screen.getByRole('tooltip')).toHaveTextContent(/1 AI Commerce Session/i)
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })
})
