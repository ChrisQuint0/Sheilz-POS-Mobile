import { getDB } from '../lib/db';
import type { MenuItem, ProductVariant, ProductCategory, PaymentMethod } from '../store/usePOSStore';

export interface CatalogSnapshot {
  categories: { id: string; name: string }[];
  sizes: { id: string; name: string; sort_order: number }[];
  temperatures: { id: string; name: string; sort_order: number }[];
  products: { id: string; name: string; category_id: string; image_url: string | null }[];
  variants: {
    id: string;
    product_id: string;
    size_id: string | null;
    temperature_id: string | null;
    price: number;
  }[];
  paymentMethods: { id: string; name: string; is_enabled: boolean }[];
}

export async function getCategories(): Promise<ProductCategory[]> {
  const db = await getDB();
  return db.getAllAsync<ProductCategory>(
    `SELECT id, name FROM product_categories ORDER BY name`
  );
}

export async function getPaymentMethods(): Promise<PaymentMethod[]> {
  const db = await getDB();
  const rows = await db.getAllAsync<any>(
    `SELECT id, name, is_enabled FROM payment_methods WHERE is_enabled = 1 ORDER BY name`
  );
  return rows.map((r) => ({ id: r.id, name: r.name, is_enabled: !!r.is_enabled }));
}

export async function getProducts(): Promise<MenuItem[]> {
  const db = await getDB();

  const productRows = await db.getAllAsync<any>(
    `SELECT p.id, p.name, p.category_id, p.image_url, c.name as category_name
     FROM products p
     LEFT JOIN product_categories c ON c.id = p.category_id
     ORDER BY p.name`
  );

  const variantRows = await db.getAllAsync<any>(
    `SELECT v.id, v.product_id, v.price,
            s.id as size_id, s.name as size_name, s.sort_order as size_sort_order,
            t.id as temp_id, t.name as temp_name, t.sort_order as temp_sort_order
     FROM product_variants v
     LEFT JOIN sizes s ON s.id = v.size_id
     LEFT JOIN temperatures t ON t.id = v.temperature_id`
  );

  return productRows.map((p) => {
    const variants: ProductVariant[] = variantRows
      .filter((v) => v.product_id === p.id)
      .map((v) => ({
        id: v.id,
        price: v.price,
        size: v.size_id
          ? { id: v.size_id, name: v.size_name, sort_order: v.size_sort_order }
          : null,
        temperature: v.temp_id
          ? { id: v.temp_id, name: v.temp_name, sort_order: v.temp_sort_order }
          : null,
      }));

    const lowestPrice = variants.length > 0 ? Math.min(...variants.map((v) => v.price)) : 0;

    return {
      id: p.id,
      name: p.name,
      category: p.category_name ?? '',
      category_id: p.category_id,
      image: p.image_url,
      price: lowestPrice,
      variants,
    };
  });
}

// Atomic overwrite — wipes and re-inserts the full catalog cache in one
// transaction so readers never see a partially-synced state.
export async function replaceCatalog(snapshot: CatalogSnapshot): Promise<void> {
  const db = await getDB();

  await db.withExclusiveTransactionAsync(async (txn) => {
    // Delete children before parents (foreign_keys = ON)
    await txn.execAsync(`DELETE FROM product_variants`);
    await txn.execAsync(`DELETE FROM products`);
    await txn.execAsync(`DELETE FROM sizes`);
    await txn.execAsync(`DELETE FROM temperatures`);
    await txn.execAsync(`DELETE FROM product_categories`);
    await txn.execAsync(`DELETE FROM payment_methods`);

    for (const c of snapshot.categories) {
      await txn.runAsync(`INSERT INTO product_categories (id, name) VALUES (?, ?)`, [c.id, c.name]);
    }
    for (const s of snapshot.sizes) {
      await txn.runAsync(
        `INSERT INTO sizes (id, name, sort_order) VALUES (?, ?, ?)`,
        [s.id, s.name, s.sort_order]
      );
    }
    for (const t of snapshot.temperatures) {
      await txn.runAsync(
        `INSERT INTO temperatures (id, name, sort_order) VALUES (?, ?, ?)`,
        [t.id, t.name, t.sort_order]
      );
    }
    for (const p of snapshot.products) {
      await txn.runAsync(
        `INSERT INTO products (id, name, category_id, image_url) VALUES (?, ?, ?, ?)`,
        [p.id, p.name, p.category_id, p.image_url]
      );
    }
    for (const v of snapshot.variants) {
      await txn.runAsync(
        `INSERT INTO product_variants (id, product_id, size_id, temperature_id, price) VALUES (?, ?, ?, ?, ?)`,
        [v.id, v.product_id, v.size_id, v.temperature_id, v.price]
      );
    }
    for (const pm of snapshot.paymentMethods) {
      await txn.runAsync(
        `INSERT INTO payment_methods (id, name, is_enabled) VALUES (?, ?, ?)`,
        [pm.id, pm.name, pm.is_enabled ? 1 : 0]
      );
    }
  });
}