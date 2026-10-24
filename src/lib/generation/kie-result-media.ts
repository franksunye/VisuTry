/** Shared bounded Kie output reader for Consumer and Store/Campaign. */
export const MAX_KIE_RESULT_BYTES = 15 * 1024 * 1024

export async function readBoundedKieResult(response: Response): Promise<Blob> {
  const mime = response.headers.get('content-type')?.split(';')[0]?.trim().toLowerCase()
  if (!mime || !['image/jpeg', 'image/png', 'image/webp'].includes(mime)) {
    throw new Error('Kie result is not a supported image')
  }
  const declaredLength = response.headers.get('content-length')
  if (declaredLength !== null && Number(declaredLength) > MAX_KIE_RESULT_BYTES) {
    throw new Error('Kie result exceeds safe media size')
  }
  if (!response.body) throw new Error('Kie result has no readable image body')

  // Never call response.blob() on untrusted vendor output. Content-Length can
  // be missing or false; enforce the cap while reading, not after allocation.
  const reader = response.body.getReader()
  const parts: ArrayBuffer[] = []
  let received = 0
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      received += value.byteLength
      if (received > MAX_KIE_RESULT_BYTES) {
        await reader.cancel()
        throw new Error('Kie result exceeds safe media size')
      }
      const part = new ArrayBuffer(value.byteLength)
      new Uint8Array(part).set(value)
      parts.push(part)
    }
  } finally {
    reader.releaseLock()
  }
  return new Blob(parts, { type: mime })
}

export function kieResultExtension(mime: string): 'jpg' | 'png' | 'webp' {
  if (mime === 'image/jpeg') return 'jpg'
  if (mime === 'image/png') return 'png'
  if (mime === 'image/webp') return 'webp'
  throw new Error('Kie result is not a supported image')
}
