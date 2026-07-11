import { useEffect, useState } from "react";
import { Moon, Sun, UserRound } from "lucide-react-native";
import { AppHeader, HeaderActionButton } from "./AppHeader";
import { getSetting } from "../storage/database";
import { getThemeFamilyId, getThemeIdForFamilyMode } from "../theme/themes";
import { useTheme } from "../theme/ThemeProvider";

export function DashboardHeader() {
  const { theme, themeId, setThemeId } = useTheme();
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
    <AppHeader
      icon={UserRound}
      imageUri={profile.avatarUri}
      title={displayName}
      subtitle="Welcome back,"
    >
      <HeaderActionButton
        onPress={toggleThemeMode}
        accessibilityLabel="Toggle theme mode"
      >
        {isDarkMode ? (
          <Sun size={21} color={theme.colors.primary} />
        ) : (
          <Moon size={21} color={theme.colors.primary} />
        )}
      </HeaderActionButton>
    </AppHeader>
  );
}
