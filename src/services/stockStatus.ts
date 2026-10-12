import type { CartItem, ProductVariant } from "../store/usePOSStore";

// A variant with this many servings left (or fewer) shows the amber "Low" badge.
export const LOW_STOCK_SERVINGS = 5;

export type StockState = "ok" | "low" | "out";

// Pure. `requestedQty` is the TOTAL number of this variant the cashier would
// then have on the order (already in the cart + the quantity being added).
// Pass 0 for a plain "is it out right now?" check (e.g. product cards).
//
// Take-Out (usesPackaging = true) is checked against servingsTakeOut, which
// also accounts for packaging; Dine-In against servingsDineIn. A null count
// means no recipe / unknown, so it never warns.
export function getStockState(
  variant: ProductVariant | null | undefined,
  usesPackaging: boolean,
  requestedQty = 0,
): StockState {
  if (!variant) return "ok";
  const servings = usesPackaging
    ? variant.servingsTakeOut
    : variant.servingsDineIn;
  if (servings === null || servings === undefined) return "ok";
  if (servings <= 0 || requestedQty > servings) return "out";
  if (servings <= LOW_STOCK_SERVINGS) return "low";
  return "ok";
}

// Card-level state. "out" = every variant is out in both modes;
// "low" = the best variant is low; otherwise "ok".
export function getProductStockState(variants: ProductVariant[]): StockState {
  if (variants.length === 0) return "ok";
  const rank = { out: 0, low: 1, ok: 2 } as const;
  let best: StockState = "out";
  for (const v of variants) {
    const a = getStockState(v, false);
    const b = getStockState(v, true);
    const variantBest = rank[a] >= rank[b] ? a : b;
    if (rank[variantBest] > rank[best]) best = variantBest;
  }
  return best;
}

// Quantity of this exact variant already in the cart, across Dine-In and
// Take-Out lines. CartItem stores size/temperature by name, not variant id.
export function getCartQtyForVariant(
  cart: CartItem[],
  productId: string,
  variant: ProductVariant,
): number {
  const size = variant.size?.name ?? null;
  const temp = variant.temperature?.name ?? null;
  return cart
    .filter(
      (c) =>
        c.item.id === productId &&
        (c.options?.size ?? null) === size &&
        (c.options?.temp ?? null) === temp,
    )
    .reduce((sum, c) => sum + c.quantity, 0);
}
