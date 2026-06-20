import React from 'react';
import { FlatList, StyleSheet } from 'react-native';
import ProductCard from './ProductCard';
import { usePOSStore } from '../../store/usePOSStore';
import { MENU_ITEMS } from '../../constants/data';
import { SPACING } from '../../constants/theme';

interface ProductGridProps {
  isTablet: boolean;
  onSelect: (item: MenuItem) => void;
}

export default function ProductGrid({ isTablet, onSelect }: ProductGridProps) {
  const { activeCategory, searchQuery } = usePOSStore();

  const filteredItems = MENU_ITEMS.filter((item) => {
    const matchesCategory =
      activeCategory === "All" || item.category === activeCategory;
    const matchesSearch = item.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <FlatList
      data={filteredItems}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <ProductCard item={item} onSelect={onSelect} />}
      contentContainerStyle={styles.productList}
      numColumns={isTablet ? 3 : 1}
      key={isTablet ? "tablet" : "mobile"} 
    />
  );
}

const styles = StyleSheet.create({
  productList: { 
    padding: SPACING.md, 
    paddingBottom: 100 
  },
});
