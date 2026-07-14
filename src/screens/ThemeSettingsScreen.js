import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { Check, Moon, Palette, X } from "lucide-react-native";
import { AppHeader, HeaderActionButton } from "../components/AppHeader";
import { Card } from "../components/Card";
import { useGetSafeAreaInsets } from "../hooks/getSafeAreaInsets";
import { triggerHaptic, withHaptic } from "../services/hapticService";
import { getThemeFamilyId, getThemeIdForFamilyMode, themeFamilies } from "../theme/themes";
import { useTheme } from "../theme/ThemeProvider";

export function ThemeSettingsScreen({ onBack }) {
  const { theme, themeId, setThemeId } = useTheme();
  const insets = useGetSafeAreaInsets();
  const themedStyles = createStyles(theme, insets);
  const selectedFamilyId = getThemeFamilyId(themeId);
  const isDarkMode = theme.mode === "dark";

  function selectFamily(familyId) {
    setThemeId(getThemeIdForFamilyMode(familyId, theme.mode));
  }

  function toggleDarkMode(nextValue) {
    triggerHaptic(nextValue ? "toggleOn" : "toggleOff");
    setThemeId(getThemeIdForFamilyMode(selectedFamilyId, nextValue ? "dark" : "light"));
  }

  return (
    <View style={themedStyles.screen}>
      <AppHeader icon={Palette} title="Theme" subtitle="Palette and dark mode">
        <CloseButton onPress={onBack} />
      </AppHeader>
      <ScrollView contentContainerStyle={themedStyles.scroll}>
        <Card style={themedStyles.card}>
          <Text style={themedStyles.cardSubtitle}>
            Choose a garden palette inspired by seasons and planting zones.
          </Text>
          <View style={themedStyles.themeGrid}>
            {themeFamilies.map((family) => (
              <ThemeFamilyButton
                key={family.id}
                family={family}
                selected={selectedFamilyId === family.id}
                onPress={() => selectFamily(family.id)}
              />
            ))}
          </View>
          <View style={themedStyles.darkModeRow}>
            <View style={themedStyles.darkIcon}>
              <Moon size={18} color={theme.colors.primary} />
            </View>
            <View style={themedStyles.darkText}>
              <Text style={themedStyles.darkTitle}>Dark mode</Text>
              <Text style={themedStyles.darkSubtitle}>
                Uses the selected theme family.
              </Text>
            </View>
            <Switch
              value={isDarkMode}
              onValueChange={toggleDarkMode}
              trackColor={{
                false: theme.colors.surfaceHigh,
                true: theme.colors.secondaryContainer,
              }}
              thumbColor={isDarkMode ? theme.colors.primary : theme.colors.surface}
            />
          </View>
        </Card>
      </ScrollView>
    </View>
  );
}

function CloseButton({ onPress }) {
  const { theme } = useTheme();
  return (
    <HeaderActionButton onPress={onPress} accessibilityLabel="Close theme settings">
      <X size={19} color={theme.colors.text} />
    </HeaderActionButton>
  );
}

function ThemeFamilyButton({ family, selected, onPress }) {
  const { theme } = useTheme();
  const themedStyles = createStyles(theme, useGetSafeAreaInsets());

  return (
    <Pressable
      style={[
        themedStyles.themeButton,
        selected && themedStyles.themeButtonSelected,
      ]}
      onPress={withHaptic(onPress)}
    >
      <View style={themedStyles.paletteWrap}>
        <View style={themedStyles.paletteCircle}>
          {family.palette.map((color, index) => (
            <View
              key={`${family.id}-${color}-${index}`}
              style={[themedStyles.paletteSlice, { backgroundColor: color }]}
            />
          ))}
        </View>
        {selected ? (
          <View style={themedStyles.checkCircle}>
            <Check size={13} color={theme.colors.onPrimary} />
          </View>
        ) : null}
      </View>
      <Text
        style={[
          themedStyles.themeLabel,
          selected && themedStyles.themeLabelSelected,
        ]}
        numberOfLines={1}
      >
        {family.label}
      </Text>
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
      paddingBottom: Math.max(insets.bottom, 24) + 24,
    },
    card: {
      padding: 24,
      gap: 18,
    },
    cardSubtitle: {
      ...theme.typography.bodySmall,
      color: theme.colors.textMuted,
    },
    themeGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      columnGap: 12,
      rowGap: 12,
      alignItems: "center",
    },
    themeButton: {
      width: "30%",
      minWidth: 92,
      minHeight: 86,
      borderRadius: 18,
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surfaceSoft,
      paddingVertical: 10,
      paddingHorizontal: 8,
    },
    themeButtonSelected: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.successSurface,
    },
    paletteWrap: {
      width: 38,
      height: 38,
      alignItems: "center",
      justifyContent: "center",
      position: "relative",
    },
    paletteCircle: {
      width: 38,
      height: 38,
      borderRadius: 19,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
      flexDirection: "row",
    },
    paletteSlice: {
      flex: 1,
      height: "100%",
    },
    checkCircle: {
      width: 18,
      height: 18,
      borderRadius: 9,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.colors.primary,
      position: "absolute",
      top: -6,
      right: -6,
    },
    themeLabel: {
      ...theme.typography.label,
      fontSize: 12,
      color: theme.colors.textMuted,
      textAlign: "center",
    },
    themeLabelSelected: {
      color: theme.colors.primaryStrong,
    },
    darkModeRow: {
      minHeight: 68,
      borderRadius: 22,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surfaceSoft,
      paddingHorizontal: 16,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    darkIcon: {
      width: 38,
      height: 38,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.colors.successSurface,
    },
    darkText: {
      flex: 1,
    },
    darkTitle: {
      ...theme.typography.label,
      color: theme.colors.text,
      fontSize: 15,
    },
    darkSubtitle: {
      ...theme.typography.bodySmall,
      color: theme.colors.textMuted,
      marginTop: 2,
    },
  });
}
