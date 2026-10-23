/**
 * The result image may come from Grsai or Kie; the actual downloaded media
 * type, not the provider or the URL route, determines its filename extension.
 * Unknown types intentionally use .bin instead of falsely claiming JPEG.
 */
export function getTryOnDownloadFilename(taskId: string, contentType: string): string {
  const mime = contentType.split(';', 1)[0].trim().toLowerCase()
  const extension = mime === 'image/png'
    ? 'png'
    : mime === 'image/webp'
      ? 'webp'
      : mime === 'image/jpeg' || mime === 'image/jpg'
        ? 'jpg'
        : 'bin'

  return `visutry-result-${taskId}.${extension}`
}
