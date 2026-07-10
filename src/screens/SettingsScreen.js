import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Database, Palette } from "lucide-react-native";
import { Card } from "../components/Card";
import { Chip } from "../components/Chip";
import { useGetSafeAreaInsets } from "../hooks/getSafeAreaInsets";
import { themeChoices } from "../theme/themes";
import { useTheme } from "../theme/ThemeProvider";

export function SettingsScreen() {
  const { theme, themeId, setThemeId } = useTheme();
  const insets = useGetSafeAreaInsets();
  const themedStyles = createStyles(theme, insets);

  return (
    <ScrollView contentContainerStyle={themedStyles.scroll}>
      <Text style={themedStyles.pageTitle}>Settings</Text>
      <Text style={themedStyles.pageSubtitle}>
        Themes are separated and ready for future seasonal designs.
      </Text>
      <Card style={themedStyles.settingsCard}>
        <View style={themedStyles.settingsHeader}>
          <Palette size={22} color={theme.colors.primary} />
          <Text style={themedStyles.settingsTitle}>Theme</Text>
        </View>
        <View style={themedStyles.chips}>
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
      <Card style={themedStyles.settingsCard}>
        <View style={themedStyles.settingsHeader}>
          <Database size={22} color={theme.colors.primary} />
          <Text style={themedStyles.settingsTitle}>Storage</Text>
        </View>
        <Text style={themedStyles.pageSubtitle}>
          User plants are saved with expo-sqlite on this mobile device.
        </Text>
        <Text style={themedStyles.pageSubtitle}>
          No backend, no Firebase, no online database.
        </Text>
      </Card>
    </ScrollView>
  );
}

function createStyles(theme, insets) {
  return StyleSheet.create({
    scroll: {
      paddingHorizontal: 20,
      paddingBottom: 132,
    },
    pageTitle: {
      ...theme.typography.headline,
      color: theme.colors.text,
      marginTop: insets.contentTop,
    },
    pageSubtitle: {
      ...theme.typography.body,
      color: theme.colors.textMuted,
      marginTop: 12,
    },
    settingsCard: {
      padding: 24,
      gap: 18,
      marginTop: 24,
    },
    settingsHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    settingsTitle: {
      ...theme.typography.title,
      color: theme.colors.text,
    },
    chips: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
    },
  });
}
