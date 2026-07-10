import { AppProviders } from "./src/providers/AppProviders";
import { AppRoot } from "./src/navigation/AppRoot";

export default function App() {
  return (
    <AppProviders>
      <AppRoot />
    </AppProviders>
  );
}
