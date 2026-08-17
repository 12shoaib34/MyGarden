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
  CalendarDays,
  Check,
  Copy,
  Leaf,
  Maximize2,
  Plus,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Sprout,
  Square,
  SquareCheckBig,
  Star,
  Trash2,
  X,
} from "lucide-react-native";
import { AppHeader, HeaderActionButton } from "../components/AppHeader";
import { useAppDialog } from "../components/AppDialog";
import { Card } from "../components/Card";
import { Chip } from "../components/Chip";
import { PLANT_CATEGORY_FILTERS } from "../constants/plantCategories";
import { useGetSafeAreaInsets } from "../hooks/getSafeAreaInsets";
import { withHaptic } from "../services/hapticService";
import { autoSyncCloudBackup } from "../services/cloudSyncService";
import { autoExportBackup } from "../services/localBackupService";
import {
  FERTILIZER_CARD_CHECK_ENABLED_KEY,
  deletePlant,
  getSetting,
  listPlants,
  setPlantFavorite,
  setPlantFertilizerAppliedAt,
} from "../storage/database";
import { useTheme } from "../theme/ThemeProvider";
import { getPlantAgeLabel } from "../utils/plantAge";

const pageSize = 12;
const dayInMs = 24 * 60 * 60 * 1000;

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
  const [fertilizerCardCheckEnabled, setFertilizerCardCheckEnabled] = useState(false);
  const [fertilizerEditorPlant, setFertilizerEditorPlant] = useState(null);
  const [fertilizerDateParts, setFertilizerDateParts] = useState(getFertilizerDateParts);
  const [fertilizerEditorBusy, setFertilizerEditorBusy] = useState(false);

  useEffect(() => {
    let alive = true;

    async function loadPlants() {
      const [savedPlants, savedFertilizerCardCheckEnabled] = await Promise.all([
        listPlants(),
        getSetting(FERTILIZER_CARD_CHECK_ENABLED_KEY, "false"),
      ]);
      if (alive) {
        setPlants(savedPlants);
        setFertilizerCardCheckEnabled(savedFertilizerCardCheckEnabled === "true");
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
        onMarkFertilizerToday={() => markFertilizerAppliedToday(plant)}
        onOpenFertilizerEditor={() => openFertilizerEditor(plant)}
        onDelete={() => confirmDeletePlant(plant)}
        deleting={deletingPlantId === plant.id}
        showFertilizerCheck={fertilizerCardCheckEnabled}
      />
    ),
    [deletingPlantId, fertilizerCardCheckEnabled, onEditPlant]
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
      await autoSyncCloudBackup();
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
      await autoSyncCloudBackup();
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

  async function saveFertilizerAppliedAt(plant, nextAppliedAt) {
    const previousAppliedAt = plant.fertilizer_applied_at || null;

    setPlants((currentPlants) =>
      currentPlants.map((item) =>
        item.id === plant.id ? { ...item, fertilizer_applied_at: nextAppliedAt } : item
      )
    );
    setFertilizerEditorPlant((currentPlant) =>
      currentPlant?.id === plant.id
        ? { ...currentPlant, fertilizer_applied_at: nextAppliedAt }
        : currentPlant
    );

    try {
      await setPlantFertilizerAppliedAt(plant.id, nextAppliedAt);
      await autoExportBackup();
      await autoSyncCloudBackup();
      return true;
    } catch (error) {
      setPlants((currentPlants) =>
        currentPlants.map((item) =>
          item.id === plant.id ? { ...item, fertilizer_applied_at: previousAppliedAt } : item
        )
      );
      setFertilizerEditorPlant((currentPlant) =>
        currentPlant?.id === plant.id
          ? { ...currentPlant, fertilizer_applied_at: previousAppliedAt }
          : currentPlant
      );
      await showDialog({
        title: "Fertilizer log failed",
        message: error.message,
        variant: "error",
      });
      return false;
    }
  }

  function markFertilizerAppliedToday(plant) {
    if (fertilizerEditorBusy) {
      return;
    }
    saveFertilizerAppliedAt(plant, new Date().toISOString());
  }

  function openFertilizerEditor(plant) {
    setFertilizerEditorPlant(plant);
    setFertilizerDateParts(getFertilizerDateParts(plant.fertilizer_applied_at));
  }

  async function saveFertilizerEditorDate() {
    if (!fertilizerEditorPlant || fertilizerEditorBusy) {
      return;
    }

    const nextAppliedAt = buildFertilizerDateIso(fertilizerDateParts);
    if (!nextAppliedAt) {
      await showDialog({
        title: "Date invalid",
        message: "Enter a valid fertilizer date.",
        variant: "warning",
      });
      return;
    }

    setFertilizerEditorBusy(true);
    try {
      const saved = await saveFertilizerAppliedAt(fertilizerEditorPlant, nextAppliedAt);
      if (saved) {
        setFertilizerEditorPlant(null);
      }
    } finally {
      setFertilizerEditorBusy(false);
    }
  }

  async function clearFertilizerEditorDate() {
    if (!fertilizerEditorPlant || fertilizerEditorBusy) {
      return;
    }

    setFertilizerEditorBusy(true);
    try {
      const saved = await saveFertilizerAppliedAt(fertilizerEditorPlant, null);
      if (saved) {
        setFertilizerEditorPlant(null);
      }
    } finally {
      setFertilizerEditorBusy(false);
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
      <FertilizerDateSheet
        visible={Boolean(fertilizerEditorPlant)}
        plant={fertilizerEditorPlant}
        dateParts={fertilizerDateParts}
        busy={fertilizerEditorBusy}
        onChangeDateParts={setFertilizerDateParts}
        onUseToday={() => setFertilizerDateParts(getFertilizerDateParts())}
        onSave={saveFertilizerEditorDate}
        onClear={clearFertilizerEditorDate}
        onClose={() => {
          if (!fertilizerEditorBusy) {
            setFertilizerEditorPlant(null);
          }
        }}
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
        {PLANT_CATEGORY_FILTERS.map((item) => (
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

function formatFertilizerElapsedLabel(appliedAt) {
  if (!appliedAt) {
    return "No log";
  }

  const appliedDate = new Date(appliedAt);
  if (Number.isNaN(appliedDate.getTime())) {
    return "No log";
  }

  const today = startOfLocalDay(new Date());
  const appliedDay = startOfLocalDay(appliedDate);
  const elapsedDays = Math.max(0, Math.floor((today.getTime() - appliedDay.getTime()) / dayInMs));

  if (elapsedDays === 0) {
    return "Today";
  }
  if (elapsedDays === 1) {
    return "1 day";
  }
  return `${elapsedDays} days`;
}

function startOfLocalDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function getFertilizerDateParts(value) {
  const date = value ? new Date(value) : new Date();
  const safeDate = Number.isNaN(date.getTime()) ? new Date() : date;

  return {
    year: String(safeDate.getFullYear()),
    month: String(safeDate.getMonth() + 1).padStart(2, "0"),
    day: String(safeDate.getDate()).padStart(2, "0"),
  };
}

function toDigits(value, maxLength) {
  return String(value || "").replace(/\D/g, "").slice(0, maxLength);
}

function buildFertilizerDateIso(parts) {
  const year = toDigits(parts?.year, 4);
  const month = toDigits(parts?.month, 2).padStart(2, "0");
  const day = toDigits(parts?.day, 2).padStart(2, "0");

  if (year.length !== 4 || month.length !== 2 || day.length !== 2) {
    return "";
  }

  const yearNumber = Number(year);
  const monthNumber = Number(month);
  const dayNumber = Number(day);
  if (monthNumber < 1 || monthNumber > 12 || dayNumber < 1 || dayNumber > 31) {
    return "";
  }

  const candidate = new Date(yearNumber, monthNumber - 1, dayNumber, 12, 0, 0, 0);
  if (
    Number.isNaN(candidate.getTime()) ||
    candidate.getFullYear() !== yearNumber ||
    candidate.getMonth() + 1 !== monthNumber ||
    candidate.getDate() !== dayNumber
  ) {
    return "";
  }

  return candidate.toISOString();
}

const PlantListCard = memo(function PlantListCard({
  plant,
  onPress,
  onViewImage,
  onToggleFavorite,
  onMarkFertilizerToday,
  onOpenFertilizerEditor,
  onDelete,
  deleting,
  showFertilizerCheck,
}) {
  const { theme } = useTheme();
  const isFavorite = Boolean(plant.is_favorite);
  const fertilizerApplied = Boolean(plant.fertilizer_applied_at);

  return (
    <Card style={styles.card}>
      <View style={styles.cardMainRow}>
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
              <View style={[styles.viewImageBadge, { backgroundColor: theme.colors.surface }]}>
                <Maximize2 size={13} color={theme.colors.primary} />
              </View>
            </>
          ) : (
            <Sprout size={30} color={theme.colors.primary} />
          )}
        </Pressable>
        <Pressable
          onPress={withHaptic(onPress)}
          accessibilityRole="button"
          accessibilityLabel={`Edit ${plant.name}`}
          style={({ pressed }) => [
            styles.cardBody,
            { opacity: pressed ? 0.76 : 1 },
          ]}
        >
          <Text style={[styles.plantName, { color: theme.colors.text }]} numberOfLines={2}>
            {plant.name}
          </Text>
          <Text style={[styles.plantCategory, { color: theme.colors.textMuted }]} numberOfLines={2}>
            {plant.category}
            {plant.variety ? ` - ${plant.variety}` : ""}
          </Text>
        </Pressable>
      </View>

      <View style={styles.cardFooter}>
        <View style={styles.careRow}>
          <View
            style={[
              styles.carePill,
              {
                borderColor: theme.colors.border,
                backgroundColor: theme.colors.surfaceSoft,
              },
            ]}
          >
            <Leaf size={15} color={theme.colors.primary} />
            <Text style={[styles.careText, { color: theme.colors.textMuted }]} numberOfLines={1}>
              {getPlantAgeLabel(plant.purchase_date)}
            </Text>
          </View>
          {showFertilizerCheck ? (
            <FertilizerCheckChip
              applied={fertilizerApplied}
              appliedAt={plant.fertilizer_applied_at}
              plantName={plant.name}
              onMarkToday={onMarkFertilizerToday}
              onOpenEditor={onOpenFertilizerEditor}
            />
          ) : null}
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
      </View>
    </Card>
  );
});

function FertilizerCheckChip({ applied, appliedAt, plantName, onMarkToday, onOpenEditor }) {
  const { theme } = useTheme();
  const Icon = applied ? SquareCheckBig : Square;

  return (
    <View
      style={[
        styles.fertilizerCheck,
        {
          borderColor: applied ? theme.colors.primary : theme.colors.border,
          backgroundColor: applied ? theme.colors.successSurface : theme.colors.surfaceSoft,
        },
      ]}
    >
      <Pressable
        onPress={withHaptic(onMarkToday, "confirm")}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: applied }}
        accessibilityLabel={`Mark fertilizer applied today for ${plantName}`}
        hitSlop={8}
        style={({ pressed }) => [
          styles.fertilizerIconButton,
          { opacity: pressed ? 0.66 : 1 },
        ]}
      >
        <Icon size={15} color={theme.colors.primary} strokeWidth={2.2} />
      </Pressable>
      <Pressable
        onPress={withHaptic(onOpenEditor)}
        accessibilityRole="button"
        accessibilityLabel={`Edit fertilizer date for ${plantName}`}
        hitSlop={6}
        style={({ pressed }) => [
          styles.fertilizerBodyButton,
          { opacity: pressed ? 0.66 : 1 },
        ]}
      >
        <Text style={[styles.fertilizerLabel, { color: theme.colors.text }]}>Fert</Text>
        <Text
          style={[styles.fertilizerAge, { color: theme.colors.textMuted }]}
          numberOfLines={1}
        >
          {formatFertilizerElapsedLabel(appliedAt)}
        </Text>
      </Pressable>
    </View>
  );
}

function FertilizerDateSheet({
  visible,
  plant,
  dateParts,
  busy,
  onChangeDateParts,
  onUseToday,
  onSave,
  onClear,
  onClose,
}) {
  const { theme } = useTheme();
  const insets = useGetSafeAreaInsets();
  const sheetStyles = createFertilizerSheetStyles(theme, insets);

  const updatePart = useCallback(
    (key, value, maxLength) => {
      onChangeDateParts((currentParts) => ({
        ...currentParts,
        [key]: toDigits(value, maxLength),
      }));
    },
    [onChangeDateParts]
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={sheetStyles.overlay}>
        <Pressable style={sheetStyles.backdrop} onPress={onClose} disabled={busy} />
        <View style={sheetStyles.sheet}>
          <View style={sheetStyles.handle} />
          <View style={sheetStyles.header}>
            <View style={sheetStyles.iconWrap}>
              <CalendarDays size={22} color={theme.colors.primary} />
            </View>
            <View style={sheetStyles.titleWrap}>
              <Text style={sheetStyles.title}>Fertilizer Date</Text>
              <Text style={sheetStyles.subtitle} numberOfLines={1}>
                {plant?.name || "Plant"}
              </Text>
            </View>
            <Pressable
              onPress={withHaptic(onClose)}
              disabled={busy}
              accessibilityRole="button"
              accessibilityLabel="Close fertilizer date"
              hitSlop={8}
              style={({ pressed }) => [
                sheetStyles.closeButton,
                { opacity: busy ? 0.45 : pressed ? 0.72 : 1 },
              ]}
            >
              <X size={20} color={theme.colors.text} />
            </Pressable>
          </View>

          <View style={sheetStyles.dateRow}>
            <DateInput
              label="Year"
              value={dateParts.year}
              placeholder="YYYY"
              maxLength={4}
              onChangeText={(value) => updatePart("year", value, 4)}
            />
            <DateInput
              label="Month"
              value={dateParts.month}
              placeholder="MM"
              maxLength={2}
              onChangeText={(value) => updatePart("month", value, 2)}
            />
            <DateInput
              label="Day"
              value={dateParts.day}
              placeholder="DD"
              maxLength={2}
              onChangeText={(value) => updatePart("day", value, 2)}
            />
          </View>

          <View style={sheetStyles.actions}>
            <Pressable
              onPress={withHaptic(onUseToday, "tap")}
              disabled={busy}
              accessibilityRole="button"
              accessibilityLabel="Use today"
              style={({ pressed }) => [
                sheetStyles.secondaryButton,
                { opacity: busy ? 0.45 : pressed ? 0.76 : 1 },
              ]}
            >
              <CalendarDays size={17} color={theme.colors.primary} />
              <Text style={sheetStyles.secondaryLabel}>Today</Text>
            </Pressable>
            <Pressable
              onPress={withHaptic(onSave, "confirm")}
              disabled={busy}
              accessibilityRole="button"
              accessibilityLabel="Save fertilizer date"
              style={({ pressed }) => [
                sheetStyles.primaryButton,
                { opacity: busy ? 0.62 : pressed ? 0.82 : 1 },
              ]}
            >
              <Check size={18} color={theme.colors.onPrimary} />
              <Text style={sheetStyles.primaryLabel}>{busy ? "Saving..." : "Save"}</Text>
            </Pressable>
          </View>

          <Pressable
            onPress={withHaptic(onClear, "reject")}
            disabled={busy}
            accessibilityRole="button"
            accessibilityLabel="Clear fertilizer log"
            style={({ pressed }) => [
              sheetStyles.clearButton,
              { opacity: busy ? 0.45 : pressed ? 0.76 : 1 },
            ]}
          >
            <RotateCcw size={17} color={theme.colors.textMuted} />
            <Text style={sheetStyles.clearLabel}>Clear Log</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function DateInput({ label, value, placeholder, maxLength, onChangeText }) {
  const { theme } = useTheme();
  const themedStyles = createDateInputStyles(theme);

  return (
    <View style={themedStyles.wrap}>
      <Text style={themedStyles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textMuted}
        keyboardType="number-pad"
        maxLength={maxLength}
        style={themedStyles.input}
      />
    </View>
  );
}

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
    flexDirection: "column",
    alignItems: "stretch",
    gap: 12,
    padding: 14,
  },
  cardMainRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  imageBox: {
    width: 86,
    height: 86,
    borderRadius: 20,
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
    right: 7,
    bottom: 7,
    width: 28,
    height: 28,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  cardBody: {
    flex: 1,
    minWidth: 0,
    alignSelf: "stretch",
    justifyContent: "center",
    gap: 5,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  cardActions: {
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  cardActionButton: {
    width: 34,
    height: 34,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  plantName: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "700",
  },
  plantCategory: {
    fontSize: 14,
    lineHeight: 19,
    fontWeight: "500",
  },
  careRow: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 8,
  },
  carePill: {
    minHeight: 32,
    maxWidth: "100%",
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexShrink: 1,
  },
  careText: {
    flexShrink: 1,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "700",
  },
  fertilizerCheck: {
    alignSelf: "flex-start",
    maxWidth: "100%",
    minHeight: 32,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 7,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flexShrink: 1,
  },
  fertilizerIconButton: {
    width: 25,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  fertilizerBodyButton: {
    minHeight: 28,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingRight: 4,
    flexShrink: 1,
  },
  fertilizerLabel: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "800",
  },
  fertilizerAge: {
    maxWidth: 88,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "700",
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

function createFertilizerSheetStyles(theme, insets) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      justifyContent: "flex-end",
      backgroundColor: "rgba(0, 0, 0, 0.54)",
    },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
    },
    sheet: {
      width: "100%",
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      borderWidth: 1,
      borderBottomWidth: 0,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
      paddingHorizontal: 20,
      paddingTop: 10,
      paddingBottom: Math.max(insets.bottom, 18) + 12,
      gap: 18,
    },
    handle: {
      alignSelf: "center",
      width: 48,
      height: 5,
      borderRadius: 999,
      backgroundColor: theme.colors.border,
      marginBottom: 2,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    iconWrap: {
      width: 46,
      height: 46,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.colors.successSurface,
    },
    titleWrap: {
      flex: 1,
      minWidth: 0,
      gap: 2,
    },
    title: {
      ...theme.typography.title,
      color: theme.colors.text,
    },
    subtitle: {
      ...theme.typography.bodySmall,
      color: theme.colors.textMuted,
    },
    closeButton: {
      width: 42,
      height: 42,
      borderRadius: 15,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surfaceSoft,
    },
    dateRow: {
      flexDirection: "row",
      gap: 10,
    },
    actions: {
      flexDirection: "row",
      gap: 10,
    },
    primaryButton: {
      flex: 1,
      minHeight: 52,
      borderRadius: theme.radius.full,
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
      gap: 8,
      paddingHorizontal: 16,
      backgroundColor: theme.colors.primary,
      borderWidth: 1,
      borderColor: theme.colors.primary,
    },
    primaryLabel: {
      fontSize: 14,
      lineHeight: 18,
      fontWeight: "800",
      color: theme.colors.onPrimary,
    },
    secondaryButton: {
      flex: 1,
      minHeight: 52,
      borderRadius: theme.radius.full,
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
      gap: 8,
      paddingHorizontal: 16,
      backgroundColor: theme.colors.surfaceSoft,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    secondaryLabel: {
      fontSize: 14,
      lineHeight: 18,
      fontWeight: "800",
      color: theme.colors.primary,
    },
    clearButton: {
      minHeight: 48,
      borderRadius: theme.radius.full,
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
      gap: 8,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surfaceSoft,
    },
    clearLabel: {
      fontSize: 13,
      lineHeight: 17,
      fontWeight: "800",
      color: theme.colors.textMuted,
    },
  });
}

function createDateInputStyles(theme) {
  return StyleSheet.create({
    wrap: {
      flex: 1,
      gap: 8,
    },
    label: {
      ...theme.typography.label,
      color: theme.colors.textMuted,
    },
    input: {
      minHeight: 56,
      borderRadius: theme.radius.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surfaceSoft,
      color: theme.colors.text,
      fontSize: 16,
      lineHeight: 20,
      fontWeight: "700",
      textAlign: "center",
      paddingHorizontal: 10,
      paddingVertical: 12,
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
