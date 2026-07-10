import { useCallback, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, CalendarDays, Droplets, HeartPulse, Image as ImageIcon, NotebookText, Sprout, Wheat } from 'lucide-react-native';
import { Card } from '../../src/components/Card';
import { Screen } from '../../src/components/Screen';
import { getPlant } from '../../src/storage/database';
import { useTheme } from '../../src/theme/ThemeProvider';
import { getPlantAgeLabel } from '../../src/utils/plantAge';

export default function PlantDetailScreen() {
  const { id } = useLocalSearchParams();
  const { theme } = useTheme();
  const [plant, setPlant] = useState(null);
  const styles = createStyles(theme);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      getPlant(id).then((row) => {
        if (alive) {
          setPlant(row);
        }
      });
      return () => {
        alive = false;
      };
    }, [id])
  );

  if (!plant) {
    return (
      <Screen safeTop safeBottom>
        <View style={styles.loading}>
          <Text style={styles.body}>Loading plant...</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen padded={false} safeBottom>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.hero}>
          {plant.image_uri ? (
            <Image source={{ uri: plant.image_uri }} style={styles.heroImage} />
          ) : (
            <View style={styles.heroPlaceholder}>
              <Sprout size={54} color={theme.colors.primary} />
            </View>
          )}
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={23} color={theme.colors.text} />
          </Pressable>
        </View>

        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.category}>{plant.category}</Text>
            <Text style={styles.title}>{plant.name}</Text>
            <Text style={styles.subtitle}>
              {plant.variety ? `${plant.variety} - ` : ''}{getPlantAgeLabel(plant.purchase_date)}
            </Text>
          </View>

          <View style={styles.grid}>
            <InfoCard Icon={HeartPulse} label="Health" value={plant.health_status} />
            <InfoCard Icon={Droplets} label="Water" value={`Every ${plant.water_every_days} days`} tone="water" />
            <InfoCard Icon={Wheat} label="Feed" value={`Every ${plant.fertilizer_every_days} days`} tone="brown" />
            <InfoCard Icon={CalendarDays} label="Added" value={plant.purchase_date} tone="harvest" />
          </View>

          <Card style={styles.section}>
            <View style={styles.sectionHeader}>
              <NotebookText size={22} color={theme.colors.primary} />
              <Text style={styles.sectionTitle}>Notes</Text>
            </View>
            <Text style={styles.body}>{plant.notes || 'No notes added yet.'}</Text>
          </Card>

          <Card style={styles.section}>
            <View style={styles.sectionHeader}>
              <ImageIcon size={22} color={theme.colors.primary} />
              <Text style={styles.sectionTitle}>Next chunks</Text>
            </View>
            <Text style={styles.body}>Watering history, fertilizer timeline, growth photos, reminders, and organic feeding records will attach to this plant detail page.</Text>
          </Card>
        </View>
      </ScrollView>
    </Screen>
  );
}

function InfoCard({ Icon, label, value, tone = 'primary' }) {
  const { theme } = useTheme();
  const color = theme.colors[tone] || theme.colors.primary;
  return (
    <Card style={detailStyles.infoCard}>
      <Icon size={22} color={color} />
      <Text style={[theme.typography.label, { color: theme.colors.textMuted }]}>{label}</Text>
      <Text style={[theme.typography.bodySmall, { color: theme.colors.text }]}>{value}</Text>
    </Card>
  );
}

const detailStyles = StyleSheet.create({
  infoCard: {
    width: '48%',
    padding: 14,
    gap: 7,
  },
});

function createStyles(theme) {
  return StyleSheet.create({
    scroll: {
      paddingBottom: theme.spacing.xxxl,
    },
    hero: {
      height: 330,
      backgroundColor: theme.colors.surfaceSoft,
    },
    heroImage: {
      width: '100%',
      height: '100%',
    },
    heroPlaceholder: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    backButton: {
      position: 'absolute',
      top: 48,
      left: 20,
      width: 44,
      height: 44,
      borderRadius: theme.radius.full,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
    },
    content: {
      paddingHorizontal: theme.spacing.lg,
      marginTop: -theme.spacing.xl,
    },
    header: {
      padding: theme.spacing.lg,
      borderRadius: theme.radius.xl,
      backgroundColor: theme.colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
      marginBottom: theme.spacing.lg,
    },
    category: {
      ...theme.typography.label,
      color: theme.colors.primary,
      marginBottom: 5,
    },
    title: {
      ...theme.typography.headline,
      color: theme.colors.text,
    },
    subtitle: {
      ...theme.typography.body,
      color: theme.colors.textMuted,
      marginTop: 4,
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      rowGap: theme.spacing.md,
      marginBottom: theme.spacing.lg,
    },
    section: {
      padding: theme.spacing.lg,
      gap: theme.spacing.sm,
      marginBottom: theme.spacing.md,
    },
    sectionHeader: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
      alignItems: 'center',
    },
    sectionTitle: {
      ...theme.typography.title,
      color: theme.colors.text,
    },
    body: {
      ...theme.typography.body,
      color: theme.colors.textMuted,
    },
    loading: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
}
