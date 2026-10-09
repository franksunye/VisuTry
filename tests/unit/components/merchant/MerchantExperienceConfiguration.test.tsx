import { fireEvent, render, screen } from '@testing-library/react'
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
