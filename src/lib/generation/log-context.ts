export type GenerationLogContext = {
  requestId?: string | null
  attemptId?: string | null
  providerTaskId?: string | null
  clientSubmissionId?: string | null
  origin?: string | null
  provider?: string | null
  model?: string | null
  attemptNumber?: number | null
  status?: string | null
  tryOnTaskId?: string | null
}

export function compactGenerationLogContext(input: GenerationLogContext): Record<string, unknown> {
  const context: Record<string, unknown> = {}
  if (input.requestId) context.requestId = input.requestId
  if (input.attemptId) context.attemptId = input.attemptId
  if (input.providerTaskId) context.providerTaskId = input.providerTaskId
  if (input.clientSubmissionId) context.clientSubmissionId = input.clientSubmissionId
  if (input.origin) context.origin = input.origin
  if (input.provider) context.provider = input.provider
  if (input.model) context.model = input.model
  if (typeof input.attemptNumber === 'number') context.attemptNumber = input.attemptNumber
  if (input.status) context.status = input.status
  if (input.tryOnTaskId) context.tryOnTaskId = input.tryOnTaskId
  return context
}
