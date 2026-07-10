import { useState } from "react";
import {
  Alert,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Camera, Check, ImagePlus, Sprout, X } from "lucide-react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { Chip } from "../components/Chip";
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
  const insets = useGetSafeAreaInsets();
  const styles = createStyles(theme, insets);
  const isEditing = Boolean(plant?.id);
  const [name, setName] = useState(plant?.name || "");
  const [variety, setVariety] = useState(plant?.variety || "Normal");
  const [category, setCategory] = useState(plant?.category || "Vegetable");
  const [purchaseDate, setPurchaseDate] = useState(
    plant?.purchase_date || new Date().toISOString().slice(0, 10),
  );
  const [notes, setNotes] = useState(plant?.notes || "");
  const [imageUri, setImageUri] = useState(plant?.image_uri || "");
  const [saving, setSaving] = useState(false);

  async function pickImage() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        "Permission needed",
        "Gallery access is needed to attach a plant image.",
      );
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
      Alert.alert("Plant name required", "Please enter a plant name.");
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
        notes,
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
      Alert.alert("Could not save plant", error.message);
    } finally {
      setSaving(false);
    }
  }

  function confirmDeletePlant() {
    if (!isEditing) {
      return;
    }

    Alert.alert(
      "Delete plant?",
      "This plant will be removed from My Plants and backup will be updated.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setSaving(true);
            try {
              await deletePlant(plant.id);
              await autoExportBackup();
              onSaved?.();
            } catch (error) {
              Alert.alert("Could not delete plant", error.message);
            } finally {
              setSaving(false);
            }
          },
        },
      ]
    );
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
        <Pressable onPress={pickImage}>
          <Card style={styles.imageCard}>
            <View
              style={[
                styles.imageBox,
                { backgroundColor: theme.colors.surfaceSoft },
              ]}
            >
              {imageUri ? (
                <Image source={{ uri: imageUri }} style={styles.image} />
              ) : (
                <Camera size={34} color={theme.colors.primary} />
              )}
            </View>
            <Button
              title={imageUri ? "Change Image" : "Optional Image"}
              variant="secondary"
              onPress={pickImage}
            />
          </Card>
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
            placeholder="Normal"
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

          <TextField
            label="Date Planted"
            value={purchaseDate}
            onChangeText={setPurchaseDate}
            placeholder="YYYY-MM-DD"
          />
          <TextField
            label="Notes (Optional)"
            value={notes}
            onChangeText={setNotes}
            multiline
          />
        </View>

        <Button
          title={saving ? "Saving..." : isEditing ? "Update Plant" : "Save Plant"}
          onPress={savePlant}
          disabled={saving}
        />
        {isEditing ? (
          <Button
            title="Delete Plant"
            variant="secondary"
            onPress={confirmDeletePlant}
            disabled={saving}
          />
        ) : null}
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
      padding: 16,
      gap: 14,
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
    row: {
      flexDirection: "row",
      gap: 14,
    },
    rowItem: {
      flex: 1,
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
