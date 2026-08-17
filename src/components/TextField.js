import { StyleSheet, Text, TextInput, View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { triggerHaptic } from '../services/hapticService';

export function TextField({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  maxLength,
  multiline,
  onFocus,
  secureTextEntry,
  autoCapitalize,
  autoCorrect,
  textContentType,
}) {
  const { theme } = useTheme();
  const handleFocus = (event) => {
    triggerHaptic();
    onFocus?.(event);
  };

  return (
    <View style={styles.wrap}>
      <Text style={[theme.typography.label, { color: theme.colors.textMuted }]}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textMuted}
        keyboardType={keyboardType}
        maxLength={maxLength}
        multiline={multiline}
        secureTextEntry={secureTextEntry}
        autoCapitalize={autoCapitalize}
        autoCorrect={autoCorrect}
        textContentType={textContentType}
        onFocus={handleFocus}
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
