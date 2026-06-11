import React from 'react';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { HomeScreen } from '../screens/HomeScreen';
import { AlertScreen } from '../screens/AlertScreen';
import { RecoveryScreen } from '../screens/RecoveryScreen';
import { CheckScreen } from '../screens/CheckScreen';
import { AlertsScreen } from '../screens/AlertsScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { colors } from '../../theme/tokens';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const guardianTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.deepBlack,
    card: colors.graphite,
    primary: colors.emerald,
    text: colors.textPrimary,
    border: colors.cardBorder,
    notification: colors.redAlert,
  },
};

function MainTabs() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Recovery" component={RecoveryScreen} />
      <Tab.Screen name="Check" component={CheckScreen} />
      <Tab.Screen name="Alerts" component={AlertsScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

export function AppNavigator() {
  return (
    <NavigationContainer theme={guardianTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Main" component={MainTabs} />
        <Stack.Screen name="Alert" component={AlertScreen} options={{ presentation: 'fullScreenModal' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
