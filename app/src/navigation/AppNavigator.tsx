import React, { useEffect } from 'react';
import { NavigationContainer, DarkTheme, createNavigationContainerRef } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { HomeScreen } from '../screens/HomeScreen';
import { AlertScreen } from '../screens/AlertScreen';
import { RecoveryScreen } from '../screens/RecoveryScreen';
import { CheckScreen } from '../screens/CheckScreen';
import { AlertsScreen } from '../screens/AlertsScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { useAppState } from '../state/AppStateContext';
import { colors, fonts } from '../../theme/tokens';

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

type IoniconName = keyof typeof Ionicons.glyphMap;

const tabIcons: Record<string, { focused: IoniconName; idle: IoniconName }> = {
  Home: { focused: 'shield-checkmark', idle: 'shield-outline' },
  Recovery: { focused: 'navigate', idle: 'navigate-outline' },
  Check: { focused: 'pulse', idle: 'pulse-outline' },
  Alerts: { focused: 'notifications', idle: 'notifications-outline' },
  Settings: { focused: 'ellipsis-horizontal', idle: 'ellipsis-horizontal-outline' },
};

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          const icons = tabIcons[route.name];
          return <Ionicons name={focused ? icons.focused : icons.idle} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.emerald,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.graphite,
          borderTopColor: colors.cardBorder,
          borderTopWidth: 1,
          elevation: 0,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontFamily: fonts.medium,
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Recovery" component={RecoveryScreen} />
      <Tab.Screen name="Check" component={CheckScreen} />
      <Tab.Screen name="Alerts" component={AlertsScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} options={{ tabBarLabel: 'More' }} />
    </Tab.Navigator>
  );
}

const navigationRef = createNavigationContainerRef();

// Presents the Alert modal as soon as the backend reports an active alert,
// and closes it when the alert is confirmed or dismissed elsewhere.
function AlertWatcher() {
  const { state } = useAppState();
  const hasAlert = state.currentAlert !== null;

  useEffect(() => {
    if (!navigationRef.isReady()) return;
    const currentRoute = navigationRef.getCurrentRoute()?.name;
    if (hasAlert && currentRoute !== 'Alert') {
      navigationRef.navigate('Alert' as never);
    } else if (!hasAlert && currentRoute === 'Alert' && navigationRef.canGoBack()) {
      navigationRef.goBack();
    }
  }, [hasAlert]);

  return null;
}

export function AppNavigator() {
  return (
    <NavigationContainer ref={navigationRef} theme={guardianTheme}>
      <AlertWatcher />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Main" component={MainTabs} />
        <Stack.Screen name="Alert" component={AlertScreen} options={{ presentation: 'fullScreenModal' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
