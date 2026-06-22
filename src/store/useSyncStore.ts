import { create } from 'zustand';

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
  
  // Mock actions to manipulate the queue
  addPendingTransaction: (count?: number) => void;
  addFailedRecord: (count?: number) => void;
  clearHistory: () => void;
}

const generateId = () => Math.random().toString(36).substr(2, 9);

export const useSyncStore = create<SyncState>((set, get) => ({
  status: 'Synced',
  lastSyncTimestamp: new Date().toISOString(),
  pendingTransactions: 0,
  pendingInventory: 0,
  failedRecords: 0,
  isAutoSyncEnabled: true,
  isNetworkConnected: true,
  syncHistory: [],

  syncNow: async () => {
    const { status, pendingTransactions, pendingInventory, isNetworkConnected } = get();
    
    if (status === 'Syncing' || (!pendingTransactions && !pendingInventory && get().failedRecords === 0)) return;
    if (!isNetworkConnected) {
      set({ status: 'Offline' });
      return;
    }

    set({ status: 'Syncing' });

    const totalToSync = pendingTransactions + pendingInventory + get().failedRecords;
    const startTime = Date.now();

    // Mock network request delay (2 seconds)
    return new Promise((resolve) => {
      setTimeout(() => {
        const isSuccess = Math.random() > 0.1; // 10% chance to fail for testing UI

        const durationMs = Date.now() - startTime;
        const now = new Date().toISOString();

        if (isSuccess) {
          const newEvent: SyncHistoryEvent = {
            id: generateId(),
            timestamp: now,
            recordsUploaded: totalToSync,
            durationMs,
            result: 'Success',
          };

          set((state) => ({
            status: 'Synced',
            lastSyncTimestamp: now,
            pendingTransactions: 0,
            pendingInventory: 0,
            failedRecords: 0,
            syncHistory: [newEvent, ...state.syncHistory].slice(0, 50), // keep last 50
          }));
        } else {
          const newEvent: SyncHistoryEvent = {
            id: generateId(),
            timestamp: now,
            recordsUploaded: 0,
            durationMs,
            result: 'Failed',
            failureReason: 'Network timeout during transaction commit.',
          };

          set((state) => ({
            status: 'Sync Failed',
            failedRecords: state.failedRecords + totalToSync,
            pendingTransactions: 0,
            pendingInventory: 0,
            syncHistory: [newEvent, ...state.syncHistory].slice(0, 50),
          }));
        }
        resolve();
      }, 2000);
    });
  },

  retryFailed: async () => {
    // Retry uses the same logic as syncNow for the mock
    await get().syncNow();
  },

  toggleAutoSync: () => set((state) => ({ isAutoSyncEnabled: !state.isAutoSyncEnabled })),

  setNetworkStatus: (isConnected: boolean) => set((state) => {
    if (!isConnected) {
      return { isNetworkConnected: false, status: 'Offline' };
    }
    // If reconnected and have pending, set to Pending Sync
    const hasPending = state.pendingTransactions > 0 || state.pendingInventory > 0 || state.failedRecords > 0;
    return {
      isNetworkConnected: true,
      status: hasPending ? 'Pending Sync' : 'Synced'
    };
  }),

  // Dev Tools
  addPendingTransaction: (count = 1) => set((state) => ({
    pendingTransactions: state.pendingTransactions + count,
    status: state.isNetworkConnected ? 'Pending Sync' : 'Offline'
  })),

  addFailedRecord: (count = 1) => set((state) => ({
    failedRecords: state.failedRecords + count,
    status: state.isNetworkConnected ? 'Sync Failed' : 'Offline'
  })),
  
  clearHistory: () => set({ syncHistory: [] })
}));
