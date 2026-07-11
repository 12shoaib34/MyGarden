import { useState } from "react";
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Camera, Check, ImagePlus, Sprout, Trash2, X } from "lucide-react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { Chip } from "../components/Chip";
import { useAppDialog } from "../components/AppDialog";
import { TextField } from "../components/TextField";
import { useGetSafeAreaInsets } from "../hooks/getSafeAreaInsets";
import { autoExportBackup, backupImageIfEnabled } from "../services/localBackupService";
import { createPlant, deletePlant, updatePlant } from "../storage/database";
import { useTheme } from "../theme/ThemeProvider";

const categories = [
  "Vegetable",
  "Fruit",
  "Herb",
  "Flower",
  "Tree",
  "Indoor",
  "Succulent",
];

export function AddPlantScreen({ plant, onCancel, onSaved }) {
  const { theme } = useTheme();
  const { showConfirm, showDialog } = useAppDialog();
  const insets = useGetSafeAreaInsets();
  const styles = createStyles(theme, insets);
  const isEditing = Boolean(plant?.id);
  const initialDateParts = getDateParts(plant?.purchase_date);
  const [name, setName] = useState(plant?.name || "");
  const [variety, setVariety] = useState(plant?.variety || "");
  const [category, setCategory] = useState(plant?.category || "Vegetable");
  const [dateYear, setDateYear] = useState(initialDateParts.year);
  const [dateMonth, setDateMonth] = useState(initialDateParts.month);
  const [dateDay, setDateDay] = useState(initialDateParts.day);
  const [imageUri, setImageUri] = useState(plant?.image_uri || "");
  const [saving, setSaving] = useState(false);

  async function pickImage() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      await showDialog({
        title: "Permission needed",
        message: "Gallery access is needed to attach a plant image.",
        variant: "warning",
      });
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
      allowsEditing: true,
      aspect: [4, 3],
    });

    if (!result.canceled && result.assets?.[0]?.uri) {
      setImageUri(result.assets[0].uri);
    }
  }

  async function savePlant() {
    if (!name.trim()) {
      await showDialog({
        title: "Plant name required",
        message: "Please enter a plant name.",
        variant: "warning",
      });
      return;
    }

    const purchaseDate = buildPurchaseDate(dateYear, dateMonth, dateDay);
    if (!purchaseDate) {
      await showDialog({
        title: "Date invalid",
        message: "Please enter a valid planted date.",
        variant: "warning",
      });
      return;
    }

    setSaving(true);
    try {
      const backedUpImageUri = await backupImageIfEnabled(imageUri);
      const payload = {
        name,
        variety,
        category,
        purchaseDate,
        healthStatus: plant?.health_status || "Healthy",
        imageUri: backedUpImageUri,
        notes: "",
        waterEveryDays: plant?.water_every_days || "2",
        fertilizerEveryDays: plant?.fertilizer_every_days || "15",
      };
      if (isEditing) {
        await updatePlant(plant.id, payload);
      } else {
        await createPlant(payload);
      }
      await autoExportBackup();
      onSaved?.();
    } catch (error) {
      await showDialog({
        title: "Could not save plant",
        message: error.message,
        variant: "error",
      });
    } finally {
      setSaving(false);
    }
  }

  async function confirmDeletePlant() {
    if (!isEditing) {
      return;
    }

    const confirmed = await showConfirm({
      title: "Delete plant?",
      message: "This plant will be removed from My Plants and backup will be updated.",
      confirmLabel: "Delete",
      destructive: true,
    });
    if (!confirmed) {
      return;
    }

    setSaving(true);
    try {
      await deletePlant(plant.id);
      await autoExportBackup();
      onSaved?.();
    } catch (error) {
      await showDialog({
        title: "Could not delete plant",
        message: error.message,
        variant: "error",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable
          style={styles.headerButton}
          onPress={onCancel}
          accessibilityRole="button"
          accessibilityLabel="Close add plant"
        >
          <X size={22} color={theme.colors.text} />
        </Pressable>
        <View style={styles.headerText}>
          <View style={styles.titleRow}>
            <Sprout size={18} color={theme.colors.primary} />
            <Text style={styles.title}>{isEditing ? "Edit Plant" : "Add Plant"}</Text>
          </View>
          <Text style={styles.subtitle}>Saved offline on this mobile</Text>
        </View>
        <Pressable
          style={styles.saveIconButton}
          onPress={savePlant}
          disabled={saving}
          accessibilityRole="button"
          accessibilityLabel="Save plant"
        >
          <Check size={22} color={theme.colors.onPrimary} />
        </Pressable>
      </View>

      <KeyboardAwareScrollView
        bottomOffset={20}
        extraKeyboardSpace={0}
        mode="insets"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        <Pressable
          onPress={pickImage}
          accessibilityRole="button"
          accessibilityLabel={imageUri ? "Change plant image" : "Add plant image"}
        >
          {({ pressed }) => (
            <Card style={[styles.imageCard, { opacity: pressed ? 0.86 : 1 }]}>
              <View
                style={[
                  styles.imageBox,
                  { backgroundColor: theme.colors.surfaceSoft },
                ]}
              >
                {imageUri ? (
                  <Image source={{ uri: imageUri }} style={styles.image} />
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <View style={styles.cameraBadge}>
                      <Camera size={30} color={theme.colors.primary} />
                    </View>
                    <Text style={styles.imageTitle}>Plant Photo</Text>
                  </View>
                )}
                <View style={styles.imagePill}>
                  <ImagePlus size={15} color={theme.colors.primary} />
                  <Text style={styles.imagePillText}>
                    {imageUri ? "Change" : "Add"}
                  </Text>
                </View>
              </View>
            </Card>
          )}
        </Pressable>

        <View style={styles.form}>
          <TextField
            label="Plant Name"
            value={name}
            onChangeText={setName}
            placeholder="Enter plant name"
          />
          <TextField
            label="Variety"
            value={variety}
            onChangeText={setVariety}
            placeholder="Variety name"
          />

          <Text style={styles.fieldLabel}>Category</Text>
          <View style={styles.chips}>
            {categories.map((item) => (
              <Chip
                key={item}
                label={item}
                selected={category === item}
                onPress={() => setCategory(item)}
              />
            ))}
          </View>

          <View style={styles.dateGroup}>
            <Text style={styles.fieldLabel}>Date Planted</Text>
            <View style={styles.row}>
              <View style={styles.rowItem}>
                <TextField
                  label="Year"
                  value={dateYear}
                  onChangeText={(text) => setDateYear(toDigits(text, 4))}
                  placeholder="YYYY"
                  keyboardType="number-pad"
                  maxLength={4}
                />
              </View>
              <View style={styles.rowItem}>
                <TextField
                  label="Month"
                  value={dateMonth}
                  onChangeText={(text) => setDateMonth(toDigits(text, 2))}
                  placeholder="MM"
                  keyboardType="number-pad"
                  maxLength={2}
                />
              </View>
              <View style={styles.rowItem}>
                <TextField
                  label="Day"
                  value={dateDay}
                  onChangeText={(text) => setDateDay(toDigits(text, 2))}
                  placeholder="DD"
                  keyboardType="number-pad"
                  maxLength={2}
                />
              </View>
            </View>
          </View>
        </View>

        <View style={styles.actionRow}>
          <Button
            title={saving ? "Saving..." : isEditing ? "Update" : "Save"}
            onPress={savePlant}
            disabled={saving}
            Icon={Check}
            style={styles.actionButton}
          />
          {isEditing ? (
            <Button
              title="Delete"
              variant="secondary"
              onPress={confirmDeletePlant}
              disabled={saving}
              Icon={Trash2}
              style={styles.actionButton}
            />
          ) : null}
        </View>
        <View style={styles.localNote}>
          <ImagePlus size={18} color={theme.colors.textMuted} />
          <Text style={styles.localText}>
            Plant records are stored in SQLite on this phone.
          </Text>
        </View>
      </KeyboardAwareScrollView>
    </View>
  );
}

function getDateParts(value) {
  const fallback = new Date().toISOString().slice(0, 10);
  const [year, month, day] = String(value || fallback).split("-");
  return {
    year: year || "",
    month: month || "",
    day: day || "",
  };
}

function toDigits(value, maxLength) {
  return String(value || "").replace(/\D/g, "").slice(0, maxLength);
}

function buildPurchaseDate(yearValue, monthValue, dayValue) {
  const year = toDigits(yearValue, 4);
  const month = toDigits(monthValue, 2).padStart(2, "0");
  const day = toDigits(dayValue, 2).padStart(2, "0");
  if (year.length !== 4 || month.length !== 2 || day.length !== 2) {
    return "";
  }

  const monthNumber = Number(month);
  const dayNumber = Number(day);
  if (monthNumber < 1 || monthNumber > 12 || dayNumber < 1 || dayNumber > 31) {
    return "";
  }

  const candidate = new Date(`${year}-${month}-${day}T00:00:00.000Z`);
  if (
    Number.isNaN(candidate.getTime()) ||
    candidate.getUTCFullYear() !== Number(year) ||
    candidate.getUTCMonth() + 1 !== monthNumber ||
    candidate.getUTCDate() !== dayNumber
  ) {
    return "";
  }

  return `${year}-${month}-${day}`;
}

function createStyles(theme, insets) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      paddingTop: insets.contentTop,
      paddingHorizontal: 20,
      paddingBottom: 16,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.border,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    headerButton: {
      width: 40,
      height: 40,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    saveIconButton: {
      width: 40,
      height: 40,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.colors.primary,
    },
    headerText: {
      flex: 1,
    },
    titleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    title: {
      ...theme.typography.title,
      color: theme.colors.text,
    },
    subtitle: {
      ...theme.typography.bodySmall,
      color: theme.colors.textMuted,
      marginTop: 2,
    },
    scroll: {
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: insets.bottom + 56,
      gap: 16,
    },
    imageCard: {
      padding: 12,
    },
    imageBox: {
      height: 170,
      borderRadius: 18,
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
    },
    image: {
      width: "100%",
      height: "100%",
    },
    imagePlaceholder: {
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
    },
    cameraBadge: {
      width: 58,
      height: 58,
      borderRadius: 20,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.colors.successSurface,
    },
    imageTitle: {
      ...theme.typography.title,
      color: theme.colors.text,
    },
    imagePill: {
      position: "absolute",
      right: 12,
      bottom: 12,
      minHeight: 34,
      borderRadius: 13,
      paddingHorizontal: 12,
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    imagePillText: {
      ...theme.typography.label,
      color: theme.colors.primary,
    },
    sectionTitle: {
      ...theme.typography.title,
      color: theme.colors.text,
      marginTop: 4,
    },
    fieldLabel: {
      ...theme.typography.label,
      color: theme.colors.textMuted,
    },
    chips: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
    },
    form: {
      gap: 16,
    },
    dateGroup: {
      gap: 8,
    },
    row: {
      flexDirection: "row",
      gap: 10,
    },
    rowItem: {
      flex: 1,
    },
    actionRow: {
      flexDirection: "row",
      gap: 12,
    },
    actionButton: {
      flex: 1,
      paddingHorizontal: 14,
    },
    localNote: {
      flexDirection: "row",
      gap: 8,
      alignItems: "center",
      justifyContent: "center",
    },
    localText: {
      ...theme.typography.bodySmall,
      color: theme.colors.textMuted,
    },
  });
}
