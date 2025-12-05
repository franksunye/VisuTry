/**
 * Unified Prompt Builder for AI Image Generation
 * 
 * This module provides a consistent prompt structure for both Gemini (direct)
 * and GrsAi (proxy) services. Both services ultimately use Gemini models,
 * so the prompt engineering should be identical.
 */

/**
 * Build a complete try-on prompt with full structure
 * 
 * @param detailedInstructions - Type-specific detailed instructions (from TRY_ON_CONFIGS[type].aiPrompt)
 * @returns Complete prompt string with all sections
 */
export function buildTryOnPrompt(detailedInstructions: string): string {
  return `You are an expert AI image generation specialist for virtual try-on technology.

INPUT:
- Image 1: A person's photograph (user photo)
- Image 2: An item to try on (product image)

TASK:
Generate a single photorealistic composite image showing the person wearing/using the item.

DETAILED INSTRUCTIONS:
${detailedInstructions}

TECHNICAL REQUIREMENTS:
- Output resolution: Match the user photo's resolution
- Image quality: Photorealistic, high-fidelity
- Composition: Keep the original photo's framing and composition
- Color accuracy: Maintain accurate colors for both person and item
- Edge blending: Seamless transitions with no visible artifacts
- Depth consistency: Proper occlusion and layering
- Shadow realism: Natural shadows that match the lighting environment

OUTPUT FORMAT:
- Return two outputs: (1) one photorealistic composite image, (2) a brief text description
- The text should include: product category, identified brand/model/color/style/price if recognizable, fit assessment, and styling recommendations
- Keep the description concise and user-friendly (2-4 sentences)`
}

/**
 * Default prompts for different try-on types
 * These are used as fallbacks if no custom prompt is provided
 */
export const DEFAULT_PROMPTS = {
  GLASSES: `Place the glasses naturally on the person's face in the uploaded photo — use that face photo exactly as is, without cropping or altering its size, proportions, or composition; if the head is slightly tilted, the glasses frame should tilt accordingly and align exactly with the roll/tilt angle of the head, sitting properly on the nose bridge and temples. Ensure the glasses fit properly, match the lighting and perspective, look realistic, and avoid any distortion or skewing of the frame.`,
  
  OUTFIT: `Replace ONLY the clothing on the torso/body with the new outfit while keeping the person's face, head, hair, and all other features COMPLETELY UNCHANGED. The outfit must fit the person's body shape and proportions naturally with proper draping and fabric flow based on the person's pose.`,
  
  SHOES: `Replace ONLY the footwear on the person's feet with the new shoes while keeping all other aspects of the person and photo COMPLETELY UNCHANGED. Position shoes correctly based on the person's foot angle and stance, ensuring they sit naturally on the ground/floor surface.`,
  
  ACCESSORIES: `Place the accessory naturally on the appropriate body part based on its type (jewelry, watch, hat, scarf, bag, etc.) while keeping all other aspects of the person and photo COMPLETELY UNCHANGED. The accessory should appear as if it was part of the original photograph with proper size, lighting, and material properties.`
} as const

