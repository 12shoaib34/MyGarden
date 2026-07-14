import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { BookOpen, ChevronRight, Filter, Flower2, Leaf, Search, Sprout, TreePine } from "lucide-react-native";
import { AppHeader } from "../components/AppHeader";
import plantInfo from "../data/plantInfo.json";
import { Chip } from "../components/Chip";
import { useGetSafeAreaInsets } from "../hooks/getSafeAreaInsets";
import { withHaptic } from "../services/hapticService";
import { useTheme } from "../theme/ThemeProvider";
import { formatMonths, includesCurrentMonth } from "../utils/months";

const categories = ["All", "Fruit", "Vegetable", "Herb", "Succulent", "Indoor", "Flower", "Tree"];

export function PlantInfoListScreen({ onSelectPlant }) {
  const { theme } = useTheme();
  const insets = useGetSafeAreaInsets();
  const styles = createStyles(theme, insets);
  const [selectedCategory, setSelectedCategory] = useState("All");

  const visiblePlants =
    selectedCategory === "All"
      ? plantInfo
      : plantInfo.filter((plant) => plant.category === selectedCategory);

  return (
    <View style={styles.screen}>
      <AppHeader
        icon={BookOpen}
        title="Plant Info"
        subtitle="JSON based local growing guide"
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        <View style={styles.searchBar}>
          <Search size={22} color={theme.colors.textMuted} />
          <Text style={styles.searchText}>Search plant information</Text>
          <Filter size={22} color={theme.colors.textMuted} />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}
        >
          {categories.map((category) => (
            <Chip
              key={category}
              label={category}
              selected={selectedCategory === category}
              onPress={() => setSelectedCategory(category)}
            />
          ))}
        </ScrollView>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Plant Library</Text>
          <Text style={styles.countText}>{visiblePlants.length} plants</Text>
        </View>

        <View style={styles.list}>
          {visiblePlants.map((plant) => (
            <PlantInfoRow
              key={plant.id}
              plant={plant}
              onPress={() => onSelectPlant(plant)}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

function PlantInfoRow({ plant, onPress }) {
  const { theme } = useTheme();
  const styles = createStyles(theme, useGetSafeAreaInsets());
  const isFruit = plant.category === "Fruit";
  const activeAirLayering = includesCurrentMonth(plant.propagation?.airLayeringMonths);
  const activeCutting = includesCurrentMonth(plant.propagation?.cuttingMonths);
  const activePlanting = includesCurrentMonth(plant.plantingMonths);
  const activeLabel = isFruit
    ? activeAirLayering
      ? "Layering"
      : activeCutting
      ? "Cutting"
      : null
    : activePlanting
    ? "Planting"
    : null;
  const seasonText = isFruit
    ? `Dormancy: ${formatMonths(plant.fruitInfo?.dormancyMonths)} | Prune: ${formatMonths(plant.fruitInfo?.pruningMonths)}`
    : `Plant: ${formatMonths(plant.plantingMonths)}`;

  return (
    <Pressable style={styles.row} onPress={withHaptic(onPress)}>
      <PlantTypeIcon category={plant.category} />
      <View style={styles.rowBody}>
        <View style={styles.rowTop}>
          <Text style={styles.plantName} numberOfLines={1}>{plant.name}</Text>
          {activeLabel ? <Text style={styles.activeChip}>{activeLabel}</Text> : null}
        </View>
        <Text style={styles.meta} numberOfLines={1}>{plant.category} - {plant.botanicalName}</Text>
        <View style={styles.rowFooter}>
          <Leaf size={16} color={theme.colors.primary} />
          <Text style={styles.footerText}>{plant.feederType}</Text>
        </View>
        <Text style={styles.seasonText} numberOfLines={1}>{seasonText}</Text>
      </View>
      <ChevronRight size={22} color={theme.colors.textMuted} />
    </Pressable>
  );
}

function PlantTypeIcon({ category }) {
  const { theme } = useTheme();
  const styles = createStyles(theme, useGetSafeAreaInsets());
  const Icon =
    category === "Fruit" || category === "Tree"
      ? TreePine
      : category === "Flower"
      ? Flower2
      : category === "Vegetable" || category === "Herb"
      ? Sprout
      : Leaf;

  return (
    <View style={styles.thumbnail}>
      <Icon size={34} color={theme.colors.primary} />
    </View>
  );
}

function createStyles(theme, insets) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scroll: {
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: Math.max(insets.bottom, 24) + 28,
      gap: 18,
    },
    searchBar: {
      height: 58,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
      paddingHorizontal: 18,
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
    },
    searchText: {
      ...theme.typography.body,
      color: theme.colors.textMuted,
      flex: 1,
    },
    chips: {
      gap: 10,
      paddingRight: 20,
    },
    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    sectionTitle: {
      ...theme.typography.title,
      color: theme.colors.text,
    },
    countText: {
      ...theme.typography.label,
      color: theme.colors.primary,
    },
    list: {
      gap: 14,
    },
    row: {
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
      borderRadius: 24,
      padding: 14,
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
    },
    thumbnail: {
      width: 76,
      height: 76,
      borderRadius: 18,
      backgroundColor: theme.colors.surfaceSoft,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
      alignItems: "center",
      justifyContent: "center",
    },
    rowBody: {
      flex: 1,
      gap: 5,
    },
    rowTop: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    plantName: {
      fontSize: 18,
      lineHeight: 24,
      fontWeight: "800",
      color: theme.colors.text,
      flex: 1,
      minWidth: 0,
    },
    activeChip: {
      ...theme.typography.label,
      color: theme.colors.primaryStrong,
      backgroundColor: theme.colors.secondaryContainer,
      borderRadius: 999,
      paddingHorizontal: 9,
      paddingVertical: 4,
      overflow: "hidden",
      flexShrink: 0,
      maxWidth: 92,
    },
    meta: {
      ...theme.typography.bodySmall,
      color: theme.colors.textMuted,
    },
    rowFooter: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    footerText: {
      ...theme.typography.label,
      color: theme.colors.textMuted,
    },
    seasonText: {
      ...theme.typography.bodySmall,
      color: theme.colors.textMuted,
    },
  });
}
