import { Platform, StyleSheet } from "react-native";
import {
  COLORS,
  TYPOGRAPHY,
  SPACING,
  BORDER_RADIUS,
} from "../../constants/theme";

// ─── Styles ─────────────────────────────────────────────────────
export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.cream,
  },
  letter: {
  fontSize: TYPOGRAPHY.sizes.xxxl,
  fontFamily: "PlusJakartaSans_600SemiBold",
  color: COLORS.espresso,
},

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    flex: 1,
    marginLeft: SPACING.md,
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.espresso,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  connectDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  connectLabel: {
    fontSize: 12,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },

  // Scroll
  scroll: { flex: 1 },
  scrollContent: {
    padding: SPACING.lg,
    gap: SPACING.md,
  },

  // Hero Card
  heroCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1.5,
    shadowColor: COLORS.espresso,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  heroTop: {
    flexDirection: "row",
    alignItems: "center",
  },
  heroIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  heroInfo: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.full,
    gap: 6,
    marginBottom: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: TYPOGRAPHY.weights.bold,
    letterSpacing: 0.3,
  },
  heroTimestamp: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.stone400,
  },
  heroSuccess: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    justifyContent: "center",
  },
  heroSuccessText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.sage,
    fontWeight: TYPOGRAPHY.weights.medium,
  },

  // Stats Row
  statsRow: {
    flexDirection: "row",
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.xl,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statDivider: {
    width: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.sm,
  },

  // Progress
  progressCard: {
    backgroundColor: COLORS.roseBlushSoft,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
  },
  progressHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: SPACING.sm,
  },
  progressLabel: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: COLORS.roseBlush + "40",
    borderRadius: BORDER_RADIUS.full,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    width: "60%",
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.full,
  },

  // Actions
  actionRow: {
    flexDirection: "row",
    gap: SPACING.sm,
  },
  syncBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.espresso,
    paddingVertical: 14,
    borderRadius: BORDER_RADIUS.lg,
    gap: SPACING.sm,
    shadowColor: COLORS.espresso,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  syncBtnDisabled: {
    backgroundColor: COLORS.stone400,
    opacity: 0.5,
    shadowOpacity: 0,
    elevation: 0,
  },
  syncBtnText: {
    color: COLORS.surface,
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  retryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.brickBg,
    paddingVertical: 14,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    gap: 6,
  },
  retryBtnText: {
    color: COLORS.brick,
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.bold,
  },

  // Section Headers
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: SPACING.sm,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.stone400,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  clearBtn: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.weights.medium,
  },

  // Settings Card
  settingsCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: SPACING.sm,
  },
  settingIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginRight: SPACING.sm,
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.espresso,
  },
  settingSub: {
    fontSize: 12,
    color: COLORS.stone400,
    marginTop: 1,
  },
  settingDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.xs,
    marginLeft: 48,
  },
  netBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.full,
    gap: 5,
  },
  netBadgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  netBadgeText: {
    fontSize: 11,
    fontWeight: TYPOGRAPHY.weights.bold,
    letterSpacing: 0.3,
  },

  // History
  historyCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  emptyHistory: {
    alignItems: "center",
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.lg,
  },
  emptyHistoryIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#F5F0ED",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.md,
  },
  emptyHistoryTitle: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.espresso,
    marginBottom: 4,
  },
  emptyHistoryDesc: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.stone400,
    textAlign: "center",
    lineHeight: 20,
  },
  syncSmallBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.roseBlushSoft,
    alignItems: "center",
    justifyContent: "center",
  },
});
