# Sheilz POS Mobile

The mobile Point-of-Sale (POS) application for Sheilz Coffee, providing a front-of-house terminal for cashiers. It is designed to handle dynamic product options, order processing, and ticket management with a beautiful, modern UI.

> **Note**: While the original `PRODUCT_SCOPE.md` mentions Flutter, this repository is built using **React Native** and **Expo v54**.

## Tech Stack

- **Framework**: React Native with Expo (v54)
- **Navigation**: React Navigation
- **State Management**: Zustand (Client-side memory mocking currently)
- **Styling**: Custom Theme System (`src/constants/theme.ts`)

---

## Backend Developer Integration Guide

This application currently operates purely on the client side using **Zustand** (`src/store/usePOSStore.ts`) to mock backend functionality. The following sections outline the precise data structures, business logic, and UI states that the eventual backend (Supabase/REST APIs) must support.

### 1. Data Models & Schemas

To map the UI to the database, the backend must implement the following core entities:

#### A. Menu Item (Products Table)
The base product catalog displayed in the POS grid.
```typescript
interface MenuItem {
  id: string; // e.g., "c1"
  name: string; // "Cafe Latte"
  category: string; // "Coffee", "Pastries", "Limited Time"
  price: number; // Base fallback price
  image: string; // Image URL
}
```

#### B. Product Configuration & Pricing Rules
Prices at Sheilz Coffee are highly dynamic based on size and temperature. The frontend maps this via `src/constants/pricing.ts`. 
**Backend Requirement**: The database needs a structured way to handle matrix pricing.
```typescript
type Size = '12oz' | '16oz' | 'One Size';
type Temp = 'Hot' | 'Cold' | 'None';

interface ProductConfig {
  sizes: Size[];
  temps: Temp[];
  prices: Record<Size, Partial<Record<Temp, number>>>;
  hasAddon?: { name: string; price: number }; // e.g., { name: 'Honey', price: 10 }
}
```
*Note: Limited Time items (Blueberry Series/Cloud Nine) are hard-locked to `Cold` for 12oz, but some 16oz sizes allow both Hot/Cold.*

#### C. Orders (Transactions Table)
When a user hits "Charge" and confirms payment, an `Order` object is generated.
```typescript
interface Order {
  id: string; // e.g., "20260620-001" (YYYYMMDD-SEQ)
  items: CartItem[]; // Array of order items
  totalAmount: number;
  paymentMethod: string; // "Cash", "BPI", "GCash", "Maya"
  customerName?: string; // Optional field for calling out orders
  status: OrderStatus;
  timestamp: string; // ISO String
}
```

#### D. Cart Items (Order Line Items Table)
Each item inside an order has specific configurations chosen by the cashier.
```typescript
interface CartItem {
  cartItemId: string; // Unique string to group identical configurations
  item: MenuItem; // Reference to the Product
  options?: {
    size?: Size;
    temp?: Temp;
    addon?: boolean;
  };
  unitPrice: number; // The dynamically calculated price at the time of order
  quantity: number;
}
```

### 2. Ticket Management & Voiding Logic

The `TicketsScreen` manages active and historical orders. The backend must track the `OrderStatus` strictly, particularly regarding **Voids and Inventory**.

```typescript
type OrderStatus = 'Current' | 'Completed' | 'Voided (Not Made)' | 'Voided (Consumed)';
```

**Backend Implications for Statuses:**
1. **`Current`**: Order is paid and queued in the kitchen.
2. **`Completed`**: Order is given to the customer.
3. **`Voided (Not Made)`**: The order was cancelled before the barista made it. **Do not subtract** raw ingredients from inventory.
4. **`Voided (Consumed)`**: The order was made incorrectly, or refunded after preparation. **You must subtract** raw ingredients from inventory because they were physically consumed.

### 3. API Endpoints / Supabase Sync Required

When integrating the backend, the following hooks/actions in `usePOSStore.ts` must be replaced with actual API calls or Supabase subscriptions:

- `fetchMenuItems()`: Pull the live product catalog and pricing matrix.
- `placeOrder(method, orderId, customerName)`: Insert a new record into `orders` and `order_items`.
- `updateOrderStatus(orderId, status)`: PATCH request to update the status of an order.
- **Realtime Sync**: The "Current" tickets tab requires real-time updates. If a Kitchen Display System (KDS) completes an order, this POS app must instantly move it from the `Current` tab to the `Completed` tab via Websockets/Supabase Realtime.

---

## Getting Started (Frontend Development)

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the Expo development server:
   ```bash
   npx expo start
   ```

### Running on a Physical Device (Expo Go)

1. Download the **Expo Go** app from the App Store (iOS) or Google Play Store (Android).
2. Ensure your phone and your development computer are connected to the same Wi-Fi network.
3. Start the development server (`npx expo start`).
4. A QR code will appear in your terminal.
5. **On Android**: Open the Expo Go app and tap "Scan QR Code".
   **On iOS**: Open your default Camera app, scan the QR code, and tap the prompt to open it in Expo Go.

## File Structure

```text
sheilz-pos-mobile/
├── src/                     # Main source code directory
│   ├── components/          # Reusable UI components
│   │   ├── pos/             # POS-specific components (Cart, Grid, Categories)
│   │   ├── tickets/         # Ticket carousel, Void modals
│   │   └── ui/              # Generic UI components (AppText, ConfirmModal)
│   ├── constants/           # App-wide constants (theme, data, pricing rules)
│   ├── navigation/          # React Navigation setup and route definitions
│   ├── screens/             # Full-screen components (POSScreen, TicketsScreen)
│   └── store/               # Zustand state management (usePOSStore.ts)
├── app.json                 # Expo configuration
└── package.json             # Project dependencies and scripts
```
