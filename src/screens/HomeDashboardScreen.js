import { useEffect, useState } from "react";
import { Image, ScrollView, StyleSheet, Text, View } from "react-native";
import {
  Camera,
  Droplets,
  Leaf,
  Sprout,
  Sun,
  Wheat,
} from "lucide-react-native";
import { Card } from "../components/Card";
import { DashboardHeader } from "../components/DashboardHeader";
import { useGetSafeAreaInsets } from "../hooks/getSafeAreaInsets";
import { getDashboardStats, listPlants } from "../storage/database";
import { useTheme } from "../theme/ThemeProvider";

const previewPlants = [
  {
    name: "Monstera Deliciosa",
    category: "Living Room",
    image_uri:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAUhBIUoLmFnVvn8ySA0722AqFE0nt7hDt7W2xcbMGssJhKYunRpLtEzpFA16spTmv4HLUsNq_atptg8BWvwVQnmgFSetgR7EIaWSo7MdTSb_GPvSd4mRDBfA7H95CdRH16v_WfbrX8hT6ad3VnZ_IWajE4JE_C7PclQrWTPRWMKMBMy8A_G6E_RTamCIOuAvQT2_CdiTbl4ztyQCk5yDA-WgNr20h_n7ScXecaDSRbBKl3LeCEB8xSkFDA9AR-J8T5PDiKyzHMrK_T",
  },
  {
    name: "Fiddle Leaf Fig",
    category: "Bedroom",
    image_uri:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuD3VyFW-mf23bR04A1hrZhB2nfiNx0sjYe_InXMtFcyckeqZHijiomkpKiaHGx6hKXGc1-z9T0MfOUfnqqnNdYWQIUhiDr09uh1dSRRLCqS1zb1HRBgYdEmc16-bur8sKADwLULH0y5zDO9muy2PuXd4YkxTlF1GtBE0Iu4ednybiFdkT6s3j4UqHN5tDr1rP7r9zjIl_SRTkTgQDwwQFcI72CHKDsONrRXWBllZt4vOPfoYGXyeP9TEE8YhrNhieyw9IvwrxAlmkPz",
  },
];

export function HomeDashboardScreen() {
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

  useEffect(() => {
    let alive = true;

    async function load() {
      const [nextStats, nextPlants] = await Promise.all([
        getDashboardStats(),
        listPlants(),
      ]);

      if (alive) {
        setStats(nextStats);
        setPlants(nextPlants.slice(0, 2));
      }
    }

    load();

    return () => {
      alive = false;
    };
  }, []);

  const gardenPlants = plants.length > 0 ? plants : previewPlants;

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={themedStyles.scroll}
    >
      <DashboardHeader />

      <Card style={themedStyles.weatherCard}>
        <View style={themedStyles.weatherIcon}>
          <Sun size={30} color={theme.colors.primary} />
        </View>
        <View style={themedStyles.weatherMain}>
          <Text style={themedStyles.weatherTitle}>24°C Sunny</Text>
          <Text style={themedStyles.weatherBody}>
            Perfect day for repotting
          </Text>
        </View>
        <View style={themedStyles.weatherMeta}>
          <Text style={themedStyles.metaGreen}>Humidity: 65%</Text>
          <Text style={themedStyles.metaText}>Wind: 5km/h</Text>
        </View>
      </Card>

      <View style={themedStyles.grid}>
        <DashboardStat
          label="Total Plants"
          value={stats.totalPlants || 14}
          Icon={Sprout}
          tone="primary"
        />
        <DashboardStat
          label="Needs Water"
          value={stats.waterDue || 3}
          Icon={Droplets}
          tone="water"
          background="#E3F2FD"
        />
        <DashboardStat
          label="Fertilizer Due"
          value={stats.fertilizerDue || 2}
          Icon={Wheat}
          tone="brown"
          background="#F1ECE9"
        />
        <DashboardStat
          label="Harvest Ready"
          value={stats.harvestReady || 5}
          Icon={Leaf}
          tone="harvest"
          background="#FFF1DD"
        />
      </View>

      <View style={themedStyles.sectionHeader}>
        <Text style={themedStyles.sectionTitle}>My Garden</Text>
        <Text style={themedStyles.link}>View All</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={themedStyles.gardenRow}
      >
        {gardenPlants.map((plant, index) => (
          <GardenCard
            key={plant.id ?? plant.name}
            plant={plant}
            badge={index === 0 ? "HEALTHY" : "NEEDS WATER"}
          />
        ))}
      </ScrollView>

      <Text style={themedStyles.activityTitle}>Recent Activity</Text>
      <View style={themedStyles.activities}>
        <ActivityItem
          Icon={Droplets}
          title="Watered Monstera"
          body="You gave 500ml of filtered water to your Monstera Deliciosa."
          time="2h ago"
          tone="water"
        />
        <ActivityItem
          Icon={Wheat}
          title="Fertilizer Applied"
          body="Added organic seaweed fertilizer to the Snake Plant."
          time="Yesterday"
          tone="brown"
        />
        <ActivityItem
          Icon={Camera}
          title="New Growth Logged"
          body="Captured a new leaf unfolding on the Pothos in the hallway."
          time="2 days ago"
          tone="primary"
        />
      </View>
    </ScrollView>
  );
}

function DashboardStat({ label, value, Icon, tone, background }) {
  const { theme } = useTheme();
  const color = theme.colors[tone] || theme.colors.primary;

  return (
    <Card
      style={[
        styles.statCard,
        { backgroundColor: background || theme.colors.surface },
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

function GardenCard({ plant, badge }) {
  const { theme } = useTheme();
  const needsWater = badge === "NEEDS WATER";

  return (
    <Card style={styles.gardenCard}>
      <View style={styles.plantImage}>
        <Image source={{ uri: plant.image_uri }} style={styles.image} />
        <View
          style={[
            styles.badge,
            { backgroundColor: needsWater ? "#FFE8E8" : "#EAF7EC" },
          ]}
        >
          <Text
            style={[
              styles.badgeText,
              { color: needsWater ? theme.colors.error : theme.colors.primary },
            ]}
          >
            {badge}
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
        <Text
          style={[
            styles.waterText,
            { color: needsWater ? theme.colors.error : theme.colors.water },
          ]}
        >
          {needsWater ? "●  Water Today" : "●  Water in 2 days"}
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
    scroll: {
      paddingTop: 0,
      paddingHorizontal: 20,
      paddingBottom: 132,
    },
    weatherCard: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 16,
      padding: 24,
      minHeight: 128,
      marginBottom: 24,
      borderRadius: 28,
      backgroundColor: theme.colors.surfaceSoft,
    },
    weatherIcon: {
      width: 48,
      height: 48,
      borderRadius: 999,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: `${theme.colors.primary}12`,
    },
    weatherMain: {
      flex: 1,
      gap: 4,
    },
    weatherTitle: {
      fontSize: 24,
      lineHeight: 30,
      fontWeight: "600",
      color: theme.colors.text,
    },
    weatherBody: {
      ...theme.typography.body,
      color: theme.colors.textMuted,
    },
    weatherMeta: {
      alignItems: "flex-end",
      gap: 3,
    },
    metaGreen: {
      ...theme.typography.label,
      color: theme.colors.primary,
    },
    metaText: {
      ...theme.typography.bodySmall,
      color: theme.colors.textMuted,
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
  });
}
