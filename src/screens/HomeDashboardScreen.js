import { useEffect, useState } from "react";
import {
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Camera, Droplets, Leaf, Sprout, Wheat } from "lucide-react-native";
import { Card } from "../components/Card";
import { DashboardHeader } from "../components/DashboardHeader";
import { WeatherSummaryCard } from "../components/WeatherSummaryCard";
import { useGetSafeAreaInsets } from "../hooks/getSafeAreaInsets";
import { getSurjaniTownWeather } from "../services/weatherService";
import { getDashboardStats, listFavoritePlants } from "../storage/database";
import { useTheme } from "../theme/ThemeProvider";
import { getPlantAgeLabel } from "../utils/plantAge";

export function HomeDashboardScreen({ onViewAllPlants }) {
  const { theme } = useTheme();
  const insets = useGetSafeAreaInsets();
  const themedStyles = createStyles(theme, insets);
  const [stats, setStats] = useState({
    totalPlants: 0,
    waterDue: 0,
    fertilizerDue: 0,
    harvestReady: 0,
  });
  const [plants, setPlants] = useState([]);
  const [weather, setWeather] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    let alive = true;

    async function load() {
      const [nextStats, nextPlants, nextWeather] = await Promise.all([
        getDashboardStats(),
        listFavoritePlants(5),
        getSurjaniTownWeather(),
      ]);

      if (alive) {
        setStats(nextStats);
        setPlants(nextPlants);
        setWeather(nextWeather);
      }
    }

    load();

    return () => {
      alive = false;
    };
  }, []);

  async function refreshDashboard() {
    setRefreshing(true);

    try {
      const [nextStats, nextPlants, nextWeather] = await Promise.all([
        getDashboardStats(),
        listFavoritePlants(5),
        getSurjaniTownWeather({ forceRefresh: true }),
      ]);

      setStats(nextStats);
      setPlants(nextPlants);
      setWeather(nextWeather);
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <View style={themedStyles.screen}>
      <DashboardHeader />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={themedStyles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refreshDashboard}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
            progressBackgroundColor={theme.colors.surface}
          />
        }
      >
        <WeatherSummaryCard weather={weather} />

        <View style={themedStyles.grid}>
          <DashboardStat
            label="Total Plants"
            value={stats.totalPlants}
            Icon={Sprout}
            tone="primary"
            background={theme.colors.statSurface}
          />
          <DashboardStat
            label="Needs Water"
            value={stats.waterDue}
            Icon={Droplets}
            tone="water"
            background={theme.colors.waterSurface ?? "#E3F2FD"}
          />
          <DashboardStat
            label="Fertilizer Due"
            value={stats.fertilizerDue}
            Icon={Wheat}
            tone="brown"
            background={theme.colors.fertilizerSurface ?? "#F1ECE9"}
          />
          <DashboardStat
            label="Harvest Ready"
            value={stats.harvestReady}
            Icon={Leaf}
            tone="harvest"
            background={theme.colors.harvestSurface ?? "#FFF1DD"}
          />
        </View>

        <View style={themedStyles.sectionHeader}>
          <Text style={themedStyles.sectionTitle}>My Garden</Text>
          <Pressable
            onPress={onViewAllPlants}
            hitSlop={12}
            style={({ pressed }) => [
              themedStyles.linkButton,
              { opacity: pressed ? 0.72 : 1 },
            ]}
          >
            <Text style={themedStyles.link}>View All</Text>
          </Pressable>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={themedStyles.gardenRow}
        >
          {plants.length > 0 ? (
            plants.map((plant) => (
              <GardenCard key={plant.id ?? plant.name} plant={plant} />
            ))
          ) : (
            <Card style={themedStyles.emptyGardenCard}>
              <View style={themedStyles.emptyIcon}>
                <Sprout size={28} color={theme.colors.primary} />
              </View>
              <Text style={themedStyles.emptyTitle}>No favorite plants</Text>
              <Text style={themedStyles.emptyBody}>
                Mark plants as favorite from My Plants to see them here.
              </Text>
            </Card>
          )}
        </ScrollView>

        <Text style={themedStyles.activityTitle}>Recent Activity</Text>
        <Card style={themedStyles.emptyActivityCard}>
          <View style={themedStyles.emptyIcon}>
            <Camera size={26} color={theme.colors.primary} />
          </View>
          <Text style={themedStyles.emptyTitle}>No activity yet</Text>
          <Text style={themedStyles.emptyBody}>
            Watering, feeding, photos, and notes will appear here.
          </Text>
        </Card>
      </ScrollView>
    </View>
  );
}

function DashboardStat({ label, value, Icon, tone, background }) {
  const { theme } = useTheme();
  const color = theme.colors[tone] || theme.colors.primary;
  const cardBackground =
    background ??
    (tone === "primary"
      ? theme.colors.statSurface ?? theme.colors.surface
      : theme.colors.surface);

  return (
    <Card
      style={[
        styles.statCard,
        { backgroundColor: cardBackground },
      ]}
    >
      <Icon size={22} color={color} />
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text
        style={[
          theme.typography.label,
          { color: tone === "primary" ? theme.colors.textMuted : color },
        ]}
      >
        {label}
      </Text>
    </Card>
  );
}

function GardenCard({ plant }) {
  const { theme } = useTheme();
  const ageLabel = getPlantAgeLabel(plant.purchase_date);

  return (
    <Card style={styles.gardenCard}>
      <View style={styles.plantImage}>
        {plant.image_uri ? (
          <Image source={{ uri: plant.image_uri }} style={styles.image} />
        ) : (
          <Sprout size={34} color={theme.colors.primary} />
        )}
        <View
          style={[
            styles.badge,
            {
              backgroundColor: theme.colors.successSurface ?? "#EAF7EC",
            },
          ]}
        >
          <Text
            style={[
              styles.badgeText,
              { color: theme.colors.primary },
            ]}
          >
            {ageLabel}
          </Text>
        </View>
      </View>
      <View style={styles.gardenBody}>
        <Text style={[styles.plantName, { color: theme.colors.text }]}>
          {plant.name}
        </Text>
        <Text
          style={[theme.typography.label, { color: theme.colors.textMuted }]}
        >
          {plant.category}
        </Text>
      </View>
    </Card>
  );
}

function ActivityItem({ Icon, title, body, time, tone }) {
  const { theme } = useTheme();
  const color = theme.colors[tone] || theme.colors.primary;

  return (
    <Card style={styles.activity}>
      <View style={[styles.activityIcon, { backgroundColor: `${color}18` }]}>
        <Icon size={22} color={color} />
      </View>
      <View style={styles.activityText}>
        <View style={styles.activityHeader}>
          <Text
            style={[
              theme.typography.label,
              styles.activityTitleText,
              { color: theme.colors.text },
            ]}
          >
            {title}
          </Text>
          <Text style={[styles.time, { color: theme.colors.textMuted }]}>
            {time}
          </Text>
        </View>
        <Text
          style={[
            theme.typography.bodySmall,
            { color: theme.colors.textMuted },
          ]}
        >
          {body}
        </Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  statCard: {
    width: "48%",
    minHeight: 152,
    padding: 20,
    justifyContent: "center",
    gap: 10,
  },
  statValue: {
    fontSize: 32,
    lineHeight: 38,
    fontWeight: "700",
  },
  gardenCard: {
    width: 200,
    marginRight: 16,
    overflow: "hidden",
    padding: 4,
  },
  plantImage: {
    height: 160,
    borderRadius: 20,
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  badge: {
    position: "absolute",
    top: 8,
    right: 8,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 10,
    lineHeight: 12,
    fontWeight: "700",
  },
  gardenBody: {
    padding: 14,
  },
  plantName: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "700",
  },
  waterText: {
    marginTop: 12,
    fontSize: 12,
    fontWeight: "700",
  },
  activity: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 16,
    padding: 16,
  },
  activityIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  activityText: {
    flex: 1,
  },
  activityHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  activityTitleText: {
    flex: 1,
  },
  time: {
    fontSize: 10,
  },
});

function createStyles(theme) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scroll: {
      paddingTop: 28,
      paddingHorizontal: 20,
      paddingBottom: 132,
    },
    grid: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-between",
      rowGap: 16,
      marginBottom: 28,
    },
    sectionHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 16,
    },
    sectionTitle: {
      ...theme.typography.headline,
      color: theme.colors.text,
    },
    link: {
      ...theme.typography.label,
      color: theme.colors.primary,
    },
    linkButton: {
      minHeight: 36,
      paddingLeft: 12,
      justifyContent: "center",
    },
    gardenRow: {
      paddingBottom: 24,
    },
    activityTitle: {
      ...theme.typography.headline,
      color: theme.colors.text,
      marginTop: 26,
      marginBottom: 16,
    },
    activities: {
      gap: 16,
    },
    emptyGardenCard: {
      width: 260,
      minHeight: 170,
      alignItems: "center",
      justifyContent: "center",
      padding: 22,
      gap: 10,
    },
    emptyActivityCard: {
      alignItems: "center",
      padding: 24,
      gap: 10,
    },
    emptyIcon: {
      width: 54,
      height: 54,
      borderRadius: 18,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.colors.successSurface,
    },
    emptyTitle: {
      ...theme.typography.title,
      color: theme.colors.text,
      textAlign: "center",
    },
    emptyBody: {
      ...theme.typography.bodySmall,
      color: theme.colors.textMuted,
      textAlign: "center",
    },
  });
}
