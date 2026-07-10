import { StyleSheet, Text, TextInput, View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

export function TextField({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  multiline,
  onFocus,
}) {
  const { theme } = useTheme();
  return (
    <View style={styles.wrap}>
      <Text style={[theme.typography.label, { color: theme.colors.textMuted }]}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textMuted}
        keyboardType={keyboardType}
        multiline={multiline}
        onFocus={onFocus}
        style={[
          styles.input,
          theme.typography.body,
          {
            minHeight: multiline ? 104 : 54,
            backgroundColor: theme.colors.surfaceSoft,
            borderColor: theme.colors.border,
            borderRadius: theme.radius.md,
            color: theme.colors.text,
            textAlignVertical: multiline ? 'top' : 'center',
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 8,
  },
  input: {
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
});
