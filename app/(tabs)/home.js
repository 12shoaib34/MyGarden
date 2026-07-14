import { useCallback, useState } from "react";
import { router, useFocusEffect } from "expo-router";
import { HomeDashboardScreen } from "../../src/screens/HomeDashboardScreen";

export default function HomeRoute() {
  const [focusVersion, setFocusVersion] = useState(0);

  useFocusEffect(
    useCallback(() => {
      setFocusVersion((version) => version + 1);
    }, [])
  );

  return (
    <HomeDashboardScreen
      key={focusVersion}
      onViewAllPlants={() => router.navigate("/(tabs)/plants")}
      onOpenMore={() => router.navigate("/(tabs)/more")}
    />
  );
}
