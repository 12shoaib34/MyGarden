import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { AlarmClock, Bell, Clock, FileText, Plus, Trash2 } from "lucide-react-native";
import { AppHeader, HeaderActionButton } from "../components/AppHeader";
import { useAppDialog } from "../components/AppDialog";
import { Card } from "../components/Card";
import { useGetSafeAreaInsets } from "../hooks/getSafeAreaInsets";
import { withHaptic } from "../services/hapticService";
import { cancelNoteReminderNotification } from "../services/notificationService";
import { deleteNote, listNotes } from "../storage/database";
import { useTheme } from "../theme/ThemeProvider";

export function NotesScreen({ onAddNote }) {
  const { theme } = useTheme();
  const { showConfirm, showDialog } = useAppDialog();
  const insets = useGetSafeAreaInsets();
  const themedStyles = useMemo(() => createStyles(theme, insets), [theme, insets]);
  const [notes, setNotes] = useState([]);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    let alive = true;

    listNotes().then((savedNotes) => {
      if (alive) {
        setNotes(savedNotes);
      }
    });

    return () => {
      alive = false;
    };
  }, []);

  async function confirmDelete(note) {
    const confirmed = await showConfirm({
      title: "Delete note?",
      message: `${note.title} will be removed and its reminder will be cancelled.`,
      confirmLabel: "Delete",
      destructive: true,
    });

    if (!confirmed) {
      return;
    }

    setDeletingId(note.id);
    try {
      await cancelNoteReminderNotification(note.notification_identifier);
      await deleteNote(note.id);
      setNotes((currentNotes) => currentNotes.filter((item) => item.id !== note.id));
    } catch (error) {
      await showDialog({
        title: "Delete failed",
        message: error.message,
        variant: "error",
      });
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <View style={themedStyles.screen}>
      <AppHeader
        icon={FileText}
        title="Notes"
        subtitle={notes.length ? `${notes.length} reminders saved locally` : "All note reminders"}
      >
        <HeaderActionButton
          onPress={onAddNote}
          accessibilityLabel="Add note"
          variant="primary"
        >
          <Plus size={20} color={theme.colors.onPrimary} />
        </HeaderActionButton>
      </AppHeader>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={themedStyles.scroll}
      >
        <View style={themedStyles.summaryBand}>
          <View style={themedStyles.summaryIcon}>
            <Bell size={18} color={theme.colors.primary} />
          </View>
          <View style={themedStyles.summaryText}>
            <Text style={themedStyles.summaryTitle}>Reminder Notes</Text>
          </View>
        </View>

        <View style={themedStyles.list}>
          {notes.length ? (
            notes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                deleting={deletingId === note.id}
                onDelete={() => confirmDelete(note)}
              />
            ))
          ) : (
            <Card style={themedStyles.emptyCard}>
              <View style={themedStyles.emptyIcon}>
                <FileText size={28} color={theme.colors.primary} />
              </View>
              <Text style={themedStyles.emptyTitle}>No notes yet</Text>
              <Text style={themedStyles.emptyBody}>
                Tap the plus button to add a note title, description, and reminder time.
              </Text>
            </Card>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

export function NoteCard({ note, now = Date.now(), deleting, onDelete }) {
  const { theme } = useTheme();
  const insets = useGetSafeAreaInsets();
  const themedStyles = useMemo(() => createStyles(theme, insets), [theme, insets]);
  const timing = getNoteTimingState(note, now);
  const iconColor = timing.inactive ? theme.colors.textMuted : theme.colors.primary;

  return (
    <Card style={[themedStyles.noteCard, timing.inactive && themedStyles.noteCardInactive]}>
      <View style={themedStyles.noteHeader}>
        <View style={[themedStyles.noteIcon, timing.inactive && themedStyles.noteIconInactive]}>
          <Clock size={20} color={iconColor} />
        </View>
        <View style={themedStyles.noteText}>
          <View style={themedStyles.noteTitleRow}>
            <Text style={[themedStyles.noteTitle, timing.inactive && themedStyles.noteTitleInactive]}>
              {note.title}
            </Text>
            <View
              style={[
                themedStyles.statusBadge,
                timing.inactive && themedStyles.statusBadgeInactive,
              ]}
            >
              <Text
                style={[
                  themedStyles.statusText,
                  timing.inactive && themedStyles.statusTextInactive,
                ]}
              >
                {timing.inactive ? "Inactive" : "Active"}
              </Text>
            </View>
          </View>
          {note.description ? (
            <Text style={themedStyles.noteDescription}>{note.description}</Text>
          ) : null}
        </View>
        {onDelete ? (
          <Pressable
            onPress={withHaptic(onDelete, "reject")}
            disabled={deleting}
            accessibilityRole="button"
            accessibilityLabel="Delete note"
            style={({ pressed }) => [
              themedStyles.deleteButton,
              { opacity: deleting ? 0.45 : pressed ? 0.72 : 1 },
            ]}
          >
            <Trash2 size={18} color={theme.colors.error} />
          </Pressable>
        ) : null}
      </View>
      <View style={themedStyles.noteFooter}>
        <View
          style={[
            themedStyles.reminderPill,
            timing.inactive && themedStyles.reminderPillInactive,
          ]}
        >
          <AlarmClock size={15} color={iconColor} />
          <Text
            style={[
              themedStyles.reminderPillText,
              timing.inactive && themedStyles.reminderPillTextInactive,
            ]}
          >
            {formatDuration(note.reminder_hours, note.reminder_minutes)}
          </Text>
        </View>
        <View style={themedStyles.dueBlock}>
          <Text style={themedStyles.dueLabel}>Reminder</Text>
          <Text style={themedStyles.dueTime}>{formatReminderDate(note.reminder_at)}</Text>
        </View>
      </View>
    </Card>
  );
}

export function formatDuration(hours, minutes) {
  const safeHours = Number(hours) || 0;
  const safeMinutes = Number(minutes) || 0;
  const parts = [];

  if (safeHours) {
    parts.push(`${safeHours} hr`);
  }
  if (safeMinutes) {
    parts.push(`${String(safeMinutes).padStart(2, "0")} min`);
  }

  return parts.join(" ") || "0 min";
}

export function formatReminderDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getNoteTimingState(note, now = Date.now()) {
  const createdAt = new Date(note.created_at).getTime();
  const reminderAt = new Date(note.reminder_at).getTime();
  const safeCreatedAt = Number.isFinite(createdAt) ? createdAt : now;
  const safeReminderAt = Number.isFinite(reminderAt)
    ? reminderAt
    : safeCreatedAt + getReminderDurationMs(note);
  const totalMs = Math.max(safeReminderAt - safeCreatedAt, 1);
  const elapsedMs = Math.max(Math.min(now - safeCreatedAt, totalMs), 0);
  const remainingMs = Math.max(safeReminderAt - now, 0);
  const inactive = remainingMs <= 0;

  return {
    inactive,
    remainingLabel: inactive ? "Reminder inactive" : `${formatRemainingTime(remainingMs)} left`,
  };
}

function getReminderDurationMs(note) {
  return (
    (Number(note.reminder_hours) || 0) * 60 * 60 * 1000 +
    (Number(note.reminder_minutes) || 0) * 60 * 1000
  );
}

function formatRemainingTime(ms) {
  const totalSeconds = Math.max(Math.ceil(ms / 1000), 1);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (days) {
    return `${days}d ${hours}h`;
  }
  if (hours) {
    return `${hours}h ${minutes}m`;
  }
  if (minutes) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
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
      paddingBottom: Math.max(insets.bottom, 24) + 124,
      gap: 18,
    },
    summaryBand: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 22,
      backgroundColor: theme.colors.surface,
      padding: 13,
    },
    summaryIcon: {
      width: 40,
      height: 40,
      borderRadius: 15,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.colors.successSurface,
    },
    summaryText: {
      flex: 1,
    },
    summaryTitle: {
      ...theme.typography.label,
      color: theme.colors.text,
    },
    list: {
      gap: 12,
    },
    noteCard: {
      padding: 16,
      gap: 12,
    },
    noteHeader: {
      flexDirection: "row",
      gap: 12,
      alignItems: "flex-start",
    },
    noteIcon: {
      width: 36,
      height: 36,
      borderRadius: 13,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.colors.successSurface,
    },
    noteText: {
      flex: 1,
      gap: 3,
    },
    noteCardInactive: {
      opacity: 0.78,
    },
    noteIconInactive: {
      backgroundColor: theme.colors.surfaceSoft,
    },
    noteTitleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    noteTitle: {
      ...theme.typography.label,
      color: theme.colors.text,
      fontSize: 16,
      lineHeight: 20,
      flex: 1,
    },
    noteTitleInactive: {
      color: theme.colors.textMuted,
    },
    noteDescription: {
      ...theme.typography.bodySmall,
      color: theme.colors.textMuted,
      lineHeight: 19,
    },
    statusBadge: {
      borderRadius: 999,
      paddingHorizontal: 8,
      paddingVertical: 3,
      backgroundColor: theme.colors.successSurface,
    },
    statusBadgeInactive: {
      backgroundColor: theme.colors.surfaceSoft,
    },
    statusText: {
      ...theme.typography.label,
      color: theme.colors.primary,
      fontSize: 10,
      lineHeight: 12,
    },
    statusTextInactive: {
      color: theme.colors.textMuted,
    },
    deleteButton: {
      width: 36,
      height: 36,
      borderRadius: 13,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.colors.errorSurface,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    noteFooter: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      gap: 12,
      flexWrap: "wrap",
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.colors.border,
      paddingTop: 10,
    },
    noteMeta: {
      ...theme.typography.label,
      color: theme.colors.textMuted,
    },
    reminderPill: {
      minHeight: 30,
      borderRadius: 999,
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 10,
      backgroundColor: theme.colors.successSurface,
    },
    reminderPillInactive: {
      backgroundColor: theme.colors.surfaceSoft,
    },
    reminderPillText: {
      ...theme.typography.label,
      color: theme.colors.primary,
      fontSize: 12,
      lineHeight: 15,
    },
    reminderPillTextInactive: {
      color: theme.colors.textMuted,
    },
    dueBlock: {
      alignItems: "flex-end",
      gap: 1,
    },
    dueLabel: {
      ...theme.typography.bodySmall,
      color: theme.colors.textMuted,
      fontSize: 11,
      lineHeight: 14,
    },
    dueTime: {
      ...theme.typography.label,
      color: theme.colors.text,
      fontSize: 13,
      lineHeight: 16,
    },
    emptyCard: {
      padding: 22,
      alignItems: "center",
      gap: 10,
    },
    emptyIcon: {
      width: 54,
      height: 54,
      borderRadius: 20,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.colors.successSurface,
    },
    emptyTitle: {
      ...theme.typography.title,
      color: theme.colors.text,
      textAlign: "center",
    },
    emptyBody: {
      ...theme.typography.body,
      color: theme.colors.textMuted,
      textAlign: "center",
    },
  });
}
