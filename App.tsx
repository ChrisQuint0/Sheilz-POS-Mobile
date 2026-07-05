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
import { useAppStateSync } from "./src/hooks/useAppStateSync";
// Importing this module (for its side effect) registers the
// TaskManager.defineTask call in global scope, as required by Phase 7 —
// this must happen before registerBackgroundSync() is called below.
import { registerBackgroundSync } from "./src/lib/backgroundSync";

export default function App() {
  let [fontsLoaded] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
  });

  useEffect(() => {
    getDB()
      .then(() =>
        Promise.all([
          usePOSStore.getState().hydrateOrders(),
          usePOSStore.getState().initOrderSequence(),
        ]),
      )
      .catch((err) => console.error("DB init failed:", err));
  }, []);

  useAppStateSync(); // ← added

  useEffect(() => {
    // Registration itself doesn't depend on getDB() resolving — it just
    // tells the OS scheduler about the task. The task body (runSync(),
    // via backgroundSync.ts) calls getDB() lazily whenever the OS actually
    // invokes it, same as every other runSync() call site. ← added (Phase 7)
    registerBackgroundSync();
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
