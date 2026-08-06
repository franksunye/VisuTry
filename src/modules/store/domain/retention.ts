/**
 * @deprecated Import from `@/lib/retention/backoff` instead.
 * Re-export kept so Store domain surface stays stable during ADR-007 migration.
 */
export {
  RETENTION_SOFT_FAIL_CAP,
  RETENTION_ACTIVE_BACKOFF_MS,
  RETENTION_BLOCKED_BACKOFF_MS,
  retentionBackoffMs,
  shouldMarkDeleteBlocked,
  type RetentionSelectMode,
} from '@/lib/retention/backoff'
