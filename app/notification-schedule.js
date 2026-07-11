import { router } from "expo-router";
import { NotificationScheduleScreen } from "../src/screens/NotificationScheduleScreen";

export default function NotificationScheduleRoute() {
  return <NotificationScheduleScreen onBack={() => router.back()} />;
}
