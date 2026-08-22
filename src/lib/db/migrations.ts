import { type SQLiteDatabase } from 'expo-sqlite';

type Migration = {
  version: number;
  sql: string;
};

const MIGRATIONS: Migration[] = [
    {
    version: 5,
    // Loyalty redemption support (2026-08-22).
    // `is_redemption` flags orders that contain a free-drink line item
    // claimed via the loyalty program. Set at createOrder() time when the
    // cashier confirms a "Redeem Free 12oz Drink" from the customer drawer.
    // The flag is what:
    //   1. tells syncService to insert a loyalty_log row server-side after the
    //      order is written (so the customer's loyalty_progress is decremented),
    //   2. tells ReceiptModal to render "Free (Loyalty)" + ₱0.00 on the line,
    //   3. lets CartSummary show a FREE badge on the line item.
    // The actual points_change is communicated via a customer_id on the order
    // (already added in v3) — the loyalty_log insert itself uses Supabase's
    // existing columns (`Event Type`, `Description`, `customer_id`,
    // `created_at`). See handoff.md "Loyalty Redemption — 2026-08-22" for
    // the optional migration that adds reward-specific columns if Ipei
    // wants stricter structured fields later.
    sql: `
      ALTER TABLE orders ADD COLUMN is_redemption INTEGER NOT NULL DEFAULT 0;
    `,
  },
    {
    version: 4,
    // card_number changed from an auto-incrementing integer identity to a
    // date-prefixed text ID (e.g. "20260819-000000001"), generated
    // upstream in Supabase. Recreating the table since SQLite can't
    // ALTER a column's declared type/affinity in place.
    sql: `
      DROP TABLE IF EXISTS customers;

      CREATE TABLE IF NOT EXISTS customers (
        id INTEGER PRIMARY KEY,
        email_address TEXT,
        card_number TEXT UNIQUE,
        loyalty_progress INTEGER NOT NULL DEFAULT 0,
        membership_date TEXT,
        card_status INTEGER NOT NULL DEFAULT 1,
        first_name TEXT,
        last_name TEXT,
        redeem_count INTEGER NOT NULL DEFAULT 0
      );

      CREATE INDEX IF NOT EXISTS idx_customers_card_number ON customers(card_number);
    `,
  },
    {
    version: 3,
    sql: `
      CREATE TABLE IF NOT EXISTS customers (
        id INTEGER PRIMARY KEY,
        email_address TEXT,
        card_number INTEGER UNIQUE,
        loyalty_progress INTEGER NOT NULL DEFAULT 0,
        membership_date TEXT,
        card_status INTEGER NOT NULL DEFAULT 1,
        first_name TEXT,
        last_name TEXT,
        redeem_count INTEGER NOT NULL DEFAULT 0
      );

      CREATE INDEX IF NOT EXISTS idx_customers_card_number ON customers(card_number);

      CREATE TABLE IF NOT EXISTS loyalty_program (
        id INTEGER PRIMARY KEY,
        points_required INTEGER NOT NULL
      );

      ALTER TABLE orders ADD COLUMN customer_id INTEGER;
    `,
  },
  {
    version: 2,
    // One-shot cleanup: removes any rows left behind by the temporary
    // devSeed.ts harness (TEST-* order_numbers, plus their child
    // order_items). The test harness file has been deleted; this
    // migration handles the device-local SQLite side. Supabase side
    // was cleaned by hand via:
    //   DELETE FROM order_items WHERE order_id IN
    //     (SELECT id FROM orders WHERE order_id LIKE 'TEST-%');
    //   DELETE FROM orders WHERE order_id LIKE 'TEST-%';
    // Safe to keep around as a migration — it's idempotent (no rows
    // match after the first run).
    sql: `
      DELETE FROM order_items
      WHERE order_id IN (SELECT id FROM orders WHERE order_number LIKE 'TEST-%');

      DELETE FROM orders WHERE order_number LIKE 'TEST-%';
    `,
  },
  {
    version: 1,
    sql: `
      CREATE TABLE IF NOT EXISTS migrations (
        version INTEGER PRIMARY KEY,
        applied_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS meta (
        key TEXT PRIMARY KEY,
        value TEXT
      );

      CREATE TABLE IF NOT EXISTS product_categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS sizes (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        sort_order INTEGER NOT NULL DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS temperatures (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        sort_order INTEGER NOT NULL DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        category_id TEXT NOT NULL REFERENCES product_categories(id),
        type TEXT NOT NULL DEFAULT 'Beverage',
        description TEXT,
        image_url TEXT,
        has_recipe INTEGER NOT NULL DEFAULT 0,
        is_visible INTEGER NOT NULL DEFAULT 1
      );

      CREATE TABLE IF NOT EXISTS product_variants (
        id TEXT PRIMARY KEY,
        product_id TEXT NOT NULL REFERENCES products(id),
        size_id TEXT REFERENCES sizes(id),
        temperature_id TEXT REFERENCES temperatures(id),
        price REAL NOT NULL DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS payment_methods (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        is_enabled INTEGER NOT NULL DEFAULT 1
      );

      CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        order_number TEXT UNIQUE NOT NULL,
        customer_name TEXT NOT NULL DEFAULT 'Walk-In',
        status TEXT NOT NULL DEFAULT 'Completed',
        amount REAL NOT NULL DEFAULT 0,
        payment_method TEXT NOT NULL,
        cashier_id TEXT,
        cashier_name TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        sync_status TEXT NOT NULL DEFAULT 'pending',
        synced_at TEXT,
        last_sync_error TEXT,
        sync_retry_count INTEGER NOT NULL DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS order_items (
        id TEXT PRIMARY KEY,
        order_id TEXT NOT NULL REFERENCES orders(id),
        product_id TEXT,
        name TEXT NOT NULL,
        size TEXT,
        temperature TEXT,
        quantity INTEGER NOT NULL DEFAULT 1,
        unit_price REAL NOT NULL DEFAULT 0,
        subtotal REAL NOT NULL DEFAULT 0
      );

      CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
      CREATE INDEX IF NOT EXISTS idx_orders_sync_status ON orders(sync_status);
    `,
  },
];

export async function migrate(db: SQLiteDatabase): Promise<void> {
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const currentVersion = row?.user_version ?? 0;

  const pending = MIGRATIONS.filter((m) => m.version > currentVersion).sort(
    (a, b) => a.version - b.version
  );

  for (const migration of pending) {
    await db.withExclusiveTransactionAsync(async (txn) => {
      await txn.execAsync(migration.sql);
      await txn.runAsync('INSERT INTO migrations (version) VALUES (?)', migration.version);
      await txn.execAsync(`PRAGMA user_version = ${migration.version}`);
    });
  }
}