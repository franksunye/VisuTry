/**
 * Backward-compatible Store-domain export.
 *
 * Merchant commercial plans are owned by the Merchant domain. Keep this
 * facade for existing Store-domain imports while preserving one source of
 * truth.
 */
export * from '../../merchant/domain/merchant-commercial-plans'
