import { useEffect, useMemo, useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import { Copy, Leaf, Plus, Search, SlidersHorizontal, Sprout, Trash2 } from "lucide-react-native";
import { AppHeader } from "../components/AppHeader";
import { useAppDialog } from "../components/AppDialog";
import { Card } from "../components/Card";
import { Chip } from "../components/Chip";
import { useGetSafeAreaInsets } from "../hooks/getSafeAreaInsets";
import { autoExportBackup } from "../services/localBackupService";
import { deletePlant, listPlants } from "../storage/database";
import { useTheme } from "../theme/ThemeProvider";
import { getPlantAgeLabel } from "../utils/plantAge";

const filters = ["All", "Indoor", "Vegetable", "Herb", "Succulent", "Fruit"];

export function PlantsScreen({ onAddPlant, onEditPlant }) {
  const { theme } = useTheme();
  const { showConfirm, showDialog } = useAppDialog();
  const insets = useGetSafeAreaInsets();
  const themedStyles = createStyles(theme, insets);
  const [plants, setPlants] = useState([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All");
  const [deletingPlantId, setDeletingPlantId] = useState(null);

  useEffect(() => {
    let alive = true;

    async function loadPlants() {
      const savedPlants = await listPlants();
      if (alive) {
        setPlants(savedPlants);
      }
    }

    loadPlants();

    return () => {
      alive = false;
    };
  }, []);

  const visiblePlants = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return plants
      .filter((plant) => {
        const matchesFilter = filter === "All" || plant.category === filter;
        const haystack = `${plant.name} ${plant.category} ${plant.variety ?? ""}`
          .toLowerCase()
          .trim();

        return matchesFilter && haystack.includes(normalizedQuery);
      })
      .sort(comparePlantsByName);
  }, [filter, plants, query]);

  async function copyPlantsByCategory() {
    if (!plants.length) {
      await showDialog({
        title: "No plants",
        message: "Add plants first, then copy the list.",
        variant: "warning",
      });
      return;
    }

    const text = formatPlantsByCategory(plants);
    await Clipboard.setStringAsync(text);
    await showDialog({
      title: "Copied",
      message: "Plant names copied category wise.",
      variant: "success",
    });
  }

  async function confirmDeletePlant(plant) {
    const confirmed = await showConfirm({
      title: "Delete plant?",
      message: `${plant.name} will be removed from My Plants and backup will be updated.`,
      confirmLabel: "Delete",
      destructive: true,
    });
    if (confirmed) {
      await handleDeletePlant(plant);
    }
  }

  async function handleDeletePlant(plant) {
    if (deletingPlantId) {
      return;
    }

    setDeletingPlantId(plant.id);
    try {
      await deletePlant(plant.id);
      setPlants((currentPlants) => currentPlants.filter((item) => item.id !== plant.id));
      await autoExportBackup();
    } catch (error) {
      await showDialog({
        title: "Delete failed",
        message: error.message,
        variant: "error",
      });
    } finally {
      setDeletingPlantId(null);
    }
  }

  return (
    <View style={themedStyles.screen}>
      <AppHeader
        icon={Sprout}
        title="My Plants"
        subtitle={
          plants.length > 0
            ? `${plants.length} plants saved locally`
            : "Saved local plants will appear here"
        }
        right={
          <>
            <Pressable
              style={themedStyles.headerIconButton}
              onPress={copyPlantsByCategory}
              accessibilityRole="button"
              accessibilityLabel="Copy plants by category"
            >
              <Copy size={18} color={theme.colors.primary} />
            </Pressable>
            <View style={themedStyles.countBadge}>
              <Text style={themedStyles.countValue}>{plants.length}</Text>
            </View>
            <Pressable
              style={themedStyles.addButton}
              onPress={onAddPlant}
              accessibilityRole="button"
              accessibilityLabel="Add plant"
            >
              <Plus size={21} color={theme.colors.onPrimary} />
            </Pressable>
          </>
        }
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={themedStyles.scroll}
      >
        <View style={themedStyles.searchBar}>
          <Search size={20} color={theme.colors.textMuted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search plants"
            placeholderTextColor={theme.colors.textMuted}
            style={themedStyles.searchInput}
          />
          <SlidersHorizontal size={20} color={theme.colors.textMuted} />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={themedStyles.filters}
        >
          {filters.map((item) => (
            <Chip
              key={item}
              label={item}
              selected={filter === item}
              onPress={() => setFilter(item)}
            />
          ))}
        </ScrollView>

        <View style={themedStyles.listHeader}>
          <Text style={themedStyles.sectionTitle}>Plant Collection</Text>
          <Text style={themedStyles.sectionMeta}>{filter}</Text>
        </View>

        <View style={themedStyles.list}>
          {visiblePlants.length > 0 ? (
            visiblePlants.map((plant) => (
              <PlantListCard
                key={plant.id}
                plant={plant}
                onPress={() => onEditPlant?.(plant)}
                onDelete={() => confirmDeletePlant(plant)}
                deleting={deletingPlantId === plant.id}
              />
            ))
          ) : (
            <Card style={themedStyles.emptyCard}>
              <View style={themedStyles.emptyIcon}>
                <Sprout size={30} color={theme.colors.primary} />
              </View>
              <Text style={themedStyles.emptyTitle}>No plants yet</Text>
              <Text style={themedStyles.emptyBody}>
                Add your first plant to start tracking watering, growth, and care.
              </Text>
            </Card>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function formatPlantsByCategory(plants) {
  const groups = plants.reduce((result, plant) => {
    const category = plant.category || "Other";
    if (!result[category]) {
      result[category] = [];
    }
    result[category].push(plant.name);
    return result;
  }, {});

  return Object.keys(groups)
    .sort((a, b) => a.localeCompare(b))
    .map((category) => {
      const names = groups[category]
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b))
        .map((name) => ` ${name}`)
        .join("\n");
      return `${category}\n${names}`;
    })
    .join("\n\n");
}

function comparePlantsByName(firstPlant, secondPlant) {
  return String(firstPlant.name || "").localeCompare(String(secondPlant.name || ""), undefined, {
    sensitivity: "base",
    numeric: true,
  });
}

function PlantListCard({ plant, onPress, onDelete, deleting }) {
  const { theme } = useTheme();

  return (
    <Pressable onPress={onPress}>
      {({ pressed }) => (
        <Card style={[styles.card, { opacity: pressed ? 0.86 : 1 }]}>
          <View
            style={[
              styles.imageBox,
              { backgroundColor: theme.colors.surfaceSoft },
            ]}
          >
            {plant.image_uri ? (
              <Image source={{ uri: plant.image_uri }} style={styles.image} />
            ) : (
              <Sprout size={30} color={theme.colors.primary} />
            )}
          </View>
          <View style={styles.cardBody}>
            <View style={styles.cardTopRow}>
              <View style={styles.cardTitleText}>
                <Text
                  style={[styles.plantName, { color: theme.colors.text }]}
                  numberOfLines={2}
                >
                  {plant.name}
                </Text>
                <Text
                  style={[
                    theme.typography.bodySmall,
                    { color: theme.colors.textMuted },
                  ]}
                  numberOfLines={1}
                >
                  {plant.category}
                  {plant.variety ? ` - ${plant.variety}` : ""}
                </Text>
              </View>
              <Pressable
                onPress={onDelete}
                disabled={deleting}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={`Delete ${plant.name}`}
                style={({ pressed }) => [
                  styles.deleteButton,
                  {
                    borderColor: theme.colors.border,
                    backgroundColor: theme.colors.surfaceSoft,
                    opacity: deleting ? 0.45 : pressed ? 0.72 : 1,
                  },
                ]}
              >
                <Trash2 size={16} color={theme.colors.danger || theme.colors.primary} />
              </Pressable>
            </View>

            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <Leaf size={16} color={theme.colors.primary} />
                <Text style={[styles.metaText, { color: theme.colors.textMuted }]}>
                  {getPlantAgeLabel(plant.purchase_date)}
                </Text>
              </View>
            </View>
          </View>
        </Card>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    gap: 14,
    padding: 12,
  },
  imageBox: {
    width: 88,
    height: 104,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  cardBody: {
    flex: 1,
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  cardTitleText: {
    flex: 1,
    gap: 4,
  },
  cardTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  deleteButton: {
    width: 34,
    height: 34,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  plantName: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "700",
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  metaText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "600",
  },
});

function createStyles(theme, insets) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    addButton: {
      width: 38,
      height: 38,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.colors.primary,
    },
    headerIconButton: {
      width: 38,
      height: 38,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    countBadge: {
      minWidth: 38,
      height: 38,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    countValue: {
      fontSize: 16,
      lineHeight: 20,
      fontWeight: "800",
      color: theme.colors.primary,
    },
    scroll: {
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 132,
    },
    searchBar: {
      minHeight: 56,
      borderRadius: 22,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingHorizontal: 16,
    },
    searchInput: {
      ...theme.typography.body,
      flex: 1,
      color: theme.colors.text,
      paddingVertical: 12,
    },
    filters: {
      gap: 10,
      paddingVertical: 18,
    },
    listHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 14,
    },
    sectionTitle: {
      ...theme.typography.title,
      color: theme.colors.text,
    },
    sectionMeta: {
      ...theme.typography.label,
      color: theme.colors.primary,
    },
    list: {
      gap: 14,
    },
    emptyCard: {
      alignItems: "center",
      padding: 28,
      gap: 12,
    },
    emptyIcon: {
      width: 58,
      height: 58,
      borderRadius: 20,
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
