import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, Platform, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Order, usePOSStore } from '../../store/usePOSStore';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../../constants/theme';
import AppText from '../ui/AppText';
import VoidReasonModal, { VoidReason } from './VoidReasonModal';
import ConfirmModal from '../ui/ConfirmModal';

interface TicketCardProps {
  order: Order;
  width: number;
}

export default function TicketCard({ order, width }: TicketCardProps) {
  const { updateOrderStatus, showToast } = usePOSStore();
  const [isVoidModalVisible, setIsVoidModalVisible] = useState(false);
  const [isCompleteModalVisible, setIsCompleteModalVisible] = useState(false);

  const handleComplete = () => {
    setIsCompleteModalVisible(true);
  };

  const executeComplete = () => {
    setIsCompleteModalVisible(false);
    updateOrderStatus(order.id, 'Completed');
    showToast(`Order ${order.id} marked as completed`);
  };

  const handleVoidConfirm = (reason: VoidReason) => {
    updateOrderStatus(order.id, reason);
    setIsVoidModalVisible(false);
    showToast(`Order ${order.id} has been voided`);
  };

  const formattedTime = new Date(order.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const handlePrint = () => {
    Alert.alert('Print Receipt', `Printing ticket #${order.id}...`, [{ text: 'OK' }]);
  };

  const handleSave = () => {
    Alert.alert('Save Receipt', `Ticket #${order.id} saved to device.`, [{ text: 'OK' }]);
  };

  return (
    <View style={[styles.cardWrapper, { width }]}>
      <View style={styles.card}>
        <View style={styles.header}>
          <View>
            <AppText style={styles.orderNumber}>{order.id}</AppText>
            <AppText style={styles.time}>{formattedTime}</AppText>
            {order.customerName && (
              <AppText style={styles.customerName}>For: {order.customerName}</AppText>
            )}
            <AppText style={styles.paymentMethod}>Paid via: {order.paymentMethod}</AppText>
          </View>
          <View style={[
            styles.statusBadge, 
            order.status === 'Completed' ? styles.statusCompleted :
            order.status.includes('Voided') ? styles.statusVoided :
            styles.statusCurrent
          ]}>
            <AppText style={[
              styles.statusText,
              order.status === 'Completed' ? styles.statusTextCompleted :
              order.status.includes('Voided') ? styles.statusTextVoided :
              styles.statusTextCurrent
            ]}>{order.status}</AppText>
          </View>
        </View>

        <ScrollView 
          style={styles.itemsContainer} 
          showsVerticalScrollIndicator={true}
          nestedScrollEnabled={true}
          contentContainerStyle={styles.scrollContent}
        >
          {order.items.map((item, index) => (
            <View key={index} style={styles.itemRow}>
              <View style={styles.qtyBadge}>
                <AppText style={styles.qtyText}>{item.quantity}x</AppText>
              </View>
              <View style={styles.itemDetails}>
                <AppText style={styles.itemName}>{item.item.name}</AppText>
                {item.options && (
                  <AppText style={styles.itemOptions}>
                    {[
                      item.options.size !== 'One Size' ? item.options.size : null,
                      item.options.temp !== 'None' ? item.options.temp : null,
                      item.options.addon ? 'Honey' : null
                    ].filter(Boolean).join(' • ')}
                  </AppText>
                )}
              </View>
            </View>
          ))}
        </ScrollView>

        <View style={styles.receiptActions}>
          <TouchableOpacity style={styles.iconBtn} onPress={handlePrint}>
            <Ionicons name="print-outline" size={20} color={COLORS.espresso} />
            <AppText style={styles.iconBtnText}>Print</AppText>
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={handleSave}>
            <Ionicons name="download-outline" size={20} color={COLORS.espresso} />
            <AppText style={styles.iconBtnText}>Save</AppText>
          </TouchableOpacity>
        </View>

        {order.status === 'Current' && (
          <View style={styles.actions}>
            <TouchableOpacity style={styles.voidBtn} onPress={() => setIsVoidModalVisible(true)}>
              <AppText style={styles.voidBtnText}>Void</AppText>
            </TouchableOpacity>
            <TouchableOpacity style={styles.completeBtn} onPress={handleComplete}>
              <AppText style={styles.completeBtnText}>Complete Order</AppText>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <VoidReasonModal 
        visible={isVoidModalVisible} 
        onClose={() => setIsVoidModalVisible(false)} 
        onConfirm={handleVoidConfirm} 
      />

      <ConfirmModal
        visible={isCompleteModalVisible}
        title="Complete Order"
        message={`Are you sure you want to mark order ${order.id} as completed?`}
        confirmText="Complete"
        onCancel={() => setIsCompleteModalVisible(false)}
        onConfirm={executeComplete}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  cardWrapper: {
    padding: SPACING.md,
    height: '100%',
  },
  card: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    elevation: 3,
    shadowColor: COLORS.espresso,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.stone200,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.stone200,
    paddingBottom: SPACING.md,
    marginBottom: SPACING.md,
  },
  orderNumber: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.espresso,
  },
  time: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textLight,
    marginTop: 2,
  },
  customerName: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.primary,
    marginTop: 4,
  },
  paymentMethod: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textLight,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: BORDER_RADIUS.full,
  },
  statusCurrent: {
    backgroundColor: COLORS.stone200,
  },
  statusCompleted: {
    backgroundColor: '#E8F5E9',
  },
  statusVoided: {
    backgroundColor: COLORS.roseBlushSoft,
  },
  statusText: {
    fontSize: TYPOGRAPHY.sizes.xs,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  statusTextCurrent: { color: COLORS.espresso },
  statusTextCompleted: { color: '#2E7D32' },
  statusTextVoided: { color: COLORS.roseDeep },
  itemsContainer: {
    flex: 1,
    flexShrink: 1,
  },
  scrollContent: {
    paddingRight: SPACING.xs,
  },
  itemRow: {
    flexDirection: 'row',
    marginBottom: SPACING.md,
    alignItems: 'flex-start',
  },
  qtyBadge: {
    backgroundColor: COLORS.stone100,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.sm,
    marginRight: SPACING.sm,
  },
  qtyText: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.espresso,
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.text,
  },
  itemOptions: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textLight,
    marginTop: 4,
  },
  actions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: COLORS.stone200,
    paddingTop: SPACING.md,
    marginTop: SPACING.md,
    gap: SPACING.md,
  },
  voidBtn: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.roseDeep,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  voidBtnText: {
    color: COLORS.roseDeep,
    fontWeight: TYPOGRAPHY.weights.bold,
    fontSize: TYPOGRAPHY.sizes.md,
  },
  completeBtn: {
    flex: 2,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  completeBtnText: {
    color: COLORS.surface,
    fontWeight: TYPOGRAPHY.weights.bold,
    fontSize: TYPOGRAPHY.sizes.md,
  },
  receiptActions: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    borderTopWidth: 1,
    borderTopColor: COLORS.stone200,
    paddingTop: SPACING.md,
    marginTop: SPACING.sm,
    gap: SPACING.lg,
  },
  iconBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: SPACING.xs,
  },
  iconBtnText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.espresso,
  }
});
