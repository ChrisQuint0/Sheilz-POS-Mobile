import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePOSStore } from '../../store/usePOSStore';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../../constants/theme';
import AppText from '../ui/AppText';

interface CartSummaryProps {
  onChargeComplete?: () => void;
}

export default function CartSummary({ onChargeComplete }: CartSummaryProps) {
  const { cart, addToCart, decrementCartItem, removeFromCart, clearCart, generateOrderNumber } = usePOSStore();
  const [orderNumber, setOrderNumber] = useState('');

  // Generate order number when cart becomes non-empty
  useEffect(() => {
    if (cart.length > 0 && !orderNumber) {
      setOrderNumber(generateOrderNumber());
    } else if (cart.length === 0) {
      setOrderNumber(''); // Clear when cart is emptied manually
    }
  }, [cart.length, orderNumber, generateOrderNumber]);

  const cartTotal = cart.reduce((sum, c) => sum + c.item.price * c.quantity, 0);

  const handleCharge = () => {
    // Process payment logic here later
    clearCart();
    setOrderNumber('');
    if (onChargeComplete) {
      onChargeComplete();
    }
    // Could show a success toast here
  };

  return (
    <View style={styles.cartContainer}>
      <View style={styles.headerRow}>
        <AppText style={styles.cartHeader}>Current Order</AppText>
        {orderNumber ? (
          <AppText style={styles.orderNumber}>#{orderNumber}</AppText>
        ) : null}
      </View>

      <FlatList
        data={cart}
        contentContainerStyle={{ paddingHorizontal: SPACING.lg }}
        showsVerticalScrollIndicator={true}
        keyExtractor={(item) => item.item.id}
        renderItem={({ item }) => (
          <View style={styles.cartItem}>
            <View style={styles.cartItemMain}>
              <AppText style={styles.cartItemName}>{item.item.name}</AppText>
              <AppText style={styles.cartItemPrice}>
                ₱{(item.item.price * item.quantity).toFixed(2)}
              </AppText>
            </View>

            <View style={styles.cartItemActions}>
              <TouchableOpacity onPress={() => decrementCartItem(item.item.id)} style={styles.actionBtn}>
                <Ionicons name="remove" size={18} color={COLORS.textLight} />
              </TouchableOpacity>
              <AppText style={styles.cartItemQty}>{item.quantity}</AppText>
              <TouchableOpacity onPress={() => addToCart(item.item)} style={styles.actionBtn}>
                <Ionicons name="add" size={18} color={COLORS.textLight} />
              </TouchableOpacity>
              
              <TouchableOpacity 
                onPress={() => removeFromCart(item.item.id)} 
                style={[styles.actionBtn, styles.deleteBtn]}
              >
                <Ionicons name="trash-outline" size={18} color={COLORS.roseDeep} />
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="cart-outline" size={64} color={COLORS.stone200} />
            <AppText style={styles.emptyCartText}>Your cart is empty</AppText>
            <AppText style={styles.emptyCartSub}>Add items from the menu to start an order.</AppText>
          </View>
        }
      />

      <View style={styles.cartFooter}>
        <View style={styles.cartTotalRow}>
          <AppText style={styles.cartTotalLabel}>Total</AppText>
          <AppText style={styles.cartTotalValue}>₱{cartTotal.toFixed(2)}</AppText>
        </View>
        <TouchableOpacity
          style={[
            styles.chargeButton,
            cart.length === 0 && styles.chargeButtonDisabled,
          ]}
          disabled={cart.length === 0}
          onPress={handleCharge}
        >
          <AppText style={styles.chargeButtonText}>
            Charge ₱{cartTotal.toFixed(2)}
          </AppText>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cartContainer: { 
    flex: 1, 
    backgroundColor: COLORS.surface,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
  },
  cartHeader: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.espresso,
  },
  orderNumber: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.stone400,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
  },
  emptyCartText: { 
    textAlign: "center", 
    color: COLORS.textLight, 
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.medium,
    marginTop: SPACING.md,
  },
  emptyCartSub: {
    textAlign: "center", 
    color: COLORS.stone400, 
    fontSize: TYPOGRAPHY.sizes.sm,
    marginTop: SPACING.sm,
  },
  cartItem: {
    flexDirection: "column",
    justifyContent: "space-between",
    marginBottom: SPACING.md,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.stone100,
  },
  cartItemMain: { 
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  cartItemName: { 
    fontSize: TYPOGRAPHY.sizes.md, 
    fontWeight: TYPOGRAPHY.weights.medium, 
    color: COLORS.text,
    flex: 1,
  },
  cartItemPrice: { 
    fontSize: TYPOGRAPHY.sizes.md, 
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.roseDeep,
  },
  cartItemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  actionBtn: {
    width: 32,
    height: 32,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.stone200,
  },
  deleteBtn: {
    marginLeft: 'auto',
    backgroundColor: COLORS.roseBlushSoft,
    borderColor: COLORS.roseBlush,
  },
  cartItemQty: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.text,
    width: 36,
    textAlign: 'center',
  },
  cartFooter: {
    paddingTop: SPACING.md,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.lg,
    marginTop: "auto",
  },
  cartTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: SPACING.md,
  },
  cartTotalLabel: { 
    fontSize: TYPOGRAPHY.sizes.lg, 
    fontWeight: TYPOGRAPHY.weights.semibold, 
    color: COLORS.textLight 
  },
  cartTotalValue: { 
    fontSize: TYPOGRAPHY.sizes.xxl, 
    fontWeight: "bold", 
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
    color: COLORS.espresso 
  },
  chargeButton: {
    backgroundColor: COLORS.primary,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: "center",
  },
  chargeButtonDisabled: { 
    backgroundColor: COLORS.stone300 
  },
  chargeButtonText: { 
    color: COLORS.surface, 
    fontSize: TYPOGRAPHY.sizes.lg, 
    fontWeight: TYPOGRAPHY.weights.bold 
  },
});
