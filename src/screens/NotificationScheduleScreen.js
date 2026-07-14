import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Bell, Check, Clock, Send, X } from "lucide-react-native";
import { AppHeader, HeaderActionButton } from "../components/AppHeader";
import { useAppDialog } from "../components/AppDialog";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { TextField } from "../components/TextField";
import { useGetSafeAreaInsets } from "../hooks/getSafeAreaInsets";
import { withHaptic } from "../services/hapticService";
import {
  getDailyWaterReminderTime,
  getFertilizerReminderTime,
  sendTestFertilizerReminderNotification,
  sendTestWaterReminderNotification,
  updateDailyWaterReminderTime,
  updateFertilizerReminderTime,
} from "../services/notificationService";
import { useTheme } from "../theme/ThemeProvider";

const defaultEditorTime = { hour: "04", minute: "00", period: "PM" };

export function NotificationScheduleScreen({ onBack }) {
  const { theme } = useTheme();
  const { showDialog } = useAppDialog();
  const insets = useGetSafeAreaInsets();
  const themedStyles = createStyles(theme, insets);
  const [waterTime, setWaterTime] = useState(defaultEditorTime);
  const [fertilizerTime, setFertilizerTime] = useState({
    hour: "09",
    minute: "00",
    period: "AM",
  });
  const [busyKey, setBusyKey] = useState(null);
  const [testBusyKey, setTestBusyKey] = useState(null);

  useEffect(() => {
    Promise.all([getDailyWaterReminderTime(), getFertilizerReminderTime()]).then(
      ([waterReminderTime, fertilizerReminderTime]) => {
        setWaterTime(toEditorTime(waterReminderTime));
        setFertilizerTime(toEditorTime(fertilizerReminderTime));
      }
    );
  }, []);

  async function saveSchedule({
    key,
    editorTime,
    updateReminderTime,
    successTitle,
    successBody,
  }) {
    const displayHour = Number(editorTime.hour);
    const nextMinute = Number(editorTime.minute);
    if (
      !Number.isInteger(displayHour) ||
      !Number.isInteger(nextMinute) ||
      displayHour < 1 ||
      displayHour > 12 ||
      nextMinute < 0 ||
      nextMinute > 59
    ) {
      await showDialog({
        title: "Time invalid",
        message: "Enter hour from 1-12 and minute from 0-59.",
        variant: "warning",
      });
      return;
    }

    const nextHour = to24Hour(displayHour, editorTime.period);

    setBusyKey(key);
    try {
      const result = await updateReminderTime(nextHour, nextMinute);
      await showDialog({
        title: result.ok ? successTitle : "Permission needed",
        message: result.ok
          ? successBody(formatTime12(displayHour, nextMinute, editorTime.period))
          : "Allow notifications for MyGarden, then try again.",
        variant: result.ok ? "success" : "warning",
      });
    } catch (error) {
      await showDialog({
        title: "Schedule failed",
        message: error.message,
        variant: "error",
      });
    } finally {
      setBusyKey(null);
    }
  }

  async function sendTest({ key, sendTestNotification, successMessage }) {
    setTestBusyKey(key);
    try {
      const result = await sendTestNotification();
      await showDialog({
        title: result.ok ? "Test notification sent" : "Permission needed",
        message: result.ok
          ? successMessage
          : "Allow notifications for MyGarden, then try again.",
        variant: result.ok ? "success" : "warning",
      });
    } catch (error) {
      await showDialog({
        title: "Notification failed",
        message: error.message,
        variant: "error",
      });
    } finally {
      setTestBusyKey(null);
    }
  }

  return (
    <View style={themedStyles.screen}>
      <AppHeader icon={Bell} title="Notification Schedule" subtitle="Reminder times">
        <CloseButton onPress={onBack} />
      </AppHeader>
      <ScrollView contentContainerStyle={themedStyles.scroll}>
        <ReminderTimeCard
          title="Daily watering"
          editorTime={waterTime}
          setEditorTime={setWaterTime}
          busy={busyKey === "water"}
          testBusy={testBusyKey === "water"}
          onSave={() =>
            saveSchedule({
              key: "water",
              editorTime: waterTime,
              updateReminderTime: updateDailyWaterReminderTime,
              successTitle: "Reminder updated",
              successBody: (timeLabel) => `Daily watering reminder set for ${timeLabel}.`,
            })
          }
          onTest={() =>
            sendTest({
              key: "water",
              sendTestNotification: sendTestWaterReminderNotification,
              successMessage: "A water plants reminder was sent now.",
            })
          }
        />

        <ReminderTimeCard
          title="Fertilizer Timeline"
          editorTime={fertilizerTime}
          setEditorTime={setFertilizerTime}
          busy={busyKey === "fertilizer"}
          testBusy={testBusyKey === "fertilizer"}
          onSave={() =>
            saveSchedule({
              key: "fertilizer",
              editorTime: fertilizerTime,
              updateReminderTime: updateFertilizerReminderTime,
              successTitle: "Fertilizer time updated",
              successBody: (timeLabel) => `Fertilizer reminders will use ${timeLabel}.`,
            })
          }
          onTest={() =>
            sendTest({
              key: "fertilizer",
              sendTestNotification: sendTestFertilizerReminderNotification,
              successMessage: "A fertilizer timeline reminder was sent now.",
            })
          }
        />
      </ScrollView>
    </View>
  );
}

function ReminderTimeCard({
  title,
  editorTime,
  setEditorTime,
  busy,
  testBusy,
  onSave,
  onTest,
}) {
  const { theme } = useTheme();
  const themedStyles = createStyles(theme, useGetSafeAreaInsets());

  return (
    <Card style={themedStyles.card}>
      <View style={themedStyles.timeHeader}>
        <View style={themedStyles.timeIcon}>
          <Clock size={22} color={theme.colors.primary} />
        </View>
        <View style={themedStyles.timeText}>
          <Text style={themedStyles.timeTitle}>{title}</Text>
          <Text style={themedStyles.timeSubtitle}>
            Current time:{" "}
            {formatTime12(
              Number(editorTime.hour),
              Number(editorTime.minute),
              editorTime.period
            )}
          </Text>
        </View>
      </View>

      <View style={themedStyles.timeRow}>
        <View style={themedStyles.timeField}>
          <TextField
            label="Hour"
            value={editorTime.hour}
            onChangeText={(text) =>
              setEditorTime((current) => ({ ...current, hour: toDigits(text, 2) }))
            }
            placeholder="09"
            keyboardType="number-pad"
            maxLength={2}
          />
        </View>
        <View style={themedStyles.timeField}>
          <TextField
            label="Minute"
            value={editorTime.minute}
            onChangeText={(text) =>
              setEditorTime((current) => ({ ...current, minute: toDigits(text, 2) }))
            }
            placeholder="00"
            keyboardType="number-pad"
            maxLength={2}
          />
        </View>
      </View>

      <View style={themedStyles.periodRow}>
        {["AM", "PM"].map((item) => (
          <Pressable
            key={item}
            onPress={withHaptic(() =>
              setEditorTime((current) => ({ ...current, period: item }))
            )}
            style={[
              themedStyles.periodButton,
              editorTime.period === item && themedStyles.periodButtonSelected,
            ]}
          >
            <Text
              style={[
                themedStyles.periodText,
                editorTime.period === item && themedStyles.periodTextSelected,
              ]}
            >
              {item}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={themedStyles.actions}>
        <Button
          title={busy ? "Saving..." : "Save"}
          onPress={onSave}
          disabled={busy}
          Icon={Check}
          style={themedStyles.actionButton}
        />
        <Button
          title={testBusy ? "Sending..." : "Test"}
          variant="secondary"
          onPress={onTest}
          disabled={testBusy}
          Icon={Send}
          style={themedStyles.actionButton}
        />
      </View>
    </Card>
  );
}

function CloseButton({ onPress }) {
  const { theme } = useTheme();
  return (
    <HeaderActionButton onPress={onPress} accessibilityLabel="Close notification schedule">
      <X size={19} color={theme.colors.text} />
    </HeaderActionButton>
  );
}

function toDigits(value, maxLength) {
  return String(value || "").replace(/\D/g, "").slice(0, maxLength);
}

function to12HourTime(hour, minute) {
  const safeHour = Number.isFinite(hour) ? hour : 16;
  const period = safeHour >= 12 ? "PM" : "AM";
  const displayHour = safeHour % 12 || 12;
  return { hour: displayHour, minute, period };
}

function toEditorTime(time) {
  const nextTime = to12HourTime(time.hour, time.minute);
  return {
    hour: String(nextTime.hour).padStart(2, "0"),
    minute: String(time.minute).padStart(2, "0"),
    period: nextTime.period,
  };
}

function to24Hour(hour, period) {
  const normalizedHour = Number(hour) % 12;
  return period === "PM" ? normalizedHour + 12 : normalizedHour;
}

function formatTime12(hour, minute, period) {
  const safeHour = Number.isFinite(hour) ? hour : 12;
  const safeMinute = Number.isFinite(minute) ? minute : 0;
  return `${String(safeHour).padStart(2, "0")}:${String(safeMinute).padStart(2, "0")} ${period}`;
}

function createStyles(theme, insets) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scroll: {
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: Math.max(insets.bottom, 24) + 24,
      gap: 16,
    },
    card: {
      padding: 24,
      gap: 18,
    },
    timeHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
    },
    timeIcon: {
      width: 52,
      height: 52,
      borderRadius: 18,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.colors.successSurface,
    },
    timeText: {
      flex: 1,
      gap: 4,
    },
    timeTitle: {
      ...theme.typography.title,
      color: theme.colors.text,
    },
    timeSubtitle: {
      ...theme.typography.bodySmall,
      color: theme.colors.textMuted,
    },
    timeRow: {
      flexDirection: "row",
      gap: 12,
    },
    timeField: {
      flex: 1,
    },
    periodRow: {
      flexDirection: "row",
      gap: 10,
    },
    periodButton: {
      flex: 1,
      minHeight: 48,
      borderRadius: 18,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surfaceSoft,
    },
    periodButtonSelected: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.secondaryContainer,
    },
    periodText: {
      ...theme.typography.label,
      color: theme.colors.textMuted,
    },
    periodTextSelected: {
      color: theme.colors.primaryStrong,
    },
    actions: {
      flexDirection: "row",
      gap: 12,
    },
    actionButton: {
      flex: 1,
      paddingHorizontal: 14,
    },
  });
}
