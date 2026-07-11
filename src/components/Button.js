import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

export function Button({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  style,
  Icon,
}) {
  const { theme } = useTheme();
  const isPrimary = variant === 'primary';
  const labelColor = isPrimary ? theme.colors.onPrimary : theme.colors.primary;

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
      <View style={styles.content}>
        {Icon ? <Icon size={18} color={labelColor} /> : null}
        <Text
          style={[
            styles.label,
            theme.typography.label,
            { color: labelColor },
          ]}
        >
          {title}
        </Text>
      </View>
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
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  label: {
    textAlign: 'center',
  },
});
