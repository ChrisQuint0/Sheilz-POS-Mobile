import { supabase } from '../lib/supabase';
import { getDB } from '../lib/db';

/**
 * Insert a `Reward Redeemed` row into Supabase's `loyalty_log` table.
 *
 * Called from `syncService.ts` after an order with `is_redemption = 1`
 * has been successfully upserted. Uses only the columns guaranteed to
 * exist on the live schema (`id`, `Event Type`, `Description`,
 * `customer_id`, `created_at` per `db_structure.md` §17). The points
 * magnitude is encoded into `Description` as a structured suffix
 * (e.g. `"Free 12oz Drink (-10 points)"`) so the existing
 * `trg_update_customer_loyalty` trigger can still find the row and
 * adjust `customers.loyalty_progress` / `redeem_count` if Ipei later
 * wires that into the trigger — for now the trigger only knows how to
 * *add* `points_change`, so the actual balance decrement happens via
 * a separate SQL function Ipei will write (see handoff.md
 * "Loyalty Redemption — 2026-08-22" for the optional migration).
 *
 * NOTE: This is a non-atomic insert (no order_id linkage in the live
 * schema). If a sync retry runs after a network blip, this may insert
 * a duplicate `loyalty_log` row. Ipei's DB-side backstop (a CHECK on
 * `loyalty_progress >= 0` plus a unique constraint per
 * `(customer_id, order_id) WHERE reward_id IS NOT NULL`) is the
 * intended safety net — once those land, this becomes idempotent.
 *
 * @returns `{success: true}` on a clean insert, otherwise
 *   `{success: false, error}`. Callers should treat failure as
 *   non-fatal (order is already synced; loyalty decrement will be
 *   retried on the next manual sync via the same code path).
 */
export async function recordLoyaltyRedemption(params: {
  customerId: number;
  orderId: string; // local UUID; logged for traceability in the Description
  rewardLabel: string; // human-readable: "Free 12oz Drink"
  pointsRequired: number; // positive number; the service negates it for storage
}): Promise<{ success: boolean; error?: string }> {
  const { customerId, orderId, rewardLabel, pointsRequired } = params;
  const description = `${rewardLabel} (-${pointsRequired} points) [order ${orderId}]`;
  try {
    const { error } = await supabase.from('loyalty_log').insert({
      // `Event Type` is a mixed-case column on Postgres (per
      // db_structure.md §17). Supabase JS accepts it as-is.
      'Event Type': 'Reward Redeemed',
      Description: description,
      customer_id: customerId,
    });
    if (error) {
      console.error('recordLoyaltyRedemption insert error:', error);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('recordLoyaltyRedemption exception:', message);
    return { success: false, error: message };
  }
}

/**
 * Optimistic local balance update after a redemption is confirmed.
 *
 * We can't wait for the server round-trip + sync + customer-cache refresh
 * before showing the cashier the new balance (otherwise they'd see the
 * same `loyalty_progress` they just spent). This updates the local SQLite
 * `customers` row immediately. The post-sync customer refresh will
 * overwrite it with the server's authoritative value, but by then the
 * server and local balances should match anyway.
 *
 * Failure here is non-fatal — the next `syncCustomersFromSupabase()`
 * (which already runs after every successful batch) will reconcile.
 */
export async function applyLocalRedemptionBalance(
  customerId: number,
  pointsRequired: number,
): Promise<void> {
  try {
    const db = await getDB();
    await db.runAsync(
      `UPDATE customers
         SET loyalty_progress = MAX(0, loyalty_progress - ?),
             redeem_count = redeem_count + 1
       WHERE id = ?`,
      [pointsRequired, customerId],
    );
  } catch (err) {
    console.error('applyLocalRedemptionBalance failed:', err);
  }
}
