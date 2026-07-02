import React from "react";
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  COLORS,
  TYPOGRAPHY,
  SPACING,
  BORDER_RADIUS,
} from "../../constants/theme";
import AppText from "../ui/AppText";

export type VoidReason = "Void (Not Made)" | "Void (Consumed)";

interface VoidReasonModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (reason: VoidReason) => void;
}

export default function VoidReasonModal({
  visible,
  onClose,
  onConfirm,
}: VoidReasonModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <AppText style={styles.title}>Void Order</AppText>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={COLORS.textLight} />
            </TouchableOpacity>
          </View>

          <AppText style={styles.subtitle}>
            Select the reason for voiding this order. This affects inventory
            tracking.
          </AppText>

          <TouchableOpacity
            style={styles.reasonBtn}
            onPress={() => onConfirm("Void (Not Made)")}
          >
            <Ionicons
              name="close-circle-outline"
              size={24}
              color={COLORS.roseDeep}
            />
            <View style={styles.reasonTextContainer}>
              <AppText style={styles.reasonTitle}>Not Made</AppText>
              <AppText style={styles.reasonDesc}>
                Order was wrong before being prepared. Ingredients not consumed.
              </AppText>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.reasonBtn}
            onPress={() => onConfirm("Void (Consumed)")}
          >
            <Ionicons name="trash-outline" size={24} color={COLORS.roseDeep} />
            <View style={styles.reasonTextContainer}>
              <AppText style={styles.reasonTitle}>Consumed</AppText>
              <AppText style={styles.reasonDesc}>
                Order was prepared but wasted/incorrect. Ingredients consumed.
              </AppText>
            </View>
          </TouchableOpacity>
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
    width: "90%",
    maxWidth: 400,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.sm,
  },
  title: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.espresso,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textLight,
    marginBottom: SPACING.xl,
    lineHeight: 20,
  },
  reasonBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.stone200,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.md,
  },
  reasonTextContainer: {
    marginLeft: SPACING.md,
    flex: 1,
  },
  reasonTitle: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.text,
    marginBottom: 2,
  },
  reasonDesc: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textLight,
    lineHeight: 18,
  },
});
