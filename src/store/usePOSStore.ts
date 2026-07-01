import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export interface MenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
  image: string;
}

import { Size, Temp } from '../constants/pricing';

export interface CartItemOptions {
  size?: Size;
  temp?: Temp;
  addon?: boolean;
}

export interface CartItem {
  cartItemId: string; // Unique ID to separate identical items with different configs
  item: MenuItem;
  options?: CartItemOptions;
  unitPrice: number;
  quantity: number;
}

export type OrderStatus = 'Current' | 'Completed' | 'Voided (Not Made)' | 'Voided (Consumed)';

export interface Order {
  id: string; // Order number (e.g., #0001)
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
  placeOrder: (paymentMethod: string, orderNumber: string, customerName?: string) => void;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
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
  placeOrder: (paymentMethod, orderNumber, customerName) => set((state) => {
    const newOrder: Order = {
      id: orderNumber,
      items: [...state.cart],
      totalAmount: state.cart.reduce((sum, c) => sum + c.unitPrice * c.quantity, 0),
      paymentMethod,
      customerName: customerName || undefined,
      status: 'Current',
      timestamp: new Date().toISOString(),
    };
    return {
      orders: [newOrder, ...state.orders], // Prepended so newest is first
      cart: [], // Clear the cart
    };
  }),
  updateOrderStatus: (orderId, status) => set((state) => ({
    orders: state.orders.map(o => o.id === orderId ? { ...o, status } : o)
  })),
}));