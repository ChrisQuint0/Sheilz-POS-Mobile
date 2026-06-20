import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';
import { TYPOGRAPHY } from '../../constants/theme';

interface AppTextProps extends TextProps {
  weight?: 'regular' | 'medium' | 'semibold' | 'bold';
}

export default function AppText({ style, weight, ...props }: AppTextProps) {
  // Determine font family based on weight or flatten the passed style to find fontWeight
  let fontFamily = TYPOGRAPHY.fonts.regular;

  const flattenedStyle = StyleSheet.flatten(style) || {};
  const explicitWeight = weight || flattenedStyle.fontWeight;

  if (explicitWeight === '500' || explicitWeight === 'medium') {
    fontFamily = TYPOGRAPHY.fonts.medium;
  } else if (explicitWeight === '600' || explicitWeight === 'semibold' || explicitWeight === 'bold' && flattenedStyle.fontWeight !== 'bold') {
    // Note: if style explicitly has fontWeight: 'bold' we'll catch it below
    fontFamily = TYPOGRAPHY.fonts.semibold;
  } else if (explicitWeight === '700' || explicitWeight === 'bold' || explicitWeight === '800') {
    fontFamily = TYPOGRAPHY.fonts.bold;
  }

  return (
    <Text 
      {...props} 
      style={[
        { fontFamily }, 
        style, 
        // We override fontWeight because custom fonts require the weight to be undefined or matched correctly on Android sometimes,
        // but leaving it is usually fine.
      ]} 
    />
  );
}
