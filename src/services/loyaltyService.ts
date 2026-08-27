import { supabase } from '../lib/supabase';
import type { CartItem, MenuItem } from '../store/usePOSStore';
import type { LoyaltyProgram } from './customerRepository';

// Mirrors the server-side earn-stamps filter: redeemed lines do not earn
// another stamp, while all other beverage quantities do.
export function projectedBeverageStamps(cart: CartItem[]): number {
  return cart.reduce((sum, c) => {
    if (c.isRedemption || c.item.type !== 'Beverage') return sum;
    return sum + c.quantity;
  }, 0);
}

export function projectedBalance(
  customerLoyaltyProgress: number,
  cart: CartItem[],
): number {
  return customerLoyaltyProgress + projectedBeverageStamps(cart);
}

export function canRedeemAnotherLine(
  customerLoyaltyProgress: number,
  cart: CartItem[],
  reward: LoyaltyProgram,
): boolean {
  const alreadyRedeemed = cart.filter((c) => c.isRedemption).length;
  const balance = projectedBalance(customerLoyaltyProgress, cart);
  return balance - alreadyRedeemed * reward.points_required >= reward.points_required;
}

export function isLineEligibleForReward(
  item: MenuItem,
  reward: LoyaltyProgram,
): boolean {
  if (reward.reward_type === 'Free Coffee') return item.type === 'Beverage';
  if (reward.reward_type === 'Free Pastry') return item.type === 'Pastry';
  return true;
}

export function isFreeItemReward(reward: LoyaltyProgram): boolean {
  return reward.reward_type === 'Free Coffee' || reward.reward_type === 'Free Pastry';
}

// Redemption logs are written only after the completed order has been synced,
// because loyalty_log.order_id references the remote order.
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
