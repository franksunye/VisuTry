import type { InternalDistributionSurface } from '@/modules/store/domain/session-acquisition'

export type ContextualHandoffPlacement = 'face-analysis' | 'compare' | 'style-explorer'

export type ContextualHandoff = {
  surface: Extract<InternalDistributionSurface, ContextualHandoffPlacement>
  merchantSlug: string
  experienceSlug: string
  campaign: string
  eyebrow: string
  title: string
  description: string
  cta: string
}

export const CONTEXTUAL_HANDOFFS: Record<ContextualHandoffPlacement, ContextualHandoff> = {
  'face-analysis': {
    surface: 'face-analysis',
    merchantSlug: 'ello-sunglasses',
    experienceSlug: 'petite-fit',
    campaign: 'face-analysis-fit',
    eyebrow: 'Continue from your fit result',
    title: 'Explore frames selected for fit',
    description: 'Keep your fit question in focus with a petite-proportion edit you can explore and try on.',
    cta: 'Explore fit-focused frames',
  },
  compare: {
    surface: 'compare',
    merchantSlug: 'framed-ewe',
    experienceSlug: 'find-your-frames',
    campaign: 'compare-more-frames',
    eyebrow: 'Continue your frame decision',
    title: 'Explore more frame directions',
    description: 'Move from side-by-side comparison into a curated multi-brand edit with more shapes to consider.',
    cta: 'Explore more frames',
  },
  'style-explorer': {
    surface: 'style-explorer',
    merchantSlug: 'akila',
    experienceSlug: 'statement-frames',
    campaign: 'style-explorer-statement',
    eyebrow: 'Continue from your style direction',
    title: 'Explore statement eyewear',
    description: 'Keep exploring with a point-of-view edit built around bold, sculptural, and expressive silhouettes.',
    cta: 'Explore statement frames',
  },
}
