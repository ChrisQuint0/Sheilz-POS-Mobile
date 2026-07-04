import { create } from 'zustand';
import { runSync, getQueueStats } from '../services/syncService';

export type SyncStatus = 'Online' | 'Offline' | 'Synced' | 'Syncing' | 'Pending Sync' | 'Sync Failed';

export interface SyncHistoryEvent {
  id: string;
  timestamp: string;
  recordsUploaded: number;
  durationMs: number;
  result: 'Success' | 'Failed';
  failureReason?: string;
}

interface SyncState {
  // Current Status
  status: SyncStatus;
  lastSyncTimestamp: string | null;

  // Queue metrics
  pendingTransactions: number;
  pendingInventory: number;
  failedRecords: number;

  // Auto Management
  isAutoSyncEnabled: boolean;
  isNetworkConnected: boolean;

  // History
  syncHistory: SyncHistoryEvent[];

  // Actions
  syncNow: () => Promise<void>;
  retryFailed: () => Promise<void>;
  toggleAutoSync: () => void;
  setNetworkStatus: (isConnected: boolean) => void;
  hydrateStats: () => Promise<void>;
  clearHistory: () => void;
}

const generateId = () => Math.random().toString(36).substr(2, 9);

export const useSyncStore = create<SyncState>((set, get) => ({
  status: 'Synced',
  lastSyncTimestamp: null,
  pendingTransactions: 0,
  // Inventory sync is out of scope (no inventory queue exists yet on mobile —
  // see plan.md "Out of scope"). Kept as a field so the UI/stats-row shape
  // is unchanged; always 0 until that scope exists.
  pendingInventory: 0,
  failedRecords: 0,
  isAutoSyncEnabled: true,
  isNetworkConnected: true,
  syncHistory: [],

  hydrateStats: async () => {
    const stats = await getQueueStats();
    set((state) => ({
      pendingTransactions: stats.pending,
      failedRecords: stats.failed,
      lastSyncTimestamp: stats.lastSyncedAt ?? state.lastSyncTimestamp,
      status:
        state.status === 'Syncing'
          ? state.status
          : !state.isNetworkConnected
          ? 'Offline'
          : stats.failed > 0
          ? 'Sync Failed'
          : stats.pending > 0
          ? 'Pending Sync'
          : 'Synced',
    }));
  },

  syncNow: async () => {
    const { status, isNetworkConnected, pendingTransactions, failedRecords } = get();

    if (status === 'Syncing') return;
    if (!isNetworkConnected) {
      set({ status: 'Offline' });
      return;
    }
    if (pendingTransactions === 0 && failedRecords === 0) return;

    set({ status: 'Syncing' });
    const startTime = Date.now();

    try {
      const result = await runSync();
      const stats = await getQueueStats();
      const durationMs = Date.now() - startTime;
      const now = new Date().toISOString();

      const newEvent: SyncHistoryEvent = {
        id: generateId(),
        timestamp: now,
        recordsUploaded: result.synced,
        durationMs,
        result: result.failed === 0 ? 'Success' : 'Failed',
        failureReason:
          result.failed > 0 ? stats.lastError ?? 'Some records could not be synchronized.' : undefined,
      };

      set((state) => ({
        status: stats.failed > 0 ? 'Sync Failed' : stats.pending > 0 ? 'Pending Sync' : 'Synced',
        lastSyncTimestamp: stats.lastSyncedAt ?? state.lastSyncTimestamp,
        pendingTransactions: stats.pending,
        failedRecords: stats.failed,
        syncHistory: [newEvent, ...state.syncHistory].slice(0, 50),
      }));
    } catch (err: any) {
      // runSync() itself shouldn't throw (per-batch errors are caught inside
      // it), but guard against an unexpected failure (e.g. getDB() rejecting)
      // so status doesn't get stuck on 'Syncing'.
      set({ status: 'Sync Failed' });
    }
  },

  retryFailed: async () => {
    await get().syncNow();
  },

  toggleAutoSync: () => set((state) => ({ isAutoSyncEnabled: !state.isAutoSyncEnabled })),

  setNetworkStatus: (isConnected: boolean) =>
    set((state) => {
      if (!isConnected) {
        return { isNetworkConnected: false, status: 'Offline' };
      }
      const hasPending = state.pendingTransactions > 0 || state.failedRecords > 0;
      return {
        isNetworkConnected: true,
        status: hasPending ? 'Pending Sync' : 'Synced',
      };
    }),

  clearHistory: () => set({ syncHistory: [] }),
}));