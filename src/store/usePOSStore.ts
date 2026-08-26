import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { getDB } from '../lib/db';
import { createOrder, getOrderRedemptionMeta, updateOrderStatus as updateOrderStatusInDb, listOrders } from '../services/orderRepository';
import { syncOrderImmediately } from '../services/syncService';
import { getLoyaltyProgram, type LoyaltyProgram } from '../services/customerRepository';
import { insertRedemptionLogs, isFreeItemReward } from '../services/loyaltyService';
import { useSyncStore } from './useSyncStore';


export interface ActiveCustomer {
  id: number;
  card_number: string;
  first_name: string | null;
  last_name: string | null;
  // Last-synced balance at scan time. Used as the base for the client-side
  // projected-balance calc (this value + this cart's own earnable stamps),
  // not re-fetched live — see loyaltyService.ts.
  loyalty_progress: number;
}

export interface ProductSizeOption {
  id: string;
  name: string;
  sort_order: number;
}

export interface ProductTemperatureOption {
  id: string;
  name: string;
  sort_order: number;
}

export interface ProductVariant {
  id: string;
  price: number;
  size: ProductSizeOption | null;
  temperature: ProductTemperatureOption | null;
}

export interface MenuItem {
  id: string;
  name: string;
  category: string; // category name (denormalized for filtering/display)
  category_id: string;
  type: string; // 'Beverage' | 'Pastry' | etc. — drives stamp-earning and redemption eligibility
  price: number; // lowest variant price — used for card display only
  image: string | null;
  variants: ProductVariant[];
}

export interface ProductCategory {
  id: string;
  name: string;
}

export interface PaymentMethod {
  id: string;
  name: string;
  is_enabled: boolean;
}

export interface CartItemOptions {
  size?: string;
  temp?: string;
  addon?: boolean; // unused for now — no add-on table exists in the DB yet
}

export interface CartItem {
  cartItemId: string; // Unique ID to separate identical items with different configs
  item: MenuItem;
  options?: CartItemOptions;
  unitPrice: number;
  quantity: number;
  // True when this line was redeemed against the shop's single active
  // loyalty reward (Free Coffee / Free Pastry / a flat Discount — see
  // usePOSStore.redeemCartLine). Drives the FREE/discount badge in
  // CartSummary, the receipt line, and the loyalty_log insert at charge
  // time (see placeOrder). For Free Coffee/Free Pastry, unitPrice is 0.
  // For Discount, unitPrice is reduced by redeemedDiscount but may still
  // be > 0.
  isRedemption?: boolean;
  // Flat peso amount taken off for a Discount-type redemption. 0/undefined
  // for Free Coffee/Free Pastry lines, where unitPrice is already 0.
  redeemedDiscount?: number;
  // Original unitPrice before redemption, stashed so undoRedemption can
  // restore it exactly (matters for Discount, where the reduced price
  // isn't simply 0).
  preRedemptionUnitPrice?: number;
}

export type OrderStatus = 'Current' | 'Completed' | 'Void (Not Made)' | 'Void (Consumed)';

export interface Order {
  id: string;
  order_number: string;
  items: CartItem[];
  totalAmount: number;
  paymentMethod: string;
  customerName?: string;
  status: OrderStatus;
  timestamp: string;
}

export interface AuthProfile {
  id: string;
  display_name: string;
  role: string;
}

interface POSState {
  // Auth & Boot
  hasFinishedSplash: boolean;
  setHasFinishedSplash: (finished: boolean) => void;
  isAuthenticated: boolean;
  userId: string | null;
  userRole: string | null;
  login: (profile: AuthProfile) => void;
  logout: () => void;
  
  activeCustomer: ActiveCustomer | null;
  setActiveCustomer: (customer: ActiveCustomer) => void;
  clearActiveCustomer: () => void;

  // The shop's single currently-active reward (loyalty_program row where
  // status = true), independent of any particular customer — hydrated
  // once from the local cache, not tied to activeCustomer. Superseding
  // the old single-reward-type redemptionMode/addRedemptionToCart (never
  // wired to any UI — replaced outright rather than kept alongside this).
  activeReward: LoyaltyProgram | null;
  hydrateActiveReward: () => Promise<void>;
  // Marks an existing cart line as redeemed against activeReward. Splits
  // the line if quantity > 1 (1 unit redeemed, the rest unchanged); for
  // quantity === 1 mutates the line in place. No-ops if activeReward isn't
  // set or the line is already redeemed.
  redeemCartLine: (cartItemId: string) => void;
  // Reverts a redeemed line. Simplification: removes the redeemed line
  // outright rather than re-merging its quantity back into a same-product
  // sibling line that an earlier split may have shrunk — the cashier can
  // re-add from the menu grid if needed.
  undoRedemption: (cartItemId: string) => void;


  // Navigation & Filtering
  activeCategory: string;
  setActiveCategory: (category: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isSearchActive: boolean;
  setIsSearchActive: (active: boolean) => void;

  // Toast
  toastMessage: string | null;
  showToast: (message: string) => void;
  hideToast: () => void;

  // Cart
  cart: CartItem[];
  addToCart: (item: MenuItem, options?: CartItemOptions, unitPrice?: number, quantity?: number) => void;
  removeFromCart: (cartItemId: string) => void;
  decrementCartItem: (cartItemId: string) => void;
  clearCart: () => void;
  
  
  // Order Generation
  orderSequence: number;
  lastOrderDate: string;
  generateOrderNumber: () => string;
  // Seeds the in-memory orderSequence counter from SQLite so the next
  // generated number is one higher than the highest existing YYYYMMDD-NNN
  // in `orders`. Called once on app boot, in parallel with hydrateOrders().
  // Without this, a kill+relaunch resets the counter to 1 and the very
  // first order collides with any existing YYYYMMDD-001 in SQLite
  // (UNIQUE constraint on orders.order_number).
  initOrderSequence: () => Promise<void>;
  
  // User Profile
  cashierName: string;
  setCashierName: (name: string) => void;

  // Orders
  orders: Order[];
  setOrders: (orders: Order[]) => void;
  hydrateOrders: () => Promise<void>;
  placeOrder: (paymentMethod: string, orderNumber: string, customerName?: string) => Promise<void>;
  updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<void>;
}

const getTodayString = () => {
  const date = new Date();
  return `${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}`;
};

export const usePOSStore = create<POSState>((set, get) => ({
  hasFinishedSplash: false,
  setHasFinishedSplash: (finished) => set({ hasFinishedSplash: finished }),
  isAuthenticated: false,
  userId: null,
  userRole: null,
  login: (profile) => set({
    isAuthenticated: true,
    userId: profile.id,
    userRole: profile.role,
    cashierName: profile.display_name,
  }),
  logout: () => {
    supabase.auth.signOut();
    set({ isAuthenticated: false, userId: null, userRole: null });
  },

  activeCategory: 'All',
  setActiveCategory: (category) => set({ activeCategory: category }),
  
  searchQuery: '',
  setSearchQuery: (query) => set({ searchQuery: query }),
  
  isSearchActive: false,
  setIsSearchActive: (active) => set({ isSearchActive: active }),

  toastMessage: null,
  showToast: (message) => set({ toastMessage: message }),
  hideToast: () => set({ toastMessage: null }),
  
  activeCustomer: null,
  setActiveCustomer: (customer) => set({ activeCustomer: customer }),
  clearActiveCustomer: () => set({ activeCustomer: null }),

  activeReward: null,
  hydrateActiveReward: async () => {
    const reward = await getLoyaltyProgram();
    set({ activeReward: reward });
  },

  redeemCartLine: (cartItemId) => set((state) => {
    const reward = state.activeReward;
    const line = state.cart.find((c) => c.cartItemId === cartItemId);
    if (!reward || !line || line.isRedemption) return state;

    const freeItem = isFreeItemReward(reward);
    const discountAmount = freeItem ? 0 : Math.min(line.unitPrice, reward.discount_amount ?? 0);
    const newUnitPrice = freeItem ? 0 : line.unitPrice - discountAmount;

    const redeemedLine: CartItem = {
      ...line,
      quantity: 1,
      isRedemption: true,
      preRedemptionUnitPrice: line.unitPrice,
      redeemedDiscount: discountAmount,
      unitPrice: newUnitPrice,
    };

    if (line.quantity > 1) {
      // Auto-split: shrink the original line by 1 unit, add the redeemed
      // unit as its own line (distinct cartItemId so it can't collide
      // with the shrunk sibling).
      return {
        cart: state.cart
          .map((c) => (c.cartItemId === cartItemId ? { ...c, quantity: c.quantity - 1 } : c))
          .concat({ ...redeemedLine, cartItemId: `${cartItemId}-redeemed-${Date.now()}` }),
      };
    }

    // Quantity already 1 — mutate in place, no split needed.
    return {
      cart: state.cart.map((c) => (c.cartItemId === cartItemId ? redeemedLine : c)),
    };
  }),

  undoRedemption: (cartItemId) => set((state) => ({
    cart: state.cart.filter((c) => c.cartItemId !== cartItemId),
  })),

  cart: [],
  addToCart: (item, options, unitPrice, quantity = 1) => set((state) => {
    // Generate unique ID based on options. Redemption items get a distinct
    // suffix so a paid and a free line of the same product (same size/temp)
    // don't collapse into one cart row.
    const optionStr = options ? `${options.size || ''}-${options.temp || ''}-${options.addon ? 'addon' : ''}` : 'no-options';
    const cartItemId = `${item.id}-${optionStr}`;
    const price = unitPrice !== undefined ? unitPrice : item.price;

    const existing = state.cart.find((c) => c.cartItemId === cartItemId);
    if (existing) {
      return {
        cart: state.cart.map((c) =>
          c.cartItemId === cartItemId ? { ...c, quantity: c.quantity + quantity } : c
        ),
      };
    }
    return { cart: [...state.cart, { cartItemId, item, options, unitPrice: price, quantity }] };
  }),

  removeFromCart: (cartItemId) => set((state) => ({
    cart: state.cart.filter((c) => c.cartItemId !== cartItemId),
  })),

  decrementCartItem: (cartItemId) => set((state) => {
    const existing = state.cart.find((c) => c.cartItemId === cartItemId);
    if (existing && existing.quantity > 1) {
      return {
        cart: state.cart.map((c) =>
          c.cartItemId === cartItemId ? { ...c, quantity: c.quantity - 1 } : c
        ),
      };
    }
    // If quantity is 1, remove it
    return {
      cart: state.cart.filter((c) => c.cartItemId !== cartItemId),
    };
  }),

  clearCart: () => set({ cart: [], activeCustomer: null }),

  orderSequence: 1,
  lastOrderDate: getTodayString(),
  
  generateOrderNumber: () => {
    const today = getTodayString();
    let currentSequence = get().orderSequence;

    // Reset sequence if it's a new day
    if (get().lastOrderDate !== today) {
      currentSequence = 1;
    }

    const orderNumber = `${today}-${currentSequence.toString().padStart(3, '0')}`;

    set({
      orderSequence: currentSequence + 1,
      lastOrderDate: today
    });

    return orderNumber;
  },

  initOrderSequence: async () => {
    const today = getTodayString();
    const prefix = `${today}-`;
    try {
      const db = await getDB();
      // Highest order_number for today, if any. order_number is
      // TEXT UNIQUE, lexicographic sort works because the YYYYMMDD-
      // prefix is identical and the suffix is zero-padded to 3 digits.
      const row = await db.getFirstAsync<{ order_number: string | null }>(
        `SELECT order_number FROM orders
         WHERE order_number LIKE ?
         ORDER BY order_number DESC
         LIMIT 1`,
        `${prefix}%`
      );
      if (row?.order_number) {
        const lastSeq = parseInt(row.order_number.slice(prefix.length), 10);
        if (Number.isFinite(lastSeq) && lastSeq > 0) {
          set({ orderSequence: lastSeq + 1, lastOrderDate: today });
          return;
        }
      }
      // Local SQLite has nothing for today — this is the normal case on a
      // brand-new day, but it's indistinguishable here from a fresh
      // install/reinstall wiping local state while remote orders for today
      // already exist (see 2026-07-09 handoff entry). Check Supabase before
      // falling back to 1, so a reinstalled device doesn't regenerate an
      // order_number another device already synced today.
      const { data: remoteRow, error } = await supabase
        .from('orders')
        .select('order_id')
        .like('order_id', `${prefix}%`)
        .order('order_id', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('initOrderSequence remote fallback failed:', error);
        return; // fall through to defaults (orderSequence: 1)
      }
      if (remoteRow?.order_id) {
        const lastSeq = parseInt(remoteRow.order_id.slice(prefix.length), 10);
        if (Number.isFinite(lastSeq) && lastSeq > 0) {
          set({ orderSequence: lastSeq + 1, lastOrderDate: today });
        }
      }
      // Neither local nor remote has an order for today — leave the
      // defaults (orderSequence: 1, lastOrderDate: today).
    } catch (err) {
      // If the lookup fails, fall through to defaults rather than
      // blocking app boot. The first generated number may still
      // collide, but a single UNIQUE failure is recoverable; a stuck
      // splash is not.
      console.error('initOrderSequence failed:', err);
    }
  },

  cashierName: 'Joshua T.',
  setCashierName: (name) => set({ cashierName: name }),

  orders: [],
  setOrders: (orders) => set({ orders }),
  hydrateOrders: async () => {
    const orders = await listOrders();
    set({ orders });
  },
    placeOrder: async (paymentMethod, orderNumber, customerName) => {
    const state = get();
    const hasRedemptionLine = state.cart.some((c) => c.isRedemption === true);

    if (hasRedemptionLine && (!state.activeCustomer || !state.activeReward)) {
      // Shouldn't be reachable if the UI only offers redemption when both
      // are set, but guarding here means a bad state can't silently ship
      // a free item with no way to trace it back to a customer/reward.
      throw new Error('A redeemed item requires an attached customer and an active reward.');
    }

    // An attached customer (scanned via Customer Management) always takes
    // precedence over whatever the cashier manually typed into
    // PaymentModal's optional name field. "First Last" order, per Ipei.
    // If the attached customer has neither name on file, we fall back to
    // undefined (-> 'Walk-In' via createOrder's default), NOT to the manual
    // name — an attached customer always wins even if their name is blank.
    const resolvedCustomerName = state.activeCustomer
      ? [state.activeCustomer.first_name, state.activeCustomer.last_name]
          .filter(Boolean)
          .join(' ') || undefined
      : customerName;

    // Orders are always created 'Current' (an open ticket) — this is not
    // the moment redemption finalizes. Supabase's orders_status_check
    // rejects 'Current' remotely, and the earn-side trigger itself only
    // fires on transition to 'Completed' — so the redemption's immediate
    // sync + loyalty_log write happens in updateOrderStatus instead, once
    // the order actually reaches 'Completed'. Here we only freeze which
    // reward/points cost applied, so a later change to the active reward
    // can't retroactively affect this order.
    const newOrder = await createOrder(
      state.cart,
      orderNumber,
      paymentMethod,
      state.userId,
      state.cashierName,
      resolvedCustomerName,
      state.activeCustomer?.id ?? null,
      hasRedemptionLine,
      hasRedemptionLine ? state.activeReward!.id : null,
      hasRedemptionLine ? state.activeReward!.points_required : null,
    );

    set((s) => ({
      orders: [newOrder, ...s.orders],
      cart: [],
      activeCustomer: null,
    }));
  },
  updateOrderStatus: async (orderId, status) => {
    const meta = await getOrderRedemptionMeta(orderId);

    if (status === 'Completed' && meta?.hasRedemption) {
      // This is the actual finalization moment for a redemption — mirrors
      // the earn-side trigger's own timing (AFTER UPDATE OF status to
      // 'Completed'). Requires connectivity for the same reason charge
      // time originally did: loyalty_log.order_id has a real FK to
      // orders(id), so the order must exist remotely before the
      // redemption log can reference it.
      if (!useSyncStore.getState().isNetworkConnected) {
        throw new Error(
          'Completing a redeemed order requires an internet connection. Please connect and try again.'
        );
      }
      if (meta.customerId == null || meta.rewardId == null || meta.pointsRequired == null) {
        throw new Error(
          'This order is missing loyalty redemption details and cannot be completed automatically.'
        );
      }

      const previousStatus = get().orders.find((o) => o.id === orderId)?.status ?? 'Current';

      await updateOrderStatusInDb(orderId, status);

      const syncResult = await syncOrderImmediately(orderId);
      if (!syncResult.success) {
        // Revert so the cashier can retry completing it once back online,
        // rather than leaving it stuck 'Completed' locally with no
        // redemption log and no remote record.
        await updateOrderStatusInDb(orderId, previousStatus);
        throw new Error(
          syncResult.error ?? 'Failed to sync redeemed order. Please try again.'
        );
      }

      const logResult = await insertRedemptionLogs(
        meta.customerId,
        meta.rewardId,
        meta.pointsRequired,
        orderId,
        meta.redeemedCount,
      );
      if (!logResult.success) {
        // The order itself already succeeded and synced at this point —
        // rolling back a completed, paid transaction isn't reasonable
        // (the customer already has the item). Surface loudly instead so
        // the cashier knows the points deduction needs manual follow-up.
        get().showToast(
          `Order completed, but the loyalty deduction failed to save: ${logResult.error ?? 'unknown error'}. Please inform your manager.`
        );
      }
    } else {
      await updateOrderStatusInDb(orderId, status);
    }

    set((state) => ({
      orders: state.orders.map((o) => (o.id === orderId ? { ...o, status } : o)),
    }));

    // Auto-sync so the cashier doesn't have to visit SyncScreen manually
    // after completing/voiding an order. Fire-and-forget — doesn't block
    // the UI on a network round-trip. hydrateStats() first, since
    // useSyncStore's in-memory pendingTransactions/failedRecords only
    // reflect reality after that call; syncNow() itself already no-ops
    // when offline (sets status: 'Offline') or when there's nothing
    // pending, so being online vs. offline is handled entirely by the
    // existing, untouched useSyncStore logic — this just triggers it
    // proactively instead of waiting for the cashier to tap the button.
    if (status !== 'Current') {
      useSyncStore.getState().hydrateStats()
        .then(() => useSyncStore.getState().syncNow())
        .catch((err) => console.warn('Background sync after status change failed to start:', err));
    }
  },
}));