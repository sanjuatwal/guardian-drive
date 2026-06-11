export const colors = {
  // Base surfaces (from UI mockup)
  deepBlack: "#05070B",
  graphite: "#0E1116",
  carbon: "#171B22",

  // Primary accents (from UI mockup — use everywhere in app)
  emerald: "#00E3B0",
  cyan: "#00D1FF",
  redAlert: "#FF3B30",

  // Logo / splash screen only (steel + gold from brand logo)
  // When logo is recolored, logoGlow should become "#00E3B0" (emerald)
  logoSteel: "#8A9DB0",
  logoGlow: "#00E3B0",    // target: emerald, matches UI theme (was gold #C9A840 in original logo)
  logoHighlight: "#00D1FF", // target: cyan (was warm gold #E8C96A in original logo)

  // Text
  textPrimary: "#E6F1FF",
  textMuted: "#93A3B8",
  cardBorder: "#1B2A3A",
} as const;

export const gradients = {
  appBackground: ["#05070B", "#0A1018"],
  cardGlow: ["rgba(0, 227, 176, 0.20)", "rgba(0, 209, 255, 0.12)"],
  dangerGlow: ["rgba(255, 59, 48, 0.25)", "rgba(255, 59, 48, 0.05)"],
} as const;

export const typography = {
  heading: {
    fontFamily: "Satoshi-Bold",
    letterSpacing: 0.2,
  },
  subheading: {
    fontFamily: "Satoshi-Medium",
    letterSpacing: 0.15,
  },
  body: {
    fontFamily: "Satoshi-Regular",
    letterSpacing: 0,
  },
  caption: {
    fontFamily: "Satoshi-Regular",
    letterSpacing: 0.1,
  },
} as const;

export const motion = {
  screenEnterMs: 320,
  cardStaggerMs: 80,
  alertPulseMs: 1400,
} as const;

export const radius = {
  sm: 10,
  md: 14,
  lg: 20,
  xl: 28,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;
