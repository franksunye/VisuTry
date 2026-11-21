import { MERCHANT_DISCOVERY_EDITORIAL } from '@/config/merchant-discovery-editorial'
import type { PublicExperienceDiscovery } from '@/modules/store/application/get-public-experience-discovery'
import { publicMerchantImageUrl } from '@/lib/is-loopback-image-url'
import { isCanaryDiscoverySource } from '@/lib/canary-discovery-frames'

export { normalizeMerchantDiscoveryDestinations } from '@/lib/canary-discovery-frames'

type EditorialFrame = Pick<PublicExperienceDiscovery['frames'][number],
  'id' | 'name' | 'shape' | 'imageUrl'>

export type MerchantDiscoveryEditorialInput = {
  merchant: Pick<PublicExperienceDiscovery['merchant'], 'id' | 'slug' | 'pilotType' | 'referenceData'>
  experience: Pick<PublicExperienceDiscovery['experience'], 'merchantId' | 'type' | 'slug' | 'status' | 'referenceData'>
  frames: EditorialFrame[]
  visibility: PublicExperienceDiscovery['visibility']
}

export type MerchantDiscoveryEditorial = {
  title: string
  headline: string
  description: string
  intro: string
  nonSaleNotice: string
  comparison: Array<{
    frameId: string
    anchorId: string
    name: string
    shape: string
    observation: string
  }>
  faqs: Array<{ question: string; answer: string }>
}

/** Stable, same-page destinations never resolve an old Canary SKU into the sales Demo. */
export function getDiscoveryFrameAnchorId(frameId: string): string {
  return `frame-${frameId}`
}

/**
 * Apply reviewed copy only after public discovery has admitted the exact live
 * Canary Campaign. Frame facts come from that Experience's current public read
 * model, never from the separate Demo Optical catalog or a fixed SKU lookup.
 */
export function getMerchantDiscoveryEditorial(
  discovery: MerchantDiscoveryEditorialInput,
): MerchantDiscoveryEditorial | null {
  const { experience, visibility } = discovery
  if (
    !isCanaryDiscoverySource(discovery)
    || experience.type !== 'CAMPAIGN'
    || experience.slug !== MERCHANT_DISCOVERY_EDITORIAL.experienceSlug
    || experience.status !== 'ACTIVE'
    || visibility !== 'PUBLIC_INDEX'
  ) return null

  const findFrame = (shape: string) => discovery.frames.find((frame) =>
    frame.shape.trim().toLowerCase() === shape
    && Boolean(frame.id.trim() && frame.name.trim() && publicMerchantImageUrl(frame.imageUrl)),
  )
  const round = findFrame('round')
  const rectangle = findFrame('rectangle')
  // Do not promise a comparison after either selected frame is removed or its
  // supporting image is unavailable. The ordinary collection remains usable.
  if (!round || !rectangle || round.id === rectangle.id) return null

  const comparison = [
    { frame: round, observation: 'Follow the continuous curved outline and compare how prominent the rims look in the product image.' },
    { frame: rectangle, observation: 'Look at the straighter edges and rounded corners, then compare the outline with the round frame.' },
  ].map(({ frame, observation }) => ({
    frameId: frame.id,
    anchorId: getDiscoveryFrameAnchorId(frame.id),
    name: frame.name.trim(),
    shape: frame.shape.trim(),
    observation,
  }))

  return {
    title: MERCHANT_DISCOVERY_EDITORIAL.title,
    headline: MERCHANT_DISCOVERY_EDITORIAL.headline,
    description: MERCHANT_DISCOVERY_EDITORIAL.description,
    intro: MERCHANT_DISCOVERY_EDITORIAL.intro,
    nonSaleNotice: MERCHANT_DISCOVERY_EDITORIAL.nonSaleNotice,
    comparison,
    faqs: [
      {
        question: 'What is the difference between the round and rectangular examples?',
        answer: `${round.name.trim()} has a curved outline; ${rectangle.name.trim()} has straighter edges and rounded corners. Compare their silhouettes and the visual prominence of their rims in the product images.`,
      },
      {
        question: 'Does this collection tell me which frame size will fit?',
        answer: 'This page does not provide measured lens width, bridge width or temple length for the demo frames. A visual preview cannot establish physical fit or comfort; check measured product details with a retailer.',
      },
      {
        question: 'Can I buy the frames in this collection?',
        answer: 'No. These are VisuTry-owned demonstration frames and are not offered for sale. The collection is for exploring frame shapes and the guided eyewear decision experience.',
      },
    ],
  }
}
