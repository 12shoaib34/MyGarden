import { router } from "expo-router";
import { AddPlantScreen } from "../src/screens/AddPlantScreen";

export default function AddPlantRoute() {
  return (
    <AddPlantScreen
      onCancel={() => router.back()}
      onSaved={() => router.back()}
    />
  );
}
