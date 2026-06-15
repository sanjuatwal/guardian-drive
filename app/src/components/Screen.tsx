import React, { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { gradients, spacing } from '../../theme/tokens';

type ScreenProps = {
  children: ReactNode;
  scroll?: boolean;
};

export function Screen({ children, scroll = false }: ScreenProps) {
  const insets = useSafeAreaInsets();
  const padding = {
    paddingTop: insets.top + spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  };

  return (
    <LinearGradient colors={gradients.appBackground} style={styles.fill}>
      {scroll ? (
        <ScrollView
          style={styles.fill}
          contentContainerStyle={[styles.content, padding]}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.fill, styles.content, padding]}>{children}</View>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  content: {
    gap: spacing.lg,
  },
});
