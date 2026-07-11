import { router } from "expo-router";
import { ProfileScreen } from "../src/screens/ProfileScreen";

export default function ProfileRoute() {
  return <ProfileScreen onBack={() => router.back()} />;
}
