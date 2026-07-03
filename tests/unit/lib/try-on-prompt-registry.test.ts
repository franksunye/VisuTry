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
    expect(listTryOnPromptVersions().map((item) => item.version)).toContain('tryon-v1')
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
})
