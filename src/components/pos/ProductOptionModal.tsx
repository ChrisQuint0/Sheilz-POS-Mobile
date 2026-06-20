import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, Modal, TouchableOpacity, Platform, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MenuItem, usePOSStore } from '../../store/usePOSStore';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../../constants/theme';
import AppText from '../ui/AppText';
import { PRICING_RULES, getProductPrice, Size, Temp } from '../../constants/pricing';

interface ProductOptionModalProps {
  visible: boolean;
  item: MenuItem | null;
  onClose: () => void;
}

export default function ProductOptionModal({ visible, item, onClose }: ProductOptionModalProps) {
  const { addToCart, showToast } = usePOSStore();
  const [size, setSize] = useState<Size | null>(null);
  const [temp, setTemp] = useState<Temp | null>(null);
  const [addon, setAddon] = useState(false);
  const [quantity, setQuantity] = useState(1);

  const config = item ? PRICING_RULES[item.name] : null;
  const slideAnim = useRef(new Animated.Value(500)).current;

  useEffect(() => {
    if (visible && item) {
      if (config) {
        setSize(config.sizes.length === 1 ? config.sizes[0] : null);
        setTemp(config.temps.length === 1 ? config.temps[0] : null);
      } else {
        setSize(null);
        setTemp(null);
      }
      setAddon(false);
      setQuantity(1);
      
      slideAnim.setValue(500);
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        bounciness: 4,
      }).start();
    }
  }, [visible, item, config]);

  const handleClose = () => {
    Animated.timing(slideAnim, {
      toValue: 500,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      onClose();
    });
  };

  // Auto-set temp to Cold if 12oz is selected
  useEffect(() => {
    if (size === '12oz' && config?.temps.includes('Cold')) {
      setTemp('Cold');
    }
  }, [size, config]);

  if (!item) return null;

  const currentPrice = config ? getProductPrice(item.name, size as Size, temp as Temp, addon) : item.price;
  const isValid = config ? (size && (temp || config.temps.includes('None'))) : true;

  const handleAdd = () => {
    if (isValid && currentPrice !== null) {
      addToCart(
        item, 
        config ? { size: size as Size, temp: temp as Temp, addon } : undefined, 
        currentPrice, 
        quantity
      );
      showToast(`Added ${quantity}x ${item.name} to order`);
      handleClose();
    }
  };

  const totalPrice = (currentPrice || 0) * quantity;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.header}>
            <AppText style={styles.title}>{item.name}</AppText>
            <TouchableOpacity onPress={handleClose}>
              <Ionicons name="close" size={24} color={COLORS.textLight} />
            </TouchableOpacity>
          </View>

          {/* Size Selection */}
          {config && config.sizes[0] !== 'One Size' && (
            <View style={styles.section}>
              <AppText style={styles.sectionTitle}>Size</AppText>
              <View style={styles.optionsRow}>
                {config.sizes.map((s) => (
                  <TouchableOpacity
                    key={s}
                    style={[styles.optionBtn, size === s && styles.optionBtnActive]}
                    onPress={() => {
                      setSize(s);
                      if (s === '16oz' && config.temps.includes('Hot') && config.temps.includes('Cold')) {
                        setTemp(null); // Reset temp to let them choose
                      }
                    }}
                  >
                    <AppText style={[styles.optionText, size === s && styles.optionTextActive]}>{s}</AppText>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Temperature Selection */}
          {config && config.temps[0] !== 'None' && config.temps.length > 1 && size === '16oz' && (
            <View style={styles.section}>
              <AppText style={styles.sectionTitle}>Temperature</AppText>
              <View style={styles.optionsRow}>
                {config.temps.map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.optionBtn, temp === t && styles.optionBtnActive]}
                    onPress={() => setTemp(t)}
                  >
                    <AppText style={[styles.optionText, temp === t && styles.optionTextActive]}>{t}</AppText>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* 12oz Cold Feedback */}
          {config && config.temps.length > 1 && size === '12oz' && (
            <View style={styles.feedbackBox}>
              <Ionicons name="snow-outline" size={16} color={COLORS.textLight} />
              <AppText style={styles.feedbackText}>12oz is only available iced/cold.</AppText>
            </View>
          )}

          {/* Addons */}
          {config?.hasAddon && (
            <View style={styles.section}>
              <AppText style={styles.sectionTitle}>Add-ons</AppText>
              <View style={styles.optionsRow}>
                <TouchableOpacity
                  style={[styles.optionBtn, addon && styles.optionBtnActive]}
                  onPress={() => setAddon(!addon)}
                >
                  <AppText style={[styles.optionText, addon && styles.optionTextActive]}>
                    {config.hasAddon.name} (+₱{config.hasAddon.price.toFixed(2)})
                  </AppText>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Quantity Selection */}
          <View style={styles.section}>
            <AppText style={styles.sectionTitle}>Quantity</AppText>
            <View style={styles.quantityContainer}>
              <TouchableOpacity 
                style={styles.qtyBtn} 
                onPress={() => setQuantity(Math.max(1, quantity - 1))}
              >
                <Ionicons name="remove" size={24} color={COLORS.espresso} />
              </TouchableOpacity>
              <AppText style={styles.qtyValue}>{quantity}</AppText>
              <TouchableOpacity 
                style={styles.qtyBtn} 
                onPress={() => setQuantity(quantity + 1)}
              >
                <Ionicons name="add" size={24} color={COLORS.espresso} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <AppText style={styles.price}>
              {currentPrice ? `₱${totalPrice.toFixed(2)}` : 'Select options'}
            </AppText>
            <TouchableOpacity
              style={[styles.addBtn, !isValid && styles.addBtnDisabled]}
              disabled={!isValid}
              onPress={handleAdd}
            >
              <AppText style={styles.addBtnText}>Add to Order</AppText>
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
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    paddingBottom: Platform.OS === 'ios' ? 40 : SPACING.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
    fontWeight: 'bold',
    color: COLORS.espresso,
  },
  section: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textLight,
    marginBottom: SPACING.sm,
  },
  optionsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  optionBtn: {
    flex: 1,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.stone200,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  optionBtnActive: {
    backgroundColor: COLORS.roseBlushSoft,
    borderColor: COLORS.primary,
  },
  optionText: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.text,
  },
  optionTextActive: {
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  feedbackBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.stone100,
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    marginBottom: SPACING.lg,
    gap: SPACING.xs,
  },
  feedbackText: {
    color: COLORS.textLight,
    fontSize: TYPOGRAPHY.sizes.sm,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  qtyBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.stone100,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.stone200,
  },
  qtyValue: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.espresso,
    minWidth: 32,
    textAlign: 'center',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.stone200,
    paddingTop: SPACING.lg,
    marginTop: SPACING.sm,
  },
  price: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: 'bold',
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
    color: COLORS.espresso,
  },
  addBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    borderRadius: BORDER_RADIUS.md,
  },
  addBtnDisabled: {
    backgroundColor: COLORS.stone300,
  },
  addBtnText: {
    color: COLORS.surface,
    fontWeight: TYPOGRAPHY.weights.bold,
    fontSize: TYPOGRAPHY.sizes.md,
  },
});
