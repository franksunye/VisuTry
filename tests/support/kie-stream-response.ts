/**
 * Response fixture for Jest/jsdom, where the runtime lacks the native
 * Response and ReadableStream implementations used by Next.js Node APIs.
 * Exercises the real streaming-reader contract without making HTTP calls.
 */
export function mockKieStreamResponse(
  mime: string,
  data: readonly number[],
  contentLength?: string,
): Response {
  const bytes = new Uint8Array(data)
  let readCount = 0
  const reader = {
    async read() {
      readCount += 1
      return readCount === 1
        ? { done: false, value: bytes }
        : { done: true, value: undefined }
    },
    async cancel() {},
    releaseLock() {},
  }
  return {
    ok: true,
    status: 200,
    headers: {
      get(name: string) {
        if (name.toLowerCase() === 'content-type') return mime
        if (name.toLowerCase() === 'content-length') return contentLength ?? null
        return null
      },
    },
    body: { getReader: () => reader },
  } as unknown as Response
}
