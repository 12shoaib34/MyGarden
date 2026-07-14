import { router } from "expo-router";
import { PlantInfoListScreen } from "../../src/screens/PlantInfoListScreen";

export default function PlantInfoRoute() {
  return (
    <PlantInfoListScreen
      onSelectPlant={(plant) => router.push(`/plant-info/${plant.id}`)}
    />
  );
}
