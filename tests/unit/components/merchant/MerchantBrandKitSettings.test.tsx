import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MerchantBrandKitSettings } from '@/components/merchant/MerchantBrandKitSettings'
const refresh = jest.fn()
jest.mock('next/navigation', () => ({ useRouter: () => ({ refresh }) }))
const getFetch = () => global.fetch as jest.Mock
const props = { merchantId: 'merchant-a', merchantName: 'Example Optics', initialLogoUrl: null, initialAccentColor: null, liveExperiences: 1, canEdit: true }
describe('Merchant Brand Kit owner self-service', () => {
  beforeEach(() => {
    refresh.mockReset()
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ success: true, data: { accentColor: '#1D4ED8' } }) })
    URL.createObjectURL = jest.fn(() => 'blob:local-preview')
    URL.revokeObjectURL = jest.fn()
  })
  it('previews a different accessible accent before live-save approval', async () => {
    render(<MerchantBrandKitSettings {...props} />)
    expect(screen.getByTestId('merchant-brand-kit')).toHaveTextContent('Unsaved brand preview')
    fireEvent.click(screen.getByRole('radio', { name: 'Cobalt' }))
    expect(getFetch()).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Save color' }))
    expect(getFetch()).not.toHaveBeenCalled()
    const dialog = screen.getByRole('alertdialog', { name: 'Confirm live brand change' })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Apply to live Experiences' }))
    await waitFor(() => expect(getFetch()).toHaveBeenCalledTimes(1))
    expect(JSON.parse((getFetch().mock.calls[0][1] as RequestInit).body as string)).toEqual({
      accentColor: '#1D4ED8', approvedLiveChange: true,
    })
    expect(refresh).toHaveBeenCalled()
  })
  it('denies editing of brand identity to ADMIN from the UI', () => {
    render(<MerchantBrandKitSettings {...props} canEdit={false} />)
    expect(screen.getByRole('button', { name: 'Save color' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Upload and save logo' })).toBeDisabled()
    expect(screen.getByText('Owner only')).toBeInTheDocument()
  })
  it('provides reset controls and a non-live approval-free save', async () => {
    render(<MerchantBrandKitSettings {...props} liveExperiences={0} initialAccentColor="#1D4ED8" />)
    fireEvent.click(screen.getByRole('button', { name: 'Use default color' }))
    fireEvent.click(screen.getByRole('button', { name: 'Save color' }))
    await waitFor(() => expect(getFetch()).toHaveBeenCalledTimes(1))
    expect(JSON.parse((getFetch().mock.calls[0][1] as RequestInit).body as string)).toEqual({
      accentColor: null, approvedLiveChange: false,
    })
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
  })
})
