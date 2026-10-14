import { render, screen } from '@testing-library/react'
import { MerchantExperienceHeroSettings } from '@/components/merchant/MerchantExperienceHeroSettings'

describe('Merchant hero Owner reference identity', () => {
  it('exposes the exact Owner-editable Experience id without a second API request', () => {
    // The Store workspace already provides the canonical store.id. Keeping this
    // reference in the private Owner DOM allows a safe read-only comparison with
    // anonymous discovery when the browser blocks direct API navigation.
    const fetchSpy = jest.spyOn(global, 'fetch').mockImplementation(() => new Promise(() => {}))
    try {
      render(<MerchantExperienceHeroSettings
        merchantId="merchant-demo"
        experienceId="experience-active-demo"
        title="Demo Store"
        summary={null}
      />)
      expect(screen.getByTestId('experience-hero-settings')).toHaveAttribute('data-experience-id', 'experience-active-demo')
      expect(fetchSpy).toHaveBeenCalledWith(
        '/api/merchant/merchant-demo/brand/hero?experienceId=experience-active-demo',
        { cache: 'no-store' },
      )
      expect(screen.getByRole('button', { name: 'Save hero' })).toBeDisabled()
    } finally {
      fetchSpy.mockRestore()
    }
  })
})
