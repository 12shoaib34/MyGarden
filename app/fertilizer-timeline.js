import { router } from "expo-router";
import { FertilizerTimelineScreen } from "../src/screens/FertilizerTimelineScreen";

export default function FertilizerTimelineRoute() {
  return <FertilizerTimelineScreen onBack={goBackToMore} />;
}

function goBackToMore() {
  if (router.canGoBack()) {
    router.back();
    return;
  }

  router.replace("/(tabs)/more");
}
