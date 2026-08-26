import { getDB } from '../lib/db';

export interface Customer {
  id: number;
  email_address: string | null;
  card_number: string; // was: number
  loyalty_progress: number;
  membership_date: string | null;
  card_status: boolean;
  first_name: string | null;
  last_name: string | null;
  redeem_count: number;
}

export interface LoyaltyProgram {
  id: number;
  points_required: number;
  // Only one loyalty_program row is ever active at a time (status = true
  // server-side) — the shop's single current promotion, not per-customer.
  reward_type: string; // e.g. 'Free Coffee' | 'Free Pastry' | 'P10 Discount'
  quantity: number | null; // items awarded — meaningful for Free Coffee/Pastry
  discount_amount: number | null; // flat peso amount — meaningful for Discount
}

export interface CustomerSnapshot {
  customers: {
    id: number;
    email_address: string | null;
    card_number: string;
    loyalty_progress: number | null;
    membership_date: string | null;
    card_status: boolean | null;
    first_name: string | null;
    last_name: string | null;
    redeem_count: number | null;
  }[];
  loyaltyProgram: LoyaltyProgram | null; // must include reward_type/quantity/discount_amount
}

export async function getLastCustomerSyncAt(): Promise<string | null> {
  const db = await getDB();
  const row = await db.getFirstAsync<{ value: string }>(
    `SELECT value FROM meta WHERE key = 'last_customer_sync_at'`
  );
  return row?.value ?? null;
}

export async function getCustomerByCardNumber(cardNumber: string): Promise<Customer | null> {
  const db = await getDB();
  const row = await db.getFirstAsync<any>(
    `SELECT * FROM customers WHERE card_number = ?`,
    [cardNumber]
  );
  if (!row) return null;
  return {
    id: row.id,
    email_address: row.email_address,
    card_number: row.card_number,
    loyalty_progress: row.loyalty_progress,
    membership_date: row.membership_date,
    card_status: !!row.card_status,
    first_name: row.first_name,
    last_name: row.last_name,
    redeem_count: row.redeem_count,
  };
}

export async function getLoyaltyProgram(): Promise<LoyaltyProgram | null> {
  const db = await getDB();
  const row = await db.getFirstAsync<any>(`SELECT * FROM loyalty_program LIMIT 1`);
  if (!row) return null;
  return {
    id: row.id,
    points_required: row.points_required,
    reward_type: row.reward_type,
    quantity: row.quantity,
    discount_amount: row.discount_amount,
  };
}

// "Last visit" is derived from this device's local order history only — no
// local cache of loyalty_log exists, so this won't reflect visits made on
// other devices or the web app. Confirmed acceptable for now (see handoff).
export async function getLastVisitForCustomer(customerId: number): Promise<string | null> {
  const db = await getDB();
  const row = await db.getFirstAsync<{ created_at: string | null }>(
    `SELECT MAX(created_at) as created_at FROM orders WHERE customer_id = ?`,
    [customerId]
  );
  return row?.created_at ?? null;
}

// Atomic overwrite — same pattern as replaceCatalog in catalogRepository.ts.
export async function replaceCustomers(snapshot: CustomerSnapshot): Promise<void> {
  const db = await getDB();

  await db.withExclusiveTransactionAsync(async (txn) => {
    await txn.execAsync(`DELETE FROM customers`);
    await txn.execAsync(`DELETE FROM loyalty_program`);

    for (const c of snapshot.customers) {
      await txn.runAsync(
        `INSERT INTO customers
          (id, email_address, card_number, loyalty_progress, membership_date, card_status, first_name, last_name, redeem_count)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          c.id,
          c.email_address,
          c.card_number,
          c.loyalty_progress ?? 0,
          c.membership_date,
          c.card_status === false ? 0 : 1,
          c.first_name,
          c.last_name,
          c.redeem_count ?? 0,
        ]
      );
    }

    if (snapshot.loyaltyProgram) {
      await txn.runAsync(
        `INSERT INTO loyalty_program (id, points_required, reward_type, quantity, discount_amount) VALUES (?, ?, ?, ?, ?)`,
        [
          snapshot.loyaltyProgram.id,
          snapshot.loyaltyProgram.points_required,
          snapshot.loyaltyProgram.reward_type,
          snapshot.loyaltyProgram.quantity,
          snapshot.loyaltyProgram.discount_amount,
        ]
      );
    }
  });
}

export async function getAllCustomersDebug(): Promise<Customer[]> {
  const db = await getDB();
  const rows = await db.getAllAsync<any>(`SELECT * FROM customers`);
  return rows.map((row) => ({
    id: row.id,
    email_address: row.email_address,
    card_number: row.card_number,
    loyalty_progress: row.loyalty_progress,
    membership_date: row.membership_date,
    card_status: !!row.card_status,
    first_name: row.first_name,
    last_name: row.last_name,
    redeem_count: row.redeem_count,
  }));
}