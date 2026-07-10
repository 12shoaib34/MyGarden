import { useState } from "react";
import { Image, StyleSheet, View } from "react-native";
import { Leaf } from "lucide-react-native";
import { useTheme } from "../theme/ThemeProvider";

export function RemotePlantImage({ uri, style, iconSize = 30 }) {
  const { theme } = useTheme();
  const [failed, setFailed] = useState(false);

  if (!uri || failed) {
    return (
      <View
        style={[
          styles.fallback,
          {
            backgroundColor: theme.colors.successSurface,
            borderColor: theme.colors.border,
          },
          style,
        ]}
      >
        <Leaf size={iconSize} color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <Image
      source={{ uri }}
      style={style}
      resizeMode="cover"
      onError={() => setFailed(true)}
    />
  );
}

const styles = StyleSheet.create({
  fallback: {
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
  },
});
