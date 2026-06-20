import React, { useState } from 'react';
import { View, StyleSheet, SafeAreaView, Image, Text, Platform, Modal, TextInput, TouchableOpacity } from 'react-native';
import { DrawerContentScrollView, DrawerItemList, DrawerContentComponentProps } from '@react-navigation/drawer';
import { usePOSStore } from '../../store/usePOSStore';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../../constants/theme';
import AppText from '../ui/AppText';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function CustomDrawer(props: DrawerContentComponentProps) {
  const { cashierName, setCashierName } = usePOSStore();
  const insets = useSafeAreaInsets();
  
  const [isProfileModalVisible, setIsProfileModalVisible] = useState(false);
  const [tempName, setTempName] = useState(cashierName);
  
  // Get initials for the profile circle (e.g. "Joshua T." -> "JT")
  const initials = cashierName
    .trim()
    .split(' ')
    .map(n => n ? n[0] : '')
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <SafeAreaView style={styles.container}>
      <DrawerContentScrollView {...props} contentContainerStyle={styles.scrollContent}>
        {/* Brand Logo Section */}
        <View style={styles.logoSection}>
          <Image 
            source={require('../../../assets/shielz_pos_logo.png')} 
            style={styles.logoImage} 
            resizeMode="contain" 
          />
          <View style={styles.brandTextContainer}>
            <Text style={styles.brandTitle}>Sheilz Coffee</Text>
          </View>
        </View>

        {/* Navigation Items */}
        <View style={styles.navItems}>
          <DrawerItemList {...props} />
        </View>
      </DrawerContentScrollView>

      {/* User Profile Section at Bottom */}
      <TouchableOpacity 
        style={[styles.profileSection, { paddingBottom: Math.max(insets.bottom, SPACING.md) }]}
        onPress={() => {
          setTempName(cashierName);
          setIsProfileModalVisible(true);
        }}
      >
        <View style={styles.profileCircle}>
          <AppText style={styles.profileInitials}>{initials}</AppText>
        </View>
        <View style={styles.profileInfo}>
          <AppText style={styles.profileRole}>CASHIER</AppText>
          <AppText style={styles.profileName}>{cashierName}</AppText>
        </View>
      </TouchableOpacity>

      {/* Edit Profile Modal */}
      <Modal visible={isProfileModalVisible} transparent animationType="fade" onRequestClose={() => setIsProfileModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <AppText style={styles.modalTitle}>Update Profile</AppText>
            <TextInput
              style={styles.modalInput}
              value={tempName}
              onChangeText={setTempName}
              placeholder="First Last"
              placeholderTextColor={COLORS.stone400}
              autoFocus
            />
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setIsProfileModalVisible(false)} style={styles.modalBtn}>
                <AppText style={styles.modalBtnText}>Cancel</AppText>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={() => {
                  if (tempName.trim()) {
                    setCashierName(tempName.trim());
                  }
                  setIsProfileModalVisible(false);
                }} 
                style={[styles.modalBtn, styles.modalBtnPrimary]}
              >
                <AppText style={styles.modalBtnTextPrimary}>Save</AppText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  scrollContent: {
    flexGrow: 1,
  },
  logoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    marginBottom: SPACING.md,
  },
  logoImage: {
    width: 64,
    height: 64,
    marginRight: SPACING.md,
  },
  brandTextContainer: {
    flex: 1,
  },
  brandTitle: {
    color: COLORS.espresso,
    fontSize: TYPOGRAPHY.sizes.lg,
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
    fontWeight: 'bold',
  },
  navItems: {
    flex: 1,
    paddingHorizontal: SPACING.sm,
  },
  profileSection: {
    flexDirection: 'row',
    padding: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    alignItems: 'center',
  },
  profileCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.stone200,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  profileInitials: {
    color: COLORS.espresso,
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  profileInfo: {
    flex: 1,
  },
  profileRole: {
    color: COLORS.textLight,
    fontSize: 10,
    fontWeight: TYPOGRAPHY.weights.bold,
    letterSpacing: 1,
    marginBottom: 2,
  },
  profileName: {
    color: COLORS.espresso,
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    backgroundColor: COLORS.surface,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    elevation: 5,
    shadowColor: COLORS.espresso,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  modalTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.espresso,
    marginBottom: SPACING.md,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.text,
    fontFamily: TYPOGRAPHY.fonts.regular,
    marginBottom: SPACING.lg,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: SPACING.md,
  },
  modalBtn: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  modalBtnPrimary: {
    backgroundColor: COLORS.primary,
  },
  modalBtnText: {
    color: COLORS.textLight,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  modalBtnTextPrimary: {
    color: COLORS.surface,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
});
