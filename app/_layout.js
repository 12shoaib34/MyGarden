import { Stack } from "expo-router";
import * as NavigationBar from "expo-navigation-bar";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { Platform } from "react-native";
import { AppProviders } from "../src/providers/AppProviders";
import { useTheme } from "../src/theme/ThemeProvider";

function RootStack() {
  const { theme } = useTheme();

  useEffect(() => {
    if (Platform.OS !== "android") {
      return;
    }

    NavigationBar.setStyle(theme.mode === "dark" ? "light" : "dark");
  }, [theme]);

  return (
    <>
      <StatusBar style={theme.mode === "dark" ? "light" : "dark"} />
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
        <Stack.Screen name="edit-plant/[id]" />
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
