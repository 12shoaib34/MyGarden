import { StyleSheet, Text, View } from "react-native";
import { useGetSafeAreaInsets } from "../hooks/getSafeAreaInsets";
import { useTheme } from "../theme/ThemeProvider";

export function AppHeader({ icon: Icon, title, subtitle, right }) {
  const { theme } = useTheme();
  const insets = useGetSafeAreaInsets();

  return (
    <View
      style={[
        styles.header,
        {
          paddingTop: insets.contentTop,
          borderBottomColor: theme.colors.border,
          backgroundColor: theme.colors.background,
        },
      ]}
    >
      <View style={[styles.iconBox, { backgroundColor: theme.colors.successSurface }]}>
        <Icon size={21} color={theme.colors.primary} />
      </View>
      <View style={styles.textBlock}>
        <Text style={[styles.title, theme.typography.title, { color: theme.colors.text }]}>
          {title}
        </Text>
        {subtitle ? (
          <Text
            style={[styles.subtitle, theme.typography.bodySmall, { color: theme.colors.textMuted }]}
            numberOfLines={1}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right ? <View style={styles.right}>{right}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    minHeight: 74,
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  textBlock: {
    flex: 1,
  },
  title: {
    lineHeight: 24,
  },
  subtitle: {
    marginTop: 2,
  },
  right: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
});
