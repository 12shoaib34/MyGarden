import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Database, Moon, Palette } from 'lucide-react-native';
import { Card } from '../../src/components/Card';
import { Chip } from '../../src/components/Chip';
import { Screen } from '../../src/components/Screen';
import { themeChoices } from '../../src/theme/themes';
import { useTheme } from '../../src/theme/ThemeProvider';

export default function SettingsScreen() {
  const { theme, themeId, setThemeId } = useTheme();
  const styles = createStyles(theme);

  return (
    <Screen safeTop>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.subtitle}>Themes are separated and ready for future seasonal designs.</Text>

        <Card style={styles.card}>
          <View style={styles.rowTitle}>
            <Palette size={22} color={theme.colors.primary} />
            <Text style={styles.sectionTitle}>Theme</Text>
          </View>
          <View style={styles.chips}>
            {themeChoices.map((choice) => (
              <Chip
                key={choice.value}
                label={choice.label}
                selected={themeId === choice.value}
                onPress={() => setThemeId(choice.value)}
              />
            ))}
          </View>
        </Card>

        <Card style={styles.card}>
          <View style={styles.rowTitle}>
            <Database size={22} color={theme.colors.primary} />
            <Text style={styles.sectionTitle}>Storage</Text>
          </View>
          <Text style={styles.body}>User plants are saved with expo-sqlite on this mobile device.</Text>
          <Text style={styles.body}>No backend, no Firebase, no online database.</Text>
        </Card>

        <Card style={styles.card}>
          <View style={styles.rowTitle}>
            <Moon size={22} color={theme.colors.primary} />
            <Text style={styles.sectionTitle}>Dark mode</Text>
          </View>
          <Text style={styles.body}>Each theme has its own light and dark palette.</Text>
        </Card>
      </ScrollView>
    </Screen>
  );
}

function createStyles(theme) {
  return StyleSheet.create({
    scroll: {
      paddingTop: theme.spacing.md,
      paddingBottom: theme.spacing.xxl,
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
    card: {
      padding: theme.spacing.lg,
      gap: theme.spacing.md,
    },
    rowTitle: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
    },
    sectionTitle: {
      ...theme.typography.title,
      color: theme.colors.text,
    },
    chips: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.xs,
    },
    body: {
      ...theme.typography.body,
      color: theme.colors.textMuted,
    },
  });
}
