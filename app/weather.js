import { router } from "expo-router";
import { WeatherDetailScreen } from "../src/screens/WeatherDetailScreen";

export default function WeatherRoute() {
  return <WeatherDetailScreen onBack={goBackToHome} />;
}

function goBackToHome() {
  if (router.canGoBack()) {
    router.back();
    return;
  }

  router.replace("/(tabs)/home");
}
