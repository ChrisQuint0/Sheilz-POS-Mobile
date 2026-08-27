import React, { useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import {
  getAllCustomersDebug,
  type Customer,
} from "../../services/customerRepository";
import { KeyboardAvoidingView, Platform } from "react-native";
import {
  CameraView,
  useCameraPermissions,
  type BarcodeScanningResult,
} from "expo-camera";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { DrawerNavigationProp } from "@react-navigation/drawer";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AppText from "../../components/ui/AppText";
import { usePOSStore } from "../../store/usePOSStore";
import { useSyncStore } from "../../store/useSyncStore";
import { useCustomerStore } from "../../store/useCustomerStore";
import { syncCustomersFromSupabase } from "../../services/customerSyncService";
import {
  COLORS,
  TYPOGRAPHY,
  SPACING,
  BORDER_RADIUS,
} from "../../constants/theme";

const CORNER_SIZE = 28;
const CORNER_THICKNESS = 3;

function ScannerFrame() {
  return (
    <View style={frameStyles.container} pointerEvents="none">
      <View style={[frameStyles.corner, frameStyles.topLeft]} />
      <View style={[frameStyles.corner, frameStyles.topRight]} />
      <View style={[frameStyles.corner, frameStyles.bottomLeft]} />
      <View style={[frameStyles.corner, frameStyles.bottomRight]} />
    </View>
  );
}

const frameStyles = StyleSheet.create({
  container: { ...StyleSheet.absoluteFillObject },
  corner: {
    position: "absolute",
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    borderColor: COLORS.primary,
  },
  topLeft: {
    top: SPACING.md,
    left: SPACING.md,
    borderTopWidth: CORNER_THICKNESS,
    borderLeftWidth: CORNER_THICKNESS,
    borderTopLeftRadius: 8,
  },
  topRight: {
    top: SPACING.md,
    right: SPACING.md,
    borderTopWidth: CORNER_THICKNESS,
    borderRightWidth: CORNER_THICKNESS,
    borderTopRightRadius: 8,
  },
  bottomLeft: {
    bottom: SPACING.md,
    left: SPACING.md,
    borderBottomWidth: CORNER_THICKNESS,
    borderLeftWidth: CORNER_THICKNESS,
    borderBottomLeftRadius: 8,
  },
  bottomRight: {
    bottom: SPACING.md,
    right: SPACING.md,
    borderBottomWidth: CORNER_THICKNESS,
    borderRightWidth: CORNER_THICKNESS,
    borderBottomRightRadius: 8,
  },
});

function LoyaltyStamps({
  progress,
  required,
}: {
  progress: number;
  required: number | null;
}) {
  const total = required ?? Math.max(progress, 10);
  const dots = Array.from({ length: total }, (_, i) => i < progress);
  return (
    <View style={stampStyles.grid}>
      {dots.map((filled, i) => (
        <View
          key={i}
          style={[
            stampStyles.dot,
            filled ? stampStyles.dotFilled : stampStyles.dotEmpty,
          ]}
        >
          <Ionicons
            name="cafe"
            size={16}
            color={filled ? COLORS.surface : COLORS.textLight}
          />
        </View>
      ))}
    </View>
  );
}

const stampStyles = StyleSheet.create({
  grid: { flexDirection: "row", flexWrap: "wrap", gap: SPACING.sm },
  dot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  dotFilled: { backgroundColor: COLORS.primary },
  dotEmpty: {
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
});

function displayName(c: {
  first_name: string | null;
  last_name: string | null;
}) {
  const name = `${c.first_name ?? ""} ${c.last_name ?? ""}`.trim();
  return name || "Unnamed Customer";
}

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatLastVisit(iso: string | null) {
  if (!iso) return "No visits recorded on this device yet";
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffHr = Math.floor(diffMs / 3600000);
  if (diffHr < 1) return "Less than an hour ago";
  if (diffHr < 24) return `${diffHr}h ago`;
  return `${Math.floor(diffHr / 24)}d ago`;
}

export default function CustomerManagementScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<DrawerNavigationProp<any>>();
  const [permission, requestPermission] = useCameraPermissions();
  const [manualCardId, setManualCardId] = useState("");
  const [hasScannedOnce, setHasScannedOnce] = useState(false);
  const [debugCustomers, setDebugCustomers] = useState<Customer[]>([]);
  useFocusEffect(
    useCallback(() => {
      getAllCustomersDebug().then(setDebugCustomers);
    }, []),
  );
  useFocusEffect(
    useCallback(() => {
      if (useSyncStore.getState().isNetworkConnected) {
        syncCustomersFromSupabase().catch((err) => {
          console.warn("Background customer sync on screen focus failed:", err);
        });
      }
    }, []),
  );

  useFocusEffect(
    useCallback(() => {
      // Refresh the customer cache automatically on focus, so the cashier
      // doesn't need to visit SyncScreen's manual "Customer Data" sync
      // button first. Offline: no-op — whatever's cached (however stale)
      // is shown, same as before this change. SyncScreen itself is
      // untouched and still works as the manual fallback.
      if (useSyncStore.getState().isNetworkConnected) {
        syncCustomersFromSupabase().catch((err) => {
          console.warn("Background customer sync on screen focus failed:", err);
        });
      }
    }, []),
  );

  const setActiveCustomer = usePOSStore((s) => s.setActiveCustomer);
  const showToast = usePOSStore((s) => s.showToast);
  const activeReward = usePOSStore((s) => s.activeReward);

  const {
    isLoading,
    error,
    foundCustomer,
    pointsRequired,
    lastVisit,
    isDrawerVisible,
    lookupByCardNumber,
    closeDrawer,
    reset,
  } = useCustomerStore();

  const handleBarcodeScanned = useCallback(
    (result: BarcodeScanningResult) => {
      if (hasScannedOnce) return; // debounce until the drawer closes/resets
      setHasScannedOnce(true);
      lookupByCardNumber(result.data);
    },
    [hasScannedOnce, lookupByCardNumber],
  );

  const handleManualSubmit = () => {
    if (!manualCardId.trim()) return;
    lookupByCardNumber(manualCardId.trim());
  };

  const handleCloseDrawer = () => {
    closeDrawer();
    reset();
    setHasScannedOnce(false);
    setManualCardId("");
  };

  const handleAttach = () => {
    if (!foundCustomer) return;
    setActiveCustomer({
      id: foundCustomer.id,
      card_number: foundCustomer.card_number,
      first_name: foundCustomer.first_name,
      last_name: foundCustomer.last_name,
      loyalty_progress: foundCustomer.loyalty_progress,
    });
    showToast(`${displayName(foundCustomer)} attached to current order`);
    handleCloseDrawer();
  };
  const handleScanButtonPress = async () => {
    if (!permission?.granted) {
      await requestPermission();
      return;
    }
    setHasScannedOnce(false);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.toggleDrawer()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="menu-outline" size={26} color={COLORS.espresso} />
        </TouchableOpacity>
        <AppText style={styles.headerTitle}>Customer Management</AppText>
        <View style={{ width: 26 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? insets.top : 0}
      >
        <View style={styles.content}>
          <View style={styles.scannerCard}>
            <View style={styles.cameraBox}>
              {!permission?.granted ? (
                <TouchableOpacity
                  style={styles.permissionPrompt}
                  onPress={requestPermission}
                >
                  <Ionicons
                    name="camera-outline"
                    size={32}
                    color={COLORS.textLight}
                  />
                  <AppText style={styles.permissionText}>
                    Tap to allow camera access for QR scanning
                  </AppText>
                </TouchableOpacity>
              ) : (
                <>
                  <CameraView
                    style={StyleSheet.absoluteFillObject}
                    facing="back"
                    barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
                    onBarcodeScanned={
                      hasScannedOnce ? undefined : handleBarcodeScanned
                    }
                  />
                  <ScannerFrame />
                  <AppText style={styles.cameraHint}>
                    Point the camera at the customer's digital card
                  </AppText>
                </>
              )}
            </View>

            <TouchableOpacity
              style={styles.scanBtn}
              onPress={handleScanButtonPress}
              activeOpacity={0.85}
            >
              <Ionicons name="scan-outline" size={18} color={COLORS.surface} />
              <AppText style={styles.scanBtnText}>
                {hasScannedOnce ? "Scan Again" : "Scan QR Code"}
              </AppText>
            </TouchableOpacity>
          </View>

          <AppText style={styles.orDivider}>OR ENTER CARD ID MANUALLY</AppText>
          <TextInput
            style={styles.input}
            placeholder="Customer ID · e.g. 20260819-123456789"
            placeholderTextColor={COLORS.textLight}
            value={manualCardId}
            onChangeText={setManualCardId}
            keyboardType="default"
            autoCapitalize="none"
          />
          {error && (
            <View style={styles.debugBox}>
              <AppText style={styles.debugTitle}>
                Local cache: {debugCustomers.length} customer(s)
              </AppText>
              {debugCustomers.map((c) => (
                <AppText key={c.id} style={styles.debugRow}>
                  #{c.card_number} — {c.first_name ?? "?"} {c.last_name ?? "?"}{" "}
                  (id {c.id})
                </AppText>
              ))}
            </View>
          )}

          <TouchableOpacity
            style={[styles.submitBtn, isLoading && styles.submitBtnDisabled]}
            onPress={handleManualSubmit}
            disabled={isLoading}
            activeOpacity={0.85}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={COLORS.surface} />
            ) : (
              <AppText style={styles.submitBtnText}>Submit</AppText>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
      <Modal
        visible={isDrawerVisible}
        transparent
        animationType="slide"
        onRequestClose={handleCloseDrawer}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.drawerContent,
              { paddingBottom: insets.bottom + SPACING.lg },
            ]}
          >
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={handleCloseDrawer}
            >
              <Ionicons name="close" size={20} color={COLORS.textLight} />
            </TouchableOpacity>

            {foundCustomer && (
              <>
                <View style={styles.avatarCircle}>
                  <AppText style={styles.avatarInitials}>
                    {(foundCustomer.first_name?.[0] ?? "") +
                      (foundCustomer.last_name?.[0] ?? "")}
                  </AppText>
                </View>
                <AppText style={styles.customerName}>
                  {displayName(foundCustomer)}
                </AppText>
                <AppText style={styles.cardNumber}>
                  {foundCustomer.card_number}
                </AppText>
                <AppText style={styles.memberSince}>
                  Member since {formatDate(foundCustomer.membership_date)}
                </AppText>

                <View style={styles.stampsCard}>
                  <View style={styles.stampsHeader}>
                    <AppText style={styles.stampsLabel}>LOYALTY STAMPS</AppText>
                    <AppText style={styles.stampsCount}>
                      {foundCustomer.loyalty_progress}/{pointsRequired ?? "—"}
                    </AppText>
                  </View>
                  <LoyaltyStamps
                    progress={foundCustomer.loyalty_progress}
                    required={pointsRequired}
                  />
                  {pointsRequired !== null && (
                    <View style={styles.remainingPill}>
                      <AppText style={styles.remainingText}>
                        {Math.max(
                          pointsRequired - foundCustomer.loyalty_progress,
                          0,
                        )}{" "}
                        more purchases until{" "}
                        {activeReward?.reward_type ?? "the next reward"}
                      </AppText>
                    </View>
                  )}
                </View>

                <View style={styles.lastVisitRow}>
                  <AppText style={styles.lastVisitLabel}>LAST VISIT</AppText>
                  <AppText style={styles.lastVisitValue}>
                    {formatLastVisit(lastVisit)}
                  </AppText>
                </View>

                <TouchableOpacity
                  style={styles.attachBtn}
                  onPress={handleAttach}
                  activeOpacity={0.85}
                >
                  <AppText style={styles.attachBtnText}>
                    Attach to Current Order
                  </AppText>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleCloseDrawer}>
                  <AppText style={styles.cancelText}>Cancel</AppText>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  debugBox: {
    backgroundColor: COLORS.stone100,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
    marginBottom: SPACING.md,
  },
  debugTitle: {
    fontSize: 11,
    color: COLORS.textLight,
    marginBottom: 4,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  debugRow: { fontSize: 11, color: COLORS.textLight },
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.espresso,
  },
  content: { flex: 1, paddingHorizontal: SPACING.md },
  scannerCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  cameraBox: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: BORDER_RADIUS.md,
    overflow: "hidden",
    backgroundColor: COLORS.stone200,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: SPACING.md,
  },
  permissionPrompt: {
    alignItems: "center",
    padding: SPACING.lg,
    gap: SPACING.sm,
  },
  permissionText: { color: COLORS.textLight, textAlign: "center" },
  cameraHint: {
    position: "absolute",
    bottom: SPACING.lg,
    left: SPACING.lg,
    right: SPACING.lg,
    textAlign: "center",
    color: COLORS.textLight,
    fontSize: TYPOGRAPHY.sizes.sm,
  },
  scanBtn: {
    flexDirection: "row",
    gap: SPACING.sm,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.md,
    alignItems: "center",
    justifyContent: "center",
  },
  scanBtnText: {
    color: COLORS.surface,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  orDivider: {
    textAlign: "center",
    color: COLORS.textLight,
    fontSize: 11,
    letterSpacing: 1,
    marginBottom: SPACING.md,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    color: COLORS.text,
  },
  errorText: {
    color: COLORS.brick,
    marginBottom: SPACING.sm,
    fontSize: TYPOGRAPHY.sizes.sm,
  },
  submitBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.md,
    alignItems: "center",
    justifyContent: "center",
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: {
    color: COLORS.surface,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  drawerContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: BORDER_RADIUS.lg,
    borderTopRightRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    alignItems: "center",
  },
  closeBtn: { alignSelf: "flex-end", padding: SPACING.xs },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.sm,
  },
  avatarInitials: {
    color: COLORS.surface,
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  customerName: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.espresso,
  },
  cardNumber: { color: COLORS.textLight, marginTop: 2 },
  memberSince: {
    color: COLORS.textLight,
    fontSize: TYPOGRAPHY.sizes.sm,
    marginBottom: SPACING.md,
  },
  stampsCard: {
    width: "100%",
    backgroundColor: COLORS.stone100,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  stampsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: SPACING.sm,
  },
  stampsLabel: { fontSize: 11, color: COLORS.textLight, letterSpacing: 1 },
  stampsCount: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.espresso,
  },
  remainingPill: {
    marginTop: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
  },
  remainingText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.text,
    textAlign: "center",
  },
  lastVisitRow: { width: "100%", marginBottom: SPACING.lg },
  lastVisitLabel: {
    fontSize: 11,
    color: COLORS.textLight,
    letterSpacing: 1,
    marginBottom: 2,
  },
  lastVisitValue: { fontSize: TYPOGRAPHY.sizes.sm, color: COLORS.text },
  attachBtn: {
    width: "100%",
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.md,
    alignItems: "center",
    marginBottom: SPACING.sm,
  },
  attachBtnText: {
    color: COLORS.surface,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  cancelText: {
    color: COLORS.textLight,
    textAlign: "center",
    padding: SPACING.sm,
  },
});
