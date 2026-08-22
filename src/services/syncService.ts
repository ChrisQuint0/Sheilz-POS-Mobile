import { getDB } from '../lib/db';
import { supabase } from '../lib/supabase';
import { deductInventoryForOrder, voidInventoryForOrder } from './inventoryService';
import { syncCustomersFromSupabase } from './customerSyncService';

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
      const now = new Date().toISOString();
      const remoteOrders = batch.map((o) => ({
        id: o.id,
        order_id: o.order_number,
        customer_name: o.customer_name,
        status: o.status,
        amount: o.amount,
        payment_method: o.payment_method,
        cashier_id: o.cashier_id,
        cashier_name: o.cashier_name,
        created_by: o.cashier_id,
        last_modified_by: o.cashier_id,
        last_modified_at: now,
        created_at: o.created_at,
        synced_at: now,
        customer_id: o.customer_id ?? null,
      }));

      // Map of local order ID to remote order ID for item syncing
      const localToRemoteOrderId = new Map<string, string>();

      // Sync orders one by one with proper conflict handling
      let ordersSyncSuccess = true;
      let ordersSyncError: any = null;

      for (const order of remoteOrders) {
        try {
          // Check if order exists — keyed on `id` (globally unique UUID),
          // not `order_id` (a human-readable, per-device sequential number
          // that can collide across devices/builds syncing the same day).
          const { data: existingOrder, error: checkError } = await supabase
            .from('orders')
            .select('id')
            .eq('id', order.id)
            .maybeSingle();

          if (checkError) {
            console.error(`Error checking order ${order.order_id}:`, checkError);
            throw checkError;
          }

          if (existingOrder) {
            // Update existing order and track remote ID
            const remoteOrderId = existingOrder.id;
            localToRemoteOrderId.set(order.id, remoteOrderId);

            const { data: updatedOrder, error: updateError } = await supabase
              .from('orders')
              .update({
                customer_name: order.customer_name,
                status: order.status,
                amount: order.amount,
                payment_method: order.payment_method,
                cashier_id: order.cashier_id,
                cashier_name: order.cashier_name,
                last_modified_by: order.last_modified_by,
                last_modified_at: order.last_modified_at,
                synced_at: order.synced_at,
                customer_id: order.customer_id,
              })
              .eq('id', order.id)
              .select();

            if (updateError) {
              console.error(`Failed to update order ${order.order_id}:`, updateError);
              throw updateError;
            }
            // A blocked-by-RLS UPDATE returns no error and 0 rows — without
            // this check it looks identical to a successful update (see
            // 2026-07-09 session log). Treat 0 rows matched as a failure.
            if (!updatedOrder || updatedOrder.length === 0) {
              throw new Error(
                `Update matched 0 rows for order ${order.order_id} — likely blocked by RLS`
              );
            }
            console.log(`Updated existing order: ${order.order_id}`);
          } else {
            // Insert new order and track remote ID (same as local in this case)
            localToRemoteOrderId.set(order.id, order.id);

            const { error: insertError } = await supabase
              .from('orders')
              .insert(order);

            if (insertError) {
              console.error(`Failed to insert order ${order.order_id}:`, insertError);
              throw insertError;
            }
            console.log(`Inserted new order: ${order.order_id}`);
          }
        } catch (error) {
          ordersSyncError = error;
          ordersSyncSuccess = false;
          console.error(`Failed to sync order ${order.order_id}:`, error);
          break; // Exit the loop if any order fails
        }
      }

      // If orders sync failed, throw error to mark batch as failed
      if (!ordersSyncSuccess) {
        throw new Error(ordersSyncError?.message || 'Failed to sync one or more orders');
      }

      // Now sync order items since parent orders exist
      if (itemRows.length > 0) {
        const remoteItems = itemRows.map((it) => ({
          id: it.id,
          order_id: localToRemoteOrderId.get(it.order_id) || it.order_id,
          product_id: it.product_id,
          name: it.name,
          size: it.size,
          temperature: it.temperature,
          quantity: it.quantity,
          unit_price: it.unit_price,
          subtotal: it.subtotal,
        }));

        // Try upsert first, fallback to individual if needed
        const { error: itemsError } = await supabase
          .from('order_items')
          .upsert(remoteItems, { onConflict: 'id' });

        if (itemsError) {
          console.error('Order items upsert error:', itemsError);
          
          // Fallback to individual inserts/updates
          console.warn('Trying individual order item inserts...');
          for (const item of remoteItems) {
            try {
              // Check if item exists
              const { data: existingItem, error: checkError } = await supabase
                .from('order_items')
                .select('id')
                .eq('id', item.id)
                .maybeSingle();

              if (checkError) {
                console.error(`Error checking item ${item.id}:`, checkError);
                throw checkError;
              }

              if (existingItem) {
                // Update existing item
                const { data: updatedItem, error: updateError } = await supabase
                  .from('order_items')
                  .update(item)
                  .eq('id', item.id)
                  .select();

                if (updateError) {
                  console.error(`Failed to update item ${item.id}:`, updateError);
                  throw updateError;
                }
                if (!updatedItem || updatedItem.length === 0) {
                  throw new Error(
                    `Update matched 0 rows for item ${item.id} — likely blocked by RLS`
                  );
                }
              } else {
                // Insert new item
                const { error: insertError } = await supabase
                  .from('order_items')
                  .insert(item);

                if (insertError) {
                  console.error(`Failed to insert item ${item.id}:`, insertError);
                  throw insertError;
                }
              }
            } catch (itemError) {
              console.error(`Failed to sync item ${item.id}:`, itemError);
              throw itemError;
            }
          }
        }
      }

      // Update local sync status
      await db.withExclusiveTransactionAsync(async (txn) => {
        for (const o of batch) {
          await txn.runAsync(
            `UPDATE orders SET sync_status = 'synced', synced_at = ?, last_sync_error = NULL WHERE id = ?`,
            [now, o.id]
          );
        }
      });

      // After successful sync, deduct inventory for completed orders
      for (const o of batch) {
        if (o.status === 'Completed') {
          const result = await deductInventoryForOrder(o.id);
          if (!result.success) {
            console.warn(`Inventory deduction failed for order ${o.id}: ${result.error}`);
            // Note: We don't fail the sync if inventory deduction fails—it's a separate operation
            // The order is already synced; the deduction failure should be logged but not block sync
          }
        } else if (o.status === 'Void (Consumed)') {
          // Void (Consumed) means the order was prepared and then wasted, so the
          // ingredients were physically consumed — stock must still be deducted.
          // "Void (Not Made)" is intentionally skipped: nothing was used.
          const result = await voidInventoryForOrder(o.id);
          if (!result.success) {
            console.warn(
              `Inventory deduction failed for voided (consumed) order ${o.id}: ${result.error}`,
            );
          }
        }
      }

      // After a successful batch, refresh the local customer cache so any
      // loyalty stamps awarded by `fn_earn_loyalty_stamps` (server-side
      // trigger on orders) are reflected on the next customer scan without
      // requiring a manual visit to SyncScreen. Logged but non-fatal —
      // orders are already marked 'synced' and the next manual customer
      // sync (from SyncScreen focus) will catch up.
      const customerRefresh = await syncCustomersFromSupabase();
      if (!customerRefresh.success) {
        console.warn(
          `Customer cache refresh failed after batch sync: ${customerRefresh.error}`,
        );
      }

      synced += batch.length;
    } catch (err: any) {
      const message = err?.message ?? 'Unknown sync error';
      console.error('Sync error for batch:', message);
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