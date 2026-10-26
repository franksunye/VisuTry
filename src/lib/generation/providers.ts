export const GRSAI_TRY_ON_MODEL = 'nano-banana-fast'
export const KIE_TRY_ON_MODEL = 'nano-banana-2-lite'
export const GEMINI_TRY_ON_IMAGE_MODEL = 'gemini-2.5-flash-image'

export type GenerationProviderName = 'grsai' | 'gemini' | 'kie'

export function modelForProvider(provider: GenerationProviderName): string {
  if (provider === 'gemini') return GEMINI_TRY_ON_IMAGE_MODEL
  return provider === 'kie' ? KIE_TRY_ON_MODEL : GRSAI_TRY_ON_MODEL
}
