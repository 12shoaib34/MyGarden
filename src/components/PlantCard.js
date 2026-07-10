import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Leaf, Sprout } from 'lucide-react-native';
import { Card } from './Card';
import { useTheme } from '../theme/ThemeProvider';
import { getPlantAgeLabel } from '../utils/plantAge';

export function PlantCard({ plant, onPress }) {
  const { theme } = useTheme();

  return (
    <Pressable onPress={onPress}>
      {({ pressed }) => (
        <Card style={[styles.card, { opacity: pressed ? 0.82 : 1 }]}>
          <View style={[styles.imageBox, { backgroundColor: theme.colors.surfaceSoft }]}>
            {plant.image_uri ? (
              <Image source={{ uri: plant.image_uri }} style={styles.image} />
            ) : (
              <Sprout size={32} color={theme.colors.primary} strokeWidth={2} />
            )}
          </View>
          <View style={styles.body}>
            <View style={styles.titleRow}>
              <Text style={[theme.typography.title, styles.name, { color: theme.colors.text }]}>
                {plant.name}
              </Text>
              <Leaf size={18} color={theme.colors.primary} />
            </View>
            <Text style={[theme.typography.bodySmall, { color: theme.colors.textMuted }]}>
              {plant.category} {plant.variety ? `- ${plant.variety}` : ''}
            </Text>
            <Text style={[theme.typography.label, { color: theme.colors.primary }]}>
              {getPlantAgeLabel(plant.purchase_date)}
            </Text>
          </View>
        </Card>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
    marginBottom: 14,
  },
  imageBox: {
    height: 132,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  body: {
    padding: 16,
    gap: 6,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  name: {
    flex: 1,
  },
});
