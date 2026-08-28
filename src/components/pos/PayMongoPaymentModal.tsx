import React, { useEffect, useRef, useState } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { WebView } from "react-native-webview";
import * as Crypto from "expo-crypto";
import { supabase } from "../../lib/supabase";
import {
  COLORS,
  TYPOGRAPHY,
  SPACING,
  BORDER_RADIUS,
} from "../../constants/theme";
import AppText from "../ui/AppText";

interface PayMongoPaymentModalProps {
  visible: boolean;
  totalAmount: number;
  onConfirm: (paymentDetail: { id: string; isPaid: true }) => void;
  onCancel: () => void;
}

// Rendered as its OWN full-screen Modal (not nested inside PaymentModal's
// small centered card) — a WebView needs real screen space, and nesting
// it inside PaymentModal's ScrollView caused a gesture conflict where the
// outer ScrollView intercepted touches before the WebView could use them,
// on top of being visually cramped into an ~85%-width, 480pt-tall box.
//
// Unlike Cash (which confirms synchronously — cashTendered/changeAmount
// are known the instant the cashier taps Confirm), PayMongo payment is
// asynchronous: the customer may take any amount of time to complete or
// abandon checkout. The order is NOT created in SQLite until payment is
// confirmed paid — onConfirm is only called after a genuine 'paid' status
// is seen. Cancelling at any point before that calls onCancel and creates
// nothing; the cart is left completely untouched (per Ipei's decision).
export default function PayMongoPaymentModal({
  visible,
  totalAmount,
  onConfirm,
  onCancel,
}: PayMongoPaymentModalProps) {
  const insets = useSafeAreaInsets();
  const [orderId, setOrderId] = useState(() => Crypto.randomUUID());
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isMountedRef = useRef(true);

  // Reset all local state whenever this modal is (re-)opened, so a second
  // PayMongo attempt in the same cashier session doesn't reuse a stale
  // orderId/checkoutUrl/error from a previous cancelled/failed attempt.
  useEffect(() => {
    if (!visible) return;

    isMountedRef.current = true;
    const freshOrderId = Crypto.randomUUID();
    setOrderId(freshOrderId);
    setCheckoutUrl(null);
    setError(null);
    setIsLoading(true);

    const createCheckout = async () => {
      try {
        const { data, error: fnError } = await supabase.functions.invoke(
          "paymongo-checkout",
          { body: { local_order_ref: freshOrderId, amount: totalAmount } },
        );
        if (fnError || !data?.checkout_url) {
          throw new Error(
            fnError?.message ?? "Failed to start PayMongo checkout.",
          );
        }
        if (!isMountedRef.current) return;
        setCheckoutUrl(data.checkout_url);
        setIsLoading(false);
        startPolling(freshOrderId);
      } catch (err) {
        if (!isMountedRef.current) return;
        setError(
          err instanceof Error
            ? err.message
            : "Failed to start PayMongo checkout.",
        );
        setIsLoading(false);
      }
    };

    const startPolling = (idToPoll: string) => {
      pollRef.current = setInterval(async () => {
        const { data } = await supabase
          .from("paymongo_payments")
          .select("status")
          .eq("local_order_ref", idToPoll)
          .maybeSingle();

        if (!isMountedRef.current) return;

        if (data?.status === "paid") {
          if (pollRef.current) clearInterval(pollRef.current);
          onConfirm({ id: idToPoll, isPaid: true });
        } else if (data?.status === "failed") {
          if (pollRef.current) clearInterval(pollRef.current);
          setError("Payment failed or was declined. You can try again.");
          setCheckoutUrl(null);
        }
      }, 3000);
    };

    createCheckout();

    return () => {
      isMountedRef.current = false;
      if (pollRef.current) clearInterval(pollRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const handleCancel = () => {
    if (pollRef.current) clearInterval(pollRef.current);
    onCancel();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleCancel}
    >
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleCancel} style={styles.cancelBtn}>
            <Ionicons name="close" size={22} color={COLORS.roseDeep} />
            <AppText style={styles.cancelBtnText}>Cancel Payment</AppText>
          </TouchableOpacity>
          <AppText style={styles.headerTitle}>PayMongo</AppText>
          <View style={styles.headerSpacer} />
        </View>

        {isLoading && (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <AppText style={styles.statusText}>
              Starting PayMongo checkout...
            </AppText>
          </View>
        )}

        {!isLoading && error && (
          <View style={styles.centered}>
            <Ionicons
              name="alert-circle-outline"
              size={40}
              color={COLORS.roseDeep}
            />
            <AppText style={styles.errorText}>{error}</AppText>
            <TouchableOpacity style={styles.retryBtn} onPress={handleCancel}>
              <AppText style={styles.retryBtnText}>
                Back to Payment Methods
              </AppText>
            </TouchableOpacity>
          </View>
        )}

        {!isLoading && !error && checkoutUrl && (
          <WebView
            source={{ uri: checkoutUrl }}
            style={styles.webview}
            startInLoadingState
            renderLoading={() => (
              <View style={styles.webviewLoading}>
                <ActivityIndicator size="large" color={COLORS.primary} />
              </View>
            )}
          />
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.stone200,
    backgroundColor: COLORS.surface,
  },
  cancelBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: SPACING.xs,
    paddingRight: SPACING.sm,
  },
  cancelBtnText: {
    color: COLORS.roseDeep,
    fontWeight: TYPOGRAPHY.weights.semibold,
    fontSize: TYPOGRAPHY.sizes.sm,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.espresso,
  },
  // Balances the cancel button's width so the title stays visually
  // centered — same fixed-width-spacer trick already used in
  // PaymentModal.tsx's own header (styles.spacer).
  headerSpacer: {
    width: 110,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: SPACING.xl,
  },
  statusText: {
    marginTop: SPACING.md,
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textLight,
  },
  errorText: {
    marginTop: SPACING.md,
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.roseDeep,
    textAlign: "center",
  },
  retryBtn: {
    marginTop: SPACING.xl,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
  },
  retryBtnText: {
    color: COLORS.surface,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  webview: {
    flex: 1,
  },
  webviewLoading: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.background,
  },
});
