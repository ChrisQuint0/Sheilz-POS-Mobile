import React, { useEffect } from 'react';
import { View, StyleSheet, Modal, ScrollView, TouchableOpacity, Alert, Platform, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../../constants/theme';
import AppText from '../ui/AppText';
import { Order } from '../../store/usePOSStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ReceiptModalProps {
  visible: boolean;
  onClose: () => void;
  order: Order | null;
}

export default function ReceiptModal({ visible, onClose, order }: ReceiptModalProps) {
  const insets = useSafeAreaInsets();
  const scaleValue = React.useRef(new Animated.Value(0.95)).current;
  const opacityValue = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleValue, {
          toValue: 1,
          useNativeDriver: true,
          tension: 50,
          friction: 7,
        }),
        Animated.timing(opacityValue, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleValue.setValue(0.95);
      opacityValue.setValue(0);
    }
  }, [visible]);

  if (!order) return null;

  const handlePrint = () => {
    Alert.alert('Print Receipt', 'Printing to connected Bluetooth printer...', [{ text: 'OK' }]);
  };

  const handleSave = () => {
    Alert.alert('Save Receipt', 'Receipt saved to device gallery/files.', [{ text: 'OK' }]);
  };

  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  const vatAmount = order.totalAmount * 0.12; // 12% VAT
  const subtotal = order.totalAmount - vatAmount;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Animated.View style={[styles.modalContainer, { opacity: opacityValue, transform: [{ scale: scaleValue }], marginTop: insets.top + SPACING.xl, marginBottom: insets.bottom + SPACING.xl }]}>
          
          {/* Header Actions */}
          <View style={styles.actionHeader}>
            <AppText style={styles.headerTitle}>Transaction Complete</AppText>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={COLORS.textLight} />
            </TouchableOpacity>
          </View>

          {/* Scrollable Receipt Area */}
          <View style={styles.receiptWrapper}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.receiptScroll}>
              
              {/* Receipt Header */}
              <View style={styles.receiptHeader}>
                <Ionicons name="cafe-outline" size={40} color={COLORS.espresso} />
                <AppText style={styles.storeName}>SHEILZ COFFEE</AppText>
                <AppText style={styles.storeInfo}>123 Brew Avenue, Coffee District</AppText>
                <AppText style={styles.storeInfo}>Tel: (02) 8123-4567</AppText>
                <AppText style={styles.storeInfo}>TIN: 000-123-456-000</AppText>
              </View>

              <View style={styles.dividerDashed} />

              {/* Receipt Meta */}
              <View style={styles.metaRow}>
                <AppText style={styles.metaLabel}>Order No:</AppText>
                <AppText style={styles.metaValue}>#{order.id}</AppText>
              </View>
              <View style={styles.metaRow}>
                <AppText style={styles.metaLabel}>Date:</AppText>
                <AppText style={styles.metaValue}>{formatDate(order.timestamp)}</AppText>
              </View>
              {order.customerName && (
                <View style={styles.metaRow}>
                  <AppText style={styles.metaLabel}>Customer:</AppText>
                  <AppText style={styles.metaValue}>{order.customerName}</AppText>
                </View>
              )}

              <View style={styles.dividerDashed} />

              {/* Items List */}
              <View style={styles.itemsHeader}>
                <AppText style={[styles.itemsHeaderText, { flex: 3 }]}>ITEM</AppText>
                <AppText style={[styles.itemsHeaderText, { flex: 1, textAlign: 'center' }]}>QTY</AppText>
                <AppText style={[styles.itemsHeaderText, { flex: 1.5, textAlign: 'right' }]}>TOTAL</AppText>
              </View>

              {order.items.map((item, idx) => (
                <View key={idx} style={styles.itemRow}>
                  <View style={{ flex: 3 }}>
                    <AppText style={styles.itemName}>{item.item.name}</AppText>
                    {item.options && (
                      <AppText style={styles.itemOptions}>
                        {[
                          item.options.size !== 'One Size' ? item.options.size : null,
                          item.options.temp !== 'None' ? item.options.temp : null,
                          item.options.addon ? '+ Addon' : null
                        ].filter(Boolean).join(', ')}
                      </AppText>
                    )}
                  </View>
                  <AppText style={[styles.itemQty, { flex: 1 }]}>{item.quantity}</AppText>
                  <AppText style={[styles.itemPrice, { flex: 1.5 }]}>
                    {(item.unitPrice * item.quantity).toFixed(2)}
                  </AppText>
                </View>
              ))}

              <View style={styles.dividerDashed} />

              {/* Totals */}
              <View style={styles.totalsRow}>
                <AppText style={styles.totalsLabel}>Subtotal</AppText>
                <AppText style={styles.totalsValue}>{subtotal.toFixed(2)}</AppText>
              </View>
              <View style={styles.totalsRow}>
                <AppText style={styles.totalsLabel}>VAT (12%)</AppText>
                <AppText style={styles.totalsValue}>{vatAmount.toFixed(2)}</AppText>
              </View>
              
              <View style={styles.dividerSolid} />
              
              <View style={styles.grandTotalRow}>
                <AppText style={styles.grandTotalLabel}>TOTAL</AppText>
                <AppText style={styles.grandTotalValue}>₱{order.totalAmount.toFixed(2)}</AppText>
              </View>

              <View style={styles.metaRow}>
                <AppText style={styles.metaLabel}>Payment Method:</AppText>
                <AppText style={styles.metaValue}>{order.paymentMethod}</AppText>
              </View>

              <View style={styles.dividerDashed} />

              {/* Footer */}
              <View style={styles.receiptFooter}>
                <AppText style={styles.footerGreeting}>Thank you for visiting!</AppText>
                <AppText style={styles.footerNote}>Please come again</AppText>
                <AppText style={styles.footerDisclaimer}>This document is not valid for claiming input taxes.</AppText>
              </View>

            </ScrollView>
            
            {/* Paper zig-zag effect at bottom */}
            <View style={styles.zigZagContainer}>
              {Array.from({ length: 30 }).map((_, i) => (
                <View key={i} style={styles.zigZagTriangle} />
              ))}
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.bottomActions}>
            <TouchableOpacity style={styles.iconBtn} onPress={handlePrint}>
              <Ionicons name="print-outline" size={24} color={COLORS.espresso} />
              <AppText style={styles.iconBtnText}>Print</AppText>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.primaryBtn} onPress={onClose}>
              <AppText style={styles.primaryBtnText}>New Order</AppText>
            </TouchableOpacity>

            <TouchableOpacity style={styles.iconBtn} onPress={handleSave}>
              <Ionicons name="download-outline" size={24} color={COLORS.espresso} />
              <AppText style={styles.iconBtnText}>Save</AppText>
            </TouchableOpacity>
          </View>

        </Animated.View>
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
  modalContainer: {
    width: '90%',
    maxWidth: 450,
    backgroundColor: COLORS.cream,
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
    shadowColor: COLORS.espresso,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
    flexShrink: 1, // allow it to shrink if screen is small
  },
  actionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.sage,
  },
  closeBtn: {
    padding: 4,
  },
  receiptWrapper: {
    backgroundColor: '#FFFFFF',
    margin: SPACING.md,
    marginBottom: 0,
    flexShrink: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    position: 'relative',
  },
  receiptScroll: {
    padding: SPACING.lg,
  },
  receiptHeader: {
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  storeName: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.bold,
    fontFamily: Platform.select({ ios: 'Courier', android: 'monospace' }),
    marginTop: SPACING.sm,
    color: '#000',
  },
  storeInfo: {
    fontSize: 12,
    color: '#333',
    fontFamily: Platform.select({ ios: 'Courier', android: 'monospace' }),
    textAlign: 'center',
    marginTop: 2,
  },
  dividerDashed: {
    height: 1,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    borderStyle: 'dashed',
    marginVertical: SPACING.md,
  },
  dividerSolid: {
    height: 1,
    backgroundColor: '#000',
    marginVertical: SPACING.sm,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  metaLabel: {
    fontSize: 12,
    color: '#333',
    fontFamily: Platform.select({ ios: 'Courier', android: 'monospace' }),
  },
  metaValue: {
    fontSize: 12,
    color: '#000',
    fontFamily: Platform.select({ ios: 'Courier', android: 'monospace' }),
    fontWeight: 'bold',
  },
  itemsHeader: {
    flexDirection: 'row',
    marginBottom: SPACING.sm,
  },
  itemsHeaderText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#000',
    fontFamily: Platform.select({ ios: 'Courier', android: 'monospace' }),
  },
  itemRow: {
    flexDirection: 'row',
    marginBottom: SPACING.sm,
    alignItems: 'flex-start',
  },
  itemName: {
    fontSize: 12,
    color: '#000',
    fontFamily: Platform.select({ ios: 'Courier', android: 'monospace' }),
    fontWeight: 'bold',
  },
  itemOptions: {
    fontSize: 10,
    color: '#666',
    fontFamily: Platform.select({ ios: 'Courier', android: 'monospace' }),
    marginTop: 2,
  },
  itemQty: {
    fontSize: 12,
    color: '#000',
    fontFamily: Platform.select({ ios: 'Courier', android: 'monospace' }),
    textAlign: 'center',
  },
  itemPrice: {
    fontSize: 12,
    color: '#000',
    fontFamily: Platform.select({ ios: 'Courier', android: 'monospace' }),
    textAlign: 'right',
  },
  totalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  totalsLabel: {
    fontSize: 12,
    color: '#333',
    fontFamily: Platform.select({ ios: 'Courier', android: 'monospace' }),
  },
  totalsValue: {
    fontSize: 12,
    color: '#000',
    fontFamily: Platform.select({ ios: 'Courier', android: 'monospace' }),
  },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
    alignItems: 'center',
  },
  grandTotalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    fontFamily: Platform.select({ ios: 'Courier', android: 'monospace' }),
  },
  grandTotalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    fontFamily: Platform.select({ ios: 'Courier', android: 'monospace' }),
  },
  receiptFooter: {
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  footerGreeting: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#000',
    fontFamily: Platform.select({ ios: 'Courier', android: 'monospace' }),
    marginBottom: 4,
  },
  footerNote: {
    fontSize: 12,
    color: '#333',
    fontFamily: Platform.select({ ios: 'Courier', android: 'monospace' }),
  },
  footerDisclaimer: {
    fontSize: 9,
    color: '#999',
    fontFamily: Platform.select({ ios: 'Courier', android: 'monospace' }),
    marginTop: SPACING.md,
    textAlign: 'center',
  },
  zigZagContainer: {
    flexDirection: 'row',
    height: 10,
    overflow: 'hidden',
    backgroundColor: 'transparent',
    marginTop: -5,
  },
  zigZagTriangle: {
    width: 10,
    height: 10,
    backgroundColor: COLORS.cream,
    transform: [{ rotate: '45deg' }],
    marginTop: 5,
    marginLeft: -2, // overlap to create jagged edge
  },
  bottomActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
  },
  iconBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 60,
  },
  iconBtnText: {
    fontSize: 10,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.espresso,
    marginTop: 4,
  },
  primaryBtn: {
    flex: 1,
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    marginHorizontal: SPACING.md,
  },
  primaryBtnText: {
    color: COLORS.surface,
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
});
