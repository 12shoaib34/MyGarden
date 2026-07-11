import { router } from "expo-router";
import { ThemeSettingsScreen } from "../src/screens/ThemeSettingsScreen";

export default function ThemeSettingsRoute() {
  return <ThemeSettingsScreen onBack={() => router.back()} />;
}
