import React from 'react';
import { View, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MenuItem, usePOSStore } from '../../store/usePOSStore';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../../constants/theme';
import AppText from '../ui/AppText';

interface ProductCardProps {
  item: MenuItem;
  onSelect: (item: MenuItem) => void;
}

export default function ProductCard({ item, onSelect }: ProductCardProps) {
  const { cart } = usePOSStore();
  const quantityInCart = cart.filter(c => c.item.id === item.id).reduce((sum, c) => sum + c.quantity, 0);

  return (
    <TouchableOpacity style={styles.card} onPress={() => onSelect(item)}>
      <View style={styles.imageContainer}>
        <Image source={{ uri: item.image }} style={styles.cardImage} />
        {quantityInCart > 0 && (
          <View style={styles.badge}>
            <AppText style={styles.badgeText}>{quantityInCart}</AppText>
          </View>
        )}
      </View>
      <View style={styles.cardInfo}>
        <AppText style={styles.cardTitle}>{item.name}</AppText>
        <AppText style={styles.cardCategory}>{item.category}</AppText>
        <AppText style={styles.cardPrice}>₱{item.price.toFixed(2)}</AppText>
      </View>
      <View style={styles.addButton}>
        <Ionicons name="add" size={20} color={COLORS.surface} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.sm,
    marginBottom: SPACING.md,
    marginHorizontal: SPACING.xs,
    alignItems: "center",
    flex: 1,
    elevation: 2,
    shadowColor: COLORS.espresso,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.stone100,
  },
  cardImage: {
    width: 60,
    height: 60,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.stone200,
  },
  cardInfo: { 
    flex: 1, 
    marginLeft: SPACING.md 
  },
  cardTitle: { 
    fontSize: TYPOGRAPHY.sizes.md, 
    fontWeight: TYPOGRAPHY.weights.semibold, 
    color: COLORS.text 
  },
  cardCategory: { 
    fontSize: TYPOGRAPHY.sizes.xs, 
    color: COLORS.textLight, 
    marginTop: 2 
  },
  cardPrice: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.roseDeep,
    marginTop: SPACING.xs,
  },
  addButton: {
    backgroundColor: COLORS.primary,
    width: 32,
    height: 32,
    borderRadius: BORDER_RADIUS.full,
    justifyContent: "center",
    alignItems: "center",
  },
  imageContainer: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: COLORS.primary,
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.surface,
    paddingHorizontal: 4,
  },
  badgeText: {
    color: COLORS.surface,
    fontSize: 10,
    fontWeight: 'bold',
  },
});
