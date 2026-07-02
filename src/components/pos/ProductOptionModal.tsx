import React, { useEffect, useState, useRef } from "react";
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Pressable,
  Platform,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  MenuItem,
  ProductSizeOption,
  ProductTemperatureOption,
  ProductVariant,
  usePOSStore,
} from "../../store/usePOSStore";
import {
  COLORS,
  TYPOGRAPHY,
  SPACING,
  BORDER_RADIUS,
} from "../../constants/theme";
import AppText from "../ui/AppText";

interface ProductOptionModalProps {
  visible: boolean;
  item: MenuItem | null;
  onClose: () => void;
}

// Dedup + sort a list of variants down to their unique size (or temperature) options.
function getUniqueSizes(variants: ProductVariant[]): ProductSizeOption[] {
  return Array.from(
    new Map(
      variants.filter((v) => v.size).map((v) => [v.size!.id, v.size!]),
    ).values(),
  ).sort((a, b) => a.sort_order - b.sort_order);
}

function getUniqueTemps(
  variants: ProductVariant[],
): ProductTemperatureOption[] {
  return Array.from(
    new Map(
      variants
        .filter((v) => v.temperature)
        .map((v) => [v.temperature!.id, v.temperature!]),
    ).values(),
  ).sort((a, b) => a.sort_order - b.sort_order);
}

export default function ProductOptionModal({
  visible,
  item,
  onClose,
}: ProductOptionModalProps) {
  const { addToCart, showToast } = usePOSStore();
  const [selectedSizeId, setSelectedSizeId] = useState<string | null>(null);
  const [selectedTempId, setSelectedTempId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);

  const slideAnim = useRef(new Animated.Value(500)).current;

  const variants = item?.variants ?? [];
  const sizeOptions = getUniqueSizes(variants);
  const allTempOptions = getUniqueTemps(variants);

  // Variants relevant to the currently selected size (or all variants, if this
  // product has no size dimension at all).
  const relevantVariants =
    sizeOptions.length === 0
      ? variants
      : variants.filter((v) => v.size?.id === selectedSizeId);
  const tempOptions = getUniqueTemps(relevantVariants);

  const selectedVariant =
    variants.find((v) => {
      const sizeMatches =
        sizeOptions.length === 0 || v.size?.id === selectedSizeId;
      const tempMatches =
        tempOptions.length === 0 || v.temperature?.id === selectedTempId;
      return sizeMatches && tempMatches;
    }) ?? null;

  useEffect(() => {
    if (visible && item) {
      const sizes = getUniqueSizes(item.variants ?? []);
      setSelectedSizeId(sizes.length === 1 ? sizes[0].id : null);
      setQuantity(1);

      slideAnim.setValue(500);
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        bounciness: 4,
      }).start();
    }
  }, [visible, item]);

  // Whenever the selected size changes, re-derive the valid temperatures for it.
  // If there's exactly one, auto-select it; otherwise the user must pick.
  useEffect(() => {
    if (!item) return;
    const itemVariants = item.variants ?? [];
    const sizes = getUniqueSizes(itemVariants);
    const relevant =
      sizes.length === 0
        ? itemVariants
        : itemVariants.filter((v) => v.size?.id === selectedSizeId);
    const temps = getUniqueTemps(relevant);
    setSelectedTempId(temps.length === 1 ? temps[0].id : null);
  }, [selectedSizeId, item]);

  const handleClose = () => {
    Animated.timing(slideAnim, {
      toValue: 500,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      onClose();
    });
  };

  if (!item) return null;

  const currentPrice = selectedVariant ? selectedVariant.price : null;
  const isValid = selectedVariant !== null;

  const handleAdd = () => {
    if (isValid && selectedVariant) {
      addToCart(
        item,
        {
          size: selectedVariant.size?.name,
          temp: selectedVariant.temperature?.name,
        },
        selectedVariant.price,
        quantity,
      );
      showToast(`Added ${quantity}x ${item.name} to order`);
      handleClose();
    }
  };

  const totalPrice = (currentPrice || 0) * quantity;

  // Only show a size selector when there's a genuine choice to make.
  const showSizeSelector = sizeOptions.length > 1;
  // Only show a temp selector once a size is settled (or there's no size dimension)
  // and there's more than one valid temperature for that size.
  const showTempSelector =
    (sizeOptions.length === 0 || selectedSizeId) && tempOptions.length > 1;
  // If a size restricts the product to a single temperature (but other sizes offer
  // more choices), let the cashier know why the temp selector isn't showing.
  const selectedSizeName = sizeOptions.find(
    (s) => s.id === selectedSizeId,
  )?.name;
  const showTempHint =
    sizeOptions.length > 0 &&
    selectedSizeId &&
    tempOptions.length === 1 &&
    allTempOptions.length > 1;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.overlayPressable} onPress={handleClose} />
        <Animated.View
          style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}
        >
          <View style={styles.header}>
            <AppText style={styles.title}>{item.name}</AppText>
            <TouchableOpacity onPress={handleClose}>
              <Ionicons name="close" size={24} color={COLORS.textLight} />
            </TouchableOpacity>
          </View>

          {/* Size Selection */}
          {showSizeSelector && (
            <View style={styles.section}>
              <AppText style={styles.sectionTitle}>Size</AppText>
              <View style={styles.optionsRow}>
                {sizeOptions.map((s) => (
                  <TouchableOpacity
                    key={s.id}
                    style={[
                      styles.optionBtn,
                      selectedSizeId === s.id && styles.optionBtnActive,
                    ]}
                    onPress={() => setSelectedSizeId(s.id)}
                  >
                    <AppText
                      style={[
                        styles.optionText,
                        selectedSizeId === s.id && styles.optionTextActive,
                      ]}
                    >
                      {s.name}
                    </AppText>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Temperature Selection */}
          {showTempSelector && (
            <View style={styles.section}>
              <AppText style={styles.sectionTitle}>Temperature</AppText>
              <View style={styles.optionsRow}>
                {tempOptions.map((t) => (
                  <TouchableOpacity
                    key={t.id}
                    style={[
                      styles.optionBtn,
                      selectedTempId === t.id && styles.optionBtnActive,
                    ]}
                    onPress={() => setSelectedTempId(t.id)}
                  >
                    <AppText
                      style={[
                        styles.optionText,
                        selectedTempId === t.id && styles.optionTextActive,
                      ]}
                    >
                      {t.name}
                    </AppText>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Restricted-temperature feedback */}
          {showTempHint && (
            <View style={styles.feedbackBox}>
              <Ionicons
                name="snow-outline"
                size={16}
                color={COLORS.textLight}
              />
              <AppText style={styles.feedbackText}>
                {selectedSizeName} is only available {tempOptions[0].name}.
              </AppText>
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
              {currentPrice ? `₱${totalPrice.toFixed(2)}` : "Select options"}
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
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  overlayPressable: {
    ...StyleSheet.absoluteFillObject,
  },
  sheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    paddingBottom: Platform.OS === "ios" ? 40 : SPACING.lg,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontFamily: Platform.select({ ios: "Georgia", android: "serif" }),
    fontWeight: "bold",
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
    flexDirection: "row",
    gap: SPACING.sm,
  },
  optionBtn: {
    flex: 1,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.stone200,
    borderRadius: BORDER_RADIUS.md,
    alignItems: "center",
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
    flexDirection: "row",
    alignItems: "center",
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
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
  },
  qtyBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.stone100,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.stone200,
  },
  qtyValue: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.espresso,
    minWidth: 32,
    textAlign: "center",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: COLORS.stone200,
    paddingTop: SPACING.lg,
    marginTop: SPACING.sm,
  },
  price: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: "bold",
    fontFamily: Platform.select({ ios: "Georgia", android: "serif" }),
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
