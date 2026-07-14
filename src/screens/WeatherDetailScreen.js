import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  ArrowLeft,
  Cloud,
  CloudDrizzle,
  CloudLightning,
  CloudRain,
  CloudSun,
  Droplets,
  RefreshCw,
  Sprout,
  Sun,
  Wind,
} from "lucide-react-native";
import { AppHeader, HeaderActionButton } from "../components/AppHeader";
import { Card } from "../components/Card";
import { useGetSafeAreaInsets } from "../hooks/getSafeAreaInsets";
import { withHaptic } from "../services/hapticService";
import { getSurjaniTownWeather } from "../services/weatherService";
import { useTheme } from "../theme/ThemeProvider";

export function WeatherDetailScreen({ onBack }) {
  const { theme } = useTheme();
  const insets = useGetSafeAreaInsets();
  const themedStyles = createStyles(theme, insets);
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    let alive = true;

    getSurjaniTownWeather()
      .then((nextWeather) => {
        if (alive) {
          setWeather(nextWeather);
        }
      })
      .finally(() => {
        if (alive) {
          setLoading(false);
        }
      });

    return () => {
      alive = false;
    };
  }, []);

  async function refreshWeather() {
    setRefreshing(true);

    try {
      const nextWeather = await getSurjaniTownWeather({ forceRefresh: true });
      setWeather(nextWeather);
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  }

  const forecast = weather?.daily?.length ? weather.daily : [];
  const guidance = useMemo(() => getWateringGuidance(forecast, weather), [forecast, weather]);

  return (
    <View style={themedStyles.screen}>
      <AppHeader
        icon={CloudSun}
        title="Weather"
        subtitle="Rain and watering guide"
        right={
          <HeaderActionButton onPress={onBack} accessibilityLabel="Go back">
            <ArrowLeft size={20} color={theme.colors.text} />
          </HeaderActionButton>
        }
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={themedStyles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refreshWeather}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
            progressBackgroundColor={theme.colors.surface}
          />
        }
      >
        {loading ? (
          <Card style={themedStyles.loadingCard}>
            <ActivityIndicator color={theme.colors.primary} />
            <Text style={themedStyles.loadingText}>Loading weather...</Text>
          </Card>
        ) : (
          <>
            <Card style={themedStyles.heroCard}>
              <View style={themedStyles.heroTop}>
                <View style={themedStyles.heroIcon}>
                  <WeatherIcon code={weather?.weatherCode} size={30} color={theme.colors.primary} />
                </View>
                <View style={themedStyles.heroText}>
                  <Text style={themedStyles.heroTitle}>
                    {weather?.temperature ?? "--"}°C {weather?.condition ?? "Weather"}
                  </Text>
                  <Text style={themedStyles.heroSubtitle}>
                    Feels like {weather?.feelsLike ?? "--"}°C
                  </Text>
                </View>
              </View>

              <View style={themedStyles.metricRow}>
                <Metric icon={Droplets} label="Humidity" value={`${weather?.humidity ?? "--"}%`} />
                <Metric icon={Wind} label="Wind" value={`${weather?.windSpeed ?? "--"}km/h`} />
              </View>
            </Card>

            <Card style={themedStyles.guideCard}>
              <View style={themedStyles.guideHeader}>
                <View style={themedStyles.guideIcon}>
                  <Sprout size={23} color={theme.colors.primary} />
                </View>
                <View style={themedStyles.guideText}>
                  <Text style={themedStyles.guideTitle}>{guidance.title}</Text>
                  <Text style={themedStyles.guideBody}>{guidance.message}</Text>
                </View>
              </View>
              <View style={themedStyles.guideMeta}>
                <Text style={themedStyles.guideMetaText}>{guidance.rainLine}</Text>
              </View>
            </Card>

            <View style={themedStyles.sectionHeader}>
              <Text style={themedStyles.sectionTitle}>7-Day Forecast</Text>
              <Pressable
                onPress={withHaptic(refreshWeather)}
                style={({ pressed }) => [
                  themedStyles.refreshButton,
                  { opacity: pressed ? 0.72 : 1 },
                ]}
              >
                <RefreshCw size={16} color={theme.colors.primary} />
                <Text style={themedStyles.refreshText}>Refresh</Text>
              </Pressable>
            </View>

            <View style={themedStyles.forecastList}>
              {forecast.map((day) => (
                <ForecastCard key={day.date} day={day} />
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

function Metric({ icon: Icon, label, value }) {
  const { theme } = useTheme();

  return (
    <View style={styles.metric}>
      <Icon size={18} color={theme.colors.primary} />
      <View>
        <Text style={[theme.typography.bodySmall, { color: theme.colors.textMuted }]}>
          {label}
        </Text>
        <Text style={[theme.typography.label, { color: theme.colors.text }]}>
          {value}
        </Text>
      </View>
    </View>
  );
}

function ForecastCard({ day }) {
  const { theme } = useTheme();
  const themedStyles = createStyles(theme, useGetSafeAreaInsets());
  const rainLevel = getRainLevel(day.rainChance, day.rainAmount);

  return (
    <Card style={themedStyles.forecastCard}>
      <View style={themedStyles.forecastTop}>
        <View style={themedStyles.forecastIcon}>
          <WeatherIcon code={day.weatherCode} size={22} color={theme.colors.primary} />
        </View>
        <View style={themedStyles.forecastText}>
          <Text style={themedStyles.forecastDay}>{day.label}</Text>
          <Text style={themedStyles.forecastCondition}>{day.condition}</Text>
        </View>
        <Text style={themedStyles.forecastTemp}>
          {day.maxTemp}°/{day.minTemp}°
        </Text>
      </View>

      <View style={themedStyles.rainRow}>
        <Text style={themedStyles.rainText}>{day.rainChance}% rain chance</Text>
        <Text style={themedStyles.rainText}>{day.rainAmount}mm expected</Text>
      </View>
      <View style={themedStyles.levelTrack}>
        <View
          style={[
            themedStyles.levelFill,
            {
              width: `${Math.min(day.rainChance, 100)}%`,
              backgroundColor: rainLevel.color,
            },
          ]}
        />
      </View>
      <Text style={themedStyles.dayAdvice}>
        {getDailyWateringAdvice(day)}
      </Text>
    </Card>
  );
}

function WeatherIcon({ code, size, color }) {
  const Icon = getWeatherIcon(code);
  return <Icon size={size} color={color} />;
}

function getWeatherIcon(code) {
  if (code === 0) return Sun;
  if ([1, 2].includes(code)) return CloudSun;
  if (code === 3) return Cloud;
  if ([51, 53, 55, 56, 57].includes(code)) return CloudDrizzle;
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return CloudRain;
  if ([95, 96, 99].includes(code)) return CloudLightning;
  return CloudSun;
}

function getWateringGuidance(forecast, weather) {
  const tomorrow = forecast[1];

  if (tomorrow && isVeryHighRain(tomorrow)) {
    return {
      title: "Skip watering tomorrow",
      message:
        "Rain chance is very high, so outdoor pots can wait. Check only sheltered or indoor plants.",
      rainLine: `Tomorrow: ${tomorrow.rainChance}% chance, ${tomorrow.rainAmount}mm expected`,
    };
  }

  if (tomorrow && tomorrow.rainChance >= 60) {
    return {
      title: "Water lightly after checking soil",
      message:
        "Rain is possible, but not certain enough to skip. Water only plants with dry top soil.",
      rainLine: `Tomorrow: ${tomorrow.rainChance}% chance, ${tomorrow.rainAmount}mm expected`,
    };
  }

  if (tomorrow && tomorrow.rainChance >= 35) {
    return {
      title: "Normal watering with a soil check",
      message:
        "Medium rain chance. Give less water to outdoor pots if soil is already moist.",
      rainLine: `Tomorrow: ${tomorrow.rainChance}% chance, ${tomorrow.rainAmount}mm expected`,
    };
  }

  return {
    title: "Water as usual",
    message:
      weather?.humidity >= 75
        ? "Humidity is high, so water slowly and avoid soggy soil."
        : "Rain risk is low. Follow your normal watering routine for dry plants.",
    rainLine: tomorrow
      ? `Tomorrow: ${tomorrow.rainChance}% chance, ${tomorrow.rainAmount}mm expected`
      : "Forecast unavailable",
  };
}

function getDailyWateringAdvice(day) {
  if (isVeryHighRain(day)) {
    return "Very high rain chance. Skip outdoor watering unless a pot is fully sheltered.";
  }

  if (day.rainChance >= 60) {
    return "Rain likely. Check soil first and water lightly only if dry.";
  }

  if (day.rainChance >= 35) {
    return "Some rain possible. Reduce water for already moist outdoor pots.";
  }

  if (day.maxTemp >= 35) {
    return "Hot day. Water early morning or evening if soil is dry.";
  }

  return "Low rain chance. Normal watering is fine after a quick soil check.";
}

function isVeryHighRain(day) {
  return day.rainChance >= 80 && day.rainAmount >= 2;
}

function getRainLevel(rainChance, rainAmount) {
  if (rainChance >= 80 && rainAmount >= 2) {
    return { color: "#7CC5FF" };
  }

  if (rainChance >= 60) {
    return { color: "#80D88C" };
  }

  if (rainChance >= 35) {
    return { color: "#E9B44C" };
  }

  return { color: "#8A9A8A" };
}

function createStyles(theme, insets) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scroll: {
      padding: 20,
      paddingBottom: Math.max(insets.bottom + 24, 44),
      gap: 16,
    },
    loadingCard: {
      minHeight: 160,
      alignItems: "center",
      justifyContent: "center",
      gap: 12,
      padding: 24,
      backgroundColor: theme.colors.surfaceSoft,
    },
    loadingText: {
      ...theme.typography.body,
      color: theme.colors.textMuted,
    },
    heroCard: {
      padding: 22,
      gap: 18,
      backgroundColor: theme.colors.surfaceSoft,
    },
    heroTop: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
    },
    heroIcon: {
      width: 56,
      height: 56,
      borderRadius: 20,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.colors.successSurface,
    },
    heroText: {
      flex: 1,
      gap: 4,
    },
    heroTitle: {
      fontSize: 27,
      lineHeight: 32,
      fontWeight: "700",
      color: theme.colors.text,
    },
    heroSubtitle: {
      ...theme.typography.label,
      color: theme.colors.textMuted,
    },
    metricRow: {
      flexDirection: "row",
      gap: 12,
    },
    guideCard: {
      padding: 18,
      gap: 14,
      backgroundColor: theme.colors.successSurface,
    },
    guideHeader: {
      flexDirection: "row",
      gap: 12,
    },
    guideIcon: {
      width: 46,
      height: 46,
      borderRadius: 18,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: `${theme.colors.primary}16`,
    },
    guideText: {
      flex: 1,
      gap: 5,
    },
    guideTitle: {
      ...theme.typography.title,
      color: theme.colors.text,
    },
    guideBody: {
      ...theme.typography.body,
      color: theme.colors.textMuted,
      lineHeight: 22,
    },
    guideMeta: {
      borderRadius: 16,
      paddingVertical: 10,
      paddingHorizontal: 12,
      backgroundColor: theme.colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
    },
    guideMetaText: {
      ...theme.typography.label,
      color: theme.colors.primary,
    },
    sectionHeader: {
      marginTop: 6,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
    },
    sectionTitle: {
      fontSize: 24,
      lineHeight: 30,
      fontWeight: "700",
      color: theme.colors.text,
    },
    refreshButton: {
      minHeight: 38,
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      borderRadius: 16,
      paddingHorizontal: 12,
      backgroundColor: theme.colors.surfaceSoft,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    refreshText: {
      ...theme.typography.label,
      color: theme.colors.primary,
    },
    forecastList: {
      gap: 14,
    },
    forecastCard: {
      padding: 18,
      gap: 14,
      backgroundColor: theme.colors.surface,
    },
    forecastTop: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    forecastIcon: {
      width: 44,
      height: 44,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.colors.successSurface,
    },
    forecastText: {
      flex: 1,
      gap: 2,
    },
    forecastDay: {
      ...theme.typography.title,
      color: theme.colors.text,
    },
    forecastCondition: {
      ...theme.typography.bodySmall,
      color: theme.colors.textMuted,
    },
    forecastTemp: {
      fontSize: 19,
      lineHeight: 24,
      fontWeight: "700",
      color: theme.colors.text,
    },
    rainRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 10,
    },
    rainText: {
      ...theme.typography.bodySmall,
      color: theme.colors.textMuted,
    },
    levelTrack: {
      height: 8,
      borderRadius: 999,
      overflow: "hidden",
      backgroundColor: theme.colors.surfaceSoft,
    },
    levelFill: {
      height: "100%",
      borderRadius: 999,
    },
    dayAdvice: {
      ...theme.typography.bodySmall,
      color: theme.colors.textMuted,
      lineHeight: 20,
    },
  });
}

const styles = StyleSheet.create({
  metric: {
    flex: 1,
    minHeight: 54,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
});
