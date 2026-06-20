import React from "react";
import { createDrawerNavigator } from "@react-navigation/drawer";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { View, Text, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, TYPOGRAPHY } from "../constants/theme";

// Auth Screens
import SplashScreen from "../screens/auth/SplashScreen";
import LoginScreen from "../screens/auth/LoginScreen";

// Import Custom Drawer
import CustomDrawer from "../components/navigation/CustomDrawer";

// Import your new POS Screen
import POSScreen from "../screens/pos/POSScreen";

// Import Tickets Screen
import TicketsScreen from "../screens/pos/TicketsScreen";

// Store
import { usePOSStore } from "../store/usePOSStore";

const Drawer = createDrawerNavigator();
const Stack = createNativeStackNavigator();

function MainDrawerNavigator() {
  return (
    <Drawer.Navigator
      initialRouteName="Orders"
      drawerContent={(props) => <CustomDrawer {...props} />}
      screenOptions={{
        drawerActiveTintColor: COLORS.espresso,
        drawerInactiveTintColor: COLORS.textLight,
        drawerActiveBackgroundColor: COLORS.stone100,
        drawerStyle: {
          backgroundColor: COLORS.surface,
          width: '80%', // Standard width
        },
        drawerLabelStyle: {
          fontWeight: TYPOGRAPHY.weights.semibold,
          fontSize: TYPOGRAPHY.sizes.sm,
        },
        drawerItemStyle: {
          marginVertical: 8,
          borderRadius: 8,
        }
      }}
    >
      {/* We hide the default header because we built a custom one inside POSScreen */}
      <Drawer.Screen
        name="Orders"
        component={POSScreen}
        options={{ 
          headerShown: false,
          drawerIcon: ({ color, size }) => <Ionicons name="grid-outline" size={size} color={color} />
        }}
      />
      <Drawer.Screen 
        name="Tickets" 
        component={TicketsScreen} 
        options={{
          headerTitle: () => (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="receipt-outline" size={20} color={COLORS.espresso} />
              <Text style={{ 
                fontSize: 18, 
                fontWeight: 'bold', 
                color: COLORS.espresso, 
                fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }) 
              }}>Order Tickets</Text>
            </View>
          ),
          drawerIcon: ({ color, size }) => <Ionicons name="receipt-outline" size={size} color={color} />
        }}
      />
    </Drawer.Navigator>
  );
}

export default function AppNavigator() {
  const { isAuthenticated, hasFinishedSplash } = usePOSStore();

  if (!hasFinishedSplash) {
    return <SplashScreen />;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
      {!isAuthenticated ? (
        <Stack.Screen name="Login" component={LoginScreen} />
      ) : (
        <Stack.Screen name="Main" component={MainDrawerNavigator} />
      )}
    </Stack.Navigator>
  );
}
