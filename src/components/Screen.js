import { StyleSheet, View } from 'react-native';
import { useGetSafeAreaInsets } from '../hooks/getSafeAreaInsets';
import { useTheme } from '../theme/ThemeProvider';

export function Screen({ children, padded = true, safeTop = false, safeBottom = false }) {
  const { theme } = useTheme();
  const insets = useGetSafeAreaInsets();

  return (
    <View
      style={[
        styles.safe,
        {
          backgroundColor: theme.colors.background,
          paddingTop: safeTop ? insets.top : 0,
          paddingBottom: safeBottom ? insets.bottom : 0,
        },
      ]}
    >
      <View style={[styles.content, padded && { paddingHorizontal: theme.spacing.lg }]}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});
