import React, { useMemo, useState } from "react";
import { View, StyleSheet, TextInput, TouchableOpacity } from "react-native";
import {
  COLORS,
  TYPOGRAPHY,
  SPACING,
  BORDER_RADIUS,
} from "../../constants/theme";
import AppText from "../ui/AppText";

interface CashPaymentModalProps {
  totalAmount: number;
  onConfirm: (cashTendered: number, changeAmount: number) => void;
}

// Rendered by PaymentModal in place of the generic confirm view when the
// selected method is "Cash". Kept as its own component (rather than an
// inline branch) so a future PayMongo step is "add another component to
// the map," not "add another if-branch to PaymentModal."
export default function CashPaymentModal({
  totalAmount,
  onConfirm,
}: CashPaymentModalProps) {
  const [cashInput, setCashInput] = useState("");

  const cashReceived = parseFloat(cashInput);
  const hasValidInput = cashInput.length > 0 && !Number.isNaN(cashReceived);
  const changeAmount = useMemo(
    () => (hasValidInput ? cashReceived - totalAmount : 0),
    [hasValidInput, cashReceived, totalAmount],
  );
  const isInsufficient = hasValidInput && changeAmount < 0;
  const canConfirm = hasValidInput && changeAmount >= 0;

  const handleConfirm = () => {
    if (!canConfirm) return;
    onConfirm(cashReceived, changeAmount);
  };

  return (
    <View style={styles.container}>
      <AppText style={styles.label}>Cash Received</AppText>
      <TextInput
        style={styles.input}
        placeholder="0.00"
        placeholderTextColor={COLORS.textLight}
        keyboardType="decimal-pad"
        value={cashInput}
        onChangeText={setCashInput}
        autoFocus
      />

      <View style={styles.changeRow}>
        <AppText style={styles.changeLabel}>Change</AppText>
        <AppText
          style={[styles.changeValue, isInsufficient && styles.changeValueBad]}
        >
          ₱{(hasValidInput ? Math.abs(changeAmount) : 0).toFixed(2)}
        </AppText>
      </View>

      {isInsufficient && (
        <AppText style={styles.insufficientText}>
          Insufficient amount — cash received is less than the total due.
        </AppText>
      )}

      <TouchableOpacity
        style={[styles.confirmBtn, !canConfirm && styles.confirmBtnDisabled]}
        onPress={handleConfirm}
        disabled={!canConfirm}
      >
        <AppText style={styles.confirmBtnText}>
          Confirm ₱{totalAmount.toFixed(2)}
        </AppText>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    alignItems: "center",
    paddingTop: SPACING.md,
  },
  label: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textLight,
    marginBottom: SPACING.xs,
  },
  input: {
    width: "100%",
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.stone200,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: "bold",
    color: COLORS.espresso,
    textAlign: "center",
    marginBottom: SPACING.lg,
  },
  changeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    backgroundColor: COLORS.roseBlushSoft,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.md,
  },
  changeLabel: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.text,
  },
  changeValue: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: "bold",
    color: COLORS.primary,
  },
  changeValueBad: {
    color: COLORS.roseDeep,
  },
  insufficientText: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.roseDeep,
    textAlign: "center",
    marginBottom: SPACING.md,
  },
  confirmBtn: {
    backgroundColor: COLORS.primary,
    width: "100%",
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: "center",
    marginTop: SPACING.sm,
  },
  confirmBtnDisabled: {
    backgroundColor: COLORS.stone300,
  },
  confirmBtnText: {
    color: COLORS.surface,
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
});
