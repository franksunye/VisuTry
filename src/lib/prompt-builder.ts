/**
 * Unified Prompt Builder for AI Image Generation
 *
 * This module provides a consistent prompt structure for both Gemini (direct)
 * and GrsAi (proxy) services. Both services ultimately use Gemini models,
 * so the prompt engineering should be identical.
 *
 * Based on Google's official Gemini 2.5 Flash Image prompting best practices:
 * - Use natural, descriptive language instead of keyword lists
 * - Think like a photographer when describing scenes
 * - Be explicit about aspect ratio and dimensions
 * - Provide context and intent for better results
 *
 * @see https://developers.googleblog.com/en/how-to-prompt-gemini-2-5-flash-image-generation-for-the-best-results/
 */

/**
 * Build a complete try-on prompt with full structure
 *
 * @param detailedInstructions - Type-specific detailed instructions (from TRY_ON_CONFIGS[type].aiPrompt)
 * @returns Complete prompt string with all sections
 */
export function buildTryOnPrompt(detailedInstructions: string): string {
  return `You are a professional virtual try-on photographer creating composite images.

SCENE SETUP:
You have two images: Image 1 is the person's photograph (the "canvas"), and Image 2 is the product to try on.

YOUR TASK:
Create a single photorealistic image showing the person naturally wearing the product. The final image must look like a real photograph taken in the same setting as the original.

CRITICAL CONSTRAINT - IMAGE DIMENSIONS:
The output image must have the exact same dimensions and aspect ratio as Image 1 (the person's photo). If Image 1 is a vertical portrait photo, your output must be a vertical portrait. If Image 1 is a horizontal landscape photo, your output must be horizontal. Do not crop, pad, letterbox, or change the framing in any way.

DETAILED INSTRUCTIONS:
${detailedInstructions}

QUALITY GUIDELINES:
Match the exact lighting direction, color temperature, and intensity from Image 1. Maintain photorealistic quality with natural shadows and highlights. Ensure seamless blending with no visible artifacts at edges. Preserve all original details including face, expression, background, and composition. The product should look like it was photographed in the same moment.

OUTPUT:
Generate the composite image, followed by a brief 2-3 sentence description noting the product type, any identifiable brand details, and how well it complements the person's features.`
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

