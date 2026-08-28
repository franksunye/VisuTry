/** @jest-environment node */

import { pickSafeTryOnMetadata } from '@/lib/generation/inspect'

describe('generation telemetry inspect projection', () => {
  it('keeps correlation keys and drops image/prompt content', () => {
    expect(
      pickSafeTryOnMetadata({
        externalTaskId: 'ext-1',
        telemetryOrigin: 'CAMPAIGN',
        framePresetId: 'browline-classic',
        batchId: 'batch-1',
        effectivePrompt: 'do not leak',
        userPathname: 'tryon/user/secret',
        originalUserFileName: 'face.png',
      }),
    ).toEqual({
      externalTaskId: 'ext-1',
      telemetryOrigin: 'CAMPAIGN',
      framePresetId: 'browline-classic',
      batchId: 'batch-1',
    })
  })
})
