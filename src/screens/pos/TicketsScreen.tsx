import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, SafeAreaView, Platform, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { useNavigation } from '@react-navigation/native';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../../constants/theme';
import AppText from '../../components/ui/AppText';
import { usePOSStore } from '../../store/usePOSStore';
import TicketCarousel from '../../components/tickets/TicketCarousel';

type TabType = 'Current' | 'Completed' | 'Void';

export default function TicketsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<DrawerNavigationProp<any>>();
  const [activeTab, setActiveTab] = useState<TabType>('Current');
  const { orders } = usePOSStore();

  // Filter orders based on active tab
  const filteredOrders = orders.filter(order => {
    if (activeTab === 'Current') return order.status === 'Current';
    if (activeTab === 'Completed') return order.status === 'Completed';
    if (activeTab === 'Void') return order.status.includes('Voided');
    return false;
  });

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
        <View style={styles.topContainer}>
          <View style={styles.tabsContainer}>
            {(['Current', 'Completed', 'Void'] as TabType[]).map((tab) => (
              <TouchableOpacity
                key={tab}
                style={[styles.tab, activeTab === tab && styles.tabActive]}
                onPress={() => setActiveTab(tab)}
              >
                <AppText style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                  {tab}
                </AppText>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.carouselArea}>
          <TicketCarousel orders={filteredOrders} />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  safeArea: {
    flex: 1,
  },
  topContainer: {
    backgroundColor: COLORS.surface,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.stone200,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
  },
  tab: {
    flex: 1,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  tabActive: {
    backgroundColor: COLORS.roseBlushSoft,
    borderColor: COLORS.primary,
  },
  tabText: {
    color: COLORS.textLight,
    fontWeight: TYPOGRAPHY.weights.semibold,
    fontSize: TYPOGRAPHY.sizes.md,
  },
  tabTextActive: {
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.weights.semibold,
    fontSize: TYPOGRAPHY.sizes.md,
  },
  carouselArea: {
    flex: 1,
    paddingTop: SPACING.lg,
  }
});
