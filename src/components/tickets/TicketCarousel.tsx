import React, { useRef, useState } from 'react';
import { View, StyleSheet, FlatList, useWindowDimensions, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Order } from '../../store/usePOSStore';
import TicketCard from './TicketCard';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../../constants/theme';
import AppText from '../ui/AppText';

interface TicketCarouselProps {
  orders: Order[];
}

export default function TicketCarousel({ orders }: TicketCarouselProps) {
  const { width } = useWindowDimensions();
  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Dynamic width: on tablets, max 600px. On phones, 90% of screen.
  const isTablet = width > 768;
  const ITEM_WIDTH = isTablet ? 600 : width * 0.9;
  
  const scrollToIndex = (index: number) => {
    if (index >= 0 && index < orders.length) {
      flatListRef.current?.scrollToIndex({ index, animated: true });
    }
  };

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index || 0);
    }
  }).current;

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 50 }).current;

  if (orders.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="receipt-outline" size={64} color={COLORS.stone300} />
        <AppText style={styles.emptyText}>No tickets found.</AppText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {orders.length > 1 && (
        <View style={styles.pagerContainer}>
          {orders.map((_, idx) => (
            <View 
              key={idx} 
              style={[
                styles.pagerDot, 
                idx === currentIndex && styles.pagerDotActive
              ]} 
            />
          ))}
        </View>
      )}

      <FlatList
        ref={flatListRef}
        data={orders}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled={!isTablet}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: (width - ITEM_WIDTH) / 2 }}
        snapToInterval={isTablet ? undefined : ITEM_WIDTH}
        decelerationRate="fast"
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        renderItem={({ item }) => <TicketCard order={item} width={ITEM_WIDTH} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
    paddingBottom: SPACING.xl,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: TYPOGRAPHY.sizes.lg,
    color: COLORS.textLight,
    marginTop: SPACING.md,
  },
  pagerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: SPACING.xl,
    gap: 8,
    marginBottom: SPACING.sm,
  },
  pagerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.stone300,
  },
  pagerDotActive: {
    backgroundColor: COLORS.primary,
    width: 12,
    height: 12,
    borderRadius: 6,
  }
});
