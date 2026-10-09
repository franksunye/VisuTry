import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MerchantExperienceHeroSettings } from '@/components/merchant/MerchantExperienceHeroSettings'
const endpoint = '/api/merchant/merchant-a/brand'
function mockGet(status: string, canEdit = true, heroAssetUrl: string | null = null) {
  const calls: Array<{url:string;init:RequestInit | undefined}> = []
  global.fetch = jest.fn((url: string, init?: RequestInit) => {
    calls.push({url,init})
    return Promise.resolve({
      ok: true,
      json: async () => init?.method === 'PATCH'
        ? { success: true, data: { heroAssetUrl: null } }
        : init?.method === 'POST'
          ? { success: true, data: { url: 'https://a.public.blob.vercel-storage.com/merchant-brand/merchant-a/hero/experience-a/abc.png' } }
          : { success: true, data: { status, canEdit, heroAssetUrl } },
    })
  }) as jest.Mock
  return calls
}
const props = { merchantId: 'merchant-a', experienceId: 'experience-a', title: 'Everyday Edit', summary: 'Curated frames' }
describe('Merchant Hero edit UX', () => {
  beforeEach(() => {
    URL.createObjectURL = jest.fn(() => 'blob:local-hero-preview')
    URL.revokeObjectURL = jest.fn()
  })
  it('requires live confirmation before uploading a new hero and previews the actual file', async () => {
    const calls = mockGet('ACTIVE')
    render(<MerchantExperienceHeroSettings {...props} />)
    const input = screen.getByLabelText('Upload your hero')
    await waitFor(() => expect(input).not.toBeDisabled())
    fireEvent.change(input, { target: { files: [new File(['img'], 'hero.png', { type: 'image/png' })] } })
    expect(screen.getByTestId('hero-unsaved-visual-preview')).toHaveTextContent('Everyday Edit')
    fireEvent.click(screen.getByRole('button', { name: 'Save hero' }))
    expect(calls.every(c => c.init?.method !== 'POST')).toBe(true)
    fireEvent.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Apply to live Experience' }))
    await waitFor(() => expect(calls.some(c => c.init?.method === 'POST')).toBe(true))
    const request = calls.find(c => c.init?.method === 'POST')!
    expect(request.url).toBe(endpoint + '/media')
    const form = request.init?.body as FormData
    expect(form.get('kind')).toBe('hero')
    expect(form.get('experienceId')).toBe('experience-a')
    expect(form.get('approvedLiveChange')).toBe('true')
  })
  it('uses canonical reset PATCH for a private Draft without confirmation', async () => {
    const calls = mockGet('DRAFT', true, 'https://a.public.blob.vercel-storage.com/merchant-brand/merchant-a/hero/experience-a/abc.png')
    render(<MerchantExperienceHeroSettings {...props} />)
    await waitFor(() => expect(screen.getByRole('button', { name: 'Use default' })).not.toBeDisabled())
    fireEvent.click(screen.getByRole('button', { name: 'Use default' }))
    await waitFor(() => expect(calls.some(c => c.init?.method === 'PATCH')).toBe(true))
    const request = calls.find(c => c.init?.method === 'PATCH')!
    expect(JSON.parse(request.init?.body as string)).toEqual({ experienceId: 'experience-a', heroAssetUrl: null, approvedLiveChange: false })
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
  })
  it('fails closed for a non-owner and disables hero mutations', async () => {
    const calls = mockGet('ACTIVE', false)
    render(<MerchantExperienceHeroSettings {...props} />)
    await waitFor(() => expect(screen.getByText('An Owner can edit this Experience hero.')).toBeInTheDocument())
    expect(screen.getByRole('button', { name: 'Save hero' })).toBeDisabled()
    expect(calls.every(c => !c.init?.method)).toBe(true)
  })
})
