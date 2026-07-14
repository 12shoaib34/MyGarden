import { router } from "expo-router";
import { NotificationScheduleScreen } from "../src/screens/NotificationScheduleScreen";

export default function NotificationScheduleRoute() {
  return <NotificationScheduleScreen onBack={goBackToMore} />;
}

function goBackToMore() {
  if (router.canGoBack()) {
    router.back();
    return;
  }

  router.replace("/(tabs)/more");
}
