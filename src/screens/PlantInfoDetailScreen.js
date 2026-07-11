import { ScrollView, StyleSheet, Text, View } from "react-native";
import { ArrowLeft, CalendarDays, Flower2, Leaf, Scissors, ShieldAlert, Sprout, TreePine, Trees } from "lucide-react-native";
import { AppHeader, HeaderActionButton } from "../components/AppHeader";
import { bottomTabHeight } from "../components/BottomTabs";
import { useGetSafeAreaInsets } from "../hooks/getSafeAreaInsets";
import { useTheme } from "../theme/ThemeProvider";
import { formatMonths, includesCurrentMonth } from "../utils/months";

export function PlantInfoDetailScreen({ plant, onBack }) {
  const { theme } = useTheme();
  const insets = useGetSafeAreaInsets();
  const styles = createStyles(theme, insets);
  const isFruit = plant.category === "Fruit";

  return (
    <View style={styles.screen}>
      <AppHeader icon={Leaf} title={plant.name} subtitle={plant.botanicalName}>
        <HeaderActionButton onPress={onBack} accessibilityLabel="Back to plant guide">
          <ArrowLeft size={22} color={theme.colors.text} />
        </HeaderActionButton>
      </AppHeader>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        <PlantHeroIcon category={plant.category} />

        <View style={styles.quickGrid}>
          <InfoPill label="Type" value={plant.plantType} />
          <InfoPill label="Feeder" value={plant.feederType} />
          <InfoPill label="Age" value={plant.totalAge} />
          <InfoPill label="Category" value={plant.category} />
        </View>

        <Section title="Grow Bag Sizes" icon={Trees}>
          <SizeRow label="Average" value={plant.growBagSizes.average} />
          <SizeRow label="Medium" value={plant.growBagSizes.medium} />
          <SizeRow label="Ideal" value={plant.growBagSizes.ideal} />
        </Section>

        {isFruit ? (
          <>
            <FruitTimingSection plant={plant} />
            <PropagationSection plant={plant} />
          </>
        ) : (
          <Section title="Planting Months" icon={CalendarDays}>
            <ActiveLine
              active={includesCurrentMonth(plant.plantingMonths)}
              activeLabel="Planting Time"
              inactiveLabel="Not active this month"
            />
            <Text style={styles.bodyText}>{formatMonths(plant.plantingMonths)}</Text>
          </Section>
        )}

        <BulletSection title="Care Information" icon={Leaf} items={plant.care} />
        <BulletSection title="Pruning Information" icon={Scissors} items={plant.pruning} />
        <BulletSection title="Common Pests" icon={ShieldAlert} items={plant.pests} />
        <BulletSection title="Common Diseases" icon={Sprout} items={plant.diseases} />

        {plant.succulentInfo ? (
          <Section title="Succulent Notes" icon={Sprout}>
            <SizeRow label="Watering" value={plant.succulentInfo.wateringRule} />
            <SizeRow label="Soil" value={plant.succulentInfo.soilRule} />
            <SizeRow label="Stress" value={plant.succulentInfo.sunStressNote} />
          </Section>
        ) : null}

        {plant.karachiNotes?.length ? (
          <BulletSection title="Karachi Notes" icon={CalendarDays} items={plant.karachiNotes} />
        ) : null}
      </ScrollView>
    </View>
  );
}

function PlantHeroIcon({ category }) {
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
    <View style={styles.heroImage}>
      <Icon size={58} color={theme.colors.primary} />
    </View>
  );
}

function FruitTimingSection({ plant }) {
  const { theme } = useTheme();
  const styles = createStyles(theme, useGetSafeAreaInsets());
  const fruitInfo = plant.fruitInfo;

  return (
    <Section title="Fruit Timing" icon={CalendarDays}>
      <ActiveLine
        active={includesCurrentMonth(fruitInfo.dormancyMonths)}
        activeLabel="Dormancy Time"
        inactiveLabel="Dormancy not active"
      />
      <Text style={styles.labelText}>Dormancy Months</Text>
      <Text style={styles.bodyText}>{formatMonths(fruitInfo.dormancyMonths)}</Text>
      <Text style={styles.bodyText}>{fruitInfo.dormantSeason}</Text>

      <ActiveLine
        active={includesCurrentMonth(fruitInfo.pruningMonths)}
        activeLabel="Pruning Time"
        inactiveLabel="Pruning not active"
      />
      <Text style={styles.labelText}>Pruning Months</Text>
      <Text style={styles.bodyText}>{formatMonths(fruitInfo.pruningMonths)}</Text>
      <Text style={styles.bodyText}>{fruitInfo.pruningSeason}</Text>

      <ActiveLine
        active={includesCurrentMonth(fruitInfo.fruitingMonths)}
        activeLabel="Fruiting Time"
        inactiveLabel="Fruiting not active"
      />
      <Text style={styles.labelText}>Fruiting Months</Text>
      <Text style={styles.bodyText}>{formatMonths(fruitInfo.fruitingMonths)}</Text>
      <Text style={styles.bodyText}>{fruitInfo.fruitingSeason}</Text>
    </Section>
  );
}

function PropagationSection({ plant }) {
  const { theme } = useTheme();
  const styles = createStyles(theme, useGetSafeAreaInsets());
  const propagation = plant.propagation;

  return (
    <Section title="Propagation Information" icon={Sprout}>
      <ActiveLine
        active={includesCurrentMonth(propagation.airLayeringMonths)}
        activeLabel="Air Layering Time"
        inactiveLabel="Air layering not active"
      />
      <Text style={styles.labelText}>Air Layering Season</Text>
      <Text style={styles.bodyText}>{formatMonths(propagation.airLayeringMonths)}</Text>

      <ActiveLine
        active={includesCurrentMonth(propagation.cuttingMonths)}
        activeLabel="Cutting Time"
        inactiveLabel="Cutting not active"
      />
      <Text style={styles.labelText}>Cutting Season</Text>
      <Text style={styles.bodyText}>{formatMonths(propagation.cuttingMonths)}</Text>

      <Text style={styles.labelText}>Best Method</Text>
      <Text style={styles.bodyText}>{propagation.bestMethod}</Text>

      {propagation.methods.map((method) => (
        <SizeRow
          key={method.name}
          label={method.name}
          value={`${method.success} - ${method.note}`}
        />
      ))}

      {propagation.notes.map((note) => (
        <Text key={note} style={styles.bullet}>- {note}</Text>
      ))}
    </Section>
  );
}

function Section({ title, icon: Icon, children }) {
  const { theme } = useTheme();
  const styles = createStyles(theme, useGetSafeAreaInsets());

  return (
    <View style={styles.section}>
      <View style={styles.sectionTop}>
        <View style={styles.sectionIcon}>
          <Icon size={20} color={theme.colors.primary} />
        </View>
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      <View style={styles.sectionContent}>{children}</View>
    </View>
  );
}

function BulletSection({ title, icon, items }) {
  const { theme } = useTheme();
  const styles = createStyles(theme, useGetSafeAreaInsets());

  return (
    <Section title={title} icon={icon}>
      {items.map((item) => (
        <Text key={item} style={styles.bullet}>- {item}</Text>
      ))}
    </Section>
  );
}

function InfoPill({ label, value }) {
  const { theme } = useTheme();
  const styles = createStyles(theme, useGetSafeAreaInsets());

  return (
    <View style={styles.infoPill}>
      <Text style={styles.pillLabel}>{label}</Text>
      <Text style={styles.pillValue}>{value}</Text>
    </View>
  );
}

function SizeRow({ label, value }) {
  const { theme } = useTheme();
  const styles = createStyles(theme, useGetSafeAreaInsets());

  return (
    <View style={styles.sizeRow}>
      <Text style={styles.sizeLabel}>{label}</Text>
      <Text style={styles.sizeValue}>{value}</Text>
    </View>
  );
}

function ActiveLine({ active, activeLabel, inactiveLabel }) {
  const { theme } = useTheme();
  const styles = createStyles(theme, useGetSafeAreaInsets());

  return (
    <Text style={[styles.statusChip, active ? styles.statusActive : styles.statusInactive]}>
      {active ? activeLabel : inactiveLabel}
    </Text>
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
      paddingTop: 18,
      paddingBottom: bottomTabHeight + insets.bottom + 28,
      gap: 16,
    },
    heroImage: {
      width: "100%",
      height: 220,
      borderRadius: 24,
      backgroundColor: theme.colors.surfaceSoft,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
      alignItems: "center",
      justifyContent: "center",
    },
    quickGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 12,
    },
    infoPill: {
      width: "48%",
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
      borderRadius: 20,
      backgroundColor: theme.colors.surface,
      padding: 14,
      gap: 6,
    },
    pillLabel: {
      ...theme.typography.label,
      color: theme.colors.primary,
    },
    pillValue: {
      ...theme.typography.bodySmall,
      color: theme.colors.text,
    },
    section: {
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
      borderRadius: 24,
      backgroundColor: theme.colors.surface,
      padding: 16,
      gap: 14,
    },
    sectionTop: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    sectionIcon: {
      width: 38,
      height: 38,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.colors.successSurface,
    },
    sectionTitle: {
      ...theme.typography.title,
      color: theme.colors.text,
      flex: 1,
    },
    sectionContent: {
      gap: 10,
    },
    labelText: {
      ...theme.typography.label,
      color: theme.colors.primary,
      marginTop: 4,
    },
    bodyText: {
      ...theme.typography.body,
      color: theme.colors.textMuted,
    },
    bullet: {
      ...theme.typography.body,
      color: theme.colors.textMuted,
    },
    sizeRow: {
      gap: 3,
    },
    sizeLabel: {
      ...theme.typography.label,
      color: theme.colors.text,
    },
    sizeValue: {
      ...theme.typography.bodySmall,
      color: theme.colors.textMuted,
    },
    statusChip: {
      alignSelf: "flex-start",
      borderRadius: 999,
      overflow: "hidden",
      paddingHorizontal: 12,
      paddingVertical: 7,
      ...theme.typography.label,
    },
    statusActive: {
      color: theme.colors.primaryStrong,
      backgroundColor: theme.colors.secondaryContainer,
    },
    statusInactive: {
      color: theme.colors.textMuted,
      backgroundColor: theme.colors.surfaceSoft,
    },
  });
}
