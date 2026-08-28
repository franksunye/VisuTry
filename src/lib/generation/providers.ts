export const GRSAI_TRY_ON_MODEL = 'nano-banana-fast'
export const GEMINI_TRY_ON_IMAGE_MODEL = 'gemini-2.5-flash-image'

export type GenerationProviderName = 'grsai' | 'gemini'

export function modelForProvider(provider: GenerationProviderName): string {
  return provider === 'gemini' ? GEMINI_TRY_ON_IMAGE_MODEL : GRSAI_TRY_ON_MODEL
}
