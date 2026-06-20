import React, { useState, useRef } from "react";
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
import SuccessModal from "../../components/pos/SuccessModal";

// Store & Theme
import { usePOSStore, MenuItem } from "../../store/usePOSStore";
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from "../../constants/theme";
import AppText from "../../components/ui/AppText";
import ProductOptionModal from "../../components/pos/ProductOptionModal";
import { PRICING_RULES, getProductPrice } from "../../constants/pricing";
import Toast from "../../components/ui/Toast";

export default function POSScreen() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isTablet = width >= 768;

  const { cart, addToCart, showToast } = usePOSStore();
  const [isCartModalVisible, setIsCartModalVisible] = useState(false);
  const [isSuccessVisible, setIsSuccessVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<MenuItem | null>(null);
  const [isOptionModalVisible, setIsOptionModalVisible] = useState(false);

  const cartTotal = cart.reduce((sum, c) => sum + c.unitPrice * c.quantity, 0);
  const cartItemCount = cart.reduce((sum, c) => sum + c.quantity, 0);

  const handleChargeComplete = () => {
    setIsCartModalVisible(false);
    setIsSuccessVisible(true);
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
    })
  ).current;

  return (
    <View 
      style={[
        styles.safeArea, 
        // Remove bottom padding to let components manage their own bottom space
        { paddingTop: insets.top }
      ]}
    >
      <Toast />
      <View style={styles.container}>
        {/* MAIN POS AREA */}
        <View style={styles.mainArea}>
          <POSHeader />
          <POSCategories />
          <ProductGrid isTablet={isTablet} onSelect={handleProductSelect} />

          {/* Mobile Floating Cart Summary */}
          {!isTablet && cart.length > 0 && (
            <View style={[styles.mobileCartBar, { paddingBottom: insets.bottom || SPACING.md }]}>
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
            <CartSummary onChargeComplete={handleChargeComplete} onClearComplete={handleClearComplete} />
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
                  <TouchableOpacity onPress={() => setIsCartModalVisible(false)} style={styles.closeBtn}>
                    <Ionicons name="close" size={28} color={COLORS.text} />
                  </TouchableOpacity>
                </View>
              </View>
              <CartSummary onChargeComplete={handleChargeComplete} onClearComplete={handleClearComplete} />
            </View>
          </KeyboardAvoidingView>
        </Modal>

        {/* Success Animation Modal */}
        <SuccessModal visible={isSuccessVisible} onHide={() => setIsSuccessVisible(false)} />

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
    backgroundColor: COLORS.surface 
  },
  container: { 
    flex: 1, 
    flexDirection: "row" 
  },
  mainArea: { 
    flex: 1, 
    backgroundColor: COLORS.background 
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
    fontWeight: TYPOGRAPHY.weights.medium 
  },
  mobileCartTotal: { 
    fontSize: TYPOGRAPHY.sizes.xl, 
    fontWeight: TYPOGRAPHY.weights.bold, 
    color: COLORS.primary 
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
    fontSize: TYPOGRAPHY.sizes.md 
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
    alignSelf: 'center',
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
  }
});
