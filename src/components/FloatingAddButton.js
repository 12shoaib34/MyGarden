import { Pressable, StyleSheet } from "react-native";
import { Plus } from "lucide-react-native";
import { useGetSafeAreaInsets } from "../hooks/getSafeAreaInsets";
import { useTheme } from "../theme/ThemeProvider";

export function FloatingAddButton() {
  const { theme } = useTheme();
  const insets = useGetSafeAreaInsets();

  return (
    <Pressable
      style={[
        styles.fab,
        { bottom: 88 + insets.bottom, backgroundColor: theme.colors.primary },
      ]}
    >
      <Plus size={30} color={theme.colors.onPrimary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    right: 24,
    width: 64,
    height: 64,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
});
