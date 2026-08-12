/** @jest-environment node */

import { storeErrorResponse } from '@/modules/store/application/http-error'
import { experienceNotFound } from '@/modules/store/domain'
import { logger } from '@/lib/logger'

jest.mock('@/lib/logger', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}))

describe('Store HTTP error logging', () => {
  it('logs missing experiences as debug-level client rejections', () => {
    const response = storeErrorResponse(experienceNotFound())

    expect(response.status).toBe(404)
    expect(logger.debug).toHaveBeenCalledWith(
      'store',
      'Store client/domain rejection',
      expect.objectContaining({
        code: 'EXPERIENCE_NOT_FOUND',
        httpStatus: 404,
      }),
    )
    expect(logger.warn).not.toHaveBeenCalled()
  })
})
