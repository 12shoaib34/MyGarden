import { useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Camera, ImagePlus } from 'lucide-react-native';
import { Button } from '../../src/components/Button';
import { Card } from '../../src/components/Card';
import { Chip } from '../../src/components/Chip';
import { Screen } from '../../src/components/Screen';
import { TextField } from '../../src/components/TextField';
import catalog from '../../src/data/plantCatalog.json';
import { createPlant } from '../../src/storage/database';
import { useTheme } from '../../src/theme/ThemeProvider';

const categories = ['Vegetable', 'Fruit', 'Herb', 'Flower', 'Tree', 'Indoor'];

export default function AddPlantScreen() {
  const { theme } = useTheme();
  const [name, setName] = useState('');
  const [variety, setVariety] = useState('');
  const [category, setCategory] = useState('Vegetable');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().slice(0, 10));
  const [healthStatus, setHealthStatus] = useState('Healthy');
  const [notes, setNotes] = useState('');
  const [waterEveryDays, setWaterEveryDays] = useState('2');
  const [fertilizerEveryDays, setFertilizerEveryDays] = useState('15');
  const [imageUri, setImageUri] = useState('');
  const [saving, setSaving] = useState(false);
  const styles = createStyles(theme);

  async function pickImage() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Gallery access is needed to attach a plant image.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: true,
      aspect: [4, 3],
    });

    if (!result.canceled && result.assets?.[0]?.uri) {
      setImageUri(result.assets[0].uri);
    }
  }

  function applyCatalogPlant(item) {
    setName(item.name);
    setCategory(item.category);
    setWaterEveryDays(String(item.waterEveryDays));
    setFertilizerEveryDays(String(item.fertilizerEveryDays));
  }

  async function savePlant() {
    if (!name.trim()) {
      Alert.alert('Plant name required', 'Please enter a plant name.');
      return;
    }

    setSaving(true);
    try {
      const id = await createPlant({
        name,
        variety,
        category,
        purchaseDate,
        healthStatus,
        imageUri,
        notes,
        waterEveryDays,
        fertilizerEveryDays,
      });
      router.replace(`/plant/${id}`);
    } catch (error) {
      Alert.alert('Could not save plant', error.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen safeTop safeBottom>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Add plant</Text>
        <Text style={styles.subtitle}>Saved free and offline on this mobile.</Text>

        <Card style={styles.imageCard}>
          <View style={[styles.imageBox, { backgroundColor: theme.colors.surfaceSoft }]}>
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.image} />
            ) : (
              <Camera size={34} color={theme.colors.primary} />
            )}
          </View>
          <Button
            title={imageUri ? 'Change Image' : 'Optional Image'}
            variant="secondary"
            onPress={pickImage}
          />
        </Card>

        <Text style={styles.sectionTitle}>Quick presets</Text>
        <View style={styles.chips}>
          {catalog.map((item) => (
            <Chip key={item.name} label={item.name} onPress={() => applyCatalogPlant(item)} />
          ))}
        </View>

        <View style={styles.form}>
          <TextField label="Plant Name" value={name} onChangeText={setName} placeholder="Cherry Tomato" />
          <TextField label="Variety" value={variety} onChangeText={setVariety} placeholder="Roma, Thai Basil, Meyer Lemon" />

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
            label="Purchase/Add Date"
            value={purchaseDate}
            onChangeText={setPurchaseDate}
            placeholder="YYYY-MM-DD"
          />
          <TextField
            label="Health Status"
            value={healthStatus}
            onChangeText={setHealthStatus}
            placeholder="Healthy"
          />
          <View style={styles.row}>
            <View style={styles.rowItem}>
              <TextField
                label="Water Days"
                value={waterEveryDays}
                onChangeText={setWaterEveryDays}
                keyboardType="number-pad"
              />
            </View>
            <View style={styles.rowItem}>
              <TextField
                label="Feed Days"
                value={fertilizerEveryDays}
                onChangeText={setFertilizerEveryDays}
                keyboardType="number-pad"
              />
            </View>
          </View>
          <TextField label="Notes" value={notes} onChangeText={setNotes} multiline />
        </View>

        <Button title={saving ? 'Saving...' : 'Save Plant'} onPress={savePlant} disabled={saving} />
        <View style={styles.localNote}>
          <ImagePlus size={18} color={theme.colors.textMuted} />
          <Text style={styles.localText}>Plant records are stored in SQLite on this phone.</Text>
        </View>
      </ScrollView>
    </Screen>
  );
}

function createStyles(theme) {
  return StyleSheet.create({
    scroll: {
      paddingTop: theme.spacing.md,
      paddingBottom: theme.spacing.xxxl,
      gap: theme.spacing.md,
    },
    title: {
      ...theme.typography.headline,
      color: theme.colors.text,
    },
    subtitle: {
      ...theme.typography.body,
      color: theme.colors.textMuted,
      marginBottom: theme.spacing.sm,
    },
    imageCard: {
      padding: theme.spacing.md,
      gap: theme.spacing.md,
    },
    imageBox: {
      height: 170,
      borderRadius: theme.radius.lg,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    image: {
      width: '100%',
      height: '100%',
    },
    sectionTitle: {
      ...theme.typography.title,
      color: theme.colors.text,
      marginTop: theme.spacing.sm,
    },
    fieldLabel: {
      ...theme.typography.label,
      color: theme.colors.textMuted,
    },
    chips: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.xs,
    },
    form: {
      gap: theme.spacing.md,
    },
    row: {
      flexDirection: 'row',
      gap: theme.spacing.md,
    },
    rowItem: {
      flex: 1,
    },
    localNote: {
      flexDirection: 'row',
      gap: theme.spacing.xs,
      alignItems: 'center',
      justifyContent: 'center',
    },
    localText: {
      ...theme.typography.bodySmall,
      color: theme.colors.textMuted,
    },
  });
}
