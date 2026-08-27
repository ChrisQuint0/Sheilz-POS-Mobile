import * as Crypto from 'expo-crypto';
import { getDB } from '../lib/db';
import type { Order, OrderStatus, CartItem } from '../store/usePOSStore';

export async function createOrder(
  cart: CartItem[],
  orderNumber: string,
  paymentMethod: string,
  cashierId: string | null,
  cashierName: string,
  customerName?: string,
  customerId?: number | null,
  isRedemption?: boolean,
  redeemedRewardId?: number | null,
  redeemedPointsRequired?: number | null,
  cashTendered: number = 0,
  changeAmount: number = 0,
): Promise<Order> {
  const db = await getDB();
  const id = Crypto.randomUUID();
  const totalAmount = cart.reduce((sum, c) => sum + c.unitPrice * c.quantity, 0);
  const timestamp = new Date().toISOString();
  const status: OrderStatus = 'Current';

  await db.withExclusiveTransactionAsync(async (txn) => {
    // Static column list — cash_tendered/change_amount are always written.
    // Migration v7 (2026-08-27) guarantees both columns exist on every
    // device; previously this checked PRAGMA table_info and silently
    // omitted the columns if missing, which is exactly what let a
    // migration collision hide a real ₱140/₱60 discrepancy without ever
    // throwing an error. If the columns are ever missing again for any
    // reason, this now fails loudly with a SQL error instead.
    await txn.runAsync(
      `INSERT INTO orders (id, order_number, customer_name, status, amount, payment_method, cashier_id, cashier_name, created_at, sync_status, customer_id, is_redemption, redeemed_reward_id, redeemed_points_required, cash_tendered, change_amount)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?, ?, ?)`,
      [
        id,
        orderNumber,
        customerName ?? 'Walk-In',
        status,
        totalAmount,
        paymentMethod,
        cashierId,
        cashierName,
        timestamp,
        customerId ?? null,
        isRedemption ? 1 : 0,
        redeemedRewardId ?? null,
        redeemedPointsRequired ?? null,
        cashTendered,
        changeAmount,
      ]
    );

    for (const c of cart) {
      const itemId = Crypto.randomUUID();
      await txn.runAsync(
        `INSERT INTO order_items (id, order_id, product_id, name, size, temperature, quantity, unit_price, subtotal, is_redemption, redeemed_discount)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          itemId,
          id,
          c.item.id,
          c.item.name,
          c.options?.size ?? null,
          c.options?.temp ?? null,
          c.quantity,
          c.unitPrice,
          c.unitPrice * c.quantity,
          c.isRedemption ? 1 : 0,
          c.redeemedDiscount ?? 0,
        ]
      );
    }
  });

  return {
    id,
    order_number: orderNumber,
    items: cart,
    totalAmount,
    paymentMethod,
    customerName: customerName || undefined,
    status,
    timestamp,
    cashTendered,
    changeAmount,
  };
}

export async function updateOrderStatus(orderId: string, status: OrderStatus): Promise<void> {
  const db = await getDB();
  await db.runAsync(
    `UPDATE orders SET status = ?, sync_status = 'pending' WHERE id = ?`,
    [status, orderId]
  );
}

export async function getOrderRedemptionMeta(orderId: string): Promise<{
  hasRedemption: boolean;
  redeemedCount: number;
  customerId: number | null;
  rewardId: number | null;
  pointsRequired: number | null;
} | null> {
  const db = await getDB();
  const order = await db.getFirstAsync<any>(
    `SELECT customer_id, redeemed_reward_id, redeemed_points_required FROM orders WHERE id = ?`,
    [orderId],
  );
  if (!order) return null;
  const countRow = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM order_items WHERE order_id = ? AND is_redemption = 1`,
    [orderId],
  );
  return {
    hasRedemption: (countRow?.count ?? 0) > 0,
    redeemedCount: countRow?.count ?? 0,
    customerId: order.customer_id,
    rewardId: order.redeemed_reward_id,
    pointsRequired: order.redeemed_points_required,
  };
}


export async function listOrders(): Promise<Order[]> {
  const db = await getDB();
  const orderRows = await db.getAllAsync<any>(`SELECT * FROM orders ORDER BY created_at DESC`);
  const itemRows = await db.getAllAsync<any>(`SELECT * FROM order_items`);
  return orderRows.map((o) => hydrateOrder(o, itemRows.filter((i) => i.order_id === o.id)));
}

export async function getOrder(orderId: string): Promise<Order | null> {
  const db = await getDB();
  const o = await db.getFirstAsync<any>(`SELECT * FROM orders WHERE id = ?`, [orderId]);
  if (!o) return null;
  const itemRows = await db.getAllAsync<any>(`SELECT * FROM order_items WHERE order_id = ?`, [orderId]);
  return hydrateOrder(o, itemRows);
}

function hydrateOrder(o: any, itemRows: any[]): Order {
  return {
    id: o.id,
    order_number: o.order_number,
    items: itemRows.map((i) => ({
      cartItemId: i.id,
      item: {
        id: i.product_id,
        name: i.name,
        category: '',
        category_id: '',
        type: '',
        price: i.unit_price,
        image: null,
        variants: [],
      },
      options: { size: i.size ?? undefined, temp: i.temperature ?? undefined },
      unitPrice: i.unit_price,
      quantity: i.quantity,
      isRedemption: !!i.is_redemption,
      redeemedDiscount: i.redeemed_discount || undefined,
    })),
    totalAmount: o.amount,
    paymentMethod: o.payment_method,
    customerName: o.customer_name === 'Walk-In' ? undefined : o.customer_name,
    status: o.status,
    timestamp: o.created_at,
    cashTendered: o.cash_tendered ?? 0,
    changeAmount: o.change_amount ?? 0,
  };
}