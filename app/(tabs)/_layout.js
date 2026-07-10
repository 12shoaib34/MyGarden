import { Tabs } from "expo-router";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen name="home" options={{ title: "Home" }} />
      <Tabs.Screen name="plants" options={{ title: "My Plants" }} />
      <Tabs.Screen name="calendar" options={{ title: "Calendar" }} />
      <Tabs.Screen name="settings" options={{ title: "Profile" }} />
      <Tabs.Screen
        name="add"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
