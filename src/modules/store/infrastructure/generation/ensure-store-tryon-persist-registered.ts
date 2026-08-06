/**
 * Ensures Store GrsAI result persist handler is registered into shared poll core.
 */

import { registerStoreGrsaiSucceededPersistHandler } from '@/lib/generation/tryon-result-persist'
import { persistStoreGrsaiSucceededResult } from './persist-store-grsai-result'

let registered = false

export function ensureStoreTryOnPersistRegistered(): void {
  if (registered) return
  registerStoreGrsaiSucceededPersistHandler(persistStoreGrsaiSucceededResult)
  registered = true
}
