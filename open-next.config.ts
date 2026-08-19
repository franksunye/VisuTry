import { defineCloudflareConfig } from '@opennextjs/cloudflare/config'
import staticAssetsIncrementalCache from '@opennextjs/cloudflare/overrides/incremental-cache/static-assets-incremental-cache'

// Official @opennextjs/cloudflare 1.15.1 SSG path: read-only Workers Static
// Assets incremental cache. Reuses the existing ASSETS binding. Do not pass
// an empty defineCloudflareConfig() — that defaults incrementalCache to
// "dummy" and rebuilds force-static HTML on every Worker invocation.
// Keep cache interception off so NextServer can emit a real x-nextjs-cache.
export default defineCloudflareConfig({
  incrementalCache: staticAssetsIncrementalCache,
})
