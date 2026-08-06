/**
 * Compatibility re-export — Store pending sync lives under modules/store (ADR-007).
 * Prefer importing from `@/modules/store/infrastructure/cron/sync-pending-store-tasks`.
 */
export {
  syncPendingStoreTryOnTasks,
  type SyncPendingStoreStats,
} from '@/modules/store/infrastructure/cron/sync-pending-store-tasks'
