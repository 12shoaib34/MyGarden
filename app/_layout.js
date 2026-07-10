import { Slot } from 'expo-router';
import * as NavigationBar from 'expo-navigation-bar';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { AppThemeProvider, useTheme } from '../src/theme/ThemeProvider';

function RootStack() {
  const { theme } = useTheme();

  useEffect(() => {
    if (Platform.OS !== 'android') {
      return;
    }

    NavigationBar.setStyle(theme.mode === 'dark' ? 'light' : 'dark');
  }, [theme]);

  return (
    <>
      <StatusBar style={theme.mode === 'dark' ? 'light' : 'dark'} />
      <Slot />
    </>
  );
}

export default function RootLayout() {
  return (
    <AppThemeProvider>
      <RootStack />
    </AppThemeProvider>
  );
}
