import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppNavigator } from './src/navigation/AppNavigator';
import { AppStateProvider } from './src/state/AppStateContext';

export default function App() {
  return (
    <SafeAreaProvider>
      <AppStateProvider>
        <AppNavigator />
      </AppStateProvider>
    </SafeAreaProvider>
  );
}
