import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePOSStore } from '../../store/usePOSStore';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../../constants/theme';
import AppText from './AppText';

export default function Toast() {
  const { toastMessage, hideToast } = usePOSStore();
  const translateY = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    if (toastMessage) {
      Animated.spring(translateY, {
        toValue: 60, // slide down from top
        useNativeDriver: true,
        bounciness: 12,
      }).start();

      const timer = setTimeout(() => {
        hideToast();
      }, 2500);
      return () => clearTimeout(timer);
    } else {
      Animated.timing(translateY, {
        toValue: -100,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [toastMessage]);

  return (
    <Animated.View style={[styles.container, { transform: [{ translateY }] }]}>
      <Ionicons name="checkmark-circle" size={24} color={COLORS.surface} />
      <AppText style={styles.text}>{toastMessage}</AppText>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    alignSelf: 'center',
    backgroundColor: COLORS.espresso,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.full,
    elevation: 5,
    shadowColor: COLORS.espresso,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    zIndex: 9999,
  },
  text: {
    color: COLORS.surface,
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.semibold,
    marginLeft: SPACING.sm,
  }
});
