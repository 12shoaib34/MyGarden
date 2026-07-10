import { useEffect } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Leaf } from 'lucide-react-native';
import { useTheme } from '../src/theme/ThemeProvider';

export default function SplashScreen() {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  useEffect(() => {
    const timer = setTimeout(() => router.replace('/home'), 900);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.logo}>
        <Leaf size={42} color={theme.colors.onPrimary} strokeWidth={2.2} />
      </View>
      <Text style={styles.title}>Leaf & Soil</Text>
      <Text style={styles.subtitle}>Organic garden care, saved locally.</Text>
      <Image source={require('../assets/splash-icon.png')} style={styles.image} />
    </View>
  );
}

function createStyles(theme) {
  return StyleSheet.create({
    container: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.background,
      padding: theme.spacing.xxl,
    },
    logo: {
      width: 92,
      height: 92,
      borderRadius: theme.radius.xl,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.primary,
      shadowColor: theme.colors.shadow,
      ...theme.elevation.level2,
    },
    title: {
      ...theme.typography.headline,
      color: theme.colors.text,
      marginTop: theme.spacing.xl,
    },
    subtitle: {
      ...theme.typography.body,
      color: theme.colors.textMuted,
      marginTop: theme.spacing.xs,
      textAlign: 'center',
    },
    image: {
      width: 1,
      height: 1,
      opacity: 0,
    },
  });
}
