import { Pressable, StyleSheet, Text } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

export function Button({ title, onPress, variant = 'primary', disabled = false, style }) {
  const { theme } = useTheme();
  const isPrimary = variant === 'primary';

  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: isPrimary ? theme.colors.primary : theme.colors.surfaceSoft,
          borderColor: isPrimary ? theme.colors.primary : theme.colors.border,
          borderRadius: theme.radius.full,
          opacity: disabled ? 0.5 : pressed ? 0.86 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
        style,
      ]}
    >
      <Text
        style={[
          styles.label,
          theme.typography.label,
          { color: isPrimary ? theme.colors.onPrimary : theme.colors.primary },
        ]}
      >
        {title}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    paddingHorizontal: 22,
  },
  label: {
    textAlign: 'center',
  },
});
