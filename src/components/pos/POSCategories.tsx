import React, { useState, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { usePOSStore } from '../../store/usePOSStore';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../../constants/theme';
import AppText from '../ui/AppText';
import { Ionicons } from '@expo/vector-icons';

const CATEGORIES = [
  "All",
  "Coffee",
  "Non-Coffee",
  "Sparkling",
  "Tea",
  "Pastries",
  "Limited Time",
];

export default function POSCategories() {
  const { activeCategory, setActiveCategory } = usePOSStore();
  const [contentWidth, setContentWidth] = useState(0);
  const [visibleWidth, setVisibleWidth] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const listRef = useRef<any>(null);
  const currentScrollX = useRef(0);

  React.useEffect(() => {
    const listenerId = scrollX.addListener(({ value }) => {
      currentScrollX.current = value;
    });
    return () => scrollX.removeListener(listenerId);
  }, [scrollX]);

  const showIndicator = contentWidth > visibleWidth && visibleWidth > 0;
  const trackWidth = 50;
  const thumbWidth = showIndicator ? Math.max(15, (visibleWidth / contentWidth) * trackWidth) : 15;
  const maxScroll = Math.max(1, contentWidth - visibleWidth);
  const maxThumbScroll = trackWidth - thumbWidth;

  const translateX = scrollX.interpolate({
    inputRange: [0, maxScroll],
    outputRange: [0, maxThumbScroll],
    extrapolate: 'clamp',
  });

  const leftChevronOpacity = scrollX.interpolate({
    inputRange: [0, 20],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const rightChevronOpacity = scrollX.interpolate({
    inputRange: [Math.max(0, maxScroll - 20), Math.max(1, maxScroll)],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const scrollBy = (amount: number) => {
    const newOffset = Math.max(0, Math.min(maxScroll, currentScrollX.current + amount));
    if (listRef.current) {
      if (typeof listRef.current.scrollToOffset === 'function') {
        listRef.current.scrollToOffset({ offset: newOffset, animated: true });
      } else if (listRef.current.getNode && typeof listRef.current.getNode().scrollToOffset === 'function') {
        listRef.current.getNode().scrollToOffset({ offset: newOffset, animated: true });
      }
    }
  };

  return (
    <View style={styles.categoriesContainer}>
      <Animated.FlatList
        ref={listRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ 
          paddingHorizontal: SPACING.sm, 
          paddingRight: SPACING.xl,
          paddingTop: SPACING.md,
          paddingBottom: SPACING.sm
        }}
        data={CATEGORIES}
        keyExtractor={(item) => item as string}
        onContentSizeChange={(w) => setContentWidth(w)}
        onLayout={(e) => setVisibleWidth(e.nativeEvent.layout.width)}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
        renderItem={({ item }) => {
          const categoryItem = item as string;
          const isActive = activeCategory === categoryItem;
          return (
            <TouchableOpacity
              style={[
                styles.categoryPill,
                isActive && styles.categoryPillActive,
              ]}
              onPress={() => setActiveCategory(categoryItem)}
            >
              <AppText
                style={[
                  styles.categoryText,
                  isActive && styles.categoryTextActive,
                ]}
              >
                {categoryItem}
              </AppText>
            </TouchableOpacity>
          );
        }}
      />

      {showIndicator && (
        <Animated.View style={[styles.chevronContainer, styles.chevronLeft, { opacity: leftChevronOpacity }]}>
          <TouchableOpacity onPress={() => scrollBy(-150)} style={styles.chevronTouchable}>
            <Ionicons name="chevron-back" size={20} color={COLORS.textLight} />
          </TouchableOpacity>
        </Animated.View>
      )}

      {showIndicator && (
        <Animated.View style={[styles.chevronContainer, styles.chevronRight, { opacity: rightChevronOpacity }]}>
          <TouchableOpacity onPress={() => scrollBy(150)} style={styles.chevronTouchable}>
            <Ionicons name="chevron-forward" size={20} color={COLORS.textLight} />
          </TouchableOpacity>
        </Animated.View>
      )}
      
      {showIndicator && (
        <View style={styles.scrollTrack}>
          <Animated.View style={[styles.scrollThumb, { width: thumbWidth, transform: [{ translateX }] }]} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  categoriesContainer: {
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: SPACING.xs,
  },
  categoryPill: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.background,
    marginHorizontal: SPACING.xs,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  categoryPillActive: { 
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  categoryText: { 
    color: COLORS.text, 
    fontWeight: TYPOGRAPHY.weights.semibold,
    fontSize: TYPOGRAPHY.sizes.sm,
  },
  categoryTextActive: { 
    color: COLORS.cream 
  },
  scrollTrack: {
    width: 50,
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: SPACING.sm,
  },
  scrollThumb: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 2,
  },
  chevronContainer: {
    position: 'absolute',
    top: SPACING.md,
    height: 34,
    width: 34,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)', 
    borderRadius: 17,
  },
  chevronLeft: { left: SPACING.xs },
  chevronRight: { right: SPACING.xs },
  chevronTouchable: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
