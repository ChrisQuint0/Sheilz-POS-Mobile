import React, { useState } from "react";
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Platform,
  Image,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  COLORS,
  TYPOGRAPHY,
  SPACING,
  BORDER_RADIUS,
} from "../../constants/theme";
import AppText from "../ui/AppText";
import { PaymentMethod } from "../../store/usePOSStore";

// Visual presentation lookup for fetched payment methods. The `payment_methods`
// table has no `image_url` column, so we keep a name -> asset/icon map locally
// and fall back to a cash icon for anything unmatched.
const METHOD_PRESENTATION: Record<string, { icon: string | null; image: any }> =
  {
    Cash: { icon: "cash-outline", image: null },
    GCash: { icon: null, image: require("../../../assets/gcash.png") },
    Gcash: { icon: null, image: require("../../../assets/gcash.png") },
    BPI: { icon: null, image: require("../../../assets/bpi.png") },
    Maya: { icon: null, image: require("../../../assets/maya.png") },
  };

const DEFAULT_PRESENTATION = { icon: "cash-outline", image: null };

interface PaymentModalProps {
  visible: boolean;
  totalAmount: number;
  paymentMethods: PaymentMethod[];
  onClose: () => void;
  onConfirm: (method: string, customerName?: string) => void;
}

export default function PaymentModal({
  visible,
  totalAmount,
  paymentMethods,
  onClose,
  onConfirm,
}: PaymentModalProps) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(
    null,
  );
  const [customerName, setCustomerName] = useState("");

  const handleClose = () => {
    setSelectedMethod(null);
    setCustomerName("");
    onClose();
  };

  const handleConfirm = () => {
    if (selectedMethod) {
      onConfirm(selectedMethod.name, customerName.trim());
      setSelectedMethod(null);
      setCustomerName("");
    }
  };

  const getPresentation = (name: string) =>
    METHOD_PRESENTATION[name] ?? DEFAULT_PRESENTATION;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            {selectedMethod ? (
              <TouchableOpacity
                onPress={() => setSelectedMethod(null)}
                style={styles.backBtn}
              >
                <Ionicons name="arrow-back" size={24} color={COLORS.text} />
              </TouchableOpacity>
            ) : (
              <View style={styles.spacer} />
            )}
            <AppText style={styles.title}>
              {selectedMethod ? "Confirm Payment" : "Select Payment"}
            </AppText>
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={COLORS.textLight} />
            </TouchableOpacity>
          </View>

          <View style={styles.amountContainer}>
            <AppText style={styles.amountLabel}>Total Due</AppText>
            <AppText style={styles.amountValue}>
              ₱{totalAmount.toFixed(2)}
            </AppText>
          </View>

          {!selectedMethod ? (
            <View style={styles.grid}>
              {paymentMethods.map((method) => {
                const presentation = getPresentation(method.name);
                return (
                  <TouchableOpacity
                    key={method.id}
                    style={styles.methodCard}
                    onPress={() => setSelectedMethod(method)}
                  >
                    <View style={styles.iconContainer}>
                      {presentation.image ? (
                        <Image
                          source={presentation.image}
                          style={styles.methodLogo}
                          resizeMode="contain"
                        />
                      ) : (
                        <Ionicons
                          name={presentation.icon as any}
                          size={32}
                          color={COLORS.primary}
                        />
                      )}
                    </View>
                    <AppText style={styles.methodLabel}>{method.name}</AppText>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            (() => {
              const presentation = getPresentation(selectedMethod.name);
              return (
                <View style={styles.confirmView}>
                  <View style={styles.selectedIconContainer}>
                    {presentation.image ? (
                      <Image
                        source={presentation.image}
                        style={styles.selectedMethodLogo}
                        resizeMode="contain"
                      />
                    ) : (
                      <Ionicons
                        name={presentation.icon as any}
                        size={48}
                        color={COLORS.primary}
                      />
                    )}
                  </View>

                  <TextInput
                    style={styles.nameInput}
                    placeholder="Customer Name (Optional)"
                    placeholderTextColor={COLORS.textLight}
                    value={customerName}
                    onChangeText={setCustomerName}
                  />

                  <AppText style={styles.confirmPrompt}>
                    Proceed with {selectedMethod.name} payment?
                  </AppText>

                  <TouchableOpacity
                    style={styles.confirmBtn}
                    onPress={handleConfirm}
                  >
                    <AppText style={styles.confirmBtnText}>
                      Confirm ₱{totalAmount.toFixed(2)}
                    </AppText>
                  </TouchableOpacity>
                </View>
              );
            })()
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "85%",
    maxWidth: 400,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    elevation: 5,
    shadowColor: COLORS.espresso,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.md,
  },
  spacer: {
    width: 32, // to balance the close button width
  },
  backBtn: {
    padding: SPACING.xs,
  },
  title: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.espresso,
  },
  closeBtn: {
    padding: SPACING.xs,
  },
  amountContainer: {
    alignItems: "center",
    backgroundColor: COLORS.roseBlushSoft,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.xl,
  },
  amountLabel: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textLight,
    marginBottom: SPACING.xs,
  },
  amountValue: {
    fontSize: TYPOGRAPHY.sizes.xxl,
    fontWeight: "bold",
    fontFamily: Platform.select({ ios: "Georgia", android: "serif" }),
    color: COLORS.primary,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.md,
    justifyContent: "space-between",
  },
  methodCard: {
    width: "47%", // slightly less than 50% to account for gap
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.stone200,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    alignItems: "center",
    marginBottom: SPACING.sm,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.surface,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: SPACING.sm,
    shadowColor: COLORS.espresso,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    overflow: "hidden",
  },
  methodLogo: {
    width: 36,
    height: 36,
  },
  methodLabel: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.text,
  },
  confirmView: {
    alignItems: "center",
    paddingTop: SPACING.md,
  },
  selectedIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.background,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.stone200,
    overflow: "hidden",
  },
  selectedMethodLogo: {
    width: 50,
    height: 50,
  },
  nameInput: {
    width: "100%",
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.stone200,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.espresso,
    marginBottom: SPACING.lg,
  },
  confirmPrompt: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.espresso,
    marginBottom: SPACING.xl,
    textAlign: "center",
  },
  confirmBtn: {
    backgroundColor: COLORS.primary,
    width: "100%",
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: "center",
  },
  confirmBtnText: {
    color: COLORS.surface,
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
});
