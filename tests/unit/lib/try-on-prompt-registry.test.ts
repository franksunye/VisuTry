import { createHash } from 'node:crypto'
import {
  DEFAULT_TRY_ON_PROMPT_VERSION,
  getActiveTryOnPromptVersion,
  getTryOnPromptDefinition,
  listTryOnPromptVersions,
  resolveTryOnPrompt,
} from '@/lib/try-on-prompt-registry'

describe('try-on prompt registry', () => {
  const originalVersion = process.env.TRY_ON_PROMPT_VERSION

  afterEach(() => {
    if (originalVersion === undefined) {
      delete process.env.TRY_ON_PROMPT_VERSION
    } else {
      process.env.TRY_ON_PROMPT_VERSION = originalVersion
    }
  })

  it('uses the stable default version when no override is configured', () => {
    delete process.env.TRY_ON_PROMPT_VERSION

    expect(getActiveTryOnPromptVersion()).toBe(DEFAULT_TRY_ON_PROMPT_VERSION)
    expect(listTryOnPromptVersions().map((item) => item.version)).toEqual([
      'tryon-v1',
      'tryon-v2',
    ])
  })

  it('resolves and renders a registry prompt with audit metadata', () => {
    const prompt = resolveTryOnPrompt('GLASSES', undefined, 'tryon-v1')

    expect(prompt.version).toBe('tryon-v1')
    expect(prompt.source).toBe('registry')
    expect(prompt.renderedPrompt).toContain(prompt.detailedInstructions)
    expect(prompt.renderedPrompt).toContain('SCENE SETUP:')
  })

  it('keeps custom instructions under the selected wrapper version', () => {
    const prompt = resolveTryOnPrompt('GLASSES', 'custom glasses instructions', 'tryon-v1')

    expect(prompt.source).toBe('override')
    expect(prompt.detailedInstructions).toBe('custom glasses instructions')
    expect(prompt.renderedPrompt).toContain('custom glasses instructions')
  })

  it('registers v2 without activating it and changes only glasses instructions', () => {
    delete process.env.TRY_ON_PROMPT_VERSION

    const v1 = getTryOnPromptDefinition('tryon-v1')
    const v2 = getTryOnPromptDefinition('tryon-v2')
    const glasses = resolveTryOnPrompt('GLASSES', undefined, 'tryon-v2')

    expect(getActiveTryOnPromptVersion()).toBe('tryon-v1')
    expect(glasses.version).toBe('tryon-v2')
    expect(glasses.detailedInstructions).toContain('exactly one pair of glasses')
    expect(glasses.detailedInstructions).toContain('completely replace them')
    expect(glasses.detailedInstructions).toContain('Scale the entire frame uniformly')
    expect(v2.instructions.OUTFIT).toBe(v1.instructions.OUTFIT)
    expect(v2.instructions.SHOES).toBe(v1.instructions.SHOES)
    expect(v2.instructions.ACCESSORIES).toBe(v1.instructions.ACCESSORIES)
  })

  it('fails closed for an unknown configured version', () => {
    process.env.TRY_ON_PROMPT_VERSION = 'missing-version'

    expect(() => resolveTryOnPrompt('GLASSES')).toThrow(
      'Unknown try-on prompt version "missing-version"'
    )
  })

  it('protects the immutable v1 release from accidental edits', () => {
    const definition = getTryOnPromptDefinition('tryon-v1')
    const payload = Object.entries(definition.instructions)
      .map(([type, instructions]) => `${type}\n${definition.render(instructions)}`)
      .join('\n---\n')
    const fingerprint = createHash('sha256').update(payload).digest('hex')

    expect(fingerprint).toBe('0eee4408006f210d7493e371ae94f50f7ae1548b32446da537125e6789cc2be3')
  })

  it('protects the inactive v2 candidate from accidental edits', () => {
    const definition = getTryOnPromptDefinition('tryon-v2')
    const payload = Object.entries(definition.instructions)
      .map(([type, instructions]) => `${type}\n${definition.render(instructions)}`)
      .join('\n---\n')
    const fingerprint = createHash('sha256').update(payload).digest('hex')

    expect(fingerprint).toBe('8fe8475f478d4aeae57682f585e05040540047eaa1fd6ed6991dbc9dfd9c3f6c')
  })
})
