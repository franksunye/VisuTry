import { authOptions } from './auth'

// Cloudflare/OpenNext replaces this module at the build boundary through the
// explicit next.config alias. Node/Vercel/Local therefore use a static import
// here; the old runtime require could produce an undefined options object in
// the Next App Router development handler.
export { authOptions }
