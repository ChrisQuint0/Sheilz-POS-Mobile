import { supabase } from '../lib/supabase';
import { getDB } from '../lib/db';
import { replaceCatalog, type CatalogSnapshot } from './catalogRepository';

export interface SyncResult {
  success: boolean;
  error?: string;
}

// Moved verbatim from POSScreen.tsx's old fetchCatalog effect, then
// flattened into a CatalogSnapshot for replaceCatalog. Sizes/temperatures
// aren't queried separately from Supabase — they're de-duplicated here
// from the nested product_variants payload, since that's the only place
// they exist in this query shape.
export async function syncCatalogFromSupabase(): Promise<SyncResult> {
  const [categoriesResult, productsResult, paymentMethodsResult] = await Promise.all([
    supabase.from('product_categories').select('id, name').order('name'),
    supabase
      .from('products')
      .select(
        `id, name, category_id, image_url,
         product_variants!inner (
           id,
           price,
           sizes ( id, name, sort_order ),
           temperatures ( id, name, sort_order )
         )`
      )
      .eq('is_visible', true)
      .is('archived_at', null)
      .gt('product_variants.price', 0)
      .order('name'),
    supabase.from('payment_methods').select('id, name, is_enabled').eq('is_enabled', true).order('name'),
  ]);

  if (categoriesResult.error || productsResult.error || paymentMethodsResult.error) {
    const error =
      categoriesResult.error?.message ??
      productsResult.error?.message ??
      paymentMethodsResult.error?.message ??
      'Unknown catalog sync error';
    console.error('Catalog sync failed:', error);
    return { success: false, error };
  }

  const sizesMap = new Map<string, { id: string; name: string; sort_order: number }>();
  const temperaturesMap = new Map<string, { id: string; name: string; sort_order: number }>();
  const variants: CatalogSnapshot['variants'] = [];

  for (const p of productsResult.data ?? []) {
    for (const v of (p as any).product_variants ?? []) {
      if (v.sizes) sizesMap.set(v.sizes.id, v.sizes);
      if (v.temperatures) temperaturesMap.set(v.temperatures.id, v.temperatures);
      variants.push({
        id: v.id,
        product_id: p.id,
        size_id: v.sizes?.id ?? null,
        temperature_id: v.temperatures?.id ?? null,
        price: v.price,
      });
    }
  }

  const snapshot: CatalogSnapshot = {
    categories: categoriesResult.data ?? [],
    sizes: Array.from(sizesMap.values()),
    temperatures: Array.from(temperaturesMap.values()),
    products: (productsResult.data ?? []).map((p: any) => ({
      id: p.id,
      name: p.name,
      category_id: p.category_id,
      image_url: p.image_url,
    })),
    variants,
    paymentMethods: paymentMethodsResult.data ?? [],
  };

  await replaceCatalog(snapshot);

  const db = await getDB();
  await db.runAsync(
    `INSERT INTO meta (key, value) VALUES ('last_catalog_sync_at', ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    [new Date().toISOString()]
  );

  return { success: true };
}