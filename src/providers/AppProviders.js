import { StyleSheet } from "react-native";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AppDialogProvider } from "../components/AppDialog";
import { AppThemeProvider, useTheme } from "../theme/ThemeProvider";

export function AppProviders({ children }) {
  return (
    <KeyboardProvider>
      <AppThemeProvider>
        <ThemedSafeAreaProvider>
          <AppDialogProvider>{children}</AppDialogProvider>
        </ThemedSafeAreaProvider>
      </AppThemeProvider>
    </KeyboardProvider>
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
