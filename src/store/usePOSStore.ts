import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { createOrder, updateOrderStatus as updateOrderStatusInDb, listOrders } from '../services/orderRepository';

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

  cart: [],
  addToCart: (item, options, unitPrice, quantity = 1) => set((state) => {
    // Generate unique ID based on options
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

  clearCart: () => set({ cart: [] }),

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
    const newOrder = await createOrder(
      state.cart,
      orderNumber,
      paymentMethod,
      state.userId,
      state.cashierName,
      customerName
    );
    set((s) => ({
      orders: [newOrder, ...s.orders],
      cart: [],
    }));
  },
  updateOrderStatus: async (orderId, status) => {
    await updateOrderStatusInDb(orderId, status);
    set((state) => ({
      orders: state.orders.map((o) => (o.id === orderId ? { ...o, status } : o)),
    }));
  },
}));