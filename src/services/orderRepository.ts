import * as Crypto from 'expo-crypto';
import { getDB } from '../lib/db';
import type { Order, OrderStatus, CartItem, OrderType } from '../store/usePOSStore';

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
  id: string = Crypto.randomUUID(),
  isPaid: boolean = false,
  orderType: 'Dine-In' | 'Take-Out' = 'Take-Out', // NEW — trailing, matches usePOSStore call
): Promise<Order> {
  const db = await getDB();
  const totalAmount = cart.reduce((sum, c) => sum + c.unitPrice * c.quantity, 0);
  const timestamp = new Date().toISOString();
  const status: OrderStatus = 'Current';

  await db.withExclusiveTransactionAsync(async (txn) => {
    await txn.runAsync(
      `INSERT INTO orders (id, order_number, customer_name, status, amount, payment_method, cashier_id, cashier_name, created_at, sync_status, customer_id, is_redemption, redeemed_reward_id, redeemed_points_required, cash_tendered, change_amount, is_paid, order_type)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?, ?, ?, ?, ?)`,
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
        isPaid ? 1 : 0,
        orderType, // NEW
      ]
    );

    for (const c of cart) {
      const itemId = Crypto.randomUUID();
      await txn.runAsync(
        `INSERT INTO order_items (id, order_id, product_id, name, size, temperature, quantity, unit_price, subtotal, is_redemption, redeemed_discount, uses_packaging)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
          c.usesPackaging === false ? 0 : 1, // NEW — defaults to 1 (packaging) if undefined
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
    isPaid,
    orderType, // NEW
  };
}
// Called from usePOSStore.updateOrderStatus when transitioning an order to
// 'Completed', to determine whether the redemption-finalization path
// (immediate sync + loyalty_log write) is needed, and with which frozen
// reward/points values (see v7 migration note).
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
    [orderId]
  );
  if (!order) return null;
  const countRow = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM order_items WHERE order_id = ? AND is_redemption = 1`,
    [orderId]
  );
  const redeemedCount = countRow?.count ?? 0;
  return {
    hasRedemption: redeemedCount > 0,
    redeemedCount,
    customerId: order.customer_id,
    rewardId: order.redeemed_reward_id,
    pointsRequired: order.redeemed_points_required,
  };
}

export async function updateOrderStatus(orderId: string, status: OrderStatus): Promise<void> {
  const db = await getDB();
  await db.runAsync(
    status === 'Completed'
      ? `UPDATE orders SET status = ?, is_paid = 1, sync_status = 'pending' WHERE id = ?`
      : `UPDATE orders SET status = ?, sync_status = 'pending' WHERE id = ?`,
    [status, orderId],
  );
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
      usesPackaging: !!i.uses_packaging, // NEW
    })),
    totalAmount: o.amount,
    paymentMethod: o.payment_method,
    customerName: o.customer_name === 'Walk-In' ? undefined : o.customer_name,
    status: o.status,
    timestamp: o.created_at,
    cashTendered: o.cash_tendered ?? 0,
    changeAmount: o.change_amount ?? 0,
    isPaid: !!o.is_paid,
    orderType: o.order_type ?? 'Take-Out', // NEW
  };
}