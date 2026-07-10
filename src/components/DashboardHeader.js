import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { Bell } from "lucide-react-native";
import { useGetSafeAreaInsets } from "../hooks/getSafeAreaInsets";
import { useTheme } from "../theme/ThemeProvider";

const avatarUri =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBR8qjm6unNEvy7exmTfQvScMqhELnMaQKELbSl6GNdwEcEjeYwSNUT1gwq0otnK5n0RmwIH6RJ5rCXm7XjbEDhhAjy8KJK4ummGpSFbHnNLbkmWLGLQakdFFysB1RV6BZ7HlEBhx0QUxcQrUX9slB-ID6nviitmQvg9FbZpizdVat6YRjl0GLB_j4ffKcBkQ14_iZktyYBTWvzBlHodMerttOEjT4I3vGqA6mLHeIiPJw7ph0NGV5KwkZ3_GHQU9RmoBc2eJgkwwg3";

export function DashboardHeader({ name = "Alex Rivera" }) {
  const { theme } = useTheme();
  const insets = useGetSafeAreaInsets();

  return (
    <View
      style={[
        styles.header,
        {
          borderBottomColor: theme.colors.border,
          paddingTop: insets.top,
        },
      ]}
    >
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
          <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
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
            {name}
          </Text>
        </View>
      </View>

      <Pressable
        style={styles.bell}
        accessibilityRole="button"
        accessibilityLabel="Notifications"
      >
        <Bell size={22} color={theme.colors.textMuted} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    minHeight: 64,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 28,
    borderBottomWidth: StyleSheet.hairlineWidth,
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
  bell: {
    width: 46,
    height: 46,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
});
