import React, { useState } from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import {
  COLORS,
  TYPOGRAPHY,
  SPACING,
  BORDER_RADIUS,
} from "../../constants/theme";
import AppText from "../../components/ui/AppText";
import { usePOSStore } from "../../store/usePOSStore";
import TicketCarousel from "../../components/tickets/TicketCarousel";

type TabType = "Current" | "Completed" | "Void";

export default function TicketsScreen() {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<TabType>("Current");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isDatePickerVisible, setIsDatePickerVisible] = useState(false);
  const { orders } = usePOSStore();

  const selectedDateKey = getDateKey(selectedDate);

  const filteredOrders = orders.filter((order) => {
    if (getDateKey(new Date(order.timestamp)) !== selectedDateKey) return false;
    if (activeTab === "Current") return order.status === "Current";
    if (activeTab === "Completed") return order.status === "Completed";
    if (activeTab === "Void") return order.status.includes("Void");
    return false;
  });

  const handleDateChange = (event: DateTimePickerEvent, date?: Date) => {
    setIsDatePickerVisible(false);
    if (event.type === "set" && date) {
      setSelectedDate(date);
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={["bottom", "left", "right"]}>
        <View style={styles.topContainer}>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Choose ticket date"
            style={styles.dateButton}
            onPress={() => setIsDatePickerVisible(true)}
          >
            <Ionicons
              name="calendar-outline"
              size={20}
              color={COLORS.primary}
            />
            <AppText style={styles.dateButtonText}>
              {formatDateLabel(selectedDate)}
            </AppText>
            <Ionicons name="chevron-down" size={18} color={COLORS.textLight} />
          </TouchableOpacity>
          {isDatePickerVisible && (
            <DateTimePicker
              value={selectedDate}
              mode="date"
              display="default"
              maximumDate={new Date()}
              onChange={handleDateChange}
            />
          )}
          <View style={styles.tabsContainer}>
            {(["Current", "Completed", "Void"] as TabType[]).map((tab) => (
              <TouchableOpacity
                key={tab}
                style={[styles.tab, activeTab === tab && styles.tabActive]}
                onPress={() => setActiveTab(tab)}
              >
                <AppText
                  style={[
                    styles.tabText,
                    activeTab === tab && styles.tabTextActive,
                  ]}
                >
                  {tab}
                </AppText>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.carouselArea}>
          <TicketCarousel orders={filteredOrders} />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  letter: {
    fontSize: TYPOGRAPHY.sizes.xxxl,
    fontFamily: "PlusJakartaSans_600SemiBold",
    color: COLORS.espresso,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  safeArea: {
    flex: 1,
  },
  topContainer: {
    backgroundColor: COLORS.surface,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.stone200,
  },
  dateButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    gap: SPACING.sm,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.roseBlushSoft,
  },
  dateButtonText: {
    color: COLORS.primary,
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  tabsContainer: {
    flexDirection: "row",
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
  },
  tab: {
    flex: 1,
    paddingVertical: SPACING.sm,
    alignItems: "center",
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: "transparent",
  },
  tabActive: {
    backgroundColor: COLORS.roseBlushSoft,
    borderColor: COLORS.primary,
  },
  tabText: {
    color: COLORS.textLight,
    fontWeight: TYPOGRAPHY.weights.semibold,
    fontSize: TYPOGRAPHY.sizes.md,
  },
  tabTextActive: {
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.weights.semibold,
    fontSize: TYPOGRAPHY.sizes.md,
  },
  carouselArea: {
    flex: 1,
    paddingTop: SPACING.lg,
  },
});

function getDateKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function formatDateLabel(date: Date) {
  const today = new Date();
  if (getDateKey(date) === getDateKey(today)) return "Today";

  return date.toLocaleDateString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
