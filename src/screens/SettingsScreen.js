import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import {
  Bell,
  ChevronRight,
  Database,
  Palette,
  Settings,
  UserRound,
} from "lucide-react-native";
import { AppHeader, HeaderActionButton } from "../components/AppHeader";
import { Card } from "../components/Card";
import { useGetSafeAreaInsets } from "../hooks/getSafeAreaInsets";
import { useTheme } from "../theme/ThemeProvider";

export function SettingsScreen({
  onOpenProfile,
  onOpenTheme,
  onOpenData,
  onOpenNotifications,
}) {
  const { theme } = useTheme();
  const insets = useGetSafeAreaInsets();
  const themedStyles = createStyles(theme, insets);

  return (
    <View style={themedStyles.screen}>
      <AppHeader icon={Settings} title="Settings" subtitle="Theme, data, and reminders">
        <HeaderActionButton onPress={onOpenProfile} accessibilityLabel="Open profile">
          <UserRound size={19} color={theme.colors.primary} />
        </HeaderActionButton>
      </AppHeader>

      <ScrollView contentContainerStyle={themedStyles.scroll}>
        <SettingsTile
          Icon={Palette}
          title="Theme"
          subtitle="Palette and dark mode"
          onPress={onOpenTheme}
        />
        <SettingsTile
          Icon={Database}
          title="Data & Backup"
          subtitle="Backup folder, export, and import"
          onPress={onOpenData}
        />
        <SettingsTile
          Icon={Bell}
          title="Notification Schedule"
          subtitle="Daily watering reminder time"
          onPress={onOpenNotifications}
        />
      </ScrollView>
    </View>
  );
}

function SettingsTile({ Icon, title, subtitle, onPress }) {
  const { theme } = useTheme();
  const themedStyles = createStyles(theme, useGetSafeAreaInsets());

  return (
    <Pressable onPress={onPress} accessibilityRole="button">
      {({ pressed }) => (
        <Card style={[themedStyles.tile, { opacity: pressed ? 0.78 : 1 }]}>
          <View style={themedStyles.tileIcon}>
            <Icon size={24} color={theme.colors.primary} />
          </View>
          <View style={themedStyles.tileText}>
            <Text style={themedStyles.tileTitle}>{title}</Text>
            <Text style={themedStyles.tileSubtitle}>{subtitle}</Text>
          </View>
          <ChevronRight size={22} color={theme.colors.textMuted} />
        </Card>
      )}
    </Pressable>
  );
}

function createStyles(theme, insets) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scroll: {
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 132,
      gap: 14,
    },
    tile: {
      minHeight: 92,
      padding: 18,
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
    },
    tileIcon: {
      width: 52,
      height: 52,
      borderRadius: 18,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.colors.successSurface,
    },
    tileText: {
      flex: 1,
      gap: 4,
    },
    tileTitle: {
      ...theme.typography.title,
      color: theme.colors.text,
    },
    tileSubtitle: {
      ...theme.typography.bodySmall,
      color: theme.colors.textMuted,
    },
  });
}
