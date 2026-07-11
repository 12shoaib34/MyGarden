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
      <Tabs.Screen name="info" options={{ title: "Plant Info" }} />
      <Tabs.Screen name="settings" options={{ title: "Settings" }} />
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
