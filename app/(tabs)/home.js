import { HomeDashboardScreen } from "../../src/screens/HomeDashboardScreen";
import { router } from "expo-router";

export default function HomeRoute() {
  return <HomeDashboardScreen onViewAllPlants={() => router.navigate("/(tabs)/plants")} />;
}
