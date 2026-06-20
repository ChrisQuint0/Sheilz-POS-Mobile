import { create } from 'zustand';

export interface MenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
  image: string;
}

export interface CartItem {
  item: MenuItem;
  quantity: number;
}

interface POSState {
  // Navigation & Filtering
  activeCategory: string;
  setActiveCategory: (category: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isSearchActive: boolean;
  setIsSearchActive: (active: boolean) => void;

  // Cart
  cart: CartItem[];
  addToCart: (item: MenuItem) => void;
  removeFromCart: (itemId: string) => void;
  decrementCartItem: (itemId: string) => void;
  clearCart: () => void;
  
  // Order Generation
  orderSequence: number;
  lastOrderDate: string;
  generateOrderNumber: () => string;
  
  // User Profile
  cashierName: string;
  setCashierName: (name: string) => void;
}

const getTodayString = () => {
  const date = new Date();
  return `${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}`;
};

export const usePOSStore = create<POSState>((set, get) => ({
  activeCategory: 'All',
  setActiveCategory: (category) => set({ activeCategory: category }),
  
  searchQuery: '',
  setSearchQuery: (query) => set({ searchQuery: query }),
  
  isSearchActive: false,
  setIsSearchActive: (active) => set({ isSearchActive: active }),

  cart: [],
  addToCart: (item) => set((state) => {
    const existing = state.cart.find((c) => c.item.id === item.id);
    if (existing) {
      return {
        cart: state.cart.map((c) =>
          c.item.id === item.id ? { ...c, quantity: c.quantity + 1 } : c
        ),
      };
    }
    return { cart: [...state.cart, { item, quantity: 1 }] };
  }),

  removeFromCart: (itemId) => set((state) => ({
    cart: state.cart.filter((c) => c.item.id !== itemId),
  })),

  decrementCartItem: (itemId) => set((state) => {
    const existing = state.cart.find((c) => c.item.id === itemId);
    if (existing && existing.quantity > 1) {
      return {
        cart: state.cart.map((c) =>
          c.item.id === itemId ? { ...c, quantity: c.quantity - 1 } : c
        ),
      };
    }
    // If quantity is 1, remove it
    return {
      cart: state.cart.filter((c) => c.item.id !== itemId),
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
}));
