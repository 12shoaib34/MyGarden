# MyGarden App Overview

## App Identity

MyGarden is a personal offline/local-only mobile app for managing home garden plants. It is focused on home gardeners, rooftop gardeners, balcony gardeners, and fruit/vegetable growers.

The app must feel calm, clean, premium, minimal, rounded, and garden-focused. It follows the organic gardening design system from:

`/home/shoaib/Downloads/stitch_organic_garden_design_system`

Main design reference used heavily:

`/home/shoaib/Desktop/New Folder/stitch_organic_garden_design_system/home_dashboard/code.html`

## Tech Stack

- Expo SDK 57
- React Native 0.86
- Local SQLite storage with `expo-sqlite`
- Android Storage Access Framework backup with `expo-file-system`
- Image picker with `expo-image-picker`
- Local notifications with `expo-notifications`
- Clipboard support with `expo-clipboard`
- Icons from `lucide-react-native`
- No backend
- No Firebase
- No online database

## Core Requirements

- App is Android-only for personal use.
- Data must stay local on the phone.
- User plants are saved in SQLite for normal app use.
- Backup/export uses a user-selected phone folder so data can survive app uninstall.
- Backup JSON and images must be stored in the selected folder until user deletes them manually.
- Plant library/info data comes from JSON files, not an admin panel or remote database.
- UI must support light and dark themes.
- Each theme family has its own light and dark version.

## Current App Structure

### Entry

- `App.js`
  - Wraps the app in `AppProviders`.
  - Renders `AppRoot`.

- `src/providers/AppProviders.js`
  - Provides keyboard controller, theme provider, and safe area provider.

- `src/navigation/AppRoot.js`
  - Handles simple tab/state navigation.
  - Tabs: Home, My Plants, Plant Info, Profile/Settings.
  - Handles Add/Edit Plant screen state.
  - Initializes daily notifications.

### Components

- `src/components/AppHeader.js`
  - Shared compact header pattern.
  - Icon is shown on the left of title.
  - Optional right-side actions.

- `src/components/DashboardHeader.js`
  - Custom home header with profile avatar/name and quick theme light/dark toggle.

- `src/components/BottomTabs.js`
  - Custom bottom tab bar.
  - Safe area bottom padding belongs inside the tab bar.

- Other reusable components:
  - `Button.js`
  - `Card.js`
  - `Chip.js`
  - `TextField.js`
  - `WeatherSummaryCard.js`
  - `EmptyState.js`
  - `PlantCard.js`
  - `StatCard.js`

### Screens

- `HomeDashboardScreen.js`
  - Shows weather for Surjani Town/Karachi.
  - Shows dashboard stats.
  - Shows My Garden horizontal cards.
  - Plant cards show plant age badge, not health/water line.
  - Pull-to-refresh updates weather.

- `PlantsScreen.js`
  - Shows saved local plants from SQLite.
  - Filters by category.
  - Search bar.
  - Add plant button.
  - Copy button copies all plant names grouped by category, like:

```text
Fruit
 Chiku
 Chinese Orange

Herb
 Mint
```

- `AddPlantScreen.js`
  - Add/edit/delete plants.
  - Optional image.
  - Fields currently used:
    - Plant Name
    - Variety, default `Normal`
    - Category
    - Date Planted
    - Notes (Optional)
  - Saves to SQLite.
  - If backup folder is selected, image and JSON backup are updated.

- `PlantInfoListScreen.js`
  - Shows JSON-based local plant guide.
  - Data source: `src/data/plantInfo.json`.
  - Categories include Fruit, Vegetable, Herb, Succulent, Indoor, Flower, Tree.
  - Plant list uses icons instead of remote images.

- `PlantInfoDetailScreen.js`
  - Detailed plant guide.
  - Shows grow bag sizes, care info, pruning info, pests, diseases.
  - Fruit plants can include extra fruit-specific data:
    - Dormancy months
    - Pruning months/season
    - Fruiting months/season
    - Propagation info
    - Air layering months
    - Cutting months
    - Best method

- `SettingsScreen.js`
  - Profile edit: first name, last name, image.
  - Theme palette selection.
  - Dark mode switch.
  - Backup folder selection, Backup Now, Import Backup.
  - Notification test section is currently commented/hidden.

## Storage

### SQLite

File: `src/storage/database.js`

Tables:

- `plants`
- `settings`

Plant fields:

- `id`
- `name`
- `variety`
- `category`
- `purchase_date`
- `health_status`
- `image_uri`
- `notes`
- `water_every_days`
- `fertilizer_every_days`
- `created_at`

Settings store:

- theme id
- profile first/last name
- profile image URI
- backup folder URI
- notification flags/scheduled IDs

### Backup

File: `src/services/localBackupService.js`

Backup folder is selected by Android Storage Access Framework. User picked a folder named `MyGarden` during testing.

Backup contents:

- `mygarden-backup.json`
- `mygarden-images/`

Backup JSON includes:

- plants
- settings/profile/theme data

Important behavior:

- Auto backup runs after plant save/update/delete and profile save when folder is selected.
- Images are copied into backup folder.
- Existing backup with plants should not be overwritten by an empty app after reinstall.
- Import Backup restores plants/settings from selected folder.

## Notifications

File: `src/services/notificationService.js`

Purpose:

- Free local notifications only.
- No paid tool, no backend, no push server.

Current permanent reminder:

- Daily water plants reminder
- Time: 4:00 PM
- Reminder id: `daily-water-plants`
- Notification channel: `plant-care-reminders`

The notification system is config-driven through `notificationReminderConfigs`, so future reminders can be added by adding config objects.

`Send Test Reminder` exists in service but Settings UI section is commented/hidden for now.

## Weather

File: `src/services/weatherService.js`

Weather is dynamic and free. It is configured for Surjani Town/Karachi. Home screen supports pull-to-refresh to update weather. The UI shows:

- temperature
- condition
- feels like
- humidity
- wind
- gardening message

## Themes

Files:

- `src/theme/tokens.js`
- `src/theme/themes.js`
- `src/theme/ThemeProvider.js`

Design principle:

- All colors should come from theme tokens.
- Do not hardcode UI colors unless it is a fallback for a token.
- Each theme family has light and dark variants.
- Keep app backgrounds neutral; do not flood the full app with primary color tint.
- Primary color should be for buttons, chips, icons, and accents.

Current theme families:

- Botanical
- Sky
- Berry
- Rose
- Harvest
- Teal
- Citrus
- Mint
- Indigo

## UI/Design Direction

Use:

- Modern Material 3 inspired UI
- Premium minimal organic gardening style
- Rounded corners, usually 16-24dp
- Spacious layouts
- Clean typography hierarchy
- Light borders
- No shadows
- Icons from lucide
- Compact headers with left icon + title
- Custom bottom tab bar

Avoid:

- Heavy gradients
- Skeuomorphic design
- Shadows/elevation
- Huge headers
- Huge header buttons
- Putting everything in one file
- Global safe area padding that creates white strips

## Safe Area Rules

- Header handles top safe area.
- Bottom tab bar handles bottom safe area when visible.
- Main layout should not add bottom safe area padding if tab bar is visible.
- Screens without tab bar may add bottom safe area padding inside content.

Safe area hook:

- `src/hooks/getSafeAreaInsets.js`

## Important Current UX Notes

- Home tab uses `DashboardHeader`, not `AppHeader`, because it has profile and theme toggle.
- Other top-level screens should use compact `AppHeader`.
- Bottom tab labels:
  - Home
  - My Plants
  - Plant Info
  - Profile
- Settings tab is called Profile in the tab bar.

## Build/Run Commands

Start dev server:

```bash
npx expo start --dev-client --clear --port 8081
```

Run Android dev build:

```bash
npx expo run:android
```

Build release APK:

```bash
cd android
./gradlew assembleRelease
```

Release APK path:

```bash
android/app/build/outputs/apk/release/app-release.apk
```

Install release APK:

```bash
adb install -r android/app/build/outputs/apk/release/app-release.apk
```

## Last Known Status

- Release APK was built successfully.
- Release APK was installed successfully on connected Android device.
- App package: `com.mygarden.app`
- App name: `MyGarden`
- Expo doctor passed 20/20 checks.

