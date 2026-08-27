import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Platform,
  Alert,
  Switch,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  getCartTotal,
  getDiscountedUnitPrice,
  usePOSStore,
  PaymentMethod,
} from "../../store/usePOSStore";
import { useSyncStore } from "../../store/useSyncStore";
import {
  COLORS,
  TYPOGRAPHY,
  SPACING,
  BORDER_RADIUS,
} from "../../constants/theme";
import AppText from "../ui/AppText";
import PaymentModal from "./PaymentModal";
import ConfirmModal from "../ui/ConfirmModal";
import {
  canRedeemAnotherLine,
  isLineEligibleForReward,
} from "../../services/loyaltyService";

interface CartSummaryProps {
  onChargeComplete?: () => void;
  onClearComplete?: () => void;
  paymentMethods: PaymentMethod[];
}

export default function CartSummary({
  onChargeComplete,
  onClearComplete,
  paymentMethods,
}: CartSummaryProps) {
  const {
    cart,
    addToCart,
    decrementCartItem,
    removeFromCart,
    clearCart,
    placeOrder,
    generateOrderNumber,
    activeCustomer,
    activeReward,
    hydrateActiveReward,
    redeemCartLine,
    undoRedemption,
    pwdSeniorDiscountEnabled,
    setPwdSeniorDiscountEnabled,
  } = usePOSStore();
  const isNetworkConnected = useSyncStore((s) => s.isNetworkConnected);
  const [orderNumber, setOrderNumber] = useState("");
  const [isPaymentModalVisible, setIsPaymentModalVisible] = useState(false);
  const [isClearModalVisible, setIsClearModalVisible] = useState(false);

  // Generate order number when cart becomes non-empty
  useEffect(() => {
    if (cart.length > 0 && !orderNumber) {
      setOrderNumber(generateOrderNumber());
    } else if (cart.length === 0) {
      setOrderNumber(""); // Clear when cart is emptied manually
    }
  }, [cart.length, orderNumber, generateOrderNumber]);

  useEffect(() => {
    hydrateActiveReward();
  }, [hydrateActiveReward]);

  const cartTotal = getCartTotal(cart, pwdSeniorDiscountEnabled);

  const handleChargeClick = () => {
    setIsPaymentModalVisible(true);
  };

  const handlePaymentConfirm = async (
    method: string,
    customerName?: string,
    paymentDetail?: { cashTendered: number; changeAmount: number },
  ) => {
    setIsPaymentModalVisible(false);

    try {
      await placeOrder(method, orderNumber, customerName, paymentDetail);
    } catch (err) {
      console.error("Failed to place order:", err);
      Alert.alert(
        "Could not complete order",
        err instanceof Error ? err.message : "Failed to place order. Please try again.",
      );
      return;
    }

    setOrderNumber("");
    if (onChargeComplete) {
      onChargeComplete();
    }
  };

  return (
    <View style={styles.cartContainer}>
      <View style={styles.headerRow}>
        <View style={styles.headerTitles}>
          <AppText style={styles.cartHeader}>Current Order</AppText>
          {orderNumber ? (
            <AppText style={styles.orderNumber}>#{orderNumber}</AppText>
          ) : null}
        </View>

        {cart.length > 0 && (
          <TouchableOpacity
            onPress={() => setIsClearModalVisible(true)}
            style={styles.clearBtn}
          >
            <Ionicons name="trash-outline" size={16} color={COLORS.roseDeep} />
            <AppText style={styles.clearBtnText}>Clear All</AppText>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={cart}
        contentContainerStyle={{ paddingHorizontal: SPACING.lg }}
        showsVerticalScrollIndicator={true}
        keyExtractor={(item) => item.cartItemId}
        renderItem={({ item }) => {
          const eligibleForReward =
            !item.isRedemption &&
            activeCustomer &&
            activeReward &&
            isLineEligibleForReward(item.item, activeReward) &&
            canRedeemAnotherLine(activeCustomer.loyalty_progress, cart, activeReward);
          const canRedeemThisLine = eligibleForReward && isNetworkConnected;
          const blockedByOffline = eligibleForReward && !isNetworkConnected;

          return (
            <View style={styles.cartItem}>
              <View style={styles.cartItemMain}>
                <View style={styles.cartItemTitleArea}>
                  <AppText style={styles.cartItemName}>{item.item.name}</AppText>
                  {item.options && (
                    <AppText style={styles.cartItemOptions}>
                      {[
                        item.options.size !== "One Size" ? item.options.size : null,
                        item.options.temp !== "None" ? item.options.temp : null,
                        item.options.addon ? "Honey" : null,
                      ].filter(Boolean).join(" • ")}
                    </AppText>
                  )}
                  {item.isRedemption && (
                    <View style={styles.redeemedBadge}>
                      <Ionicons name="gift" size={12} color={COLORS.primary} />
                      <AppText style={styles.redeemedBadgeText}>
                        {item.redeemedDiscount
                          ? `-₱${item.redeemedDiscount.toFixed(2)} REWARD`
                          : "FREE • REWARD"}
                      </AppText>
                    </View>
                  )}
                </View>
                <AppText style={styles.cartItemPrice}>
                  ₱{(
                    getDiscountedUnitPrice(item, pwdSeniorDiscountEnabled) * item.quantity
                  ).toFixed(2)}
                </AppText>
              </View>

              {item.isRedemption ? (
                <TouchableOpacity
                  onPress={() => undoRedemption(item.cartItemId)}
                  style={styles.undoRedeemBtn}
                >
                  <AppText style={styles.undoRedeemBtnText}>Undo reward</AppText>
                </TouchableOpacity>
              ) : (
                <>
                  {canRedeemThisLine && (
                    <TouchableOpacity
                      onPress={() => redeemCartLine(item.cartItemId)}
                      style={styles.redeemBtn}
                    >
                      <Ionicons name="gift-outline" size={14} color={COLORS.primary} />
                      <AppText style={styles.redeemBtnText}>
                        Redeem {activeReward?.reward_type}
                      </AppText>
                    </TouchableOpacity>
                  )}
                  {blockedByOffline && (
                    <View style={styles.redeemOfflineNotice}>
                      <Ionicons name="cloud-offline-outline" size={14} color={COLORS.textLight} />
                      <AppText style={styles.redeemOfflineText}>
                        Connect to the internet to redeem
                      </AppText>
                    </View>
                  )}
                  <View style={styles.cartItemActions}>
                    <TouchableOpacity
                      onPress={() => decrementCartItem(item.cartItemId)}
                      style={styles.actionBtn}
                    >
                      <Ionicons name="remove" size={18} color={COLORS.textLight} />
                    </TouchableOpacity>
                    <AppText style={styles.cartItemQty}>{item.quantity}</AppText>
                    <TouchableOpacity
                      onPress={() => addToCart(item.item, item.options, item.unitPrice)}
                      style={styles.actionBtn}
                    >
                      <Ionicons name="add" size={18} color={COLORS.textLight} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => removeFromCart(item.cartItemId)}
                      style={[styles.actionBtn, styles.deleteBtn]}
                    >
                      <Ionicons name="trash-outline" size={18} color={COLORS.roseDeep} />
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="cart-outline" size={64} color={COLORS.stone200} />
            <AppText style={styles.emptyCartText}>Your cart is empty</AppText>
            <AppText style={styles.emptyCartSub}>
              Add items from the menu to start an order.
            </AppText>
          </View>
        }
      />

      <View style={styles.cartFooter}>
        <View style={styles.discountRow}>
          <View style={styles.discountLabelArea}>
            <AppText style={styles.discountLabel}>PWD/Senior Discount</AppText>
            <AppText style={styles.discountHint}>20% off eligible items</AppText>
          </View>
          <Switch
            value={pwdSeniorDiscountEnabled}
            onValueChange={setPwdSeniorDiscountEnabled}
            disabled={cart.length === 0}
            trackColor={{ false: COLORS.stone200, true: COLORS.roseBlush }}
            thumbColor={
              pwdSeniorDiscountEnabled ? COLORS.primary : COLORS.stone100
            }
          />
        </View>
        <View style={styles.cartTotalRow}>
          <AppText style={styles.cartTotalLabel}>Total</AppText>
          <AppText style={styles.cartTotalValue}>
            ₱{cartTotal.toFixed(2)}
          </AppText>
        </View>
        <TouchableOpacity
          style={[
            styles.chargeButton,
            cart.length === 0 && styles.chargeButtonDisabled,
          ]}
          disabled={cart.length === 0}
          onPress={handleChargeClick}
        >
          <AppText style={styles.chargeButtonText}>
            Charge ₱{cartTotal.toFixed(2)}
          </AppText>
        </TouchableOpacity>
      </View>

      <PaymentModal
        visible={isPaymentModalVisible}
        totalAmount={cartTotal}
        paymentMethods={paymentMethods}
        onClose={() => setIsPaymentModalVisible(false)}
        onConfirm={handlePaymentConfirm}
      />

      <ConfirmModal
        visible={isClearModalVisible}
        title="Clear Entire Order?"
        message="Are you sure you want to remove all items from the current order? This action cannot be undone."
        confirmText="Clear Order"
        onCancel={() => setIsClearModalVisible(false)}
        onConfirm={() => {
          clearCart();
          setIsClearModalVisible(false);
          if (onClearComplete) {
            onClearComplete();
          }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  cartContainer: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
  },
  headerTitles: {
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 2,
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
  clearBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: COLORS.roseBlushSoft,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    borderRadius: BORDER_RADIUS.sm,
  },
  clearBtnText: {
    fontSize: TYPOGRAPHY.sizes.xs,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.roseDeep,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
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
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: SPACING.sm,
    alignItems: "flex-start",
  },
  cartItemTitleArea: {
    flex: 1,
    paddingRight: SPACING.sm,
  },
  cartItemName: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.text,
  },
  cartItemOptions: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textLight,
    marginTop: 2,
  },
  cartItemPrice: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.roseDeep,
  },
  redeemedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
    alignSelf: "flex-start",
    backgroundColor: COLORS.roseBlushSoft,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
  },
  redeemedBadgeText: {
    fontSize: 10,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.primary,
  },
  redeemBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: COLORS.primary,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.sm,
    marginBottom: SPACING.sm,
  },
  redeemBtnText: {
    fontSize: TYPOGRAPHY.sizes.xs,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.primary,
  },
  redeemOfflineNotice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
    marginBottom: SPACING.sm,
  },
  redeemOfflineText: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textLight,
    fontStyle: "italic",
  },
  undoRedeemBtn: {
    alignSelf: "flex-start",
    marginBottom: SPACING.sm,
  },
  undoRedeemBtnText: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textLight,
    textDecorationLine: "underline",
  },
  cartItemActions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
  },
  actionBtn: {
    width: 32,
    height: 32,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.background,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.stone200,
  },
  deleteBtn: {
    marginLeft: "auto",
    backgroundColor: COLORS.roseBlushSoft,
    borderColor: COLORS.roseBlush,
  },
  cartItemQty: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.text,
    width: 36,
    textAlign: "center",
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
  discountRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.md,
    paddingVertical: SPACING.xs,
  },
  discountLabelArea: {
    flex: 1,
  },
  discountLabel: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.text,
  },
  discountHint: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textLight,
    marginTop: 2,
  },
  cartTotalLabel: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textLight,
  },
  cartTotalValue: {
    fontSize: TYPOGRAPHY.sizes.xxl,
    fontWeight: "bold",
    fontFamily: Platform.select({ ios: "Georgia", android: "serif" }),
    color: COLORS.espresso,
  },
  chargeButton: {
    backgroundColor: COLORS.primary,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: "center",
  },
  chargeButtonDisabled: {
    backgroundColor: COLORS.stone300,
  },
  chargeButtonText: {
    color: COLORS.surface,
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
});
