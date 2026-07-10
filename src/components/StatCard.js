import { StyleSheet, Text, View } from 'react-native';
import { Card } from './Card';
import { useTheme } from '../theme/ThemeProvider';

export function StatCard({ label, value, Icon, tone = 'primary' }) {
  const { theme } = useTheme();
  const color = theme.colors[tone] || theme.colors.primary;

  return (
    <Card style={styles.card}>
      <View style={[styles.iconWrap, { backgroundColor: `${color}20` }]}>
        <Icon size={22} color={color} strokeWidth={2.1} />
      </View>
      <Text style={[theme.typography.headline, { color: theme.colors.text }]}>{value}</Text>
      <Text style={[theme.typography.bodySmall, { color: theme.colors.textMuted }]}>{label}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '48%',
    padding: 16,
    gap: 10,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
