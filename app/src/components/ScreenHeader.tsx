import React, { ReactNode } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

import { colors, fonts, spacing } from '../../theme/tokens';

type ScreenHeaderProps = {
  title?: string;
  subtitle?: string;
  right?: ReactNode;
};

export function ScreenHeader({ title, subtitle, right }: ScreenHeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.logoRow}>
        <Image
          source={require('../../theme/assets/brand-logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        {right ? <View style={styles.right}>{right}</View> : null}
      </View>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
  },
  logoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
  },
  logo: {
    width: 180,
    height: 40,
    marginLeft: -spacing.sm,
  },
  right: {
    alignItems: 'flex-end',
  },
  title: {
    color: colors.textPrimary,
    fontSize: 26,
    fontFamily: fonts.black,
    letterSpacing: 0.3,
    marginTop: spacing.sm,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 13,
    fontFamily: fonts.regular,
    lineHeight: 18,
  },
});
