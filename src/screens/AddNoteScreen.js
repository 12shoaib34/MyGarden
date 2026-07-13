import { useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Bell, Check, FileText, X } from "lucide-react-native";
import { AppHeader, HeaderActionButton } from "../components/AppHeader";
import { useAppDialog } from "../components/AppDialog";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { TextField } from "../components/TextField";
import { useGetSafeAreaInsets } from "../hooks/getSafeAreaInsets";
import { scheduleNoteReminderNotification } from "../services/notificationService";
import { createNote, updateNoteNotificationIdentifier } from "../storage/database";
import { useTheme } from "../theme/ThemeProvider";
import { formatDuration } from "./NotesScreen";

export function AddNoteScreen({ onCancel, onSaved }) {
  const { theme } = useTheme();
  const { showDialog } = useAppDialog();
  const insets = useGetSafeAreaInsets();
  const themedStyles = useMemo(() => createStyles(theme, insets), [theme, insets]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [hours, setHours] = useState("");
  const [minutes, setMinutes] = useState("");
  const [saving, setSaving] = useState(false);

  async function saveNote() {
    const cleanTitle = title.trim();
    const cleanDescription = description.trim();
    const reminderHours = Number(hours || 0);
    const reminderMinutes = Number(minutes || 0);

    if (!cleanTitle) {
      await showDialog({
        title: "Title needed",
        message: "Add a note title before saving.",
        variant: "warning",
      });
      return;
    }

    if (
      !Number.isInteger(reminderHours) ||
      !Number.isInteger(reminderMinutes) ||
      reminderHours < 0 ||
      reminderHours > 999 ||
      reminderMinutes < 0 ||
      reminderMinutes > 59 ||
      reminderHours + reminderMinutes <= 0
    ) {
      await showDialog({
        title: "Reminder invalid",
        message: "Enter hours from 0-999 and minutes from 0-59. At least one minute is required.",
        variant: "warning",
      });
      return;
    }

    setSaving(true);
    try {
      const reminderAt = new Date(
        Date.now() + reminderHours * 60 * 60 * 1000 + reminderMinutes * 60 * 1000
      ).toISOString();
      const noteId = await createNote({
        title: cleanTitle,
        description: cleanDescription,
        reminderHours,
        reminderMinutes,
        reminderAt,
      });
      const reminder = await scheduleNoteReminderNotification({
        id: noteId,
        title: cleanTitle,
        description: cleanDescription,
        reminderHours,
        reminderMinutes,
      });

      if (reminder.ok) {
        await updateNoteNotificationIdentifier(noteId, reminder.identifier);
      }

      await showDialog({
        title: reminder.ok ? "Note saved" : "Permission needed",
        message: reminder.ok
          ? `Reminder set after ${formatDuration(reminderHours, reminderMinutes)}.`
          : "Note saved, but notification permission is needed for reminders.",
        variant: reminder.ok ? "success" : "warning",
      });
      onSaved?.();
    } catch (error) {
      await showDialog({
        title: "Save failed",
        message: error.message,
        variant: "error",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={themedStyles.screen}>
      <AppHeader icon={FileText} title="Add Note" subtitle="Title, description, reminder time">
        <HeaderActionButton onPress={onCancel} accessibilityLabel="Close add note">
          <X size={19} color={theme.colors.text} />
        </HeaderActionButton>
      </AppHeader>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={themedStyles.scroll}
      >
        <Card style={themedStyles.formCard}>
          <View style={themedStyles.formHeader}>
            <View style={themedStyles.formIcon}>
              <Bell size={22} color={theme.colors.primary} />
            </View>
            <View style={themedStyles.formText}>
              <Text style={themedStyles.formTitle}>New reminder note</Text>
              <Text style={themedStyles.formSubtitle}>Example: 12 hours and 05 minutes</Text>
            </View>
          </View>

          <TextField
            label="Title"
            value={title}
            onChangeText={setTitle}
            placeholder="Example: Check compost"
          />
          <TextField
            label="Description"
            value={description}
            onChangeText={setDescription}
            placeholder="Write note details"
            multiline
          />
          <View style={themedStyles.timeRow}>
            <View style={themedStyles.timeField}>
              <TextField
                label="Hours"
                value={hours}
                onChangeText={(text) => setHours(toDigits(text, 3))}
                placeholder="12"
                keyboardType="number-pad"
                maxLength={3}
              />
            </View>
            <View style={themedStyles.timeField}>
              <TextField
                label="Minutes"
                value={minutes}
                onChangeText={(text) => setMinutes(toMinuteDigits(text))}
                placeholder="05"
                keyboardType="number-pad"
                maxLength={2}
              />
            </View>
          </View>

          <Button
            title={saving ? "Saving..." : "Save Note"}
            onPress={saveNote}
            disabled={saving}
            Icon={Check}
          />
        </Card>
      </ScrollView>
    </View>
  );
}

function toDigits(value, maxLength) {
  return String(value || "").replace(/\D/g, "").slice(0, maxLength);
}

function toMinuteDigits(value) {
  const digits = toDigits(value, 2);
  if (digits.length === 2 && Number(digits) > 59) {
    return "59";
  }
  return digits;
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
    },
    formCard: {
      padding: 20,
      gap: 16,
    },
    formHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
    },
    formIcon: {
      width: 46,
      height: 46,
      borderRadius: 18,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.colors.successSurface,
    },
    formText: {
      flex: 1,
    },
    formTitle: {
      ...theme.typography.title,
      color: theme.colors.text,
    },
    formSubtitle: {
      ...theme.typography.bodySmall,
      color: theme.colors.textMuted,
      marginTop: 2,
    },
    timeRow: {
      flexDirection: "row",
      gap: 12,
    },
    timeField: {
      flex: 1,
    },
  });
}
