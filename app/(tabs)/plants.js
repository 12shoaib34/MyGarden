import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { EmptyState } from '../../src/components/EmptyState';
import { PlantCard } from '../../src/components/PlantCard';
import { Screen } from '../../src/components/Screen';
import { useTheme } from '../../src/theme/ThemeProvider';
import { listPlants } from '../../src/storage/database';

export default function PlantsScreen() {
  const { theme } = useTheme();
  const [plants, setPlants] = useState([]);
  const styles = createStyles(theme);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      listPlants().then((rows) => {
        if (alive) {
          setPlants(rows);
        }
      });
      return () => {
        alive = false;
      };
    }, [])
  );

  if (plants.length === 0) {
    return (
      <Screen safeTop>
        <EmptyState
          title="No plants yet"
          message="Add balcony, rooftop, vegetable, fruit, herb, and flower plants here."
          actionTitle="Add Plant"
          onAction={() => router.push('/add')}
        />
      </Screen>
    );
  }

  return (
    <Screen safeTop>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={styles.title}>Plant list</Text>
          <Text style={styles.subtitle}>{plants.length} saved locally</Text>
        </View>
        {plants.map((plant) => (
          <PlantCard
            key={plant.id}
            plant={plant}
            onPress={() => router.push(`/plant/${plant.id}`)}
          />
        ))}
      </ScrollView>
    </Screen>
  );
}

function createStyles(theme) {
  return StyleSheet.create({
    scroll: {
      paddingTop: theme.spacing.md,
      paddingBottom: theme.spacing.xxl,
    },
    header: {
      marginBottom: theme.spacing.xl,
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
  });
}
