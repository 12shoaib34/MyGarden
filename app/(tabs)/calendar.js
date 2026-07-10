import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { CalendarDays, Droplets, Wheat } from 'lucide-react-native';
import { Card } from '../../src/components/Card';
import { Screen } from '../../src/components/Screen';
import { useTheme } from '../../src/theme/ThemeProvider';

export default function CalendarScreen() {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  return (
    <Screen safeTop>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Calendar</Text>
        <Text style={styles.subtitle}>Local care schedule overview.</Text>

        <Card style={styles.monthCard}>
          <View style={styles.monthHeader}>
            <CalendarDays size={24} color={theme.colors.primary} />
            <Text style={styles.sectionTitle}>This week</Text>
          </View>
          <View style={styles.row}>
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, index) => (
              <View
                key={`${day}-${index}`}
                style={[
                  styles.day,
                  index === 2 && { backgroundColor: theme.colors.primary },
                ]}
              >
                <Text
                  style={[
                    styles.dayText,
                    { color: index === 2 ? theme.colors.onPrimary : theme.colors.textMuted },
                  ]}
                >
                  {day}
                </Text>
              </View>
            ))}
          </View>
        </Card>

        <Card style={styles.task}>
          <Droplets size={23} color={theme.colors.water} />
          <View style={styles.taskText}>
            <Text style={styles.taskTitle}>Watering Due</Text>
            <Text style={styles.body}>Plants needing water will appear here.</Text>
          </View>
        </Card>

        <Card style={styles.task}>
          <Wheat size={23} color={theme.colors.brown} />
          <View style={styles.taskText}>
            <Text style={styles.taskTitle}>Fertilizer Due</Text>
            <Text style={styles.body}>Organic feeding reminders will appear here.</Text>
          </View>
        </Card>
      </ScrollView>
    </Screen>
  );
}

function createStyles(theme) {
  return StyleSheet.create({
    scroll: {
      paddingTop: theme.spacing.md,
      paddingBottom: 112,
      gap: theme.spacing.md,
    },
    title: {
      ...theme.typography.headline,
      color: theme.colors.text,
    },
    subtitle: {
      ...theme.typography.body,
      color: theme.colors.textMuted,
      marginBottom: theme.spacing.sm,
    },
    monthCard: {
      padding: theme.spacing.lg,
      gap: theme.spacing.lg,
    },
    monthHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
    },
    sectionTitle: {
      ...theme.typography.title,
      color: theme.colors.text,
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    day: {
      width: 38,
      height: 46,
      borderRadius: theme.radius.md,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.surfaceSoft,
    },
    dayText: {
      ...theme.typography.label,
    },
    task: {
      flexDirection: 'row',
      gap: theme.spacing.md,
      padding: theme.spacing.lg,
      alignItems: 'center',
    },
    taskText: {
      flex: 1,
    },
    taskTitle: {
      ...theme.typography.title,
      color: theme.colors.text,
    },
    body: {
      ...theme.typography.bodySmall,
      color: theme.colors.textMuted,
    },
  });
}
