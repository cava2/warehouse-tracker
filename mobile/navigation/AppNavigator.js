import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

import SearchScreen from '../screens/SearchScreen';
import ScanScreen   from '../screens/ScanScreen';
import AlertsScreen from '../screens/AlertsScreen';  // if you have it

const Stack = createStackNavigator();

export default function AppNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Search"
      screenOptions={{
        headerTitleAlign: 'center',
        headerStyle: { backgroundColor: '#fff' },
        headerTintColor: '#333',
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <Stack.Screen
        name="Search"
        component={SearchScreen}
        options={{ title: 'Search Items' }}
      />

      <Stack.Screen
        name="Scan"
        component={ScanScreen}
        options={{ title: 'Scan QR Code' }}
      />

      <Stack.Screen
        name="Alerts"
        component={AlertsScreen}
        options={{ title: 'Low Stock Alerts' }}
      />
    </Stack.Navigator>
  );
}
