import { router } from "expo-router";
import { DataSettingsScreen } from "../src/screens/DataSettingsScreen";

export default function DataSettingsRoute() {
  return <DataSettingsScreen onBack={() => router.back()} />;
}
