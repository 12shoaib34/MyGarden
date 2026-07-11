import { useCallback, useState } from "react";
import { router, useFocusEffect } from "expo-router";
import { PlantsScreen } from "../../src/screens/PlantsScreen";

export default function PlantsRoute() {
  const [focusVersion, setFocusVersion] = useState(0);

  useFocusEffect(
    useCallback(() => {
      setFocusVersion((version) => version + 1);
    }, [])
  );

  return (
    <PlantsScreen
      key={focusVersion}
      onAddPlant={() => router.push("/add")}
      onEditPlant={(plant) => router.push(`/edit-plant/${plant.id}`)}
    />
  );
}
