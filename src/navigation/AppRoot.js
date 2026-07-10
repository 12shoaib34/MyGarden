import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import * as NavigationBar from "expo-navigation-bar";
import { BottomTabs } from "../components/BottomTabs";
import { FloatingAddButton } from "../components/FloatingAddButton";
import { CalendarScreen } from "../screens/CalendarScreen";
import { HomeDashboardScreen } from "../screens/HomeDashboardScreen";
import { PlantsScreen } from "../screens/PlantsScreen";
import { SettingsScreen } from "../screens/SettingsScreen";
import { useTheme } from "../theme/ThemeProvider";

export function AppRoot() {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState("home");

  return (
    <>
      <NavigationBar.NavigationBar
        hidden
        style={theme.mode === "dark" ? "light" : "dark"}
      />
      <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
        <StatusBar style={theme.mode === "dark" ? "light" : "dark"} />
        {activeTab === "home" ? <HomeDashboardScreen /> : null}
        {activeTab === "plants" ? <PlantsScreen /> : null}
        {activeTab === "calendar" ? <CalendarScreen /> : null}
        {activeTab === "settings" ? <SettingsScreen /> : null}
        <FloatingAddButton />
        <BottomTabs active={activeTab} onChange={setActiveTab} />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
