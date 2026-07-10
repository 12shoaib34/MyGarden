import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { SystemBars } from "react-native-edge-to-edge";
import { BottomTabs } from "../components/BottomTabs";
import { AddPlantScreen } from "../screens/AddPlantScreen";
import { HomeDashboardScreen } from "../screens/HomeDashboardScreen";
import { PlantInfoDetailScreen } from "../screens/PlantInfoDetailScreen";
import { PlantInfoListScreen } from "../screens/PlantInfoListScreen";
import { PlantsScreen } from "../screens/PlantsScreen";
import { SettingsScreen } from "../screens/SettingsScreen";
import { initializeNotifications } from "../services/notificationService";
import { useTheme } from "../theme/ThemeProvider";

export function AppRoot() {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState("home");
  const [showAddPlant, setShowAddPlant] = useState(false);
  const [editingPlant, setEditingPlant] = useState(null);
  const [selectedPlantInfo, setSelectedPlantInfo] = useState(null);

  useEffect(() => {
    async function setupNotifications() {
      try {
        await initializeNotifications();
      } catch (error) {
        console.warn("Notification setup failed", error);
      }
    }

    setupNotifications();
  }, []);

  function closeAddPlant() {
    setShowAddPlant(false);
    setEditingPlant(null);
    setActiveTab("plants");
  }

  function openAddPlant() {
    setEditingPlant(null);
    setShowAddPlant(true);
  }

  function openEditPlant(plant) {
    setEditingPlant(plant);
    setShowAddPlant(true);
  }

  function changeTab(nextTab) {
    setSelectedPlantInfo(null);
    setActiveTab(nextTab);
  }

  return (
    <>
      <SystemBars style={theme.mode === "dark" ? "light" : "dark"} />
      <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
        {showAddPlant ? (
          <AddPlantScreen
            plant={editingPlant}
            onCancel={() => setShowAddPlant(false)}
            onSaved={closeAddPlant}
          />
        ) : (
          <>
            {activeTab === "home" ? <HomeDashboardScreen /> : null}
            {activeTab === "plants" ? (
              <PlantsScreen onAddPlant={openAddPlant} onEditPlant={openEditPlant} />
            ) : null}
            {activeTab === "info" && selectedPlantInfo ? (
              <PlantInfoDetailScreen
                plant={selectedPlantInfo}
                onBack={() => setSelectedPlantInfo(null)}
              />
            ) : null}
            {activeTab === "info" && !selectedPlantInfo ? (
              <PlantInfoListScreen onSelectPlant={setSelectedPlantInfo} />
            ) : null}
            {activeTab === "settings" ? <SettingsScreen /> : null}
            <BottomTabs active={activeTab} onChange={changeTab} />
          </>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
