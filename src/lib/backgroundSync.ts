import * as TaskManager from 'expo-task-manager';
import * as BackgroundTask from 'expo-background-task';
import { runSync } from '../services/syncService';

// The task MUST be defined in global module scope,
// not inside a component/hook/effect. TaskManager requires the task body
// to be registered synchronously as soon as this module is imported (see
// App.tsx), so the OS can invoke it even if the JS bundle is cold-started
// solely to run this background task (app not otherwise in memory).
export const SHEILZ_AUTO_SYNC = 'sheilz-auto-sync';

TaskManager.defineTask(SHEILZ_AUTO_SYNC, async () => {
  try {
    const result = await runSync();
    // runSync() already swallows per-batch errors internally (a batch that
    // fails flips only its own rows to 'failed' rather than throwing — see
    // syncService.ts), so reaching this line without an exception counts as
    // task success regardless of whether every row synced this run. Any
    // rows left 'failed' are picked up again on the next trigger (manual,
    // foreground, or this task) via the existing sync_status IN
    // ('pending','failed') filter.
    console.log(
      `[backgroundSync] ran: attempted=${result.attempted} synced=${result.synced} failed=${result.failed}`,
    );
    return BackgroundTask.BackgroundTaskResult.Success;
  } catch (err) {
    console.error('[backgroundSync] task threw:', err);
    return BackgroundTask.BackgroundTaskResult.Failed;
  }
});

// Called once on app mount (see App.tsx). Per Expo's docs, "registered
// tasks are saved in persistent storage and restored once the app is
// initialized" — calling registerTaskAsync again on every boot is the
// documented pattern, not a duplicate-registration risk.
export async function registerBackgroundSync(): Promise<void> {
  try {
    await BackgroundTask.registerTaskAsync(SHEILZ_AUTO_SYNC, {
      // A 30-minute cadence. Android's WorkManager
      // enforces a 15-minute floor for periodic work, so 30 clears that
      // with room to spare. iOS's BGTaskScheduler treats this as a hint,
      // not a guarantee — the actual fire time is opportunistic.
      minimumInterval: 30,
    });
  } catch (err) {
    // Registration can fail before `expo prebuild` has been run (task
    // requires a dev client / native build, not Expo Go) or on
    // unsupported platforms (web). Fail soft, matching the same
    // .catch()-and-log pattern already used for getDB() in App.tsx —
    // no user-facing failure UI exists for background-infra setup.
    console.error('[backgroundSync] registerTaskAsync failed:', err);
  }
}