import { Stack } from "expo-router";
import { useEffect } from "react";
import { Platform, StatusBar as NativeStatusBar } from "react-native";
import { SystemBars } from "react-native-edge-to-edge";
import { AppProviders } from "../src/providers/AppProviders";
import { useTheme } from "../src/theme/ThemeProvider";

function RootStack() {
  const { theme } = useTheme();
  const systemBarStyle = theme.mode === "dark" ? "light" : "dark";

  useEffect(() => {
    if (Platform.OS !== "android") {
      return;
    }

    NativeStatusBar.setBarStyle(
      theme.mode === "dark" ? "light-content" : "dark-content",
      true
    );
    NativeStatusBar.setBackgroundColor(theme.colors.background, true);
    NativeStatusBar.setTranslucent(false);
    SystemBars.setStyle({
      statusBar: systemBarStyle,
      navigationBar: systemBarStyle,
    });

    const systemBarsTimeout = setTimeout(() => {
      SystemBars.setStyle({
        statusBar: systemBarStyle,
        navigationBar: systemBarStyle,
      });
    }, 250);

    return () => {
      clearTimeout(systemBarsTimeout);
    };
  }, [systemBarStyle, theme.colors.background]);

  return (
    <>
      <SystemBars
        style={{
          statusBar: systemBarStyle,
          navigationBar: systemBarStyle,
        }}
      />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: "default",
          contentStyle: { backgroundColor: theme.colors.background },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="add" />
        <Stack.Screen name="add-note" />
        <Stack.Screen name="edit-plant/[id]" />
        <Stack.Screen name="profile" />
        <Stack.Screen name="settings-theme" />
        <Stack.Screen name="settings-data" />
        <Stack.Screen name="notification-schedule" />
        <Stack.Screen name="fertilizer-timeline" />
        <Stack.Screen name="weather" />
        <Stack.Screen name="plant-info" />
        <Stack.Screen name="plant-info/[id]" />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <AppProviders>
      <RootStack />
    </AppProviders>
  );
}
