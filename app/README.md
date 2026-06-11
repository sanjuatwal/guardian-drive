# Guardian Drive App

React Native + TypeScript mobile app for the Guardian Drive control center.

## Product Shape

- `Home` - daily command hub with location, service mode, key tag, and siren shortcuts
- `Recovery` - live map, route trail, sharing, police pack
- `Check` - device health, key tag state, battery, diagnostics
- `Alerts` - incident timeline and why-this-alert explanations
- `Settings` - privacy, contacts, notification preferences

## Current Stack Direction

- Language: TypeScript
- Framework: React Native
- Start path: Expo-first, with room for prebuild / custom native modules later
- Core rule: app talks to backend first; hardware-specific logic stays in firmware/backend

## Exact Stack Proposal

### Base Stack

- TypeScript
- React Native
- Expo for initial scaffold and fast iteration
- React Navigation for routing
- TanStack Query for server state and cached API responses
- Zustand for lightweight UI/session state
- React Hook Form for settings and forms
- Zod for runtime validation of payloads and forms

### Why this stack

- TypeScript gives strong typing for alerts, commands, device state, and timeline records
- React Native gives one iOS + Android codebase
- Expo gets the first version moving quickly
- React Navigation keeps Home/Recovery/Check/Alerts/Settings simple and consistent
- TanStack Query keeps backend data flow predictable
- Zustand avoids over-engineering local UI state
- Zod gives a clean boundary for backend and firmware event payloads

### Native Boundary Plan

Use Expo first, but expect to move to prebuild / custom dev client if needed for:

- BLE pairing and key tag utilities
- background notification edge cases
- deep notification customization
- location/background policy work
- any future native-only hardware helper

### Suggested Package Set

Core:

- `react-native`
- `expo`
- `@react-navigation/native`
- `@react-navigation/bottom-tabs`
- `@react-navigation/native-stack`
- `react-native-safe-area-context`
- `react-native-screens`
- `@tanstack/react-query`
- `zustand`
- `react-hook-form`
- `zod`

Nice-to-have later:

- native notification helpers
- map SDK
- secure storage module
- BLE module

## App Folder Structure

The current app should stay small and typed:

```
app/
├── App.tsx
├── src/
│   ├── navigation/
│   ├── screens/
│   ├── components/
│   ├── services/
│   ├── state/
│   └── types/
├── theme/
│   ├── tokens.ts
│   ├── assetManifest.ts
│   └── assets/
└── README.md
```

## API Contract Shape

The app should be built around a small set of payloads:

- `DeviceSummary`
- `AlertSummary`
- `ActivityEvent`
- `CommandRequest`
- `CommandResponse`
- `PrivacyMode`
- `ServiceModeState`

Minimum backend endpoints for MVP:

- `GET /api/device/status`
- `GET /api/device/events`
- `GET /api/device/alerts`
- `POST /api/device/commands`
- `POST /api/device/service-mode`
- `POST /api/device/confirm-theft`

## What to Mock First

Build these against mock data before real backend integration:

1. Home screen state cards
2. Alert full-screen takeover
3. Recovery map shell
4. Check / device health screen
5. Service mode bottom sheet
6. Find Key Tag utility
7. Notification entry flow

## What to Leave for Native Later

Do not block the first version on these:

- BLE scanning edge cases
- custom alarm-like notification behavior on iOS
- advanced background service logic
- direct hardware pairing flows
- map SDK final choice

## Build Order

1. Scaffold navigation + screen shells
2. Wire theme tokens into the UI
3. Add mock backend data models
4. Build Home, Alert, Recovery, and Check screens
5. Add notification entry points and service mode flows
6. Connect to backend API contracts
7. Add BLE and key tag features only after the core flow is stable

## Theme Assets

Drop reference images into `app/theme/assets/`.

Expected filenames:

- `brand-logo.png`
- `dashboard-car.png`
- `alert-radar.png`
- `map-recovery.png`
- `protection-health.png`
- `texture-noise.png`

Theme config files:

- `app/theme/tokens.ts`
- `app/theme/assetManifest.ts`

If you use different filenames, update `assetManifest.ts` to match.
