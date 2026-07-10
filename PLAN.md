# Organic Garden App Implementation Plan

## Summary

Build an offline/local-only React Native Expo app in JavaScript, Android-first, using the provided design system as the UI reference. Data will stay saved on the user's mobile device using free local storage via `expo-sqlite`. No backend, Firebase, paid database, or online database will be used.

The app uses Lucide icons only, Expo Router, and a custom token-based theme system. The provided design system folder is copied into the project root as `stitch_organic_garden_design_system`.

## Phase 1: Project Setup

- Create Expo JavaScript app in the current workspace.
- Copy `/home/shoaib/Downloads/stitch_organic_garden_design_system` into the project root.
- Create `PLAN.md` in the project root with this implementation plan.
- Install required packages:
  - `expo-router`
  - `expo-sqlite`
  - `lucide-react-native`
  - `expo-image-picker`
  - `expo-file-system`
  - `react-native-safe-area-context`
  - `react-native-screens`
- Configure Expo Router.
- Run the app on the connected Android mobile device after setup.

## Phase 2: Theme & Design System Foundation

- Create a scalable token system for colors, typography, spacing, radius, elevation, borders, opacity, motion, and icon sizes.
- Add separate theme files:
  - Botanical Light
  - Botanical Dark
  - Harvest Garden Light
  - Harvest Garden Dark
- Add a theme registry so future themes can be added without changing screens.
- Use Botanical Essence from the copied design system as the default visual style.
- Add theme switching support in Settings.
- Build UI styles from tokens only.

## Phase 3: Local Data Storage

- Use `expo-sqlite` so user data stays saved on the phone.
- Store user-created plants locally.
- Load static plant information from bundled JSON files.
- Store optional plant images as local file URIs.
- Calculate plant age from purchase/add date.
- Add repository/helper functions so screens do not directly handle raw SQL.

## Phase 4: Core Components

Build reusable token-based components:

- Buttons
- FAB
- Icon buttons
- Cards
- Plant cards
- Statistics cards
- Chips
- Text fields
- Top app bar
- Bottom navigation
- Empty states
- Loading states

All icons come from Lucide.

## Phase 5: MVP Screens

Build the first usable app chunk:

1. Splash Screen
2. Home Dashboard
3. Plant List
4. Add Plant
5. Plant Details
6. Settings with theme switcher

MVP acceptance:

- User can add a plant.
- Plant data remains saved after app restart.
- Home screen shows total plant count and overview.
- Plant list shows locally saved plants.
- Plant detail opens correctly.
- Optional plant image works.
- Light/dark mode and theme switching work.

## Phase 6: Care & History Screens

Add the next app chunks:

- Watering Schedule
- Fertilizer Schedule
- Organic Feeding Timeline
- Reminder Screen
- Calendar
- Plant Notes
- Growth History
- Plant Gallery
- Statistics Dashboard

## Phase 7: Future/Placeholder Features

Add polished local placeholders for:

- Disease Detection
- Weather Overview
- Seasonal themes
- Larger bundled plant JSON catalog
- Offline diagnosis rules

These should not pretend to use online services.

## Phase 8: Testing & Run

- Test SQLite persistence after app restart.
- Test plant age calculation.
- Test JSON catalog loading.
- Test add/list/detail plant flow.
- Test dashboard counts.
- Test theme switching across all screens.
- Test Botanical and Harvest themes in light/dark mode.
- Test Android layout on the connected mobile device.
- Run Expo app on connected Android device.

## Locked Decisions

- Stack: React Native Expo.
- Language: JavaScript only.
- Platform: Android first.
- Routing: Expo Router.
- Icons: Lucide icons.
- Storage: `expo-sqlite`, saved locally on mobile.
- Backend: none.
- Firebase: none.
- Online database: none.
- Styling: custom design-token system.
- Default theme: Botanical Essence.
- Extra theme: Harvest Garden.
- Each theme has its own dark mode.
