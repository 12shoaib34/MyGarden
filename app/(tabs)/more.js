import { router } from "expo-router";
import { MoreScreen } from "../../src/screens/MoreScreen";

export default function MoreRoute() {
  return (
    <MoreScreen
      onOpenProfile={() => router.push("/profile")}
      onOpenPlantInfo={() => router.push("/plant-info")}
      onOpenFertilizerTimeline={() => router.push("/fertilizer-timeline")}
      onOpenTheme={() => router.push("/settings-theme")}
      onOpenData={() => router.push("/settings-data")}
      onOpenNotifications={() => router.push("/notification-schedule")}
    />
  );
}
