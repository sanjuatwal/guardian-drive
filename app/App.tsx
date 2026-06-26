import React from 'react';
import { useFonts } from 'expo-font';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppNavigator } from './src/navigation/AppNavigator';
import { AppStateProvider } from './src/state/AppStateContext';
import { AuthProvider } from './src/state/AuthContext';

export default function App() {
  const [fontsLoaded] = useFonts({
    'Satoshi-Regular': require('./theme/assets/fonts/Satoshi-Regular.otf'),
    'Satoshi-Medium': require('./theme/assets/fonts/Satoshi-Medium.otf'),
    'Satoshi-Bold': require('./theme/assets/fonts/Satoshi-Bold.otf'),
    'Satoshi-Black': require('./theme/assets/fonts/Satoshi-Black.otf'),
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AppStateProvider>
          <AppNavigator />
        </AppStateProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
