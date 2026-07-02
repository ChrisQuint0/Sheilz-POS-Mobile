import React from "react";
import { FlatList, StyleSheet, View, ActivityIndicator } from "react-native";
import ProductCard from "./ProductCard";
import { usePOSStore, MenuItem } from "../../store/usePOSStore";
import { COLORS, SPACING, TYPOGRAPHY } from "../../constants/theme";
import AppText from "../ui/AppText";

interface ProductGridProps {
  isTablet: boolean;
  onSelect: (item: MenuItem) => void;
  items: MenuItem[];
  loading?: boolean;
}

export default function ProductGrid({
  isTablet,
  onSelect,
  items,
  loading,
}: ProductGridProps) {
  const { activeCategory, searchQuery } = usePOSStore();

  const filteredItems = items
    .filter((item) => {
      const matchesCategory =
        activeCategory === "All" || item.category === activeCategory;
      const matchesSearch = item.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  if (loading && items.length === 0) {
    return (
      <View style={styles.centerState}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <FlatList
      data={filteredItems}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <ProductCard item={item} onSelect={onSelect} />}
      contentContainerStyle={styles.productList}
      numColumns={isTablet ? 3 : 1}
      key={isTablet ? "tablet" : "mobile"}
      ListEmptyComponent={
        !loading ? (
          <View style={styles.centerState}>
            <AppText style={styles.emptyText}>No products found</AppText>
          </View>
        ) : null
      }
    />
  );
}

const styles = StyleSheet.create({
  productList: {
    padding: SPACING.md,
    paddingBottom: 100,
  },
  centerState: {
    padding: SPACING.xl,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textLight,
  },
});
