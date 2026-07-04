import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  Alert,
  Switch,
  Animated,
  Easing,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  useSyncStore,
  SyncStatus,
  SyncHistoryEvent,
} from "../../store/useSyncStore";
import { getLastCatalogSyncAt } from "../../services/catalogRepository";
import {
  COLORS,
  TYPOGRAPHY,
  SPACING,
  BORDER_RADIUS,
} from "../../constants/theme";
import AppText from "../../components/ui/AppText";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { DrawerNavigationProp } from "@react-navigation/drawer";
import { styles } from "./SyncScreen.styles";

// ─── Status Helpers ─────────────────────────────────────────────
const STATUS_CONFIG: Record<
  SyncStatus,
  { icon: string; color: string; bg: string; label: string }
> = {
  Synced: {
    icon: "checkmark-circle",
    color: COLORS.sage,
    bg: COLORS.sageBg,
    label: "Synced",
  },
  "Pending Sync": {
    icon: "time-outline",
    color: COLORS.caramel,
    bg: COLORS.caramelBg,
    label: "Pending",
  },
  Syncing: {
    icon: "sync-outline",
    color: COLORS.primary,
    bg: COLORS.roseBlushSoft,
    label: "Syncing",
  },
  "Sync Failed": {
    icon: "close-circle",
    color: COLORS.brick,
    bg: COLORS.brickBg,
    label: "Failed",
  },
  Offline: {
    icon: "cloud-offline-outline",
    color: COLORS.stone400,
    bg: "#F5F0ED",
    label: "Offline",
  },
  Online: {
    icon: "cloud-done-outline",
    color: COLORS.sage,
    bg: COLORS.sageBg,
    label: "Online",
  },
};

// ─── Animated Sync Spinner ──────────────────────────────────────
function SyncSpinner({ color, size = 20 }: { color: string; size?: number }) {
  const spin = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 1200,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [spin]);
  const rotate = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });
  return (
    <Animated.View style={{ transform: [{ rotate }] }}>
      <Ionicons name="sync-outline" size={size} color={color} />
    </Animated.View>
  );
}

// ─── Stat Chip (for the hero card) ──────────────────────────────
function StatChip({
  icon,
  label,
  value,
  color,
}: {
  icon: string;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <View style={chipStyles.container}>
      <View style={[chipStyles.iconWrap, { backgroundColor: color + "18" }]}>
        <Ionicons name={icon as any} size={18} color={color} />
      </View>
      <AppText style={chipStyles.value}>{value}</AppText>
      <AppText style={chipStyles.label}>{label}</AppText>
    </View>
  );
}

const chipStyles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", paddingVertical: SPACING.sm },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  value: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.espresso,
  },
  label: {
    fontSize: 11,
    color: COLORS.stone400,
    marginTop: 2,
    letterSpacing: 0.3,
  },
});

// ─── History Row ────────────────────────────────────────────────
function HistoryRow({
  event,
  isLast,
}: {
  event: SyncHistoryEvent;
  isLast: boolean;
}) {
  const isSuccess = event.result === "Success";
  const dotColor = isSuccess ? COLORS.sage : COLORS.brick;
  const formatDate = (ts: string) => {
    const d = new Date(ts);
    return d.toLocaleDateString([], { month: "short", day: "numeric" });
  };
  const formatTime = (ts: string) => {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };
  const formatDuration = (ms: number) =>
    ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`;

  return (
    <View style={[histStyles.row, !isLast && histStyles.rowBorder]}>
      {/* Timeline dot */}
      <View style={histStyles.timeline}>
        <View style={[histStyles.dot, { backgroundColor: dotColor }]} />
        {!isLast && (
          <View style={[histStyles.line, { backgroundColor: COLORS.border }]} />
        )}
      </View>
      {/* Content */}
      <View style={histStyles.content}>
        <View style={histStyles.topRow}>
          <AppText style={histStyles.title}>
            {isSuccess
              ? `${event.recordsUploaded} records synced`
              : "Sync failed"}
          </AppText>
          <AppText style={histStyles.duration}>
            {formatDuration(event.durationMs)}
          </AppText>
        </View>
        <AppText style={histStyles.time}>
          {formatDate(event.timestamp)} at {formatTime(event.timestamp)}
        </AppText>
        {!isSuccess && event.failureReason && (
          <View style={histStyles.errorBadge}>
            <Ionicons
              name="information-circle-outline"
              size={12}
              color={COLORS.brick}
            />
            <AppText style={histStyles.errorText}>
              {event.failureReason}
            </AppText>
          </View>
        )}
      </View>
    </View>
  );
}

const histStyles = StyleSheet.create({
  row: { flexDirection: "row", paddingBottom: SPACING.md },
  rowBorder: {},
  timeline: { width: 24, alignItems: "center", marginRight: SPACING.sm },
  dot: { width: 10, height: 10, borderRadius: 5, marginTop: 4 },
  line: { width: 2, flex: 1, marginTop: 4 },
  content: { flex: 1 },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.espresso,
  },
  duration: {
    fontSize: 11,
    color: COLORS.stone400,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  time: { fontSize: 11, color: COLORS.stone400, marginTop: 2 },
  errorBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 6,
    backgroundColor: COLORS.brickBg,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  errorText: { fontSize: 11, color: COLORS.brick, flex: 1 },
});

// ─── Main Screen ────────────────────────────────────────────────
export default function SyncScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<DrawerNavigationProp<any>>();
  const {
    status,
    lastSyncTimestamp,
    pendingTransactions,
    pendingInventory,
    failedRecords,
    isAutoSyncEnabled,
    isNetworkConnected,
    syncHistory,
    syncNow,
    retryFailed,
    toggleAutoSync,
    clearHistory,
  } = useSyncStore();

  const totalPending = pendingTransactions + pendingInventory + failedRecords;
  const isSyncing = status === "Syncing";
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG["Online"];

  // Catalog last-sync watermark — read directly from the SQLite meta table
  // via catalogRepository.ts (parent-level read, no store detour, matching
  // how POSScreen.tsx reads the catalog repo directly). Refreshed on focus
  // rather than mount-only, since this is a Drawer screen and drawer screens
  // typically stay mounted between visits.
  const [catalogSyncedAt, setCatalogSyncedAt] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;
      getLastCatalogSyncAt().then((value) => {
        if (isMounted) setCatalogSyncedAt(value);
      });
      useSyncStore.getState().hydrateStats(); // ← added
      return () => {
        isMounted = false;
      };
    }, []),
  );

  // Pulse animation for hero icon
  const pulseAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (isSyncing) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ]),
      );
      loop.start();
      return () => loop.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isSyncing, pulseAnim]);

  const formatTimestamp = (ts: string | null) => {
    if (!ts) return "Never synced";
    const d = new Date(ts);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return "Just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    return d.toLocaleDateString([], {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleSyncNow = async () => {
    if (isSyncing) return;
    await syncNow();
    const currentStatus = useSyncStore.getState().status;
    if (currentStatus === "Synced") {
      Alert.alert(
        "Sync Complete",
        "All records have been synchronized with the cloud.",
      );
    } else if (currentStatus === "Sync Failed") {
      Alert.alert(
        "Sync Failed",
        "Some records could not be synchronized. Please retry or check your connection.",
      );
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* ── Header ───────────────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.toggleDrawer()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="menu-outline" size={26} color={COLORS.espresso} />
        </TouchableOpacity>
        <AppText style={styles.headerTitle}>Data Sync</AppText>
        <View style={styles.headerRight}>
          <View
            style={[
              styles.connectDot,
              {
                backgroundColor: isNetworkConnected
                  ? COLORS.sage
                  : COLORS.stone400,
              },
            ]}
          />
          <AppText
            style={[
              styles.connectLabel,
              { color: isNetworkConnected ? COLORS.sage : COLORS.stone400 },
            ]}
          >
            {isNetworkConnected ? "Online" : "Offline"}
          </AppText>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + SPACING.xxl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero Status Card ────────────────────────────────── */}
        <View style={[styles.heroCard, { borderColor: cfg.color + "30" }]}>
          <View style={styles.heroTop}>
            <Animated.View
              style={[
                styles.heroIconWrap,
                { backgroundColor: cfg.bg, transform: [{ scale: pulseAnim }] },
              ]}
            >
              {isSyncing ? (
                <SyncSpinner color={cfg.color} size={28} />
              ) : (
                <Ionicons name={cfg.icon as any} size={28} color={cfg.color} />
              )}
            </Animated.View>
            <View style={styles.heroInfo}>
              <View style={[styles.statusPill, { backgroundColor: cfg.bg }]}>
                <View
                  style={[styles.statusDot, { backgroundColor: cfg.color }]}
                />
                <AppText style={[styles.statusPillText, { color: cfg.color }]}>
                  {cfg.label}
                </AppText>
              </View>
              <AppText style={styles.heroTimestamp}>
                {isSyncing
                  ? "Synchronizing data..."
                  : formatTimestamp(lastSyncTimestamp)}
              </AppText>
            </View>
          </View>

          {/* Success empty state */}
          {status === "Synced" && totalPending === 0 && (
            <View style={styles.heroSuccess}>
              <Ionicons
                name="shield-checkmark-outline"
                size={16}
                color={COLORS.sage}
              />
              <AppText style={styles.heroSuccessText}>
                All data is up to date
              </AppText>
            </View>
          )}
        </View>

        {/* ── Queue Stats ─────────────────────────────────────── */}
        <View style={styles.statsRow}>
          <StatChip
            icon="receipt-outline"
            label="Transactions"
            value={pendingTransactions}
            color={COLORS.caramel}
          />
          <View style={styles.statDivider} />
          <StatChip
            icon="cube-outline"
            label="Inventory"
            value={pendingInventory}
            color={COLORS.primary}
          />
          <View style={styles.statDivider} />
          <StatChip
            icon="alert-circle-outline"
            label="Failed"
            value={failedRecords}
            color={COLORS.brick}
          />
        </View>

        {/* ── Sync Progress (when syncing) ────────────────────── */}
        {isSyncing && (
          <View style={styles.progressCard}>
            <View style={styles.progressHeader}>
              <SyncSpinner color={COLORS.primary} size={16} />
              <AppText style={styles.progressLabel}>
                Uploading to cloud...
              </AppText>
            </View>
            <View style={styles.progressBarBg}>
              <View style={styles.progressBarFill} />
            </View>
          </View>
        )}

        {/* ── Action Buttons ──────────────────────────────────── */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[
              styles.syncBtn,
              (isSyncing || (!totalPending && !failedRecords)) &&
                styles.syncBtnDisabled,
            ]}
            onPress={handleSyncNow}
            disabled={isSyncing || (!totalPending && !failedRecords)}
            activeOpacity={0.8}
          >
            {isSyncing ? (
              <ActivityIndicator size="small" color={COLORS.surface} />
            ) : (
              <Ionicons
                name="cloud-upload-outline"
                size={20}
                color={COLORS.surface}
              />
            )}
            <AppText style={styles.syncBtnText}>
              {isSyncing ? "Syncing..." : "Sync Now"}
            </AppText>
          </TouchableOpacity>

          {failedRecords > 0 && (
            <TouchableOpacity
              style={[styles.retryBtn, isSyncing && { opacity: 0.4 }]}
              onPress={() => retryFailed()}
              disabled={isSyncing}
              activeOpacity={0.7}
            >
              <Ionicons name="refresh-outline" size={18} color={COLORS.brick} />
              <AppText style={styles.retryBtnText}>Retry</AppText>
            </TouchableOpacity>
          )}
        </View>

        {/* ── Settings ────────────────────────────────────────── */}
        <View style={styles.sectionHeader}>
          <AppText style={styles.sectionTitle}>Settings</AppText>
        </View>
        <View style={styles.settingsCard}>
          <View style={styles.settingRow}>
            <View
              style={[
                styles.settingIconWrap,
                { backgroundColor: COLORS.sageBg },
              ]}
            >
              <Ionicons name="wifi-outline" size={18} color={COLORS.sage} />
            </View>
            <View style={styles.settingInfo}>
              <AppText style={styles.settingLabel}>Network</AppText>
              <AppText style={styles.settingSub}>
                {isNetworkConnected
                  ? "Connected to Internet"
                  : "No connection detected"}
              </AppText>
            </View>
            <View
              style={[
                styles.netBadge,
                {
                  backgroundColor: isNetworkConnected
                    ? COLORS.sageBg
                    : "#F5F0ED",
                },
              ]}
            >
              <View
                style={[
                  styles.netBadgeDot,
                  {
                    backgroundColor: isNetworkConnected
                      ? COLORS.sage
                      : COLORS.stone400,
                  },
                ]}
              />
              <AppText
                style={[
                  styles.netBadgeText,
                  { color: isNetworkConnected ? COLORS.sage : COLORS.stone400 },
                ]}
              >
                {isNetworkConnected ? "Online" : "Offline"}
              </AppText>
            </View>
          </View>

          <View style={styles.settingDivider} />

          <View style={styles.settingRow}>
            <View
              style={[
                styles.settingIconWrap,
                { backgroundColor: COLORS.caramelBg },
              ]}
            >
              <Ionicons
                name="repeat-outline"
                size={18}
                color={COLORS.caramel}
              />
            </View>
            <View style={styles.settingInfo}>
              <AppText style={styles.settingLabel}>Auto Sync</AppText>
              <AppText style={styles.settingSub}>
                {isAutoSyncEnabled
                  ? "Syncs when data changes"
                  : "Manual sync only"}
              </AppText>
            </View>
            <Switch
              value={isAutoSyncEnabled}
              onValueChange={toggleAutoSync}
              trackColor={{ false: COLORS.stone200, true: COLORS.sage }}
              thumbColor={COLORS.surface}
            />
          </View>

          <View style={styles.settingDivider} />

          <View style={styles.settingRow}>
            <View
              style={[
                styles.settingIconWrap,
                { backgroundColor: COLORS.roseBlushSoft },
              ]}
            >
              <Ionicons
                name="storefront-outline"
                size={18}
                color={COLORS.primary}
              />
            </View>
            <View style={styles.settingInfo}>
              <AppText style={styles.settingLabel}>Product Catalog</AppText>
              <AppText style={styles.settingSub}>
                {catalogSyncedAt
                  ? `Last updated ${formatTimestamp(catalogSyncedAt)}`
                  : "Not yet synced"}
              </AppText>
            </View>
          </View>
        </View>

        {/* ── History ─────────────────────────────────────────── */}
        <View style={styles.sectionHeader}>
          <AppText style={styles.sectionTitle}>Recent Activity</AppText>
          {syncHistory.length > 0 && (
            <TouchableOpacity
              onPress={clearHistory}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <AppText style={styles.clearBtn}>Clear</AppText>
            </TouchableOpacity>
          )}
        </View>

        {syncHistory.length === 0 ? (
          <View style={styles.emptyHistory}>
            <View style={styles.emptyHistoryIcon}>
              <Ionicons name="time-outline" size={28} color={COLORS.stone400} />
            </View>
            <AppText style={styles.emptyHistoryTitle}>No activity yet</AppText>
            <AppText style={styles.emptyHistoryDesc}>
              Sync events will appear here once data has been uploaded.
            </AppText>
          </View>
        ) : (
          <View style={styles.historyCard}>
            {syncHistory.slice(0, 10).map((event, i) => (
              <HistoryRow
                key={event.id}
                event={event}
                isLast={i === Math.min(syncHistory.length, 10) - 1}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
