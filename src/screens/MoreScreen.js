import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import {
  BadgeCheck,
  Bell,
  BookOpen,
  CalendarClock,
  ChevronRight,
  Database,
  Hand,
  MoreHorizontal,
  Palette,
  UserRound,
} from "lucide-react-native";
import { AppHeader } from "../components/AppHeader";
import { Card } from "../components/Card";
import { useGetSafeAreaInsets } from "../hooks/getSafeAreaInsets";
import {
  getHapticsEnabled,
  setHapticsEnabled,
  triggerHaptic,
  withHaptic,
} from "../services/hapticService";
import {
  FERTILIZER_CARD_CHECK_ENABLED_KEY,
  getSetting,
  setSetting,
} from "../storage/database";
import { getSwitchColors } from "../theme/switchColors";
import { useTheme } from "../theme/ThemeProvider";

export function MoreScreen({
  onOpenProfile,
  onOpenPlantInfo,
  onOpenFertilizerTimeline,
  onOpenTheme,
  onOpenData,
  onOpenNotifications,
}) {
  const { theme } = useTheme();
  const insets = useGetSafeAreaInsets();
  const themedStyles = createStyles(theme, insets);
  const [hapticsEnabled, setHapticsEnabledState] = useState(true);
  const [fertilizerCardCheckEnabled, setFertilizerCardCheckEnabled] = useState(false);
  const fertilizerSwitchColors = getSwitchColors(theme, fertilizerCardCheckEnabled);
  const hapticsSwitchColors = getSwitchColors(theme, hapticsEnabled);

  useEffect(() => {
    let alive = true;
    Promise.all([
      getHapticsEnabled(),
      getSetting(FERTILIZER_CARD_CHECK_ENABLED_KEY, "false"),
    ]).then(([enabled, fertilizerCheckEnabled]) => {
      if (alive) {
        setHapticsEnabledState(enabled);
        setFertilizerCardCheckEnabled(fertilizerCheckEnabled === "true");
      }
    });

    return () => {
      alive = false;
    };
  }, []);

  async function toggleHaptics(nextValue) {
    setHapticsEnabledState(nextValue);
    if (!nextValue) {
      triggerHaptic("toggleOff");
    }
    await setHapticsEnabled(nextValue);
  }

  async function toggleFertilizerCardCheck(nextValue) {
    setFertilizerCardCheckEnabled(nextValue);
    triggerHaptic(nextValue ? "toggleOn" : "toggleOff");
    try {
      await setSetting(FERTILIZER_CARD_CHECK_ENABLED_KEY, nextValue ? "true" : "false");
    } catch {
      setFertilizerCardCheckEnabled(!nextValue);
    }
  }

  return (
    <View style={themedStyles.screen}>
      <AppHeader icon={MoreHorizontal} title="More" subtitle="Profile, guides, and settings" />

      <ScrollView contentContainerStyle={themedStyles.scroll}>
        <MoreSection title="Garden">
          <MoreTile
            Icon={UserRound}
            title="Profile"
            subtitle="Name and profile image"
            onPress={onOpenProfile}
          />
          <MoreTile
            Icon={BookOpen}
            title="Plant Info"
            subtitle="Local growing guide"
            onPress={onOpenPlantInfo}
          />
          <MoreTile
            Icon={CalendarClock}
            title="Fertilizer Timeline"
            subtitle="Coming soon"
            onPress={onOpenFertilizerTimeline}
          />
        </MoreSection>

        <MoreSection title="Settings">
          <MoreTile
            Icon={Palette}
            title="Theme"
            subtitle="Palette and dark mode"
            onPress={onOpenTheme}
          />
          <MoreTile
            Icon={Database}
            title="Data & Backup"
            subtitle="Backup folder, export, and import"
            onPress={onOpenData}
          />
          <MoreTile
            Icon={Bell}
            title="Notification Schedule"
            subtitle="Daily watering reminder time"
            onPress={onOpenNotifications}
          />
          <Card style={themedStyles.toggleTile}>
            <View style={themedStyles.tileIcon}>
              <BadgeCheck size={24} color={theme.colors.primary} />
            </View>
            <View style={themedStyles.tileText}>
              <Text style={themedStyles.tileTitle}>Fertilizer Tick</Text>
              <Text style={themedStyles.tileSubtitle}>Plant card quick log</Text>
            </View>
            <Switch
              value={fertilizerCardCheckEnabled}
              onValueChange={toggleFertilizerCardCheck}
              trackColor={fertilizerSwitchColors.trackColor}
              thumbColor={fertilizerSwitchColors.thumbColor}
              ios_backgroundColor={fertilizerSwitchColors.iosBackgroundColor}
            />
          </Card>
          <Card style={themedStyles.toggleTile}>
            <View style={themedStyles.tileIcon}>
              <Hand size={24} color={theme.colors.primary} />
            </View>
            <View style={themedStyles.tileText}>
              <Text style={themedStyles.tileTitle}>Haptic Feedback</Text>
              <Text style={themedStyles.tileSubtitle}>Premium tap feedback across the app</Text>
            </View>
            <Switch
              value={hapticsEnabled}
              onValueChange={toggleHaptics}
              trackColor={hapticsSwitchColors.trackColor}
              thumbColor={hapticsSwitchColors.thumbColor}
              ios_backgroundColor={hapticsSwitchColors.iosBackgroundColor}
            />
          </Card>
        </MoreSection>
      </ScrollView>
    </View>
  );
}

function MoreSection({ title, children }) {
  const { theme } = useTheme();
  const themedStyles = createStyles(theme, useGetSafeAreaInsets());

  return (
    <View style={themedStyles.section}>
      <View style={themedStyles.sectionHeader}>
        <Text style={themedStyles.sectionTitle}>{title}</Text>
        <View style={themedStyles.sectionRule} />
      </View>
      <View style={themedStyles.sectionList}>{children}</View>
    </View>
  );
}

function MoreTile({ Icon, title, subtitle, onPress }) {
  const { theme } = useTheme();
  const themedStyles = createStyles(theme, useGetSafeAreaInsets());

  return (
    <Pressable onPress={withHaptic(onPress)} accessibilityRole="button">
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
      paddingTop: 18,
      paddingBottom: 132,
      gap: 22,
    },
    section: {
      gap: 10,
    },
    sectionHeader: {
      minHeight: 26,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingHorizontal: 2,
    },
    sectionTitle: {
      ...theme.typography.label,
      fontSize: 14,
      textTransform: "uppercase",
      letterSpacing: 0,
      color: theme.colors.textMuted,
    },
    sectionRule: {
      flex: 1,
      height: StyleSheet.hairlineWidth,
      backgroundColor: theme.colors.border,
    },
    sectionList: {
      gap: 12,
    },
    tile: {
      minHeight: 92,
      padding: 18,
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
    },
    toggleTile: {
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
