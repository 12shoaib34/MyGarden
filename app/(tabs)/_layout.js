import { Tabs } from "expo-router";
import { BottomTabs } from "../../src/components/BottomTabs";

export default function TabsLayout() {
  return (
    <Tabs
      backBehavior="history"
      screenOptions={{
        headerShown: false,
      }}
      tabBar={(props) => <RouterBottomTabs {...props} />}
    >
      <Tabs.Screen name="home" options={{ title: "Home" }} />
      <Tabs.Screen name="plants" options={{ title: "My Plants" }} />
      <Tabs.Screen name="notes" options={{ title: "Notes" }} />
      <Tabs.Screen name="more" options={{ title: "More" }} />
    </Tabs>
  );
}

function RouterBottomTabs({ state, navigation }) {
  const active = state.routes[state.index]?.name ?? "home";

  return (
    <BottomTabs
      active={active}
      onChange={(nextTab) => {
        if (nextTab !== active) {
          navigation.navigate(nextTab);
        }
      }}
    />
  );
}
