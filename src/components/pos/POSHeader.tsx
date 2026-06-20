import React from 'react';
import { View, StyleSheet, TouchableOpacity, TextInput, Image, Text, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { usePOSStore } from '../../store/usePOSStore';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../../constants/theme';
import AppText from '../ui/AppText';

export default function POSHeader() {
  const navigation = useNavigation<DrawerNavigationProp<any>>();
  const { isSearchActive, setIsSearchActive, searchQuery, setSearchQuery } = usePOSStore();

  return (
    <View style={styles.header}>
      {!isSearchActive ? (
        <>
          <TouchableOpacity onPress={() => navigation.toggleDrawer()} style={styles.iconButton}>
            <Ionicons name="menu" size={28} color={COLORS.text} />
          </TouchableOpacity>
          
          <View style={styles.logoContainer}>
            <Text style={styles.headerTitle}>Sheilz POS</Text>
          </View>

          <TouchableOpacity onPress={() => setIsSearchActive(true)} style={styles.iconButton}>
            <Ionicons name="search" size={24} color={COLORS.text} />
          </TouchableOpacity>
        </>
      ) : (
        <View style={styles.searchBarContainer}>
          <Ionicons name="search" size={20} color={COLORS.textLight} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search drinks, items..."
            placeholderTextColor={COLORS.stone400}
            autoFocus
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <TouchableOpacity
            onPress={() => {
              setIsSearchActive(false);
              setSearchQuery("");
            }}
          >
            <Ionicons name="close-circle" size={24} color={COLORS.textLight} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    height: 60,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  logo: {
    width: 32,
    height: 32,
  },
  headerTitle: { 
    fontSize: TYPOGRAPHY.sizes.xl, 
    fontWeight: "bold", 
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
    color: COLORS.text 
  },
  iconButton: {
    padding: SPACING.xs,
  },
  searchBarContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    height: 40,
  },
  searchInput: { 
    flex: 1, 
    marginLeft: SPACING.sm, 
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.text,
  },
});
