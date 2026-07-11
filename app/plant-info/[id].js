import { router, useLocalSearchParams } from "expo-router";
import plantInfo from "../../src/data/plantInfo.json";
import { PlantInfoDetailScreen } from "../../src/screens/PlantInfoDetailScreen";

export default function PlantInfoDetailRoute() {
  const { id } = useLocalSearchParams();
  const plant = plantInfo.find((item) => String(item.id) === String(id)) ?? plantInfo[0];

  return (
    <PlantInfoDetailScreen
      plant={plant}
      onBack={() => router.back()}
    />
  );
}
