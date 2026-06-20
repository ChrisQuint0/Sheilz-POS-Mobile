import React, { useState } from 'react';
import { View, StyleSheet, Modal, TouchableOpacity, Platform, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../../constants/theme';
import AppText from '../ui/AppText';

interface PaymentModalProps {
  visible: boolean;
  totalAmount: number;
  onClose: () => void;
  onConfirm: (method: string) => void;
}

const PAYMENT_METHODS = [
  { id: 'Cash', icon: 'cash-outline', label: 'Cash', image: null },
  { id: 'Gcash', icon: null, label: 'GCash', image: require('../../../assets/gcash.png') },
  { id: 'BPI', icon: null, label: 'BPI', image: require('../../../assets/bpi.png') },
  { id: 'Maya', icon: null, label: 'Maya', image: require('../../../assets/maya.png') },
];

export default function PaymentModal({ visible, totalAmount, onClose, onConfirm }: PaymentModalProps) {
  const [selectedMethod, setSelectedMethod] = useState<typeof PAYMENT_METHODS[0] | null>(null);

  const handleClose = () => {
    setSelectedMethod(null);
    onClose();
  };

  const handleConfirm = () => {
    if (selectedMethod) {
      onConfirm(selectedMethod.id);
      setSelectedMethod(null);
    }
  };
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            {selectedMethod ? (
              <TouchableOpacity onPress={() => setSelectedMethod(null)} style={styles.backBtn}>
                <Ionicons name="arrow-back" size={24} color={COLORS.text} />
              </TouchableOpacity>
            ) : (
              <View style={styles.spacer} />
            )}
            <AppText style={styles.title}>{selectedMethod ? 'Confirm Payment' : 'Select Payment'}</AppText>
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={COLORS.textLight} />
            </TouchableOpacity>
          </View>

          <View style={styles.amountContainer}>
            <AppText style={styles.amountLabel}>Total Due</AppText>
            <AppText style={styles.amountValue}>₱{totalAmount.toFixed(2)}</AppText>
          </View>

          {!selectedMethod ? (
            <View style={styles.grid}>
              {PAYMENT_METHODS.map((method) => (
                <TouchableOpacity
                  key={method.id}
                  style={styles.methodCard}
                  onPress={() => setSelectedMethod(method)}
                >
                  <View style={styles.iconContainer}>
                    {method.image ? (
                      <Image source={method.image} style={styles.methodLogo} resizeMode="contain" />
                    ) : (
                      <Ionicons name={method.icon as any} size={32} color={COLORS.primary} />
                    )}
                  </View>
                  <AppText style={styles.methodLabel}>{method.label}</AppText>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.confirmView}>
              <View style={styles.selectedIconContainer}>
                {selectedMethod.image ? (
                  <Image source={selectedMethod.image} style={styles.selectedMethodLogo} resizeMode="contain" />
                ) : (
                  <Ionicons name={selectedMethod.icon as any} size={48} color={COLORS.primary} />
                )}
              </View>
              <AppText style={styles.confirmPrompt}>
                Proceed with {selectedMethod.label} payment?
              </AppText>
              
              <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm}>
                <AppText style={styles.confirmBtnText}>Confirm ₱{totalAmount.toFixed(2)}</AppText>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    alignItems: 'center',
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
    fontWeight: 'bold',
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
    color: COLORS.primary,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
    justifyContent: 'space-between',
  },
  methodCard: {
    width: '47%', // slightly less than 50% to account for gap
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.stone200,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    shadowColor: COLORS.espresso,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
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
    alignItems: 'center',
    paddingTop: SPACING.md,
  },
  selectedIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.stone200,
    overflow: 'hidden',
  },
  selectedMethodLogo: {
    width: 50,
    height: 50,
  },
  confirmPrompt: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.espresso,
    marginBottom: SPACING.xl,
    textAlign: 'center',
  },
  confirmBtn: {
    backgroundColor: COLORS.primary,
    width: '100%',
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  confirmBtnText: {
    color: COLORS.surface,
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
});
