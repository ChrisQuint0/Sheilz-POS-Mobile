import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions, Easing, Platform } from 'react-native';
import { usePOSStore } from '../../store/usePOSStore';
import { COLORS, TYPOGRAPHY } from '../../constants/theme';

const { width } = Dimensions.get('window');

const APP_NAME = "SHIELZ POS";

export default function SplashScreen() {
  const { setHasFinishedSplash } = usePOSStore();
  
  // Animation values
  const logoScale = useRef(new Animated.Value(0)).current;
  const logoRotate = useRef(new Animated.Value(0)).current;
  const fadeOut = useRef(new Animated.Value(1)).current;
  
  // Array of animated values for each letter
  const letterAnimations = useRef(APP_NAME.split('').map(() => new Animated.Value(0))).current;

  useEffect(() => {
    // 1. Logo Circular Reveal (Scale + Rotate)
    const logoAnim = Animated.parallel([
      Animated.spring(logoScale, {
        toValue: 1,
        tension: 10,
        friction: 4,
        useNativeDriver: true,
      }),
      Animated.timing(logoRotate, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      })
    ]);

    // 2. Wave Text Animation
    const textAnim = Animated.stagger(100, 
      letterAnimations.map(anim => 
        Animated.spring(anim, {
          toValue: 1,
          friction: 6,
          useNativeDriver: true,
        })
      )
    );

    // 3. Fade Out Entire Screen
    const fadeOutAnim = Animated.timing(fadeOut, {
      toValue: 0,
      duration: 500,
      delay: 800, // Hold on screen for a moment
      useNativeDriver: true,
    });

    Animated.sequence([
      logoAnim,
      textAnim,
      fadeOutAnim
    ]).start(() => {
      setHasFinishedSplash(true);
    });
  }, []);

  const spin = logoRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['180deg', '0deg']
  });

  return (
    <Animated.View style={[styles.container, { opacity: fadeOut }]}>
      <Animated.Image
        source={require('../../../assets/shielz_pos_logo.png')}
        style={[
          styles.logo,
          {
            transform: [
              { scale: logoScale },
              { rotate: spin }
            ]
          }
        ]}
        resizeMode="contain"
      />
      
      <View style={styles.textContainer}>
        {APP_NAME.split('').map((char, index) => {
          // Calculate Y translation for the wave effect
          const translateY = letterAnimations[index].interpolate({
            inputRange: [0, 0.5, 1],
            outputRange: [20, -10, 0] // Start low, bounce high, settle
          });
          
          const opacity = letterAnimations[index].interpolate({
            inputRange: [0, 1],
            outputRange: [0, 1]
          });

          return (
            <Animated.Text
              key={index}
              style={[
                styles.letter,
                {
                  opacity,
                  transform: [{ translateY }]
                }
              ]}
            >
              {char === ' ' ? '\u00A0' : char}
            </Animated.Text>
          );
        })}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: width * 0.4,
    height: width * 0.4,
    maxWidth: 200,
    maxHeight: 200,
    marginBottom: 24,
  },
  textContainer: {
    flexDirection: 'row',
  },
  letter: {
    fontSize: TYPOGRAPHY.sizes.xxxl,
    fontWeight: 'bold',
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
    color: COLORS.espresso,
  }
});
