import { TRY_ON_CONFIGS, TryOnType } from '@/config/try-on-types'

export const DEFAULT_TRY_ON_PROMPT_VERSION = 'tryon-v1' as const
export const TRY_ON_PROMPT_VERSION_ENV = 'TRY_ON_PROMPT_VERSION' as const

export interface TryOnPromptDefinition {
  version: string
  description: string
  createdAt: string
  instructions: Readonly<Record<TryOnType, string>>
  render: (detailedInstructions: string) => string
}

export interface ResolvedTryOnPrompt {
  version: string
  source: 'registry' | 'override'
  detailedInstructions: string
  renderedPrompt: string
}

function renderV1(detailedInstructions: string): string {
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
 * Prompt versions are immutable release artifacts. Never edit an existing entry
 * after it has served production traffic; add a new version instead.
 */
const TRY_ON_PROMPT_VERSIONS: Readonly<Record<string, TryOnPromptDefinition>> = Object.freeze({
  'tryon-v1': Object.freeze({
    version: 'tryon-v1',
    description: 'Production prompt introduced from the December 2025 Gemini 2.5 guidance',
    createdAt: '2025-12-05',
    instructions: Object.freeze({
      GLASSES: TRY_ON_CONFIGS.GLASSES.aiPrompt,
      OUTFIT: TRY_ON_CONFIGS.OUTFIT.aiPrompt,
      SHOES: TRY_ON_CONFIGS.SHOES.aiPrompt,
      ACCESSORIES: TRY_ON_CONFIGS.ACCESSORIES.aiPrompt,
    }),
    render: renderV1,
  }),
})

export function listTryOnPromptVersions(): TryOnPromptDefinition[] {
  return Object.values(TRY_ON_PROMPT_VERSIONS)
}

export function getActiveTryOnPromptVersion(): string {
  return process.env[TRY_ON_PROMPT_VERSION_ENV] || DEFAULT_TRY_ON_PROMPT_VERSION
}

export function getTryOnPromptDefinition(version = getActiveTryOnPromptVersion()): TryOnPromptDefinition {
  const definition = TRY_ON_PROMPT_VERSIONS[version]

  if (!definition) {
    const available = Object.keys(TRY_ON_PROMPT_VERSIONS).join(', ')
    throw new Error(`Unknown try-on prompt version "${version}". Available versions: ${available}`)
  }

  return definition
}

export function resolveTryOnPrompt(
  type: TryOnType,
  detailedInstructions?: string,
  version = getActiveTryOnPromptVersion()
): ResolvedTryOnPrompt {
  const definition = getTryOnPromptDefinition(version)
  const source = detailedInstructions ? 'override' : 'registry'
  const instructions = detailedInstructions || definition.instructions[type]

  return {
    version: definition.version,
    source,
    detailedInstructions: instructions,
    renderedPrompt: definition.render(instructions),
  }
}

export function renderTryOnPrompt(
  detailedInstructions: string,
  version = getActiveTryOnPromptVersion()
): string {
  return getTryOnPromptDefinition(version).render(detailedInstructions)
}
