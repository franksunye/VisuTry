import type { GlassesPreset, StyleIntent, StyleOccasion } from '@/config/glasses-presets'
import type { StyleLookCopy } from './types'

const LOOK_NAMES: Record<string, string> = {
  'sun-wayfarer-black': 'Everyday Classic',
  'sun-aviator-gold': 'Modern Pilot',
  'sun-cat-eye-black': 'Elegant Edge',
  'sun-oversized-gradient': 'Glamorous Escape',
  'sun-narrow-rectangle-black': 'Modern Editorial',
  'sun-round-tortoise': 'Warm Vintage',
  'optical-transparent-geometric': 'Clear Perspective',
  'optical-statement-color': 'Color Confidence',
  'optical-warm-tortoise': 'Modern Classic',
  'optical-thin-gold-oval': 'Refined Minimal',
  'optical-clear-soft-square': 'Clean Modern',
  'optical-slim-browline': 'Confident Professional',
  'sun-shield-wraparound-black': 'Future Sport',
  'sun-curved-flat-top-black': 'Architectural Bold',
  'optical-rimless-geometric': 'Invisible Structure',
  'optical-slim-black-oval': 'Quiet Intelligence',
}

const INTENT_LABELS: Record<StyleIntent, string> = {
  professional: 'Professional',
  minimal: 'Minimal',
  classic: 'Classic',
  creative: 'Creative',
  bold: 'Bold',
  vacation: 'Vacation',
}

export function getStyleLookCopy(
  preset: GlassesPreset,
  styleIntent: StyleIntent,
  occasion?: StyleOccasion,
): StyleLookCopy {
  const weight = preset.visualWeight <= 2 ? 'lightweight' : preset.visualWeight >= 4 ? 'statement' : 'balanced'
  const material = preset.material === 'sport-polymer' ? 'sport' : preset.material
  const occasionText = occasion ? ` for ${occasion}` : ''

  return {
    name: LOOK_NAMES[preset.id] ?? preset.name,
    tags: [INTENT_LABELS[styleIntent], preset.shape.replace(/-/g, ' '), preset.category],
    summary: `${preset.name} brings a ${weight}, ${preset.styleTags[0]} direction${occasionText}.`,
    whyItWorks: `The ${preset.shape.replace(/-/g, ' ')} silhouette and ${material} construction create a ${weight} look while keeping your selected ${INTENT_LABELS[styleIntent].toLowerCase()} direction clear.`,
  }
}
