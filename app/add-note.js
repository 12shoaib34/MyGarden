import { router } from "expo-router";
import { AddNoteScreen } from "../src/screens/AddNoteScreen";

export default function AddNoteRoute() {
  return (
    <AddNoteScreen
      onCancel={() => router.back()}
      onSaved={() => router.back()}
    />
  );
}
