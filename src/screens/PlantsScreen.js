import { memo, useCallback, useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import {
  Copy,
  Leaf,
  Maximize2,
  Plus,
  Search,
  SlidersHorizontal,
  Sprout,
  Star,
  Trash2,
  X,
} from "lucide-react-native";
import { AppHeader, HeaderActionButton } from "../components/AppHeader";
import { useAppDialog } from "../components/AppDialog";
import { Card } from "../components/Card";
import { Chip } from "../components/Chip";
import { useGetSafeAreaInsets } from "../hooks/getSafeAreaInsets";
import { withHaptic } from "../services/hapticService";
import { autoExportBackup } from "../services/localBackupService";
import { deletePlant, listPlants, setPlantFavorite } from "../storage/database";
import { useTheme } from "../theme/ThemeProvider";
import { getPlantAgeLabel } from "../utils/plantAge";

const filters = ["All", "Vegetable", "Fruit", "Herb", "Tree", "Flower", "Indoor", "Succulent"];
const pageSize = 12;

export function PlantsScreen({ onAddPlant, onEditPlant }) {
  const { theme } = useTheme();
  const { showConfirm, showDialog } = useAppDialog();
  const insets = useGetSafeAreaInsets();
  const themedStyles = createStyles(theme, insets);
  const [plants, setPlants] = useState([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All");
  const [deletingPlantId, setDeletingPlantId] = useState(null);
  const [previewPlant, setPreviewPlant] = useState(null);
  const [visibleCount, setVisibleCount] = useState(pageSize);

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
  const pagedPlants = useMemo(
    () => visiblePlants.slice(0, visibleCount),
    [visibleCount, visiblePlants]
  );

  useEffect(() => {
    setVisibleCount(pageSize);
  }, [filter, query]);

  const loadMorePlants = useCallback(() => {
    setVisibleCount((currentCount) =>
      currentCount >= visiblePlants.length
        ? currentCount
        : Math.min(currentCount + pageSize, visiblePlants.length)
    );
  }, [visiblePlants.length]);

  const renderPlant = useCallback(
    ({ item: plant }) => (
      <PlantListCard
        plant={plant}
        onPress={() => onEditPlant?.(plant)}
        onViewImage={() => setPreviewPlant(plant)}
        onToggleFavorite={() => toggleFavoritePlant(plant)}
        onDelete={() => confirmDeletePlant(plant)}
        deleting={deletingPlantId === plant.id}
      />
    ),
    [deletingPlantId, onEditPlant]
  );

  const keyExtractor = useCallback((plant) => String(plant.id), []);

  async function copyPlantsByCategory() {
    if (!visiblePlants.length) {
      await showDialog({
        title: "No plants",
        message: "No plants match the selected category or search.",
        variant: "warning",
      });
      return;
    }

    const text = formatPlantsByCategory(visiblePlants);
    await Clipboard.setStringAsync(text);
    await showDialog({
      title: "Copied",
      message:
        filter === "All" && !query.trim()
          ? "All plant names copied category wise."
          : "Filtered plant names copied.",
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

  async function toggleFavoritePlant(plant) {
    const nextFavorite = plant.is_favorite ? 0 : 1;

    setPlants((currentPlants) =>
      currentPlants.map((item) =>
        item.id === plant.id ? { ...item, is_favorite: nextFavorite } : item
      )
    );

    try {
      await setPlantFavorite(plant.id, nextFavorite);
      await autoExportBackup();
    } catch (error) {
      setPlants((currentPlants) =>
        currentPlants.map((item) =>
          item.id === plant.id ? { ...item, is_favorite: plant.is_favorite ? 1 : 0 } : item
        )
      );
      await showDialog({
        title: "Favorite failed",
        message: error.message,
        variant: "error",
      });
    }
  }

  return (
    <View style={themedStyles.screen}>
      <AppHeader
        icon={Sprout}
        title="My Plants"
        subtitle={
          visiblePlants.length > 0
            ? `${visiblePlants.length} plants shown`
            : "Saved local plants will appear here"
        }
      >
        <HeaderActionButton
          onPress={copyPlantsByCategory}
          accessibilityLabel="Copy plants by category"
        >
          <Copy size={18} color={theme.colors.primary} />
        </HeaderActionButton>
        <View style={themedStyles.countBadge}>
          <Text style={themedStyles.countValue}>{visiblePlants.length}</Text>
        </View>
        <Pressable
          style={themedStyles.addButton}
          onPress={withHaptic(onAddPlant)}
          accessibilityRole="button"
          accessibilityLabel="Add plant"
        >
          <Plus size={21} color={theme.colors.onPrimary} />
        </Pressable>
      </AppHeader>

      <FlatList
        data={pagedPlants}
        keyExtractor={keyExtractor}
        renderItem={renderPlant}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={themedStyles.listContent}
        ListHeaderComponent={
          <PlantsListHeader
            query={query}
            setQuery={setQuery}
            filter={filter}
            setFilter={setFilter}
            resultLabel={filter}
          />
        }
        ListEmptyComponent={<EmptyPlantsCard />}
        ItemSeparatorComponent={PlantSeparator}
        ListFooterComponent={<View style={themedStyles.listFooter} />}
        initialNumToRender={8}
        maxToRenderPerBatch={6}
        updateCellsBatchingPeriod={50}
        windowSize={7}
        removeClippedSubviews
        onEndReached={loadMorePlants}
        onEndReachedThreshold={0.45}
        keyboardShouldPersistTaps="handled"
      />

      <ImagePreviewModal
        plant={previewPlant}
        visible={Boolean(previewPlant)}
        onClose={() => setPreviewPlant(null)}
      />
    </View>
  );
}

function PlantsListHeader({ query, setQuery, filter, setFilter, resultLabel }) {
  const { theme } = useTheme();
  const themedStyles = createStyles(theme, useGetSafeAreaInsets());

  return (
    <>
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
        <Text style={themedStyles.sectionMeta}>{resultLabel}</Text>
      </View>
    </>
  );
}

function EmptyPlantsCard() {
  const { theme } = useTheme();
  const themedStyles = createStyles(theme, useGetSafeAreaInsets());

  return (
    <Card style={themedStyles.emptyCard}>
      <View style={themedStyles.emptyIcon}>
        <Sprout size={30} color={theme.colors.primary} />
      </View>
      <Text style={themedStyles.emptyTitle}>No plants yet</Text>
      <Text style={themedStyles.emptyBody}>
        Add your first plant to start tracking watering, growth, and care.
      </Text>
    </Card>
  );
}

function PlantSeparator() {
  return <View style={styles.separator} />;
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

const PlantListCard = memo(function PlantListCard({
  plant,
  onPress,
  onViewImage,
  onToggleFavorite,
  onDelete,
  deleting,
}) {
  const { theme } = useTheme();
  const isFavorite = Boolean(plant.is_favorite);

  return (
    <Card style={styles.card}>
      <Pressable
        onPress={plant.image_uri ? withHaptic(onViewImage) : undefined}
        disabled={!plant.image_uri}
        accessibilityRole={plant.image_uri ? "imagebutton" : "image"}
        accessibilityLabel={
          plant.image_uri ? `View ${plant.name} image` : `${plant.name} has no image`
        }
        style={({ pressed }) => [
          styles.imageBox,
          {
            backgroundColor: theme.colors.surfaceSoft,
            opacity: pressed ? 0.82 : 1,
          },
        ]}
      >
        {plant.image_uri ? (
          <>
            <Image source={{ uri: plant.image_uri }} style={styles.image} />
            <View
              style={[
                styles.viewImageBadge,
                { backgroundColor: theme.colors.surface },
              ]}
            >
              <Maximize2 size={13} color={theme.colors.primary} />
            </View>
          </>
        ) : (
          <Sprout size={30} color={theme.colors.primary} />
        )}
      </Pressable>
      <View style={styles.cardBody}>
        <Pressable
          onPress={withHaptic(onPress)}
          accessibilityRole="button"
          accessibilityLabel={`Edit ${plant.name}`}
          style={({ pressed }) => [
            styles.cardDetailsButton,
            { opacity: pressed ? 0.76 : 1 },
          ]}
        >
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
          </View>

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Leaf size={16} color={theme.colors.primary} />
              <Text style={[styles.metaText, { color: theme.colors.textMuted }]}>
                {getPlantAgeLabel(plant.purchase_date)}
              </Text>
            </View>
          </View>
        </Pressable>
      </View>
      <View style={styles.cardActions}>
        <Pressable
          onPress={withHaptic(onToggleFavorite)}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={
            isFavorite ? `Remove ${plant.name} from favorites` : `Add ${plant.name} to favorites`
          }
          style={({ pressed }) => [
            styles.cardActionButton,
            {
              borderColor: isFavorite ? theme.colors.primary : theme.colors.border,
              backgroundColor: isFavorite
                ? theme.colors.successSurface
                : theme.colors.surfaceSoft,
              opacity: pressed ? 0.72 : 1,
            },
          ]}
        >
          <Star
            size={16}
            color={theme.colors.primary}
            fill={isFavorite ? theme.colors.primary : "transparent"}
          />
        </Pressable>
        <Pressable
          onPress={withHaptic(onDelete, "reject")}
          disabled={deleting}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={`Delete ${plant.name}`}
          style={({ pressed }) => [
            styles.cardActionButton,
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
    </Card>
  );
});

function ImagePreviewModal({ plant, visible, onClose }) {
  const { theme } = useTheme();
  const insets = useGetSafeAreaInsets();
  const previewStyles = createImagePreviewStyles(theme, insets);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={previewStyles.overlay}>
        <View style={previewStyles.header}>
          <View style={previewStyles.titleWrap}>
            <Text style={previewStyles.title} numberOfLines={1}>
              {plant?.name || "Plant image"}
            </Text>
            <Text style={previewStyles.subtitle} numberOfLines={1}>
              {plant?.category || "My Plants"}
            </Text>
          </View>
          <Pressable
            onPress={withHaptic(onClose)}
            accessibilityRole="button"
            accessibilityLabel="Close image preview"
            hitSlop={8}
            style={({ pressed }) => [
              previewStyles.closeButton,
              { opacity: pressed ? 0.72 : 1 },
            ]}
          >
            <X size={22} color={theme.colors.text} />
          </Pressable>
        </View>

        <View style={previewStyles.imageStage}>
          {plant?.image_uri ? (
            <Image
              source={{ uri: plant.image_uri }}
              style={previewStyles.previewImage}
              resizeMode="contain"
            />
          ) : null}
        </View>
      </View>
    </Modal>
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
  viewImageBadge: {
    position: "absolute",
    right: 8,
    bottom: 8,
    width: 26,
    height: 26,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  cardBody: {
    flex: 1,
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  cardDetailsButton: {
    flex: 1,
    justifyContent: "space-between",
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
  cardActions: {
    gap: 8,
  },
  cardActionButton: {
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
  separator: {
    height: 14,
  },
});

function createImagePreviewStyles(theme, insets) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      paddingTop: Math.max(insets.top, 18),
      paddingBottom: Math.max(insets.bottom, 18),
      backgroundColor: "rgba(0, 0, 0, 0.92)",
    },
    header: {
      minHeight: 68,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingHorizontal: 18,
    },
    titleWrap: {
      flex: 1,
      gap: 2,
    },
    title: {
      fontSize: 20,
      lineHeight: 26,
      fontWeight: "800",
      color: "#FFFFFF",
    },
    subtitle: {
      ...theme.typography.bodySmall,
      color: "rgba(255, 255, 255, 0.72)",
    },
    closeButton: {
      width: 42,
      height: 42,
      borderRadius: 15,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
    imageStage: {
      flex: 1,
      paddingHorizontal: 12,
      paddingBottom: 12,
      alignItems: "center",
      justifyContent: "center",
    },
    previewImage: {
      width: "100%",
      height: "100%",
    },
  });
}

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
    listContent: {
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
    listFooter: {
      height: 14,
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
