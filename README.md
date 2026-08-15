# ☕ Sheilz POS Mobile

<p align="center">
  <strong>Mobile Point-of-Sale application for Sheilz Coffee</strong><br>
  Front-of-house terminal for cashier operations, order processing, and ticket management.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React_Native-0.81-61DAFB?style=for-the-badge&logo=react&logoColor=white" alt="React Native">
  <img src="https://img.shields.io/badge/Expo-54-000020?style=for-the-badge&logo=expo&logoColor=white" alt="Expo">
  <img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/Zustand-5.x-443E38?style=for-the-badge&logo=react&logoColor=white" alt="Zustand">
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Status-In%20Development-yellow?style=flat-square" alt="Status">
  <img src="https://img.shields.io/badge/Platform-iOS%20%7C%20Android-blue?style=flat-square" alt="Platform">
  <img src="https://img.shields.io/badge/Backend-Pending-lightgrey?style=flat-square" alt="Backend">
</p>

---

## 📖 Overview

**Sheilz POS Mobile** is the front-of-house mobile Point-of-Sale application for **Sheilz Coffee**. It provides cashiers with a streamlined interface for browsing products, configuring orders, processing payments, and managing active and completed tickets.

The current implementation is **frontend-only** and uses **Zustand** for local state and mock data. Backend integration with Supabase/REST APIs will replace the mocked functionality in the production implementation.

---

## ✨ Features

* 🛒 **Product Catalog** — Browse beverages and pastries by category.
* ⚙️ **Dynamic Product Configuration** — Select size, temperature, and available add-ons.
* 💰 **Dynamic Pricing** — Calculate prices based on product configuration.
* 🧾 **Order Processing** — Build carts and process customer orders.
* 💳 **Multiple Payment Methods** — Support for Cash, BPI, GCash, and Maya.
* 🎫 **Ticket Management** — View current, completed, and voided orders.
* 🚫 **Void Management** — Distinguish between orders that were not made and orders where ingredients were consumed.
* 📱 **Responsive Mobile UI** — Optimized for cashier-facing POS workflows.
* 🔄 **Realtime Backend Ready** — Designed for future Supabase Realtime synchronization with kitchen operations.

---

## 🛠️ Tech Stack

| Technology              | Purpose                                  |
| ----------------------- | ---------------------------------------- |
| **React Native**        | Mobile application framework             |
| **Expo 54**             | Development and application runtime      |
| **TypeScript**          | Type-safe application development        |
| **React Navigation**    | Screen navigation                        |
| **Zustand**             | Client-side state management             |
| **Custom Theme System** | Centralized UI styling and design tokens |
| **Supabase / REST API** | Planned backend integration              |

---

## 🏗️ Architecture

The application is currently structured around a simple frontend architecture:

```text
sheilz-pos-mobile/
├── src/
│   ├── components/
│   │   ├── pos/             # Cart, product grid, categories
│   │   ├── tickets/         # Ticket carousel and void modals
│   │   └── ui/              # Reusable UI components
│   ├── constants/
│   │   ├── theme.ts         # Application theme
│   │   ├── data.ts          # Mock product data
│   │   └── pricing.ts       # Product pricing rules
│   ├── navigation/          # React Navigation configuration
│   ├── screens/
│   │   ├── POSScreen        # Main POS interface
│   │   └── TicketsScreen    # Order and ticket management
│   └── store/
│       └── usePOSStore.ts   # Zustand POS state
├── app.json
└── package.json
```

---

# 🔌 Backend Integration Guide

> **Current status:** The application currently operates using mocked client-side data through Zustand. The following specifications define what the backend implementation must support.

## 1. Data Models

### Product

The product catalog should provide the information required by the POS grid.

```typescript
interface MenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
  image: string;
}
```

### Product Configuration & Pricing

Product pricing depends on size and temperature.

```typescript
type Size = '12oz' | '16oz' | 'One Size';
type Temp = 'Hot' | 'Cold' | 'None';

interface ProductConfig {
  sizes: Size[];
  temps: Temp[];
  prices: Record<Size, Partial<Record<Temp, number>>>;
  hasAddon?: {
    name: string;
    price: number;
  };
}
```

> **Note:** Limited-time products such as the Blueberry Series and Cloud Nine have specific size and temperature restrictions that must be respected by the backend.

### Orders

An order is created when the cashier confirms payment.

```typescript
interface Order {
  id: string;
  items: CartItem[];
  totalAmount: number;
  paymentMethod: string;
  customerName?: string;
  status: OrderStatus;
  timestamp: string;
}
```

### Order Items

Each order item stores the exact configuration and price selected at checkout.

```typescript
interface CartItem {
  cartItemId: string;
  item: MenuItem;
  options?: {
    size?: Size;
    temp?: Temp;
    addon?: boolean;
  };
  unitPrice: number;
  quantity: number;
}
```

---

## 2. Ticket & Void Management

Orders use the following statuses:

```typescript
type OrderStatus =
  | 'Current'
  | 'Completed'
  | 'Voided (Not Made)'
  | 'Voided (Consumed)';
```

| Status              | Description                                        | Inventory Deduction    |
| ------------------- | -------------------------------------------------- | ---------------------- |
| `Current`           | Paid order waiting to be prepared                  | Depends on preparation |
| `Completed`         | Order has been given to the customer               | Yes                    |
| `Voided (Not Made)` | Cancelled before preparation                       | ❌ No                   |
| `Voided (Consumed)` | Prepared incorrectly or refunded after preparation | ✅ Yes                  |

### Important Business Rule

**Voided orders must not all be treated the same.**

If an order is voided before preparation, ingredients must remain in inventory. If the order was already prepared and ingredients were physically consumed, the inventory deduction must be retained.

---

## 3. Backend Synchronization

The following frontend actions currently use mocked Zustand logic and will eventually require backend integration:

| Frontend Action           | Backend Operation              |
| ------------------------- | ------------------------------ |
| `fetchMenuItems()`        | Retrieve products and pricing  |
| `placeOrder()`            | Insert order and order items   |
| `updateOrderStatus()`     | Update transaction status      |
| Current ticket monitoring | Supabase Realtime subscription |

### Realtime Ticket Updates

The **Current** tickets screen should receive real-time updates when connected to the backend.

For example:

```text
Cashier creates order
       ↓
    Supabase
       ↓
Kitchen Display System
       ↓
Order completed
       ↓
Supabase Realtime
       ↓
POS Mobile updates ticket
```

This allows the cashier interface to automatically move an order from **Current** to **Completed** without manually refreshing the application.

---

# 🚀 Getting Started

## Prerequisites

Make sure you have:

* Node.js installed
* npm installed
* Expo-compatible development environment
* Expo Go installed on a physical device, if testing on mobile

## Installation

Clone the repository and install dependencies:

```bash
npm install
```

## Start Development Server

```bash
npx expo start
```

Expo will display a QR code that can be used to launch the application on a connected device.

---

## 📱 Running on a Physical Device

### Android

1. Install **Expo Go** from Google Play.
2. Connect your phone and development computer to the same Wi-Fi network.
3. Run:

```bash
npx expo start
```

4. Open Expo Go and scan the QR code.

### iOS

1. Install **Expo Go** from the App Store.
2. Connect your phone and development computer to the same Wi-Fi network.
3. Run:

```bash
npx expo start
```

4. Use the iOS Camera app to scan the QR code.
5. Open the project using Expo Go.

---

## 📂 Project Structure

```text
sheilz-pos-mobile/
│
├── src/
│   ├── components/
│   │   ├── pos/             # POS components
│   │   ├── tickets/         # Ticket management components
│   │   └── ui/              # Reusable UI components
│   │
│   ├── constants/
│   │   ├── theme.ts         # Design system
│   │   ├── data.ts          # Mock data
│   │   └── pricing.ts       # Pricing configuration
│   │
│   ├── navigation/          # Navigation configuration
│   ├── screens/             # Application screens
│   └── store/
│       └── usePOSStore.ts   # Zustand store
│
├── app.json                 # Expo configuration
├── package.json             # Dependencies and scripts
└── README.md
```
---

<p align="center">
  Built for <strong>Sheilz Coffee</strong> ☕
</p>
