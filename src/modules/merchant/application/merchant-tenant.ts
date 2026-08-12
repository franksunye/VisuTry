import { MerchantAccessError } from './merchant-access'
import type { MerchantActorContext } from '../domain/actor'

/** Anti-enumeration guard for any future tenant-owned Merchant/Catalog/Experience capability. */
export function requireMerchantTenant(actor: MerchantActorContext, resourceMerchantId: string): void {
  if (actor.merchantId !== resourceMerchantId) throw new MerchantAccessError()
}
