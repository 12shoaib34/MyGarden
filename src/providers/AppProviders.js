import { StyleSheet } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AppThemeProvider, useTheme } from "../theme/ThemeProvider";

export function AppProviders({ children }) {
  return (
    <AppThemeProvider>
      <ThemedSafeAreaProvider>{children}</ThemedSafeAreaProvider>
    </AppThemeProvider>
  );
}

function ThemedSafeAreaProvider({ children }) {
  const { theme } = useTheme();

  return (
    <SafeAreaProvider
      style={[styles.provider, { backgroundColor: theme.colors.background }]}
    >
      {children}
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  provider: {
    flex: 1,
  },
});
