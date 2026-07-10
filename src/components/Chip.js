import { Pressable, StyleSheet, Text } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

export function Chip({ label, selected, onPress, tone = 'primary' }) {
  const { theme } = useTheme();
  const color = theme.colors[tone] || theme.colors.primary;

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        {
          borderRadius: theme.radius.full,
          backgroundColor: selected ? color : theme.colors.surfaceSoft,
          borderColor: selected ? color : theme.colors.border,
        },
      ]}
    >
      <Text
        style={[
          theme.typography.label,
          { color: selected ? theme.colors.onPrimary : theme.colors.textMuted },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
});
