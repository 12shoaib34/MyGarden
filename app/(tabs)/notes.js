import { useCallback, useState } from "react";
import { router, useFocusEffect } from "expo-router";
import { NotesScreen } from "../../src/screens/NotesScreen";

export default function NotesRoute() {
  const [focusVersion, setFocusVersion] = useState(0);

  useFocusEffect(
    useCallback(() => {
      setFocusVersion((version) => version + 1);
    }, [])
  );

  return <NotesScreen key={focusVersion} onAddNote={() => router.push("/add-note")} />;
}
