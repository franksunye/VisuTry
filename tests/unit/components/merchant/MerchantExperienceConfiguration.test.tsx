import { fireEvent, render, screen, within } from '@testing-library/react'
import { MerchantExperienceConfiguration, type ExperienceConfigurationDraft } from '@/components/merchant/MerchantExperienceConfiguration'
import { DEFAULT_DECISION_JOURNEY_POLICY } from '@/modules/store/domain/decision-journey'
import { DEFAULT_EXPERIENCE_DELIVERY_POLICY } from '@/modules/store/domain/delivery-profile'

function renderConfiguration() {
  let value: ExperienceConfigurationDraft = {
    journeyPolicy: { enabledStages: [...DEFAULT_DECISION_JOURNEY_POLICY.enabledStages] },
    deliveryPolicy: { ...DEFAULT_EXPERIENCE_DELIVERY_POLICY },
    presentationMode: 'PRODUCT_FIRST',
    primaryHandoff: { action: '', label: '', url: '' },
    secondaryHandoff: { action: '', label: '', url: '' },
  }
  const onChange = jest.fn((next: ExperienceConfigurationDraft) => { value = next })
  const renderControl = () => <MerchantExperienceConfiguration experienceType="STORE" value={value} capabilities={{ tryOnEnabled: true, compareEnabled: true }} onChange={(next) => { value = next; onChange(next) }} />
  const view = render(renderControl())
  return { ...view, onChange, renderCurrent: () => view.rerender(renderControl()) }
}

describe('MerchantExperienceConfiguration', () => {
  it('keeps the six supported Journey combinations dependency-safe', () => {
    const { onChange, renderCurrent } = renderConfiguration()
    fireEvent.click(screen.getByRole('checkbox', { name: 'Virtual Try-On' }))
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({
      journeyPolicy: { enabledStages: ['FACE_ANALYSIS', 'FIT_PROFILE', 'RECOMMENDATION'] },
    }))
    renderCurrent()

    fireEvent.click(screen.getByRole('checkbox', { name: 'Compare frames' }))
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({
      journeyPolicy: { enabledStages: ['FACE_ANALYSIS', 'FIT_PROFILE', 'RECOMMENDATION', 'TRY_ON', 'COMPARE'] },
    }))
  })

  it('shows plan-limited selected stages without changing the selected policy', () => {
    render(<MerchantExperienceConfiguration
      experienceType="CAMPAIGN"
      value={{
        journeyPolicy: { enabledStages: [...DEFAULT_DECISION_JOURNEY_POLICY.enabledStages] },
        deliveryPolicy: { ...DEFAULT_EXPERIENCE_DELIVERY_POLICY },
        presentationMode: 'EDITORIAL_FIRST',
        primaryHandoff: { action: '', label: '', url: '' },
        secondaryHandoff: { action: '', label: '', url: '' },
      }}
      capabilities={{ tryOnEnabled: false, compareEnabled: false }}
      onChange={jest.fn()}
    />)
    expect(screen.getAllByText('Plan limited')).toHaveLength(2)
    expect(screen.getByRole('checkbox', { name: 'Virtual Try-On' })).toBeChecked()
  })

  it('previews the effective shopper flow without saving and disables Kiosk when it is not entitled', () => {
    const onChange = jest.fn()
    const value: ExperienceConfigurationDraft = {
      journeyPolicy: { enabledStages: [...DEFAULT_DECISION_JOURNEY_POLICY.enabledStages] },
      deliveryPolicy: { kioskEnabled: true, kioskIdleTimeoutSeconds: 120 },
      presentationMode: 'PRODUCT_FIRST',
      primaryHandoff: { action: 'VISIT_STORE', label: 'Find us', url: '/visit' },
      secondaryHandoff: { action: '', label: '', url: '' },
    }
    render(<MerchantExperienceConfiguration
      experienceType="STORE"
      value={value}
      capabilities={{ tryOnEnabled: true, compareEnabled: true, kioskDeliveryEnabled: false }}
      onChange={onChange}
    />)

    fireEvent.click(screen.getByRole('button', { name: 'Preview shopper flow' }))
    expect(screen.getByRole('region', { name: 'Shopper flow preview' })).toHaveTextContent('Try-On')
    expect(screen.getByRole('region', { name: 'Shopper flow preview' })).toHaveTextContent('Compare')
    expect(screen.getByRole('region', { name: 'Shopper flow preview' })).toHaveTextContent('Recommendations')
    expect(screen.getByRole('region', { name: 'Shopper flow preview' })).toHaveTextContent('Web · product first · Find us')
    expect(screen.getByRole('checkbox', { name: /Enable shared-device Kiosk route/ })).toBeDisabled()
    expect(screen.getByText('Not included in current plan')).toBeInTheDocument()
    expect(onChange).not.toHaveBeenCalled()
  })


  it('clears the primary and secondary handoff fields when No action is selected', () => {
    const onChange = jest.fn()
    const value: ExperienceConfigurationDraft = {
      journeyPolicy: { enabledStages: [...DEFAULT_DECISION_JOURNEY_POLICY.enabledStages] },
      deliveryPolicy: { ...DEFAULT_EXPERIENCE_DELIVERY_POLICY },
      presentationMode: 'PRODUCT_FIRST',
      primaryHandoff: { action: 'VISIT_STORE', label: 'Visit us', url: 'https://example.com' },
      secondaryHandoff: { action: 'BOOK_APPOINTMENT', label: 'Book', url: '/appointments' },
    }
    const view = render(<MerchantExperienceConfiguration
      experienceType="CAMPAIGN"
      value={value}
      capabilities={{ tryOnEnabled: true, compareEnabled: true }}
      onChange={onChange}
    />)
    fireEvent.change(screen.getByRole('combobox', { name: 'Primary action' }), { target: { value: '' } })
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({
      primaryHandoff: { action: '', label: '', url: '' },
      secondaryHandoff: value.secondaryHandoff,
    }))
    view.rerender(<MerchantExperienceConfiguration
      experienceType="CAMPAIGN"
      value={{ ...value, primaryHandoff: { action: '', label: '', url: '' } }}
      capabilities={{ tryOnEnabled: true, compareEnabled: true }}
      onChange={onChange}
    />)
    expect(screen.getAllByRole('textbox', { name: 'Button label' })[0]).toBeDisabled()
    fireEvent.change(screen.getByRole('combobox', { name: 'Secondary action' }), { target: { value: '' } })
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({
      primaryHandoff: { action: '', label: '', url: '' },
      secondaryHandoff: { action: '', label: '', url: '' },
    }))
  })


  it('renders the unsaved visual shopper presentation and truthful conditional result layout', () => {
    const value: ExperienceConfigurationDraft = {
      journeyPolicy: { enabledStages: [...DEFAULT_DECISION_JOURNEY_POLICY.enabledStages] },
      deliveryPolicy: { kioskEnabled: true, kioskIdleTimeoutSeconds: 120 },
      presentationMode: 'PRODUCT_FIRST',
      primaryHandoff: { action: 'VISIT_STORE', label: 'Visit shop', url: '/visit' },
      secondaryHandoff: { action: '', label: '', url: '' },
    }
    const shopperPreview = {
      experienceType: 'CAMPAIGN' as const,
      merchantName: 'Example Optics',
      experienceName: 'Find your fit',
      headline: 'Try frames confidently',
      description: 'Choose from selected eyewear',
      frames: [{ id: 'frame-1', name: 'Classic round', imageUrl: '/assets/glasses-presets/large-round-classic.jpg', shape: 'round', color: null, productBrand: 'Example' }],
    }
    const renderPage = (configuration: ExperienceConfigurationDraft) => <MerchantExperienceConfiguration
      experienceType="CAMPAIGN" value={configuration} shopperPreview={shopperPreview}
      capabilities={{ tryOnEnabled: true, compareEnabled: true, kioskDeliveryEnabled: true }}
      onChange={jest.fn()}
    />
    const view = render(renderPage(value))
    fireEvent.click(screen.getByRole('button', { name: 'Preview shopper flow' }))
    const visual = screen.getByTestId('unsaved-shopper-visual-preview')
    expect(visual).toHaveAttribute('data-draft-only', 'true')
    expect(within(visual).getByText('Try frames confidently')).toBeInTheDocument()
    expect(within(visual).getByText('Classic round')).toBeInTheDocument()
    const result = within(visual).getByRole('region', { name: 'Shopper result layout preview' })
    expect(result.querySelector('[data-preview-stage="TRY_ON"]')).toBeTruthy()
    expect(result.querySelector('[data-preview-stage="COMPARE"]')).toBeTruthy()
    expect(within(result).getByText('Visit shop')).toBeInTheDocument()
    expect(within(result).getByText(/Kiosk delivery with idle reset/)).toBeInTheDocument()

    view.rerender(renderPage({
      ...value,
      presentationMode: 'ACTION_FIRST',
      journeyPolicy: { enabledStages: ['FACE_ANALYSIS', 'RECOMMENDATION'] },
      deliveryPolicy: { kioskEnabled: false, kioskIdleTimeoutSeconds: 120 },
      primaryHandoff: { action: '', label: '', url: '' },
    }))
    const updated = screen.getByTestId('unsaved-shopper-visual-preview')
    expect(updated.querySelector('[data-presentation-mode="ACTION_FIRST"]')).toBeTruthy()
    const updatedResult = within(updated).getByRole('region', { name: 'Shopper result layout preview' })
    expect(updatedResult.querySelector('[data-preview-stage="TRY_ON"]')).toBeNull()
    expect(updatedResult.querySelector('[data-preview-stage="COMPARE"]')).toBeNull()
    expect(within(updatedResult).queryByText('Visit shop')).not.toBeInTheDocument()
    expect(within(updatedResult).getByText(/Kiosk is not enabled/)).toBeInTheDocument()
  })

  it('offers a specific live-impact warning and a reversible saved-state action', () => {
    const onReset = jest.fn()
    const value: ExperienceConfigurationDraft = {
      journeyPolicy: { enabledStages: [...DEFAULT_DECISION_JOURNEY_POLICY.enabledStages] },
      deliveryPolicy: { ...DEFAULT_EXPERIENCE_DELIVERY_POLICY },
      presentationMode: 'PRODUCT_FIRST',
      primaryHandoff: { action: '', label: '', url: '' },
      secondaryHandoff: { action: '', label: '', url: '' },
    }
    render(<MerchantExperienceConfiguration experienceType="CAMPAIGN" value={value} capabilities={{ tryOnEnabled: true, compareEnabled: true }} active dirty onReset={onReset} onChange={jest.fn()} />)
    expect(screen.getByRole('status')).toHaveTextContent('live Campaign immediately')
    fireEvent.click(screen.getByRole('button', { name: 'Revert to saved settings' }))
    expect(onReset).toHaveBeenCalledTimes(1)
  })
})
