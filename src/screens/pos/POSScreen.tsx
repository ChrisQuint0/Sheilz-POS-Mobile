import React, { useState, useRef, useEffect } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  Modal,
  KeyboardAvoidingView,
  Platform,
  PanResponder,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

// Components
import POSHeader from "../../components/pos/POSHeader";
import POSCategories from "../../components/pos/POSCategories";
import ProductGrid from "../../components/pos/ProductGrid";
import CartSummary from "../../components/pos/CartSummary";
import ReceiptModal from "../../components/pos/ReceiptModal";

// Store & Theme
import {
  usePOSStore,
  MenuItem,
  ProductCategory,
  PaymentMethod,
} from "../../store/usePOSStore";
import {
  getCategories,
  getProducts,
  getPaymentMethods,
} from "../../services/catalogRepository";
import { syncCatalogFromSupabase } from "../../services/catalogSyncService";
import {
  COLORS,
  TYPOGRAPHY,
  SPACING,
  BORDER_RADIUS,
} from "../../constants/theme";
import AppText from "../../components/ui/AppText";
import ProductOptionModal from "../../components/pos/ProductOptionModal";
import Toast from "../../components/ui/Toast";

export default function POSScreen() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isTablet = width >= 768;

  const { cart, addToCart, showToast, orders } = usePOSStore();
  const [isCartModalVisible, setIsCartModalVisible] = useState(false);
  const [isReceiptVisible, setIsReceiptVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<MenuItem | null>(null);
  const [isOptionModalVisible, setIsOptionModalVisible] = useState(false);

  // Product catalog — cache-first from SQLite (src/services/catalogRepository.ts),
  // refreshed in the background from Supabase (src/services/catalogSyncService.ts).
  // Reads/sync trigger live here (parent), per the
  // "Supabase calls belong in parent components only" convention.
  const [products, setProducts] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadCatalog = async () => {
      // 1. Instant render from the local cache.
      const [cachedCategories, cachedProducts, cachedPaymentMethods] =
        await Promise.all([
          getCategories(),
          getProducts(),
          getPaymentMethods(),
        ]);

      if (!isMounted) return;

      setCategories(cachedCategories);
      setProducts(cachedProducts);
      setPaymentMethods(cachedPaymentMethods);

      // Only keep the spinner up if there was nothing to show yet
      // (first launch with an empty cache).
      if (cachedProducts.length > 0) {
        setProductsLoading(false);
      }

      // 2. Refresh from Supabase in the background.
      const result = await syncCatalogFromSupabase();

      if (!isMounted) return;

      if (result.success) {
        const [freshCategories, freshProducts, freshPaymentMethods] =
          await Promise.all([
            getCategories(),
            getProducts(),
            getPaymentMethods(),
          ]);

        if (!isMounted) return;

        setCategories(freshCategories);
        setProducts(freshProducts);
        setPaymentMethods(freshPaymentMethods);
      }

      setProductsLoading(false);
    };

    loadCatalog();

    return () => {
      isMounted = false;
    };
  }, []);

  const cartTotal = cart.reduce((sum, c) => sum + c.unitPrice * c.quantity, 0);
  const cartItemCount = cart.reduce((sum, c) => sum + c.quantity, 0);

  const handleChargeComplete = () => {
    setIsCartModalVisible(false);
    setIsReceiptVisible(true);
  };

  const handleClearComplete = () => {
    setIsCartModalVisible(false);
  };

  const handleProductSelect = (item: MenuItem) => {
    setSelectedProduct(item);
    setIsOptionModalVisible(true);
  };

  // PanResponder to handle swipe down on Modal Header
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderRelease: (e, gestureState) => {
        if (gestureState.dy > 50) {
          // Swiped down
          setIsCartModalVisible(false);
        }
      },
    }),
  ).current;

  return (
    <View
      style={[
        styles.safeArea,
        // Remove bottom padding to let components manage their own bottom space
        { paddingTop: insets.top },
      ]}
    >
      <Toast />
      <View style={styles.container}>
        {/* MAIN POS AREA */}
        <View style={styles.mainArea}>
          <POSHeader />
          <POSCategories categories={categories} />
          <ProductGrid
            isTablet={isTablet}
            onSelect={handleProductSelect}
            items={products}
            loading={productsLoading}
          />

          {/* Mobile Floating Cart Summary */}
          {!isTablet && cart.length > 0 && (
            <View
              style={[
                styles.mobileCartBar,
                { paddingBottom: insets.bottom || SPACING.md },
              ]}
            >
              <View>
                <AppText style={styles.mobileCartItems}>
                  {cartItemCount} items
                </AppText>
                <AppText style={styles.mobileCartTotal}>
                  ₱{cartTotal.toFixed(2)}
                </AppText>
              </View>
              <TouchableOpacity
                style={styles.viewOrderBtn}
                onPress={() => setIsCartModalVisible(true)}
              >
                <AppText style={styles.viewOrderBtnText}>View Order</AppText>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* TABLET RIGHT SIDEBAR CART */}
        {isTablet && (
          <View style={[styles.sidebarRight, { paddingBottom: insets.bottom }]}>
            <CartSummary
              onChargeComplete={handleChargeComplete}
              onClearComplete={handleClearComplete}
              paymentMethods={paymentMethods}
            />
          </View>
        )}

        {/* MOBILE CART MODAL */}
        <Modal
          visible={isCartModalVisible}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setIsCartModalVisible(false)}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={{ flex: 1 }}
          >
            <View style={[styles.modalContainer]}>
              {/* Draggable Header */}
              <View style={styles.modalHeader} {...panResponder.panHandlers}>
                <View style={styles.dragHandle} />
                <View style={styles.modalHeaderContent}>
                  <AppText style={styles.modalTitle}>Order Summary</AppText>
                  <TouchableOpacity
                    onPress={() => setIsCartModalVisible(false)}
                    style={styles.closeBtn}
                  >
                    <Ionicons name="close" size={28} color={COLORS.text} />
                  </TouchableOpacity>
                </View>
              </View>
              <CartSummary
                onChargeComplete={handleChargeComplete}
                onClearComplete={handleClearComplete}
                paymentMethods={paymentMethods}
              />
            </View>
          </KeyboardAvoidingView>
        </Modal>

        {/* Receipt Modal */}
        <ReceiptModal
          visible={isReceiptVisible}
          onClose={() => setIsReceiptVisible(false)}
          order={orders[0] || null}
        />

        {/* Product Option Modal */}
        <ProductOptionModal
          visible={isOptionModalVisible}
          item={selectedProduct}
          onClose={() => setIsOptionModalVisible(false)}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  container: {
    flex: 1,
    flexDirection: "row",
  },
  mainArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  // Mobile Bottom Bar
  mobileCartBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: SPACING.md,
  },
  mobileCartItems: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textLight,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  mobileCartTotal: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.primary,
  },
  viewOrderBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm + 4,
    borderRadius: BORDER_RADIUS.md,
  },
  viewOrderBtnText: {
    color: COLORS.surface,
    fontWeight: TYPOGRAPHY.weights.bold,
    fontSize: TYPOGRAPHY.sizes.md,
  },

  // Tablet Sidebar
  sidebarRight: {
    width: 360,
    backgroundColor: COLORS.surface,
    borderLeftWidth: 1,
    borderLeftColor: COLORS.border,
  },

  // Modal
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  dragHandle: {
    width: 40,
    height: 5,
    backgroundColor: COLORS.stone300,
    borderRadius: 5,
    alignSelf: "center",
    marginBottom: SPACING.sm,
  },
  modalHeader: {
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  modalHeaderContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.text,
  },
  closeBtn: {
    padding: SPACING.xs,
  },
});
