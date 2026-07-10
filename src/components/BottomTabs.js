import { Pressable, StyleSheet, Text, View } from "react-native";
import { BookOpen, Home, Leaf, UserRound } from "lucide-react-native";
import { useGetSafeAreaInsets } from "../hooks/getSafeAreaInsets";
import { useTheme } from "../theme/ThemeProvider";

const tabs = [
  ["home", "Home", Home],
  ["plants", "My Plants", Leaf],
  ["info", "Plant Info", BookOpen],
  ["settings", "Profile", UserRound],
];

export const bottomTabHeight = 110;

export function BottomTabs({ active, onChange }) {
  const { theme } = useTheme();
  const insets = useGetSafeAreaInsets();

  return (
    <View
      style={[
        styles.tabbar,
        {
          height: bottomTabHeight,
          paddingBottom: insets.bottom,
          backgroundColor: theme.colors.surfaceSoft,
        },
      ]}
    >
      {tabs.map(([key, label, Icon]) => {
        const focused = active === key;
        const color = focused
          ? theme.colors.primaryStrong
          : theme.colors.textMuted;

        return (
          <Pressable
            key={key}
            onPress={() => onChange(key)}
            style={[
              styles.tabItem,
              focused && { backgroundColor: theme.colors.secondaryContainer },
            ]}
          >
            <Icon size={22} color={color} />
            <Text style={[theme.typography.label, styles.tabLabel, { color }]}>
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  tabbar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 14,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    flexDirection: "row",
    justifyContent: "space-around",
  },
  tabItem: {
    minWidth: 78,
    minHeight: 48,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  tabLabel: {
    fontSize: 14,
    lineHeight: 18,
  },
});
