import { getTryOnDownloadFilename } from '@/lib/tryon-download'

describe('getTryOnDownloadFilename', () => {
  it.each([
    ['image/jpeg', 'jpg'],
    ['image/jpg', 'jpg'],
    ['image/png', 'png'],
    ['image/webp', 'webp'],
    [' IMAGE/WEBP ; charset=utf-8', 'webp'],
    ['application/octet-stream', 'bin'],
    ['', 'bin'],
  ])('maps %s to a safe .%s filename', (mime, extension) => {
    expect(getTryOnDownloadFilename('synthetic-task', mime)).toBe(`visutry-result-synthetic-task.${extension}`)
  })
})
