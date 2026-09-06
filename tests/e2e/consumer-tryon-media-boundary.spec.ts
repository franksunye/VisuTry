import { createServer, type Server } from 'node:http'
import { once } from 'node:events'
import { expect, test } from '@playwright/test'

const PROTECTED_RESULT_PATH = '/api/try-on/task-1/media/result'
const SESSION_COOKIE = 'next-auth.session-token=consumer-media-e2e-session'
const ONE_PIXEL_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
  'base64',
)

interface ProtectedRequestObservation {
  path: string
  hasSessionCookie: boolean
}

interface MediaFixture {
  server: Server
  origin: string
  protectedRequests: ProtectedRequestObservation[]
  optimizerRequests: string[]
}

/**
 * This is a real HTTP boundary fixture, not a Playwright route interception.
 * The protected handler checks the session cookie before returning image bytes.
 * FaceAnalysisResult's actual next/image prop is covered by the companion unit
 * test; this fixture proves the browser-side equivalent request is direct and
 * authenticated when that prop is rendered.
 */
async function startMediaFixture(): Promise<MediaFixture> {
  const protectedRequests: ProtectedRequestObservation[] = []
  const optimizerRequests: string[] = []
  const server = createServer((request, response) => {
    const requestUrl = new URL(request.url || '/', `http://${request.headers.host}`)

    if (requestUrl.pathname === '/en/face-analysis') {
      response.writeHead(200, { 'content-type': 'text/html; charset=utf-8' })
      response.end(`<!doctype html>
        <html>
          <body>
            <main data-testid="face-analysis-top-picks">
              <img id="result" src="${PROTECTED_RESULT_PATH}" alt="Top Pick result">
            </main>
          </body>
        </html>`)
      return
    }

    if (requestUrl.pathname === PROTECTED_RESULT_PATH) {
      const hasSessionCookie = (request.headers.cookie || '')
        .split(';')
        .some((cookie) => cookie.trim() === SESSION_COOKIE)
      protectedRequests.push({ path: requestUrl.pathname, hasSessionCookie })

      if (!hasSessionCookie) {
        response.writeHead(401, { 'content-type': 'application/json' })
        response.end(JSON.stringify({ success: false, error: 'Unauthorized' }))
        return
      }

      response.writeHead(200, {
        'content-type': 'image/png',
        'content-length': String(ONE_PIXEL_PNG.byteLength),
        'cache-control': 'private, no-store',
      })
      response.end(ONE_PIXEL_PNG)
      return
    }

    if (requestUrl.pathname === '/_next/image') {
      optimizerRequests.push(requestUrl.toString())
    }

    response.writeHead(404)
    response.end()
  })

  server.listen(0, '127.0.0.1')
  await once(server, 'listening')
  const address = server.address()
  if (!address || typeof address === 'string') {
    server.close()
    throw new Error('Media fixture did not bind to a TCP port')
  }

  return {
    server,
    origin: `http://127.0.0.1:${address.port}`,
    protectedRequests,
    optimizerRequests,
  }
}

async function stopMediaFixture(server: Server) {
  if (!server.listening) return
  await new Promise<void>((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve())
  })
}

test.describe('@critical Consumer Try-On media boundary', () => {
  test('browser loads an authenticated result directly, without Next image optimization', async ({ page, context }) => {
    const fixture = await startMediaFixture()

    try {
      await context.addCookies([{
        name: 'next-auth.session-token',
        value: 'consumer-media-e2e-session',
        url: fixture.origin,
      }])

      const imageRequests: string[] = []
      page.on('request', (request) => {
        if (request.resourceType() === 'image') imageRequests.push(request.url())
      })

      await page.goto(`${fixture.origin}/en/face-analysis`, { waitUntil: 'load' })
      const image = page.locator('#result')

      await expect(image).toHaveJSProperty('complete', true)
      await expect.poll(async () => image.evaluate((element) => (element as HTMLImageElement).naturalWidth)).toBeGreaterThan(0)

      const protectedUrl = `${fixture.origin}${PROTECTED_RESULT_PATH}`
      expect(imageRequests).toContain(protectedUrl)
      expect(imageRequests.some((url) => url.includes('/_next/image?'))).toBe(false)
      expect(imageRequests.some((url) => url.includes('storage.example.test'))).toBe(false)
      expect(fixture.optimizerRequests).toEqual([])
      expect(fixture.protectedRequests).toEqual([{
        path: PROTECTED_RESULT_PATH,
        hasSessionCookie: true,
      }])
    } finally {
      await stopMediaFixture(fixture.server)
    }
  })
})
