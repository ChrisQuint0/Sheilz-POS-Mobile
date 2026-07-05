import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { runSync } from '../services/syncService';

// Foreground trigger. Fires runSync() when the app transitions
// from background/inactive to active, so a queued order/inventory change
// gets pushed as soon as the cashier reopens the app, without waiting for
// the manual "Sync Now" button or the 30-min background task.
// Does NOT fire on initial mount — cold boot already runs getDB() →
// hydrateOrders() in App.tsx; this hook only cares about re-foregrounding.
export function useAppStateSync(): void {
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      const cameFromBackground = /inactive|background/.test(appStateRef.current);
      if (cameFromBackground && nextState === 'active') {
        runSync().catch((err) => console.error('Foreground sync failed:', err));
      }
      appStateRef.current = nextState;
    });

    return () => subscription.remove();
  }, []);
}