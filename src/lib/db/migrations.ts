import { type SQLiteDatabase } from 'expo-sqlite';

type Migration = {
  version: number;
  sql?: string;
  // Used instead of `sql` when a migration needs conditional logic.
  run?: (txn: any) => Promise<void>;
};

const MIGRATIONS: Migration[] = [
  {
    version: 9,
    // Redemption reward metadata was originally shipped as v7. Keep this
    // repair migration separate from the cash migrations so upgraded
    // devices cannot skip it due to the historical version collision.
    run: async (txn) => {
      const columns = await txn.getAllAsync(`PRAGMA table_info('orders')`);
      if (!columns.some((c: any) => c.name === 'redeemed_reward_id')) {
        await txn.execAsync(`ALTER TABLE orders ADD COLUMN redeemed_reward_id INTEGER;`);
      }
      if (!columns.some((c: any) => c.name === 'redeemed_points_required')) {
        await txn.execAsync(`ALTER TABLE orders ADD COLUMN redeemed_points_required INTEGER;`);
      }
      // Devices that ran the historical redemption v7 are already at
      // user_version 7, so they skipped the cash v6/v7 repair entirely.
      if (!columns.some((c: any) => c.name === 'cash_tendered')) {
        await txn.execAsync(
          `ALTER TABLE orders ADD COLUMN cash_tendered REAL NOT NULL DEFAULT 0;`,
        );
      }
      if (!columns.some((c: any) => c.name === 'change_amount')) {
        await txn.execAsync(
          `ALTER TABLE orders ADD COLUMN change_amount REAL NOT NULL DEFAULT 0;`,
        );
      }
    },
  },
  {
    version: 8,
    // Per-reward metadata and per-line redemption flags were originally
    // shipped as v6. Use conditional adds for installs that already received
    // the old redemption migrations.
    run: async (txn) => {
      const loyaltyColumns = await txn.getAllAsync(`PRAGMA table_info('loyalty_program')`);
      const itemColumns = await txn.getAllAsync(`PRAGMA table_info('order_items')`);
      if (!loyaltyColumns.some((c: any) => c.name === 'reward_type')) {
        await txn.execAsync(`ALTER TABLE loyalty_program ADD COLUMN reward_type TEXT;`);
      }
      if (!loyaltyColumns.some((c: any) => c.name === 'quantity')) {
        await txn.execAsync(`ALTER TABLE loyalty_program ADD COLUMN quantity INTEGER;`);
      }
      if (!loyaltyColumns.some((c: any) => c.name === 'discount_amount')) {
        await txn.execAsync(`ALTER TABLE loyalty_program ADD COLUMN discount_amount REAL;`);
      }
      if (!itemColumns.some((c: any) => c.name === 'is_redemption')) {
        await txn.execAsync(
          `ALTER TABLE order_items ADD COLUMN is_redemption INTEGER NOT NULL DEFAULT 0;`,
        );
      }
      if (!itemColumns.some((c: any) => c.name === 'redeemed_discount')) {
        await txn.execAsync(
          `ALTER TABLE order_items ADD COLUMN redeemed_discount REAL NOT NULL DEFAULT 0;`,
        );
      }
    },
  },
  {
    version: 7,
    // Repair migration for the v1/v6 collision (2026-08-27). Some devices
    // installed the app while v1's CREATE TABLE orders already (mistakenly)
    // included cash_tendered/change_amount directly, AND v6 still existed
    // as a separate `ALTER TABLE ADD COLUMN` for those same two columns.
    // On those devices, v6 threw "duplicate column name" on first run,
    // aborting its transaction — so `migrations`/`user_version` never
    // advanced past 5, even though the columns physically exist (from v1).
    // Those devices are permanently stuck retrying v6 on every boot.
    //
    // v1 has since been corrected to no longer include the two columns,
    // so a genuinely fresh install only ever adds them once, via v6.
    // This migration exists purely to unstick devices caught in the bad
    // window before that fix: it checks PRAGMA table_info first and only
    // adds a column if it's actually missing, so it's safe to run
    // regardless of which path a given device took to get here.
    run: async (txn) => {
      const tableInfo = await txn.getAllAsync(`PRAGMA table_info('orders')`);
      const hasCash = tableInfo.some((c: any) => c.name === 'cash_tendered');
      const hasChange = tableInfo.some((c: any) => c.name === 'change_amount');

      if (!hasCash) {
        await txn.execAsync(
          `ALTER TABLE orders ADD COLUMN cash_tendered REAL NOT NULL DEFAULT 0;`
        );
      }
      if (!hasChange) {
        await txn.execAsync(
          `ALTER TABLE orders ADD COLUMN change_amount REAL NOT NULL DEFAULT 0;`
        );
      }
    },
  },
  {
    version: 6,
    // Cash payment support (2026-08-26). Mirrors the Supabase
    // `cash_tendered`/`change_amount` columns added the same session.
    // Populated for every order regardless of payment method — 0 for
    // non-cash, real values for Cash — so reporting never has to special-
    // case a NULL.
    //
    // NOTE (2026-08-27): this previously collided with v1's CREATE TABLE
    // orders, which had accidentally already included these two columns.
    // v1 has been corrected — see its comment below — and v7 exists to
    // repair any device that got stuck on the broken version of this file.
    run: async (txn) => {
      const tableInfo = await txn.getAllAsync(`PRAGMA table_info('orders')`);
      if (!tableInfo.some((c: any) => c.name === 'cash_tendered')) {
        await txn.execAsync(
          `ALTER TABLE orders ADD COLUMN cash_tendered REAL NOT NULL DEFAULT 0;`,
        );
      }
      if (!tableInfo.some((c: any) => c.name === 'change_amount')) {
        await txn.execAsync(
          `ALTER TABLE orders ADD COLUMN change_amount REAL NOT NULL DEFAULT 0;`,
        );
      }
    },
  },
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
    sql: `
      DELETE FROM order_items
      WHERE order_id IN (SELECT id FROM orders WHERE order_number LIKE 'TEST-%');

      DELETE FROM orders WHERE order_number LIKE 'TEST-%';
    `,
  },
  {
    version: 1,
    // NOTE (2026-08-27): cash_tendered/change_amount were briefly, mistakenly
    // included directly in this CREATE TABLE — that duplicated what v6 adds
    // and caused v6's ALTER TABLE to fail with "duplicate column name" on
    // any fresh install, permanently stalling migration at v5. Removed here;
    // see v6 and v7's comments for the full story and the repair path.
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
      if (migration.run) {
        await migration.run(txn);
      } else if (migration.sql) {
        await txn.execAsync(migration.sql);
      }
      await txn.runAsync('INSERT INTO migrations (version) VALUES (?)', migration.version);
      await txn.execAsync(`PRAGMA user_version = ${migration.version}`);
    });
  }
}