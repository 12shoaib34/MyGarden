import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  AlarmClock,
  ArrowLeft,
  Bell,
  CalendarClock,
  Check,
  CheckCircle2,
  Clock3,
  Droplets,
  History,
  Leaf,
  RotateCcw,
  Sprout,
  X,
} from "lucide-react-native";
import { AppHeader, HeaderActionButton } from "../components/AppHeader";
import { useAppDialog } from "../components/AppDialog";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import {
  fertilizerSchedule,
  getFertilizerMonthKey,
  getFertilizerMonthLabel,
  getFertilizerTaskDueDate,
} from "../data/fertilizerSchedule";
import { useGetSafeAreaInsets } from "../hooks/getSafeAreaInsets";
import { withHaptic } from "../services/hapticService";
import {
  cancelFertilizerTaskReminderNotification,
  getFertilizerReminderTime,
  scheduleFertilizerTaskReminderNotification,
} from "../services/notificationService";
import {
  listFertilizerHistory,
  listFertilizerTaskStates,
  updateFertilizerTaskNotificationIdentifier,
  upsertFertilizerTaskState,
} from "../storage/database";
import { useTheme } from "../theme/ThemeProvider";

const totalTasks = fertilizerSchedule.length;

export function FertilizerTimelineScreen({ onBack }) {
  const { theme } = useTheme();
  const { showDialog } = useAppDialog();
  const insets = useGetSafeAreaInsets();
  const styles = createStyles(theme, insets);
  const [now, setNow] = useState(Date.now());
  const [taskStates, setTaskStates] = useState({});
  const [history, setHistory] = useState([]);
  const [reminderTime, setReminderTime] = useState({ hour: 9, minute: 0 });
  const monthKey = getFertilizerMonthKey(new Date(now));

  const loadTimeline = useCallback(async () => {
    const [stateRows, historyRows] = await Promise.all([
      listFertilizerTaskStates(monthKey),
      listFertilizerHistory(8),
    ]);
    setTaskStates(indexTaskStates(stateRows));
    setHistory(historyRows.filter((row) => row.month_key !== monthKey));
  }, [monthKey]);

  useEffect(() => {
    loadTimeline();
  }, [loadTimeline]);

  useEffect(() => {
    getFertilizerReminderTime().then(setReminderTime);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const tasks = useMemo(
    () =>
      fertilizerSchedule.map((task) =>
        hydrateTask(task, taskStates[task.id], monthKey, now, reminderTime)
      ),
    [monthKey, now, reminderTime, taskStates]
  );
  const completedCount = tasks.filter((task) => task.status === "completed").length;
  const resolvedCount = tasks.filter(
    (task) => task.status === "completed" || task.status === "skipped"
  ).length;
  const progress = Math.round((completedCount / totalTasks) * 100);
  const upcomingTask =
    tasks.find((task) => task.status === "pending" && task.dueDate.getTime() >= now) ??
    tasks.find((task) => task.status === "pending");

  async function setTaskStatus(task, status) {
    if (task.notificationIdentifier) {
      await cancelFertilizerTaskReminderNotification(task.notificationIdentifier);
    }
    await upsertFertilizerTaskState(monthKey, task.id, {
      status,
      notificationIdentifier: null,
      completedAt:
        status === "completed" || status === "skipped"
          ? new Date().toISOString()
          : null,
    });
    await loadTimeline();
  }

  async function toggleReminder(task) {
    if (task.notificationIdentifier) {
      await cancelFertilizerTaskReminderNotification(task.notificationIdentifier);
      await updateFertilizerTaskNotificationIdentifier(monthKey, task.id, null);
      await loadTimeline();
      return;
    }

    const reminderDueDate = getNextReminderDueDate(task, now);

    const result = await scheduleFertilizerTaskReminderNotification({
      monthKey,
      taskId: task.id,
      title: task.title,
      body: `Day ${task.day}: ${task.type}`,
      dueAt: reminderDueDate.toISOString(),
      notificationIdentifier: task.notificationIdentifier,
    });

    if (!result.ok) {
      if (result.reason === "permission-denied") {
        await showDialog({
          title: "Notification permission needed",
          message: "Allow notifications to turn on fertilizer reminders.",
          variant: "warning",
        });
      }
      return;
    }

    await updateFertilizerTaskNotificationIdentifier(monthKey, task.id, result.identifier);
    await loadTimeline();
  }

  async function resetCurrentMonth() {
    await Promise.all(
      tasks.map(async (task) => {
        if (task.notificationIdentifier) {
          await cancelFertilizerTaskReminderNotification(task.notificationIdentifier);
        }
        await upsertFertilizerTaskState(monthKey, task.id, {
          status: "pending",
          notificationIdentifier: null,
          completedAt: null,
        });
      })
    );
    await loadTimeline();
  }

  return (
    <View style={styles.screen}>
      <AppHeader
        icon={CalendarClock}
        title="Fertilizer Timeline"
        subtitle={getFertilizerMonthLabel(monthKey)}
      >
        <HeaderActionButton onPress={onBack} accessibilityLabel="Back">
          <ArrowLeft size={20} color={theme.colors.text} />
        </HeaderActionButton>
      </AppHeader>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Card style={styles.summaryCard}>
          <View style={styles.summaryTop}>
            <View style={styles.summaryIcon}>
              <Sprout size={28} color={theme.colors.primary} />
            </View>
            <View style={styles.summaryText}>
              <Text style={styles.summaryTitle}>{progress}% complete</Text>
              <Text style={styles.summarySubtitle}>
                {completedCount} completed, {resolvedCount - completedCount} skipped, {totalTasks - resolvedCount} pending
              </Text>
            </View>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
          <View style={styles.upcomingBox}>
            <Clock3 size={18} color={theme.colors.primary} />
            <View style={styles.upcomingText}>
              <Text style={styles.upcomingLabel}>Upcoming</Text>
              <Text style={styles.upcomingTitle}>
                {upcomingTask ? `Day ${upcomingTask.day}: ${upcomingTask.title}` : "All tasks resolved"}
              </Text>
              <Text style={styles.upcomingMeta}>
                {upcomingTask ? upcomingTask.countdownLabel : "Monthly routine is complete."}
              </Text>
            </View>
          </View>
          <Button
            title="Reset Current Month"
            variant="secondary"
            Icon={RotateCcw}
            onPress={resetCurrentMonth}
          />
        </Card>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Monthly Schedule</Text>
          <Text style={styles.sectionMeta}>Auto resets next month</Text>
        </View>

        <View style={styles.timeline}>
          {tasks.map((task) => (
            <TimelineTaskCard
              key={task.id}
              task={task}
              onComplete={() => setTaskStatus(task, task.status === "completed" ? "pending" : "completed")}
              onSkip={() => setTaskStatus(task, task.status === "skipped" ? "pending" : "skipped")}
              onToggleReminder={() => toggleReminder(task)}
            />
          ))}
        </View>

        <HistorySection history={history} />
      </ScrollView>
    </View>
  );
}

function TimelineTaskCard({
  task,
  onComplete,
  onSkip,
  onToggleReminder,
}) {
  const { theme } = useTheme();
  const styles = createStyles(theme, useGetSafeAreaInsets());
  const Icon = getTaskIcon(task.icon);

  return (
    <Card style={[styles.taskCard, task.status === "completed" && styles.taskCardDone]}>
      <View style={styles.taskHeader}>
        <View style={styles.taskIcon}>
          <Icon size={20} color={theme.colors.primary} />
        </View>
        <View style={styles.taskText}>
          <Text style={styles.taskDay}>Day {task.day}</Text>
          <Text
            style={styles.taskTitle}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.82}
          >
            {task.title}
          </Text>
          <Text style={styles.taskType}>{task.type}</Text>
        </View>
      </View>

      {task.items.length ? (
        <View style={styles.itemList}>
          {task.items.map((item) => (
            <View key={item} style={styles.itemRow}>
              <Leaf size={14} color={theme.colors.primary} />
              <Text style={styles.itemText}>{item}</Text>
            </View>
          ))}
        </View>
      ) : null}

      <View style={styles.metaRow}>
        <AlarmClock size={16} color={theme.colors.textMuted} />
        <Text style={styles.metaText}>{task.countdownLabel}</Text>
      </View>

      <View style={styles.actions}>
        <ActionPill
          label={task.status === "completed" ? "Completed" : "Complete"}
          selected={task.status === "completed"}
          Icon={Check}
          onPress={onComplete}
        />
        <ActionPill
          label={task.status === "skipped" ? "Skipped" : "Skip"}
          selected={task.status === "skipped"}
          Icon={X}
          onPress={onSkip}
        />
        <ActionPill
          label={task.notificationIdentifier ? "Reminder On" : "Reminder"}
          selected={Boolean(task.notificationIdentifier)}
          Icon={Bell}
          onPress={onToggleReminder}
        />
      </View>
    </Card>
  );
}

function ActionPill({ label, selected, Icon, onPress, disabled = false }) {
  const { theme } = useTheme();
  const styles = createStyles(theme, useGetSafeAreaInsets());
  const iconColor = selected
    ? theme.colors.onPrimary
    : disabled
      ? theme.colors.textMuted
      : theme.colors.primary;

  return (
    <Pressable
      onPress={disabled ? undefined : withHaptic(onPress)}
      accessibilityRole="button"
      disabled={disabled}
      style={({ pressed }) => [
        styles.actionPill,
        selected && styles.actionPillSelected,
        disabled && styles.actionPillDisabled,
        { opacity: pressed ? 0.72 : 1 },
      ]}
    >
      <Icon size={15} color={iconColor} />
      <Text
        style={[
          styles.actionText,
          selected && styles.actionTextSelected,
          disabled && styles.actionTextDisabled,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function HistorySection({ history }) {
  const { theme } = useTheme();
  const styles = createStyles(theme, useGetSafeAreaInsets());

  return (
    <View style={styles.historySection}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>History</Text>
        <History size={18} color={theme.colors.textMuted} />
      </View>
      {history.length ? (
        history.map((row) => (
          <Card key={row.month_key} style={styles.historyCard}>
            <Text style={styles.historyTitle}>{getFertilizerMonthLabel(row.month_key)}</Text>
            <Text style={styles.historyMeta}>
              {row.completed_count ?? 0} completed, {row.skipped_count ?? 0} skipped
            </Text>
          </Card>
        ))
      ) : (
        <Card style={styles.historyCard}>
          <Text style={styles.historyTitle}>No previous months yet</Text>
          <Text style={styles.historyMeta}>Completed routines will stay here after month end.</Text>
        </Card>
      )}
    </View>
  );
}

function hydrateTask(task, state, monthKey, now, reminderTime) {
  const dueDate = getFertilizerTaskDueDate(
    monthKey,
    task.day,
    reminderTime.hour,
    reminderTime.minute
  );
  const status = state?.status || "pending";
  const isOverdue =
    status === "pending" && dueDate.getTime() + 24 * 60 * 60 * 1000 - 1 < now;

  return {
    ...task,
    status,
    monthKey,
    notificationIdentifier: state?.notification_identifier || null,
    dueDate,
    isOverdue,
    countdownLabel: getCountdownLabel(dueDate, now, isOverdue, status),
  };
}

function indexTaskStates(rows) {
  return rows.reduce((indexed, row) => {
    indexed[row.task_id] = row;
    return indexed;
  }, {});
}

function getCountdownLabel(dueDate, now, isOverdue, status) {
  if (status === "completed") {
    return "Marked completed";
  }
  if (status === "skipped") {
    return "Skipped for this month";
  }
  const diffMs = dueDate.getTime() - now;
  if (isOverdue) {
    return "Overdue";
  }
  if (diffMs <= 0) {
    return "Due today";
  }
  const days = Math.ceil(diffMs / (24 * 60 * 60 * 1000));
  return days === 1 ? "Due tomorrow" : `Due in ${days} days`;
}

function getNextReminderDueDate(task, now) {
  if (task.dueDate.getTime() > now) {
    return task.dueDate;
  }

  const currentDueDate = task.dueDate;
  return new Date(
    currentDueDate.getFullYear(),
    currentDueDate.getMonth() + 1,
    task.day,
    currentDueDate.getHours(),
    currentDueDate.getMinutes(),
    0,
    0
  );
}

function getTaskIcon(icon) {
  switch (icon) {
    case "drench":
      return Droplets;
    case "tea":
      return CalendarClock;
    case "foliar":
      return Leaf;
    case "humic":
      return CheckCircle2;
    default:
      return Sprout;
  }
}

function createStyles(theme, insets) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scroll: {
      paddingHorizontal: 18,
      paddingTop: 18,
      paddingBottom: Math.max(insets.bottom, 24) + 28,
      gap: 18,
    },
    summaryCard: {
      padding: 18,
      gap: 16,
    },
    summaryTop: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    summaryIcon: {
      width: 54,
      height: 54,
      borderRadius: 18,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.colors.successSurface,
    },
    summaryText: {
      flex: 1,
      gap: 2,
    },
    summaryTitle: {
      ...theme.typography.headline,
      color: theme.colors.text,
    },
    summarySubtitle: {
      ...theme.typography.bodySmall,
      color: theme.colors.textMuted,
    },
    progressTrack: {
      height: 10,
      borderRadius: 999,
      overflow: "hidden",
      backgroundColor: theme.colors.surfaceHigh,
    },
    progressFill: {
      height: "100%",
      borderRadius: 999,
      backgroundColor: theme.colors.primary,
    },
    upcomingBox: {
      borderRadius: 18,
      backgroundColor: theme.colors.surfaceSoft,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
      padding: 14,
      flexDirection: "row",
      gap: 10,
    },
    upcomingText: {
      flex: 1,
      gap: 2,
    },
    upcomingLabel: {
      ...theme.typography.label,
      color: theme.colors.primary,
    },
    upcomingTitle: {
      ...theme.typography.label,
      fontSize: 15,
      color: theme.colors.text,
    },
    upcomingMeta: {
      ...theme.typography.bodySmall,
      color: theme.colors.textMuted,
    },
    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
    },
    sectionTitle: {
      ...theme.typography.title,
      color: theme.colors.text,
    },
    sectionMeta: {
      ...theme.typography.label,
      color: theme.colors.textMuted,
    },
    timeline: {
      gap: 12,
    },
    taskCard: {
      padding: 14,
      gap: 12,
    },
    taskCardDone: {
      backgroundColor: theme.colors.successSurface,
      borderColor: theme.colors.border,
    },
    taskHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    taskIcon: {
      width: 34,
      height: 34,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.colors.fertilizerSurface ?? theme.colors.surfaceSoft,
    },
    taskText: {
      flex: 1,
      minWidth: 0,
      gap: 1,
    },
    taskDay: {
      ...theme.typography.label,
      color: theme.colors.primary,
    },
    taskTitle: {
      ...theme.typography.title,
      fontSize: 17,
      lineHeight: 22,
      color: theme.colors.text,
    },
    taskType: {
      ...theme.typography.bodySmall,
      color: theme.colors.textMuted,
    },
    itemList: {
      gap: 7,
    },
    itemRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    itemText: {
      ...theme.typography.bodySmall,
      fontSize: 13,
      lineHeight: 18,
      color: theme.colors.textMuted,
      flex: 1,
    },
    metaRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    metaText: {
      ...theme.typography.label,
      color: theme.colors.textMuted,
    },
    actions: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 7,
    },
    actionPill: {
      minHeight: 34,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surfaceSoft,
      paddingHorizontal: 10,
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    actionPillSelected: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primary,
    },
    actionPillDisabled: {
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
    actionText: {
      ...theme.typography.label,
      color: theme.colors.primary,
    },
    actionTextSelected: {
      color: theme.colors.onPrimary,
    },
    actionTextDisabled: {
      color: theme.colors.textMuted,
    },
    historySection: {
      gap: 12,
    },
    historyCard: {
      minHeight: 72,
      padding: 16,
      gap: 4,
    },
    historyTitle: {
      ...theme.typography.label,
      fontSize: 15,
      color: theme.colors.text,
    },
    historyMeta: {
      ...theme.typography.bodySmall,
      color: theme.colors.textMuted,
    },
  });
}
