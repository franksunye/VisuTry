function safeHttpsUrl(value: string): URL {
  let url: URL
  try {
    url = new URL(value)
  } catch {
    throw new Error('Invalid consumer media URL')
  }
  if (url.protocol !== 'https:' || url.username || url.password || url.port) {
    throw new Error('Unsupported consumer media URL')
  }
  return url
}

function isPublicBlob(host: string): boolean {
  return /^[a-z0-9-]+\.(?:public\.)?blob\.vercel-storage\.com$/.test(host)
}

function isGrsaiResult(host: string): boolean {
  // Result URLs in the GrsAi integration use numbered file CDN hosts.
  return /^file[0-9]*\.grsai\.com$/.test(host)
}

export function isKieResultHost(host: string): boolean {
  return host === 'tempfile.aiquickdraw.com' ||
    host === 'redpandaai.co' || host.endsWith('.redpandaai.co') ||
    host === 'kie.ai' || host.endsWith('.kie.ai')
}

export function parseConsumerProviderResultUrl(value: string, provider: 'grsai' | 'kie'): URL {
  const url = safeHttpsUrl(value)
  const allowed = provider === 'grsai' ? isGrsaiResult(url.hostname) : isKieResultHost(url.hostname)
  if (!allowed) throw new Error('Unrecognized consumer provider result host')
  return url
}

export function parseLegacyPublicConsumerMediaUrl(value: string, kind: 'user' | 'item' | 'result' | 'face'): URL {
  const url = safeHttpsUrl(value)
  if (isPublicBlob(url.hostname)) return url
  if (kind === 'result' && (isGrsaiResult(url.hostname) || isKieResultHost(url.hostname))) return url
  throw new Error('Unrecognized legacy consumer media host')
}
