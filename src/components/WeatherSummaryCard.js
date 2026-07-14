import { Pressable, StyleSheet, Text, View } from "react-native";
import {
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSun,
  Snowflake,
  Sun,
} from "lucide-react-native";
import { Card } from "./Card";
import { withHaptic } from "../services/hapticService";
import { useTheme } from "../theme/ThemeProvider";

export function WeatherSummaryCard({ weather, onPress }) {
  const { theme } = useTheme();
  const Icon = getWeatherIcon(weather?.weatherCode);
  const temperature = weather?.temperature ?? 24;
  const feelsLike = weather?.feelsLike ?? temperature;
  const condition = weather?.condition ?? "Sunny";
  const careTip = weather?.careTip ?? "Perfect day for repotting";
  const humidity = weather?.humidity ?? 65;
  const windSpeed = weather?.windSpeed ?? 5;

  const content = (
    <Card style={[styles.weatherCard, { backgroundColor: theme.colors.surfaceSoft }]}>
      <View style={[styles.weatherIcon, { backgroundColor: `${theme.colors.primary}12` }]}>
        <Icon size={30} color={theme.colors.primary} />
      </View>
      <View style={styles.weatherMain}>
        <Text style={[styles.weatherTitle, { color: theme.colors.text }]}>
          {temperature}°C {condition}
        </Text>
        <Text style={[theme.typography.label, { color: theme.colors.textMuted }]}>
          Feels like {feelsLike}°C
        </Text>
        <Text style={[theme.typography.body, { color: theme.colors.textMuted }]}>
          {careTip}
        </Text>
      </View>
      <View style={styles.weatherMeta}>
        <Text style={[theme.typography.label, { color: theme.colors.primary }]}>
          Humidity: {humidity}%
        </Text>
        <Text style={[theme.typography.bodySmall, { color: theme.colors.textMuted }]}>
          Wind: {windSpeed}km/h
        </Text>
      </View>
    </Card>
  );

  if (!onPress) {
    return content;
  }

  return (
    <Pressable
      onPress={withHaptic(onPress)}
      accessibilityRole="button"
      accessibilityLabel="Open weather details"
      style={({ pressed }) => ({ opacity: pressed ? 0.78 : 1 })}
    >
      {content}
    </Pressable>
  );
}

function getWeatherIcon(code) {
  if (code === 0) return Sun;
  if ([1, 2].includes(code)) return CloudSun;
  if (code === 3) return Cloud;
  if ([45, 48].includes(code)) return CloudFog;
  if ([51, 53, 55, 56, 57].includes(code)) return CloudDrizzle;
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return CloudRain;
  if ([71, 73, 75, 77, 85, 86].includes(code)) return Snowflake;
  if ([95, 96, 99].includes(code)) return CloudLightning;
  return Sun;
}

const styles = StyleSheet.create({
  weatherCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
    padding: 24,
    minHeight: 128,
    marginBottom: 24,
    borderRadius: 28,
  },
  weatherIcon: {
    width: 48,
    height: 48,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  weatherMain: {
    flex: 1,
    gap: 4,
  },
  weatherTitle: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "600",
  },
  weatherMeta: {
    alignItems: "flex-end",
    gap: 3,
  },
});
