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
    aiPrompt: `You are a professional virtual try-on specialist. Create a photorealistic image of the person wearing the provided glasses.

CRITICAL REQUIREMENTS - MUST FOLLOW:
1. PRESERVE THE PERSON EXACTLY:
   - Use the face photo EXACTLY as is - no cropping, resizing, or altering
   - Keep face size, proportions, and composition COMPLETELY UNCHANGED
   - Maintain the exact same facial expression and head position
   - Do NOT alter skin tone, facial features, hair, or background
   - Preserve the original photo's framing and composition

2. GLASSES PLACEMENT:
   - Position glasses naturally on the nose bridge and temples
   - If the head is tilted, tilt the glasses frame to match the EXACT head angle
   - Align the frame perfectly with the roll/tilt angle of the head
   - Ensure the glasses sit properly on the nose bridge
   - The temples should rest naturally on the ears

3. FITTING AND PROPORTIONS:
   - Scale the glasses to fit the face proportionally
   - The frame width should match the face width appropriately
   - Lens height should be proportional to the eye area
   - Ensure the glasses don't appear too large or too small

4. LIGHTING AND REALISM:
   - Match the lighting direction and intensity from the original photo
   - Create realistic reflections on the lenses (subtle, not overpowering)
   - Add appropriate shadows from the frame on the face
   - Ensure the frame material (metal, plastic, etc.) reflects light correctly

5. PERSPECTIVE AND DEPTH:
   - Match the perspective of the original photo
   - Ensure the glasses follow the same depth plane as the face
   - Maintain proper occlusion (glasses in front of face, behind hair if applicable)

AVOID:
- Distorting or skewing the glasses frame
- Changing the person's face, head size, or features
- Altering the background or photo composition
- Creating unnatural reflections or shadows
- Making the glasses appear floating or misaligned`,
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
    aiPrompt: `You are a professional virtual try-on specialist. Create a photorealistic image of the person wearing the provided outfit.

CRITICAL REQUIREMENTS - MUST FOLLOW:
1. PRESERVE THE PERSON EXACTLY:
   - Keep the person's face, head, hair, and facial features COMPLETELY UNCHANGED
   - Maintain the exact same pose, stance, and body position
   - Do NOT alter skin tone, facial expression, or any facial characteristics
   - Keep the background EXACTLY as it appears in the original photo

2. OUTFIT PLACEMENT:
   - Replace ONLY the clothing on the torso/body with the new outfit
   - The outfit must fit the person's body shape and proportions naturally
   - Ensure proper draping and fabric flow based on the person's pose
   - Match the outfit's size to the person's body realistically

3. LIGHTING AND REALISM:
   - Match the lighting direction and intensity from the original photo
   - Create realistic shadows and highlights on the outfit
   - Ensure the outfit's colors appear natural under the existing lighting
   - Maintain consistent perspective and depth

4. INTEGRATION:
   - Seamlessly blend the outfit with the person's body
   - Ensure natural transitions at neckline, shoulders, and waist
   - The outfit should look like it was photographed in the same environment
   - Preserve any visible hands, arms, or lower body parts

AVOID:
- Changing the person's face, head size, or facial features
- Altering the background or environment
- Creating unnatural body proportions
- Adding elements not present in either image
- Distorting the outfit's original design or colors`,
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
    aiPrompt: `You are a professional virtual try-on specialist. Create a photorealistic image of the person wearing the provided shoes.

CRITICAL REQUIREMENTS - MUST FOLLOW:
1. PRESERVE THE PERSON EXACTLY:
   - Keep the person's face, body, pose, and clothing COMPLETELY UNCHANGED
   - Maintain the exact same stance and leg position
   - Do NOT alter any part of the person except the footwear area
   - Keep the background EXACTLY as it appears in the original photo

2. SHOE PLACEMENT:
   - Replace ONLY the footwear on the person's feet
   - Position shoes correctly based on the person's foot angle and stance
   - Ensure shoes sit naturally on the ground/floor surface
   - Match the shoe size to the person's feet proportionally

3. LIGHTING AND REALISM:
   - Match the lighting direction and intensity from the original photo
   - Create realistic shadows under and around the shoes
   - Ensure shoe materials (leather, fabric, rubber) reflect light appropriately
   - Maintain consistent perspective with the ground plane

4. INTEGRATION:
   - Seamlessly blend shoes with the person's legs/pants
   - Ensure natural transitions at ankles and shoe openings
   - The shoes should look like they were photographed in the same environment
   - Preserve any floor reflections or shadows

AVOID:
- Changing the person's pose, body, or clothing
- Altering the background or floor surface
- Creating unnatural foot positions or angles
- Distorting the shoe's original design or proportions`,
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
    aiPrompt: `You are a professional virtual try-on specialist. Create a photorealistic image of the person wearing the provided accessory.

CRITICAL REQUIREMENTS - MUST FOLLOW:
1. PRESERVE THE PERSON EXACTLY:
   - Keep the person's face, body, pose, and clothing COMPLETELY UNCHANGED
   - Maintain the exact same position and expression
   - Do NOT alter any part of the person except where the accessory is placed
   - Keep the background EXACTLY as it appears in the original photo

2. ACCESSORY PLACEMENT:
   - Identify the accessory type (jewelry, watch, hat, scarf, bag, etc.)
   - Place the accessory on the appropriate body part:
     * Necklace/pendant: around the neck
     * Earrings: on the ears
     * Watch/bracelet: on the wrist
     * Ring: on the finger
     * Hat: on the head (matching head angle)
     * Scarf: around the neck/shoulders
     * Bag: on shoulder or in hand
   - Ensure the accessory size is proportional to the body part
   - Position naturally based on the person's pose and orientation

3. LIGHTING AND REALISM:
   - Match the lighting direction and intensity from the original photo
   - Create realistic reflections on metallic/shiny accessories
   - Ensure gemstones and materials reflect light appropriately
   - Maintain consistent shadows and highlights

4. INTEGRATION:
   - Seamlessly blend the accessory with the person
   - Ensure natural contact points (e.g., earring on earlobe, watch on wrist)
   - The accessory should look like it was photographed in the same environment
   - Preserve depth and perspective

AVOID:
- Changing the person's appearance, pose, or clothing
- Altering the background
- Placing accessories in unnatural positions
- Distorting the accessory's original design`,
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

