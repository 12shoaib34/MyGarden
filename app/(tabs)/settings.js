import { router } from "expo-router";
import { SettingsScreen } from "../../src/screens/SettingsScreen";

export default function SettingsRoute() {
  return (
    <SettingsScreen
      onOpenProfile={() => router.push("/profile")}
      onOpenTheme={() => router.push("/settings-theme")}
      onOpenData={() => router.push("/settings-data")}
      onOpenNotifications={() => router.push("/notification-schedule")}
    />
  );
}
