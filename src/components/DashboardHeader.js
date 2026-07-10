import { useEffect, useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { Moon, Sun, UserRound } from "lucide-react-native";
import { useGetSafeAreaInsets } from "../hooks/getSafeAreaInsets";
import { getSetting } from "../storage/database";
import { getThemeFamilyId, getThemeIdForFamilyMode } from "../theme/themes";
import { useTheme } from "../theme/ThemeProvider";

export function DashboardHeader() {
  const { theme, themeId, setThemeId } = useTheme();
  const insets = useGetSafeAreaInsets();
  const [profile, setProfile] = useState({
    firstName: "Alex",
    lastName: "Rivera",
    avatarUri: "",
  });

  useEffect(() => {
    let alive = true;

    async function loadProfile() {
      const [firstName, lastName, avatarUri] = await Promise.all([
        getSetting("profileFirstName", "Alex"),
        getSetting("profileLastName", "Rivera"),
        getSetting("profileAvatarUri", ""),
      ]);
      if (alive) {
        setProfile({ firstName, lastName, avatarUri });
      }
    }

    loadProfile();

    return () => {
      alive = false;
    };
  }, []);

  const displayName = `${profile.firstName} ${profile.lastName}`.trim() || "Gardener";
  const isDarkMode = theme.mode === "dark";

  function toggleThemeMode() {
    const familyId = getThemeFamilyId(themeId);
    setThemeId(getThemeIdForFamilyMode(familyId, isDarkMode ? "light" : "dark"));
  }

  return (
    <View
      style={[
        styles.header,
        {
          borderBottomColor: theme.colors.border,
          backgroundColor: theme.colors.background,
          paddingTop: insets.top,
        },
      ]}
    >
      <View style={styles.inner}>
        <View style={styles.profileRow}>
          <View
            style={[
              styles.avatar,
              {
                backgroundColor: theme.colors.surface,
                borderColor: `${theme.colors.primary}22`,
              },
            ]}
          >
            {profile.avatarUri ? (
              <Image source={{ uri: profile.avatarUri }} style={styles.avatarImage} />
            ) : (
              <UserRound size={22} color={theme.colors.primary} />
            )}
          </View>
          <View>
            <Text
              style={[theme.typography.label, { color: theme.colors.textMuted }]}
            >
              Welcome back,
            </Text>
            <Text
              style={[
                theme.typography.title,
                styles.name,
                { color: theme.colors.primary },
              ]}
            >
              {displayName}
            </Text>
          </View>
        </View>

        <Pressable
          style={[
            styles.themeButton,
            {
              backgroundColor: theme.colors.surfaceSoft,
              borderColor: theme.colors.border,
            },
          ]}
          onPress={toggleThemeMode}
          accessibilityRole="button"
          accessibilityLabel="Toggle theme mode"
        >
          {isDarkMode ? (
            <Sun size={21} color={theme.colors.primary} />
          ) : (
            <Moon size={21} color={theme.colors.primary} />
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    width: "100%",
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  inner: {
    minHeight: 64,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 14,
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    overflow: "hidden",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  name: {
    lineHeight: 26,
  },
  themeButton: {
    width: 46,
    height: 46,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
});
