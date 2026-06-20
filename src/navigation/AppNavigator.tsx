import React from "react";
import { createDrawerNavigator } from "@react-navigation/drawer";
import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, TYPOGRAPHY } from "../constants/theme";

// Import Custom Drawer
import CustomDrawer from "../components/navigation/CustomDrawer";

// Import your new POS Screen
import POSScreen from "../screens/pos/POSScreen";

// A temporary placeholder for your Tickets screen
const TicketsScreen = () => (
  <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
    <Text style={{ fontSize: 20 }}>Tickets Screen Coming Soon</Text>
  </View>
);

const Drawer = createDrawerNavigator();

export default function AppNavigator() {
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
          drawerIcon: ({ color, size }) => <Ionicons name="receipt-outline" size={size} color={color} />
        }}
      />
    </Drawer.Navigator>
  );
}
