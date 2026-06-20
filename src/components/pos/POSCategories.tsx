import React from 'react';
import { View, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { usePOSStore } from '../../store/usePOSStore';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../../constants/theme';
import AppText from '../ui/AppText';

const CATEGORIES = [
  "All",
  "Coffee",
  "Non-Coffee",
  "Sparkling",
  "Tea",
  "Pastries",
];

export default function POSCategories() {
  const { activeCategory, setActiveCategory } = usePOSStore();

  return (
    <View style={styles.categoriesContainer}>
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={CATEGORIES}
        keyExtractor={(item) => item}
        renderItem={({ item }) => {
          const isActive = activeCategory === item;
          return (
            <TouchableOpacity
              style={[
                styles.categoryPill,
                isActive && styles.categoryPillActive,
              ]}
              onPress={() => setActiveCategory(item)}
            >
              <AppText
                style={[
                  styles.categoryText,
                  isActive && styles.categoryTextActive,
                ]}
              >
                {item}
              </AppText>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  categoriesContainer: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  categoryPill: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.background,
    marginHorizontal: SPACING.xs,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  categoryPillActive: { 
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  categoryText: { 
    color: COLORS.textLight, 
    fontWeight: TYPOGRAPHY.weights.semibold,
    fontSize: TYPOGRAPHY.sizes.sm,
  },
  categoryTextActive: { 
    color: COLORS.cream 
  },
});
