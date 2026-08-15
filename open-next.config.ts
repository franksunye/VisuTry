import { defineCloudflareConfig } from '@opennextjs/cloudflare/config'

// Phase A intentionally uses the Workers Static Assets path only. No R2
// cache binding is declared until a later staging-parity phase justifies it.
export default defineCloudflareConfig()
