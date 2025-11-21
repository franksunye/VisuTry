/**
 * Try-On Type Configuration
 * 
 * This file defines all supported try-on types and their configurations.
 * Adding a new type is as simple as adding a new entry to TRY_ON_CONFIGS.
 */

export type TryOnType = 'GLASSES' | 'OUTFIT' | 'SHOES' | 'ACCESSORIES'

export interface TryOnConfig {
  name: string
  displayName: string
  route: string
  icon: string
  userImageLabel: string
  itemImageLabel: string
  itemImagePlaceholder: string
  emptyStateMessage: string
  aiPrompt: string
  metadata: {
    category: string
    requiresFaceDetection?: boolean
    requiresBodyDetection?: boolean
    requiresFootDetection?: boolean
  }
}

export const TRY_ON_CONFIGS: Record<TryOnType, TryOnConfig> = {
  GLASSES: {
    name: 'Glasses',
    displayName: 'Try On Glasses',
    route: '/try-on/glasses',
    icon: '👓',
    userImageLabel: 'Upload Your Photo',
    itemImageLabel: 'Upload Glasses Image',
    itemImagePlaceholder: 'Choose glasses to try on',
    emptyStateMessage: 'Upload your photo and glasses to see the magic!',
    aiPrompt: 'Place the glasses naturally on the person\'s face in the uploaded photo — use that face photo exactly as is, without cropping or altering its size, proportions, or composition; if the head is slightly tilted, the glasses frame should tilt accordingly and align exactly with the roll/tilt angle of the head, sitting properly on the nose bridge and temples. Ensure the glasses fit properly, match the lighting and perspective, look realistic, and avoid any distortion or skewing of the frame.',
    metadata: {
      category: 'eyewear',
      requiresFaceDetection: true
    }
  },
  OUTFIT: {
    name: 'Outfit',
    displayName: 'Try On Outfit',
    route: '/try-on/outfit',
    icon: '👔',
    userImageLabel: 'Upload Your Photo',
    itemImageLabel: 'Upload Outfit Image',
    itemImagePlaceholder: 'Choose outfit to try on',
    emptyStateMessage: 'Upload your photo and outfit to see how it looks!',
    aiPrompt: 'Generate a photorealistic image of the person wearing this outfit. The outfit should fit naturally on the person\'s body, matching their pose, body shape, and proportions. Ensure the clothing matches the lighting, perspective, and looks realistic. Preserve the person\'s face, hair, and overall appearance while seamlessly integrating the outfit.',
    metadata: {
      category: 'clothing',
      requiresBodyDetection: true
    }
  },
  SHOES: {
    name: 'Shoes',
    displayName: 'Try On Shoes',
    route: '/try-on/shoes',
    icon: '👟',
    userImageLabel: 'Upload Your Photo',
    itemImageLabel: 'Upload Shoes Image',
    itemImagePlaceholder: 'Choose shoes to try on',
    emptyStateMessage: 'Upload your photo and shoes to see the perfect fit!',
    aiPrompt: 'Generate a photorealistic image of the person wearing these shoes. The shoes should fit naturally on the person\'s feet, matching their pose and body proportions. Ensure the footwear matches the lighting, perspective, and looks realistic. Preserve the person\'s overall appearance while seamlessly integrating the shoes.',
    metadata: {
      category: 'footwear',
      requiresFootDetection: true
    }
  },
  ACCESSORIES: {
    name: 'Accessories',
    displayName: 'Try On Accessories',
    route: '/try-on/accessories',
    icon: '💍',
    userImageLabel: 'Upload Your Photo',
    itemImageLabel: 'Upload Accessory Image',
    itemImagePlaceholder: 'Choose accessory to try on',
    emptyStateMessage: 'Upload your photo and accessory to see how it complements your style!',
    aiPrompt: 'Generate a photorealistic image of the person wearing this accessory (jewelry, watch, hat, etc.). The accessory should be placed naturally on the appropriate part of the body, matching the person\'s pose and proportions. Ensure the accessory matches the lighting, perspective, and looks realistic. Preserve the person\'s overall appearance while seamlessly integrating the accessory.',
    metadata: {
      category: 'accessories'
    }
  }
}

/**
 * Get configuration for a specific try-on type
 */
export function getTryOnConfig(type: TryOnType): TryOnConfig {
  return TRY_ON_CONFIGS[type]
}

/**
 * Validate if a string is a valid try-on type
 */
export function isValidTryOnType(type: string): type is TryOnType {
  return type in TRY_ON_CONFIGS
}

/**
 * Get all available try-on types
 */
export function getAllTryOnTypes(): TryOnType[] {
  return Object.keys(TRY_ON_CONFIGS) as TryOnType[]
}

/**
 * Convert URL-friendly type string to TryOnType enum
 * e.g., "glasses" -> "GLASSES"
 */
export function urlToTryOnType(urlType: string): TryOnType | null {
  const upperType = urlType.toUpperCase() as TryOnType
  return isValidTryOnType(upperType) ? upperType : null
}

/**
 * Convert TryOnType enum to URL-friendly string
 * e.g., "GLASSES" -> "glasses"
 */
export function tryOnTypeToUrl(type: TryOnType): string {
  return type.toLowerCase()
}

