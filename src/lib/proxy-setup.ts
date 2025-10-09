/**
 * Global Proxy Setup for NextAuth / openid-client
 *
 * This module configures proxy for NextAuth's openid-client in local development.
 * It must be imported BEFORE NextAuth is initialized.
 *
 * Strategy:
 * - In Vercel (production): No proxy needed, direct connection
 * - In local dev: Use proxy for external APIs (Twitter), but NOT for localhost
 *
 * Reference: https://next-auth.js.org/tutorials/corporate-proxy
 */

// Only setup proxy in Node.js environment (not in browser)
if (typeof window === 'undefined') {
  const isLocalDev = process.env.NODE_ENV === 'development' && !process.env.VERCEL
  const proxyUrl = process.env.HTTPS_PROXY || process.env.HTTP_PROXY

  if (isLocalDev && proxyUrl) {
    try {
      // Configure openid-client to use proxy
      const { custom } = require('openid-client')
      const { HttpsProxyAgent } = require('https-proxy-agent')

      // Create proxy agent with increased timeout
      const httpsAgent = new HttpsProxyAgent(proxyUrl, {
        timeout: 15000, // 15 seconds timeout
      })

      // Set default HTTP options for openid-client
      custom.setHttpOptionsDefaults({
        agent: httpsAgent,
        timeout: 15000, // 15 seconds timeout for requests
      })

      console.log('🔌 Proxy configured for NextAuth/openid-client')
      console.log('  - Proxy URL:', proxyUrl)
      console.log('  - Timeout: 15000ms')
      console.log('  - Target: Twitter OAuth API')
    } catch (error) {
      console.error('❌ Failed to configure proxy for openid-client:', error)
      console.error('   Twitter OAuth may fail in China without proxy')
    }
  } else {
    if (isLocalDev) {
      console.log('⚠️  No proxy configured - Twitter OAuth may fail in China')
      console.log('   Set HTTPS_PROXY or HTTP_PROXY in .env.local')
    }
  }
}

export {}

