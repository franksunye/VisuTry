import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MerchantCatalogImageUpload } from '@/components/merchant/MerchantCatalogImageUpload'

const originalFetch = global.fetch
afterEach(() => { global.fetch = originalFetch; jest.clearAllMocks() })

describe('Merchant product photo picker', () => {
  it('stages only the image and returns its URL for explicit Catalog review', async () => {
    const uploaded = jest.fn()
    const endpoint = '/api/merchant/merchant-a/catalog/media'
    const url = 'https://abc.public.blob.vercel-storage.com/merchant-catalog/merchant-a/product/test.png'
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true, json: async () => ({ success: true, data: { url, width: 640, height: 480 } }),
    })
    global.fetch = fetchMock as typeof fetch
    render(<MerchantCatalogImageUpload merchantId="merchant-a" onUploaded={uploaded} />)
    const data = new Uint8Array(64)
    data[0] = 137
    fireEvent.change(screen.getByLabelText('Choose product photo'), {
      target: { files: [new File([data.buffer as ArrayBuffer], 'frame.png', { type: 'image/png' })] },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Upload photo' }))
    await waitFor(() => expect(uploaded).toHaveBeenCalledWith(url))
    expect(fetchMock).toHaveBeenCalledWith(endpoint, expect.objectContaining({ method: 'POST', body: expect.any(FormData) }))
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('status')).toHaveTextContent(/Image uploaded/)
  })

  it('rejects invalid local files without a network call', async () => {
    const fetchMock = jest.fn()
    global.fetch = fetchMock as typeof fetch
    render(<MerchantCatalogImageUpload merchantId="merchant-a" onUploaded={jest.fn()} />)
    fireEvent.change(screen.getByLabelText('Choose product photo'), {
      target: { files: [new File(['<svg/>'], 'graphic.svg', { type: 'image/svg+xml' })] },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Upload photo' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/PNG, JPEG or WebP/)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('surfaces a server error without confirming an upload', async () => {
    const uploaded = jest.fn()
    global.fetch = jest.fn().mockResolvedValue({
      ok: false, json: async () => ({ success: false, message: 'Daily product-image upload limit reached.' }),
    }) as typeof fetch
    render(<MerchantCatalogImageUpload merchantId="merchant-a" onUploaded={uploaded} />)
    fireEvent.change(screen.getByLabelText('Choose product photo'), {
      target: { files: [new File([new ArrayBuffer(64)], 'frame.png', { type: 'image/png' })] },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Upload photo' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/upload limit/)
    expect(uploaded).not.toHaveBeenCalled()
  })
})
