import { create } from 'zustand';
import {
  getCustomerByCardNumber,
  getLoyaltyProgram,
  getLastVisitForCustomer,
  type Customer,
} from '../services/customerRepository';

interface CustomerLookupState {
  isLoading: boolean;
  error: string | null;
  foundCustomer: Customer | null;
  pointsRequired: number | null;
  lastVisit: string | null;
  isDrawerVisible: boolean;

  lookupByCardNumber: (rawInput: string) => Promise<void>;
  closeDrawer: () => void;
  reset: () => void;
}

export const useCustomerStore = create<CustomerLookupState>((set) => ({
  isLoading: false,
  error: null,
  foundCustomer: null,
  pointsRequired: null,
  lastVisit: null,
  isDrawerVisible: false,

  lookupByCardNumber: async (rawInput: string) => {
    const cardNumber = rawInput.trim();
    if (!cardNumber) {
      set({
        error: 'Enter a valid card ID.',
        foundCustomer: null,
        isDrawerVisible: false,
      });
      return;
    }
    set({ isLoading: true, error: null });
    try {
      const customer = await getCustomerByCardNumber(cardNumber);
      if (!customer) {
        set({
          isLoading: false,
          error: 'No customer found with that card number.',
          foundCustomer: null,
          isDrawerVisible: false,
        });
        return;
      }
      const [program, lastVisit] = await Promise.all([
        getLoyaltyProgram(),
        getLastVisitForCustomer(customer.id),
      ]);
      set({
        isLoading: false,
        error: null,
        foundCustomer: customer,
        pointsRequired: program?.points_required ?? null,
        lastVisit,
        isDrawerVisible: true,
      });
    } catch (err: any) {
      set({
        isLoading: false,
        error: err?.message ?? 'Lookup failed.',
        foundCustomer: null,
        isDrawerVisible: false,
      });
    }
  },

  closeDrawer: () => set({ isDrawerVisible: false }),

  reset: () =>
    set({
      foundCustomer: null,
      error: null,
      pointsRequired: null,
      lastVisit: null,
      isDrawerVisible: false,
    }),
}));