import { getDB } from '../lib/db';
import { supabase } from '../lib/supabase';

const BATCH_SIZE = 25;

export interface QueueStats {
  pending: number;
  failed: number;
  lastSyncedAt: string | null;
  lastError: string | null;
}

export interface RunSyncResult {
  attempted: number;
  synced: number;
  failed: number;
}

// Single-flight guard — same pattern as getDB()'s initPromise —
// so a manual tap during an in-flight AppState-triggered sync (Phase 6)
// doesn't double-push the same batch.
let inFlight: Promise<RunSyncResult> | null = null;

export async function runSync(): Promise<RunSyncResult> {
  if (inFlight) return inFlight;
  inFlight = doRunSync().finally(() => {
    inFlight = null;
  });
  return inFlight;
}

async function doRunSync(): Promise<RunSyncResult> {
  const db = await getDB();

  // 'Current' (open tickets) has no Supabase equivalent — excluded per
  // plan.md's decision. Both 'pending' and 'failed' orders are retried
  // here so runSync() also serves as the "retry" path.
  const orderRows = await db.getAllAsync<any>(
    `SELECT * FROM orders
     WHERE sync_status IN ('pending', 'failed') AND status != 'Current'
     ORDER BY created_at ASC`
  );

  let synced = 0;
  let failed = 0;

  for (let i = 0; i < orderRows.length; i += BATCH_SIZE) {
    const batch = orderRows.slice(i, i + BATCH_SIZE);
    const batchIds = batch.map((o) => o.id);

    const itemRows = await db.getAllAsync<any>(
      `SELECT * FROM order_items WHERE order_id IN (${batchIds.map(() => '?').join(',')})`,
      batchIds
    );

    try {
      // Orders first — order_items.order_id is an FK to orders.id,
      // so the parent row must exist remotely before its children upsert.
      const remoteOrders = batch.map((o) => ({
        id: o.id,
        order_id: o.order_number,
        customer_name: o.customer_name,
        status: o.status,
        amount: o.amount,
        payment_method: o.payment_method,
        cashier_id: o.cashier_id,
        cashier_name: o.cashier_name,
        created_at: o.created_at,
        synced_at: new Date().toISOString(),
      }));

      const { error: ordersError } = await supabase
        .from('orders')
        .upsert(remoteOrders, { onConflict: 'id' });
      if (ordersError) throw new Error(ordersError.message);

      if (itemRows.length > 0) {
        const remoteItems = itemRows.map((it) => ({
          id: it.id,
          order_id: it.order_id,
          product_id: it.product_id,
          name: it.name,
          size: it.size,
          temperature: it.temperature,
          quantity: it.quantity,
          unit_price: it.unit_price,
          subtotal: it.subtotal,
        }));

        const { error: itemsError } = await supabase
          .from('order_items')
          .upsert(remoteItems, { onConflict: 'id' });
        if (itemsError) throw new Error(itemsError.message);
      }

      const now = new Date().toISOString();
      await db.withExclusiveTransactionAsync(async (txn) => {
        for (const o of batch) {
          await txn.runAsync(
            `UPDATE orders SET sync_status = 'synced', synced_at = ?, last_sync_error = NULL WHERE id = ?`,
            [now, o.id]
          );
        }
      });
      synced += batch.length;
    } catch (err: any) {
      const message = err?.message ?? 'Unknown sync error';
      await db.withExclusiveTransactionAsync(async (txn) => {
        for (const o of batch) {
          await txn.runAsync(
            `UPDATE orders SET sync_status = 'failed', last_sync_error = ?, sync_retry_count = sync_retry_count + 1 WHERE id = ?`,
            [message, o.id]
          );
        }
      });
      failed += batch.length;
    }
  }

  return { attempted: orderRows.length, synced, failed };
}

export async function getQueueStats(): Promise<QueueStats> {
  const db = await getDB();

  const pendingRow = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM orders WHERE sync_status = 'pending' AND status != 'Current'`
  );
  const failedRow = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM orders WHERE sync_status = 'failed'`
  );
  const lastSyncedRow = await db.getFirstAsync<{ synced_at: string | null }>(
    `SELECT MAX(synced_at) as synced_at FROM orders WHERE sync_status = 'synced'`
  );
  const lastErrorRow = await db.getFirstAsync<{ last_sync_error: string | null }>(
    `SELECT last_sync_error FROM orders
     WHERE sync_status = 'failed' AND last_sync_error IS NOT NULL
     ORDER BY created_at DESC LIMIT 1`
  );

  return {
    pending: pendingRow?.count ?? 0,
    failed: failedRow?.count ?? 0,
    lastSyncedAt: lastSyncedRow?.synced_at ?? null,
    lastError: lastErrorRow?.last_sync_error ?? null,
  };
}