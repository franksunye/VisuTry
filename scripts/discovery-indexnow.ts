import {
  buildDiscoveryCanaryIndexNowUrls,
  INDEXNOW_HOST,
  INDEXNOW_KEY,
  INDEXNOW_KEY_LOCATION,
} from '../src/config/discovery-indexnow'

const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/indexnow'
const INDEXNOW_TIMEOUT_MS = 10_000

async function main(): Promise<void> {
  const urlList = buildDiscoveryCanaryIndexNowUrls()
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), INDEXNOW_TIMEOUT_MS)

  try {
    const response = await fetch(INDEXNOW_ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/json; charset=utf-8' },
      body: JSON.stringify({
        host: INDEXNOW_HOST,
        key: INDEXNOW_KEY,
        keyLocation: INDEXNOW_KEY_LOCATION,
        urlList,
      }),
      signal: controller.signal,
    })

    console.log(JSON.stringify({
      result: response.ok ? 'success' : 'error',
      endpoint: INDEXNOW_ENDPOINT,
      httpStatus: response.status,
      submittedUrlCount: urlList.length,
      timestamp: new Date().toISOString(),
    }))

    if (!response.ok) process.exitCode = 1
  } catch (error) {
    const message = error instanceof Error && error.name === 'AbortError'
      ? `IndexNow request timed out after ${INDEXNOW_TIMEOUT_MS}ms`
      : error instanceof Error ? error.message : 'IndexNow request failed'
    console.error(JSON.stringify({
      result: 'error',
      endpoint: INDEXNOW_ENDPOINT,
      submittedUrlCount: urlList.length,
      timestamp: new Date().toISOString(),
      error: message,
    }))
    process.exitCode = 1
  } finally {
    clearTimeout(timeout)
  }
}

void main()
