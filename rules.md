# MyGarden Project Rules

## Design Rules

- Shadow use nahi karne hain.
- UI provided design system jesi banani hai.
- Design reference folder: `/home/shoaib/Downloads/stitch_organic_garden_design_system`.
- Home dashboard reference ko closely follow karna hai.
- UI clean, modern, rounded, minimal aur premium honi chahiye.
- Heavy gradients use nahi karne.
- Skeuomorphic design use nahi karna.
- Cards/buttons/chips rounded rahen, usually 16-24dp.
- Typography clean aur readable ho.
- App ka background neutral rakho; primary color ka heavy shade poori app par mat do.
- Primary color icons/buttons/chips/accent tak limited rakho.
- Lucide icons use karne hain.

## Theme Rules

- Sab colors theme tokens se use karo.
- Hardcoded colors avoid karo, except token fallback.
- Theme files scalable rakhni hain:
  - `src/theme/tokens.js`
  - `src/theme/themes.js`
  - `src/theme/ThemeProvider.js`
- Har theme family ka light aur dark mode hona chahiye.
- New theme add karte waqt `themeFamilies` mein family add karo aur light/dark ids define karo.
- Light mode backgrounds mostly off-white/white rakho.
- Dark mode backgrounds near-black/neutral rakho; selected theme ka color sirf accents par lage.

## Layout And Safe Area Rules

- Header top safe area handle kare.
- Bottom tab bar bottom safe area handle kare.
- Jis screen par bottom tab visible ho, main content ko global bottom safe area padding mat do.
- Jis screen par tab bar hidden ho, us screen content ko bottom safe area padding do.
- Safe area ke liye `src/hooks/getSafeAreaInsets.js` use karo.
- White strip issues avoid karne ke liye root/background color theme background ho.

## Header Rules

- Headers compact hone chahiye.
- Header icon title ke left par show ho.
- Large right-side icon cards avoid karo.
- Header buttons/icons chotay rakho.
- Shared header component use karo: `src/components/AppHeader.js`.
- Home dashboard exception hai; woh custom `DashboardHeader` use karta hai.

## Component/Code Rules

- Saari screens `App.js` mein mat banao.
- Proper folder structure maintain karo:
  - `src/screens`
  - `src/components`
  - `src/services`
  - `src/storage`
  - `src/theme`
  - `src/utils`
  - `src/data`
- Code components divided rakho.
- Reusable UI ko components mein rakho.
- Business logic services mein rakho.
- SQLite access sirf storage/service layer se karo.
- JSON plant info `src/data/plantInfo.json` mein maintain karo.

## Data Rules

- App offline/local-only hai.
- Backend, Firebase, online database use nahi karna.
- User plants SQLite mein save hon.
- Plant info JSON se load ho.
- Backup folder Android phone storage mein user-selected folder hona chahiye.
- Backup JSON aur images app uninstall ke baad bhi folder mein rehni chahiye.
- Empty app existing backup ko overwrite na kare.

## Backup Rules

- Backup service: `src/services/localBackupService.js`.
- Backup file: `mygarden-backup.json`.
- Images folder: `mygarden-images/`.
- Plant save/update/delete ke baad auto backup run hona chahiye agar folder selected ho.
- Profile save ke baad bhi backup update hona chahiye.
- Import backup reinstall ke baad restore ke liye use hota hai.

## Notification Rules

- Paid notification tools use nahi karne.
- Backend push notification use nahi karni.
- Free local notifications use karni hain: `expo-notifications`.
- Notification configs scalable rakho in `src/services/notificationService.js`.
- Current daily reminder: water plants at 4:00 PM.
- Test notification UI currently hidden/commented in Settings.

## Android Rules

- App Android personal use ke liye hai.
- iOS ki tension nahi leni.
- Release APK build path:
  - `android/app/build/outputs/apk/release/app-release.apk`
- Install command:
  - `adb install -r android/app/build/outputs/apk/release/app-release.apk`

## Verification Rules

- Code change ke baad relevant `node -c` syntax checks run karo.
- App config/dependencies ke baad `npx expo-doctor` run karo.
- Native module add hone ke baad Android rebuild zaroor karo.
- Release dene se pehle APK build aur install verify karo.
