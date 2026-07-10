import { StyleSheet, Text, View } from "react-native";
import { useGetSafeAreaInsets } from "../hooks/getSafeAreaInsets";
import { useTheme } from "../theme/ThemeProvider";

export function PlantsScreen() {
  const { theme } = useTheme();
  const insets = useGetSafeAreaInsets();
  const themedStyles = createStyles(theme, insets);

  return (
    <View style={themedStyles.container}>
      <Text style={themedStyles.pageTitle}>My Plants</Text>
      <Text style={themedStyles.pageSubtitle}>
        Saved local plants will appear here.
      </Text>
    </View>
  );
}

function createStyles(theme, insets) {
  return StyleSheet.create({
    container: {
      flex: 1,
      paddingHorizontal: 20,
      paddingTop: insets.contentTop,
    },
    pageTitle: {
      ...theme.typography.headline,
      color: theme.colors.text,
    },
    pageSubtitle: {
      ...theme.typography.body,
      color: theme.colors.textMuted,
      marginTop: 12,
    },
  });
}
