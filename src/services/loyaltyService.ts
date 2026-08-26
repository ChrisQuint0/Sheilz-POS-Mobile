import { supabase } from '../lib/supabase';
import type { CartItem, MenuItem } from '../store/usePOSStore';
import type { LoyaltyProgram } from './customerRepository';

// Mirrors fn_earn_loyalty_stamps_from_items()'s WHERE clause exactly:
//   SUM(oi.quantity) WHERE p.type = 'Beverage' AND is_redemption IS NOT TRUE
// Redeemed (free) lines are excluded — a comped drink shouldn't also earn
// a stamp. The server-side trigger was updated to match this on 2026-08-23
// (see handoff.md) — both sides now exclude redeemed lines the same way.
// IMPORTANT: if fn_earn_loyalty_stamps_from_items() is ever changed
// server-side again, this must be updated to match or eligibility checks
// will silently drift from what actually gets credited.
export function projectedBeverageStamps(cart: CartItem[]): number {
  return cart.reduce((sum, c) => {
    if (c.isRedemption) return sum;
    if (c.item.type !== 'Beverage') return sum;
    return sum + c.quantity;
  }, 0);
}

// Customer's last-synced balance + what this order's own beverage lines
// would earn, per Ipei's "projected balance" decision.
export function projectedBalance(customerLoyaltyProgress: number, cart: CartItem[]): number {
  return customerLoyaltyProgress + projectedBeverageStamps(cart);
}

// Whether one more redemption can be started, accounting for
// redemptions already applied earlier in this same cart.
export function canRedeemAnotherLine(
  customerLoyaltyProgress: number,
  cart: CartItem[],
  reward: LoyaltyProgram,
): boolean {
  const alreadyRedeemed = cart.filter((c) => c.isRedemption).length;
  const balance = projectedBalance(customerLoyaltyProgress, cart);
  const remaining = balance - alreadyRedeemed * reward.points_required;
  return remaining >= reward.points_required;
}

// Which cart lines a given reward can be applied to.
// - Free Coffee: any Beverage-type item (tea, non-coffee drinks included —
//   confirmed with Ipei, matches the earn-side category).
// - Free Pastry: Pastry-type items. ASSUMPTION: 'Pastry' is the literal
//   products.type value — not confirmed the same way 'Beverage' was, since
//   no Pastry-type product was seen in the reviewed catalog. Flag if wrong.
// - Anything else (Discount): no category restriction — applies to
//   whichever line the cashier picks.
export function isLineEligibleForReward(item: MenuItem, reward: LoyaltyProgram): boolean {
  if (reward.reward_type === 'Free Coffee') return item.type === 'Beverage';
  if (reward.reward_type === 'Free Pastry') return item.type === 'Pastry';
  return true;
}

export function isFreeItemReward(reward: LoyaltyProgram): boolean {
  return reward.reward_type === 'Free Coffee' || reward.reward_type === 'Free Pastry';
}

// Direct Supabase insert, per Ipei's "online required" decision — this is
// NOT queued through the offline sync pipeline. Call only after the order
// itself has been synced (loyalty_log.order_id has a real FK to orders.id
// with no ON DELETE/UPDATE override — inserting before the order exists
// remotely will fail). One row per redeemed line; `count` > 1 supports
// multiple redemptions in the same order.
export async function insertRedemptionLogs(
  customerId: number,
  rewardId: number,
  pointsRequired: number,
  orderId: string,
  count: number,
): Promise<{ success: boolean; error?: string }> {
  if (count <= 0) return { success: true };

  const rows = Array.from({ length: count }, () => ({
    customer_id: customerId,
    event_type: 'Reward Redeemed',
    points_change: -pointsRequired,
    reward_id: rewardId,
    order_id: orderId,
  }));

  const { error } = await supabase.from('loyalty_log').insert(rows);
  if (error) {
    console.error('Failed to insert redemption loyalty_log rows:', error);
    return { success: false, error: error.message };
  }
  return { success: true };
}