import { supabase } from '../lib/supabase';
import { getDB } from '../lib/db';
import { replaceCustomers, type CustomerSnapshot } from './customerRepository';

export interface SyncResult {
  success: boolean;
  error?: string;
}

export async function syncCustomersFromSupabase(): Promise<SyncResult> {
  const [customersResult, loyaltyProgramResult] = await Promise.all([
    supabase
      .from('customers')
      .select(
        'id, email_address, card_number, loyalty_progress, membership_date, card_status, First_name, last_name, redeem_count'
      ),
    supabase.from('loyalty_program').select('id, points_required').limit(1),
  ]);

  if (customersResult.error || loyaltyProgramResult.error) {
    const error =
      customersResult.error?.message ??
      loyaltyProgramResult.error?.message ??
      'Unknown customer sync error';
    console.error('Customer sync failed:', error);
    
    return { success: false, error };
  }
  console.log(
    `Customer sync: fetched ${customersResult.data?.length ?? 0} customer row(s), ` +
    `${loyaltyProgramResult.data?.length ?? 0} loyalty_program row(s)`
  );

  const snapshot: CustomerSnapshot = {
    // Note: Supabase column is "First_name" (inconsistent casing per schema) —
    // mapped to first_name locally to match our snake_case convention.
    customers: (customersResult.data ?? []).map((c: any) => ({
      id: c.id,
      email_address: c.email_address,
      card_number: c.card_number,
      loyalty_progress: c.loyalty_progress,
      membership_date: c.membership_date,
      card_status: c.card_status,
      first_name: c.First_name,
      last_name: c.last_name,
      redeem_count: c.redeem_count,
    })),
    loyaltyProgram: loyaltyProgramResult.data?.[0]
      ? {
          id: loyaltyProgramResult.data[0].id,
          points_required: loyaltyProgramResult.data[0].points_required,
        }
      : null,
  };

  await replaceCustomers(snapshot);

  const db = await getDB();
  await db.runAsync(
    `INSERT INTO meta (key, value) VALUES ('last_customer_sync_at', ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    [new Date().toISOString()]
  );

  return { success: true };
}