import { StyleSheet, Text, View } from 'react-native';
import { Sprout } from 'lucide-react-native';
import { Button } from './Button';
import { useTheme } from '../theme/ThemeProvider';

export function EmptyState({ title, message, actionTitle, onAction }) {
  const { theme } = useTheme();
  return (
    <View style={styles.wrap}>
      <View style={[styles.icon, { backgroundColor: theme.colors.surfaceSoft }]}>
        <Sprout size={34} color={theme.colors.primary} strokeWidth={2} />
      </View>
      <Text style={[theme.typography.title, { color: theme.colors.text, textAlign: 'center' }]}>
        {title}
      </Text>
      <Text style={[theme.typography.body, { color: theme.colors.textMuted, textAlign: 'center' }]}>
        {message}
      </Text>
      {actionTitle ? <Button title={actionTitle} onPress={onAction} style={styles.button} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    paddingHorizontal: 24,
  },
  icon: {
    width: 78,
    height: 78,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    marginTop: 8,
    alignSelf: 'stretch',
  },
});
