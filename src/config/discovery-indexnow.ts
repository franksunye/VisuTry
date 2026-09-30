import demoIdentity from './visutry-demo-identity.json'

export const INDEXNOW_HOST = 'www.visutry.com'
export const INDEXNOW_KEY = 'c8e524ff25e25458ae2918c2362f1585'
export const INDEXNOW_KEY_LOCATION = `https://${INDEXNOW_HOST}/${INDEXNOW_KEY}.txt`

const INDEXNOW_ORIGIN = `https://${INDEXNOW_HOST}`

export const VISUTRY_DEMO_INDEXNOW_URLS = [
  `${INDEXNOW_ORIGIN}/en/store/${demoIdentity.VISUTRY_DEMO_MERCHANT_SLUG}`,
  `${INDEXNOW_ORIGIN}/en/demo/frames/round`,
  `${INDEXNOW_ORIGIN}/en/demo/frames/rectangle`,
  `${INDEXNOW_ORIGIN}/en/demo/frames/oval`,
  `${INDEXNOW_ORIGIN}/en/demo/frames/browline`,
  `${INDEXNOW_ORIGIN}/en/demo/frames/aviator`,
  `${INDEXNOW_ORIGIN}/en/demo/frames/cat-eye`,
] as const

/**
 * IndexNow is intentionally constrained to the canonical first-party Demo
 * Store and its six stable first-party frame detail URLs. No caller-supplied
 * URL list is accepted.
 */
export function assertIndexNowUrl(value: string): string {
  const url = new URL(value)
  if (
    url.protocol !== 'https:'
    || url.hostname !== INDEXNOW_HOST
    || url.port
    || url.username
    || url.password
    || url.search
    || url.hash
    || !url.pathname.startsWith('/en/')
  ) {
    throw new Error(`IndexNow URL must be a canonical ${INDEXNOW_HOST} URL`)
  }
  return url.toString()
}

export function buildVisutryDemoIndexNowUrls(): string[] {
  return VISUTRY_DEMO_INDEXNOW_URLS.map(assertIndexNowUrl)
}
