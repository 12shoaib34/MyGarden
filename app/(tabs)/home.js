import { useCallback, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Camera, Droplets, Leaf, Plus, Sprout, Sun, Wheat } from 'lucide-react-native';
import { Screen } from '../../src/components/Screen';
import { Card } from '../../src/components/Card';
import { DashboardHeader } from '../../src/components/DashboardHeader';
import { useTheme } from '../../src/theme/ThemeProvider';
import { getDashboardStats, listPlants } from '../../src/storage/database';
import { getPlantAgeLabel } from '../../src/utils/plantAge';

export default function HomeScreen() {
  const { theme } = useTheme();
  const [stats, setStats] = useState(null);
  const [plants, setPlants] = useState([]);
  const styles = createStyles(theme);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      async function load() {
        const [nextStats, nextPlants] = await Promise.all([getDashboardStats(), listPlants()]);
        if (alive) {
          setStats(nextStats);
          setPlants(nextPlants.slice(0, 2));
        }
      }
      load();
      return () => {
        alive = false;
      };
    }, [])
  );

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <DashboardHeader />

        <Card style={styles.weatherCard}>
          <View style={styles.weatherIcon}>
            <Sun size={30} color={theme.colors.primary} fill={`${theme.colors.primary}22`} />
          </View>
          <View style={styles.weatherMain}>
            <Text style={styles.weatherTitle}>24°C Sunny</Text>
            <Text style={styles.weatherBody}>Perfect day for repotting</Text>
          </View>
          <View style={styles.weatherMeta}>
            <Text style={styles.metaGreen}>Humidity: 65%</Text>
            <Text style={styles.metaText}>Wind: 5km/h</Text>
          </View>
        </Card>

        <View style={styles.grid}>
          <DashboardStat label="Total Plants" value={stats?.totalPlants ?? 0} Icon={Sprout} tone="primary" />
          <DashboardStat label="Needs Water" value={stats?.waterDue ?? 3} Icon={Droplets} tone="water" tinted />
          <DashboardStat label="Fertilizer Due" value={stats?.fertilizerDue ?? 2} Icon={Wheat} tone="brown" muted />
          <DashboardStat label="Harvest Ready" value={stats?.harvestReady ?? 5} Icon={Leaf} tone="harvest" warm />
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>My Garden</Text>
          <Pressable onPress={() => router.push('/plants')}>
            <Text style={styles.link}>View all</Text>
          </Pressable>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.gardenRow}
        >
          {(plants.length > 0 ? plants : previewPlants).map((plant, index) => (
            <GardenCard
              key={plant.id ?? plant.name}
              plant={plant}
              preview={!plant.id}
              badge={index === 0 ? 'HEALTHY' : 'NEEDS WATER'}
              onPress={() => (plant.id ? router.push(`/plant/${plant.id}`) : router.push('/add'))}
            />
          ))}
        </ScrollView>

        <Text style={styles.activityTitle}>Recent Activity</Text>
        <View style={styles.activities}>
          <ActivityItem
            Icon={Droplets}
            title="Watered Monstera"
            body="You gave 500ml of filtered water."
            time="2h ago"
            tone="water"
          />
          <ActivityItem
            Icon={Wheat}
            title="Fertilizer Applied"
            body="Added organic seaweed fertilizer."
            time="Yesterday"
            tone="brown"
          />
          <ActivityItem
            Icon={Camera}
            title="New Growth Logged"
            body="Captured a new leaf unfolding."
            time="2 days ago"
            tone="primary"
          />
        </View>
      </ScrollView>
      <Pressable style={styles.fab} onPress={() => router.push('/add')}>
        <Plus size={28} color={theme.colors.onPrimary} />
      </Pressable>
    </Screen>
  );
}

const previewPlants = [
  {
    name: 'Monstera Deliciosa',
    category: 'Living Room',
    variety: '',
    purchase_date: new Date().toISOString().slice(0, 10),
    water_every_days: 2,
    image_uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAUhBIUoLmFnVvn8ySA0722AqFE0nt7hDt7W2xcbMGssJhKYunRpLtEzpFA16spTmv4HLUsNq_atptg8BWvwVQnmgFSetgR7EIaWSo7MdTSb_GPvSd4mRDBfA7H95CdRH16v_WfbrX8hT6ad3VnZ_IWajE4JE_C7PclQrWTPRWMKMBMy8A_G6E_RTamCIOuAvQT2_CdiTbl4ztyQCk5yDA-WgNr20h_n7ScXecaDSRbBKl3LeCEB8xSkFDA9AR-J8T5PDiKyzHMrK_T',
  },
  {
    name: 'Fiddle Leaf Fig',
    category: 'Bedroom',
    variety: '',
    purchase_date: new Date().toISOString().slice(0, 10),
    water_every_days: 0,
    image_uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD3VyFW-mf23bR04A1hrZhB2nfiNx0sjYe_InXMtFcyckeqZHijiomkpKiaHGx6hKXGc1-z9T0MfOUfnqqnNdYWQIUhiDr09uh1dSRRLCqS1zb1HRBgYdEmc16-bur8sKADwLULH0y5zDO9muy2PuXd4YkxTlF1GtBE0Iu4ednybiFdkT6s3j4UqHN5tDr1rP7r9zjIl_SRTkTgQDwwQFcI72CHKDsONrRXWBllZt4vOPfoYGXyeP9TEE8YhrNhieyw9IvwrxAlmkPz',
  },
];

function DashboardStat({ label, value, Icon, tone, tinted, muted, warm }) {
  const { theme } = useTheme();
  const color = theme.colors[tone] || theme.colors.primary;
  const backgroundColor = tinted
    ? '#E3F2FD'
    : muted
      ? '#F1ECE9'
      : warm
        ? '#FFF1DD'
        : theme.colors.surface;

  return (
    <Card style={[dashboardStyles.statCard, { backgroundColor }]}>
      <Icon size={21} color={color} strokeWidth={2.3} />
      <Text style={[theme.typography.headline, dashboardStyles.statValue, { color }]}>{value}</Text>
      <Text style={[theme.typography.bodySmall, { color: theme.colors.textMuted }]}>{label}</Text>
    </Card>
  );
}

function GardenCard({ plant, badge, preview, onPress }) {
  const { theme } = useTheme();
  const isNeedsWater = badge === 'NEEDS WATER';

  return (
    <Pressable onPress={onPress} style={dashboardStyles.gardenPressable}>
      <Card style={dashboardStyles.gardenCard}>
        <View style={[dashboardStyles.plantImage, { backgroundColor: theme.colors.beige }]}>
          {plant.image_uri ? (
            <Image source={{ uri: plant.image_uri }} style={dashboardStyles.image} />
          ) : (
            <View style={dashboardStyles.plantIconScene}>
              <View style={[dashboardStyles.pot, { backgroundColor: theme.colors.brown }]} />
              <Leaf size={62} color={theme.colors.primary} strokeWidth={1.8} />
            </View>
          )}
          <View style={[
            dashboardStyles.badge,
            { backgroundColor: isNeedsWater ? '#FFE8E8' : '#EAF7EC' },
          ]}>
            <Text style={[
              theme.typography.label,
              dashboardStyles.badgeText,
              { color: isNeedsWater ? theme.colors.error : theme.colors.primary },
            ]}>
              {badge}
            </Text>
          </View>
        </View>
        <View style={dashboardStyles.gardenBody}>
          <Text style={[theme.typography.label, dashboardStyles.plantName, { color: theme.colors.text }]}>
            {plant.name}
          </Text>
          <Text style={[theme.typography.bodySmall, dashboardStyles.room, { color: theme.colors.textMuted }]}>
            {plant.category}
          </Text>
          <Text
            style={[
              theme.typography.label,
              {
                color: isNeedsWater ? theme.colors.error : theme.colors.water,
                marginTop: 6,
              },
            ]}
          >
            {preview && isNeedsWater ? 'Water Today' : getPlantAgeLabel(plant.purchase_date)}
          </Text>
        </View>
      </Card>
    </Pressable>
  );
}

function ActivityItem({ Icon, title, body, time, tone }) {
  const { theme } = useTheme();
  const color = theme.colors[tone] || theme.colors.primary;

  return (
    <Card style={dashboardStyles.activity}>
      <View style={[dashboardStyles.activityIcon, { backgroundColor: `${color}18` }]}>
        <Icon size={22} color={color} />
      </View>
      <View style={dashboardStyles.activityText}>
        <View style={dashboardStyles.activityHeader}>
          <Text style={[theme.typography.label, { color: theme.colors.text }]}>{title}</Text>
          <Text style={[theme.typography.label, dashboardStyles.time, { color: theme.colors.textMuted }]}>
            {time}
          </Text>
        </View>
        <Text style={[theme.typography.bodySmall, { color: theme.colors.textMuted }]}>{body}</Text>
      </View>
    </Card>
  );
}

const dashboardStyles = StyleSheet.create({
  statCard: {
    width: '48%',
    minHeight: 152,
    padding: 20,
    justifyContent: 'center',
    gap: 10,
  },
  statValue: {
    fontSize: 32,
    lineHeight: 38,
  },
  gardenPressable: {
    width: 200,
    marginRight: 16,
  },
  gardenCard: {
    overflow: 'hidden',
    padding: 4,
  },
  plantImage: {
    height: 160,
    borderRadius: 20,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  plantIconScene: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pot: {
    position: 'absolute',
    bottom: 20,
    width: 38,
    height: 30,
    borderRadius: 10,
    opacity: 0.28,
  },
  badge: {
    position: 'absolute',
    top: 8,
    right: 8,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 8,
    lineHeight: 10,
  },
  gardenBody: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 14,
  },
  plantName: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '700',
  },
  room: {
    fontSize: 11,
    lineHeight: 14,
  },
  activity: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
    padding: 16,
  },
  activityIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityText: {
    flex: 1,
  },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  time: {
    fontSize: 9,
    lineHeight: 12,
  },
});

function createStyles(theme) {
  return StyleSheet.create({
    scroll: {
      paddingTop: 0,
      paddingBottom: 128,
    },
    weatherCard: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: theme.spacing.md,
      padding: 24,
      minHeight: 128,
      marginBottom: 24,
      borderRadius: 28,
      backgroundColor: theme.colors.surfaceSoft,
    },
    weatherIcon: {
      width: 48,
      height: 48,
      borderRadius: theme.radius.full,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: `${theme.colors.primary}12`,
    },
    weatherMain: {
      flex: 1,
      gap: 4,
    },
    weatherTitle: {
      fontSize: 24,
      lineHeight: 30,
      fontWeight: '600',
      color: theme.colors.text,
    },
    weatherBody: {
      ...theme.typography.body,
      color: theme.colors.textMuted,
    },
    weatherMeta: {
      alignItems: 'flex-end',
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
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      rowGap: theme.spacing.md,
      marginBottom: 28,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
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
      paddingBottom: theme.spacing.lg,
    },
    activityTitle: {
      ...theme.typography.headline,
      color: theme.colors.text,
      marginTop: 26,
      marginBottom: 16,
    },
    activities: {
      gap: theme.spacing.md,
    },
    fab: {
      position: 'absolute',
      right: theme.spacing.lg,
      bottom: 94,
      width: 64,
      height: 64,
      borderRadius: 28,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.primary,
      shadowColor: theme.colors.shadow,
      ...theme.elevation.level2,
    },
  });
}
