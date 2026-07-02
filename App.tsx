import "react-native-gesture-handler"; // MUST be at the very top
import React, { useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import AppNavigator from "./src/navigation/AppNavigator";
import {
  useFonts,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
} from "@expo-google-fonts/plus-jakarta-sans";
import { getDB } from "./src/lib/db";
import { usePOSStore } from "./src/store/usePOSStore";

export default function App() {
  let [fontsLoaded] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
  });

  useEffect(() => {
    getDB()
      .then(() => usePOSStore.getState().hydrateOrders())
      .catch((err) => console.error("DB init failed:", err));
  }, []);

  if (!fontsLoaded) {
    return null; // Or a splash screen
  }
  return (
    <NavigationContainer>
      <AppNavigator />
    </NavigationContainer>
  );
}
