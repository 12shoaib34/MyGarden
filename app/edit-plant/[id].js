import { useCallback, useState } from "react";
import { Text, View } from "react-native";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { AddPlantScreen } from "../../src/screens/AddPlantScreen";
import { getPlant } from "../../src/storage/database";
import { useTheme } from "../../src/theme/ThemeProvider";

export default function EditPlantRoute() {
  const { id } = useLocalSearchParams();
  const { theme } = useTheme();
  const [plant, setPlant] = useState(null);

  useFocusEffect(
    useCallback(() => {
      let alive = true;

      getPlant(id).then((savedPlant) => {
        if (alive) {
          setPlant(savedPlant);
        }
      });

      return () => {
        alive = false;
      };
    }, [id])
  );

  if (!plant) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: theme.colors.background,
        }}
      >
        <Text style={{ color: theme.colors.text }}>Loading plant...</Text>
      </View>
    );
  }

  return (
    <AddPlantScreen
      plant={plant}
      onCancel={() => router.back()}
      onSaved={() => router.back()}
    />
  );
}
