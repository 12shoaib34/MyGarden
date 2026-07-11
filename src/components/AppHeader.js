import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { useGetSafeAreaInsets } from "../hooks/getSafeAreaInsets";
import { withHaptic } from "../services/hapticService";
import { useTheme } from "../theme/ThemeProvider";

export function AppHeader({ icon: Icon, imageUri, title, subtitle, children, right }) {
  const { theme } = useTheme();
  const insets = useGetSafeAreaInsets();
  const actions = children ?? right;

  return (
    <View
      style={[
        styles.header,
        {
          paddingTop: insets.top,
          borderBottomColor: theme.colors.border,
          backgroundColor: theme.colors.background,
        },
      ]}
    >
      <View
        pointerEvents="none"
        style={[
          styles.statusStrip,
          {
            height: insets.top,
            backgroundColor:
              theme.mode === "dark" ? theme.colors.primary : theme.colors.background,
          },
        ]}
      />
      <View style={[styles.iconBox, { backgroundColor: theme.colors.successSurface }]}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.iconImage} />
        ) : (
          <Icon size={21} color={theme.colors.primary} />
        )}
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
      {actions ? <View style={styles.right}>{actions}</View> : null}
    </View>
  );
}

export function HeaderActionButton({
  children,
  onPress,
  disabled,
  accessibilityLabel,
  variant = "secondary",
}) {
  const { theme } = useTheme();
  const isPrimary = variant === "primary";

  return (
    <Pressable
      onPress={withHaptic(onPress, variant === "primary" ? "confirm" : "tap")}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [
        styles.actionButton,
        {
          backgroundColor: isPrimary ? theme.colors.primary : theme.colors.surface,
          borderColor: isPrimary ? theme.colors.primary : theme.colors.border,
          opacity: disabled ? 0.5 : pressed ? 0.72 : 1,
        },
      ]}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  statusStrip: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
  },
  header: {
    minHeight: 72,
    paddingHorizontal: 20,
    paddingBottom: 14,
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
    overflow: "hidden",
  },
  iconImage: {
    width: "100%",
    height: "100%",
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
  actionButton: {
    width: 38,
    height: 38,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
});
