import React from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { ResultDisplay } from '@/components/try-on/ResultDisplay'

jest.mock('@/components/OptimizedImage', () => ({
  TryOnResultImage: ({
    src,
    alt,
    useFill,
    className,
  }: {
    src: string
    alt: string
    useFill: boolean
    className: string
  }) => (
    <div role="img" aria-label={alt} data-src={src} data-fill={String(useFill)} data-fit={className} />
  ),
}))

describe('ResultDisplay constrained result viewport', () => {
  const resultImageUrl = '/api/try-on/synthetic-task/media/result'
  const taskId = 'synthetic-task'

  it('contains a full result image inside a bounded viewport and keeps both actions above it', () => {
    const onTryAgain = jest.fn()
    render(<ResultDisplay resultImageUrl={resultImageUrl} taskId={taskId} onTryAgain={onTryAgain} />)

    const viewport = screen.getByTestId('try-on-result-image-viewport')
    expect(viewport).toHaveClass('relative', 'min-h-0', 'flex-1', 'overflow-hidden')
    const image = screen.getByRole('img', { name: 'AI Try-On Result' })
    expect(image).toHaveAttribute('data-src', resultImageUrl)
    expect(image).toHaveAttribute('data-fill', 'true')
    expect(image).toHaveAttribute('data-fit', 'object-contain')

    const download = screen.getByRole('button', { name: 'Download' })
    const tryAgain = screen.getByRole('button', { name: 'Try Again' })
    expect(download).toHaveAttribute('type', 'button')
    expect(tryAgain).toHaveAttribute('type', 'button')
    expect(download.parentElement?.parentElement).toHaveClass('relative', 'z-10', 'flex-shrink-0', 'bg-white')
    expect(download).toHaveClass('min-h-11')
    expect(tryAgain).toHaveClass('min-h-11')

    fireEvent.click(tryAgain)
    expect(onTryAgain).toHaveBeenCalledTimes(1)
  })

  it.each([
    ['image/jpeg', 'jpg'],
    ['image/png', 'png'],
    ['image/webp', 'webp'],
  ])('downloads the generated %s image as %s without another generation request', async (mime, extension) => {
    const originalFetch = global.fetch
    const originalCreateObjectURL = URL.createObjectURL
    const originalRevokeObjectURL = URL.revokeObjectURL
    const downloadedNames: string[] = []
    const clickSpy = jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
      downloadedNames.push(this.download)
    })
    const fetchMock = jest.fn().mockResolvedValue({
      blob: async () => new Blob(['synthetic-result'], { type: mime }),
    })
    global.fetch = fetchMock as typeof fetch
    URL.createObjectURL = jest.fn().mockReturnValue('blob:synthetic-result')
    URL.revokeObjectURL = jest.fn()

    try {
      render(<ResultDisplay resultImageUrl={resultImageUrl} taskId={taskId} onTryAgain={jest.fn()} />)
      fireEvent.click(screen.getByRole('button', { name: 'Download' }))

      await waitFor(() => expect(clickSpy).toHaveBeenCalledTimes(1))
      expect(downloadedNames).toEqual([`visutry-result-${taskId}.${extension}`])
      expect(fetchMock).toHaveBeenCalledTimes(1)
      expect(fetchMock).toHaveBeenCalledWith(resultImageUrl)
      expect(URL.createObjectURL).toHaveBeenCalledTimes(1)
      expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:synthetic-result')
    } finally {
      clickSpy.mockRestore()
      global.fetch = originalFetch
      URL.createObjectURL = originalCreateObjectURL
      URL.revokeObjectURL = originalRevokeObjectURL
    }
  })
})
