import { getDB } from '../lib/db';

const PAYMONGO_ENABLED_KEY = 'paymongo_enabled';

export async function getPaymongoEnabled(): Promise<boolean> {
  const db = await getDB();
  const row = await db.getFirstAsync<{ value: string }>(
    `SELECT value FROM meta WHERE key = ?`,
    [PAYMONGO_ENABLED_KEY],
  );
  return row?.value === 'true';
}

export async function setPaymongoEnabled(enabled: boolean): Promise<void> {
  const db = await getDB();
  await db.runAsync(
    `INSERT INTO meta (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    [PAYMONGO_ENABLED_KEY, enabled ? 'true' : 'false'],
  );
}