import { supabase } from '../lib/supabase';

/**
 * Calls the Supabase RPC to deduct inventory items based on product recipes
 * when an order is completed and synced.
 *
 * @param orderId - The UUID of the completed order
 * @returns Object with success flag and deduction count
 */
export async function deductInventoryForOrder(orderId: string): Promise<{
  success: boolean;
  deduction_count?: number;
  error?: string;
}> {
  try {
    const { data, error } = await supabase.rpc(
      'deduct_inventory_for_order',
      { order_id_param: orderId }
    );

    if (error) {
      console.error('Inventory deduction RPC error:', error);
      return {
        success: false,
        error: error.message || 'Unknown RPC error',
      };
    }

    if (!data?.success) {
      console.error('Inventory deduction failed:', data?.error);
      return {
        success: false,
        error: data?.error || 'Inventory deduction returned false',
      };
    }

    return {
      success: true,
      deduction_count: data.deduction_count,
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('Inventory deduction exception:', errorMessage);
    return {
      success: false,
      error: errorMessage,
    };
  }
}
