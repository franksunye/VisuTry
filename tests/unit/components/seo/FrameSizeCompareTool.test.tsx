import { fireEvent, render, screen } from '@testing-library/react'
import { renderToStaticMarkup } from 'react-dom/server'
import { FrameSizeCompareTool } from '@/components/seo/FrameSizeCompareTool'
import { trackCampaignEvent } from '@/lib/analytics-v2'

jest.mock('@/lib/analytics-v2', () => ({ trackCampaignEvent: jest.fn() }))

describe('FrameSizeCompareTool', () => {
  beforeEach(() => jest.clearAllMocks())

  it('is disabled in server HTML until hydration attaches handlers', () => {
    const html = renderToStaticMarkup(<FrameSizeCompareTool />)
    expect(html).toMatch(/<button[^>]*disabled=""/)
  })

  it('compares printed dimensions locally and emits one privacy-safe event', () => {
    render(<FrameSizeCompareTool />)
    fireEvent.change(screen.getByLabelText('Your current pair'), { target: { value: '52-18-145' } })
    fireEvent.change(screen.getByLabelText('Frame you are considering'), { target: { value: '54-17-140' } })
    fireEvent.click(screen.getByRole('button', { name: 'Compare markings' }))
    expect(screen.getByText('+2 mm')).toBeTruthy()
    expect(screen.getByText('−1 mm')).toBeTruthy()
    expect(screen.getByText('−5 mm')).toBeTruthy()
    expect(trackCampaignEvent).toHaveBeenCalledTimes(1)
    expect(trackCampaignEvent).toHaveBeenCalledWith('frame_size_compared', {
      entry_point: 'consumer',
      source_page: '/en/glasses-guide/how-wide-should-glasses-be-for-my-face',
      query_cluster: 'frame-width-fit',
      content_cluster: 'new-entry-size',
    })
  })

  it('does not report a comparison for invalid entries', () => {
    render(<FrameSizeCompareTool />)
    fireEvent.change(screen.getByLabelText('Your current pair'), { target: { value: '52' } })
    fireEvent.change(screen.getByLabelText('Frame you are considering'), { target: { value: '54-18-145' } })
    fireEvent.click(screen.getByRole('button', { name: 'Compare markings' }))
    expect(screen.getByRole('alert')).toBeTruthy()
    expect(trackCampaignEvent).not.toHaveBeenCalled()
  })
})
