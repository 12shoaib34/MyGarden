import { Pressable, StyleSheet, Text } from 'react-native';
import { withHaptic } from '../services/hapticService';
import { useTheme } from '../theme/ThemeProvider';

export function Chip({ label, selected, onPress, tone = 'primary' }) {
  const { theme } = useTheme();
  const color = theme.colors[tone] || theme.colors.primary;
  const selectedBackground = theme.mode === 'dark' ? theme.colors.secondaryContainer : color;
  const selectedTextColor = theme.mode === 'dark' ? theme.colors.primaryStrong : theme.colors.onPrimary;

  return (
    <Pressable
      onPress={withHaptic(onPress)}
      style={[
        styles.chip,
        {
          borderRadius: theme.radius.full,
          backgroundColor: selected ? selectedBackground : theme.colors.surfaceSoft,
          borderColor: selected ? color : theme.colors.border,
        },
      ]}
    >
      <Text
        style={[
          theme.typography.label,
          { color: selected ? selectedTextColor : theme.colors.textMuted },
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
