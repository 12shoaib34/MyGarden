import { StyleSheet, View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

export function Card({ children, style, elevated = false }) {
  const { theme } = useTheme();
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderRadius: theme.radius.xl,
          shadowColor: theme.colors.shadow,
          borderColor: theme.colors.border,
        },
        elevated ? theme.elevation.level2 : theme.elevation.level1,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: StyleSheet.hairlineWidth,
  },
});
