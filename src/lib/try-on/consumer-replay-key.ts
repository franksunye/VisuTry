import type { TryOnType } from '@/config/try-on-types'

/** A client-side logical request is identified by type and the exact File selections. */
export interface ConsumerSubmission {
  type: TryOnType
  userImageFile: File
  itemImageFile: File
  clientSubmissionId: string
}

/**
 * Keep the same ID through lost responses / network retries so server CAS
 * can replay a single task. A deliberate change of either selected file
 * starts a new logical request. Never log image bytes or source URLs.
 */
export function getOrCreateConsumerSubmission(
  previous: ConsumerSubmission | null,
  selected: Omit<ConsumerSubmission, 'clientSubmissionId'>,
  createId: () => string,
): ConsumerSubmission {
  if (previous &&
      previous.type === selected.type &&
      previous.userImageFile === selected.userImageFile &&
      previous.itemImageFile === selected.itemImageFile) {
    return previous
  }

  return { ...selected, clientSubmissionId: createId() }
}
