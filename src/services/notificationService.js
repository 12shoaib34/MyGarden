import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { getSetting, setSetting } from "../storage/database";

const CHANNEL_ID = "plant-care-reminders";
const NOTES_CHANNEL_ID = "note-reminders";
const FERTILIZER_CHANNEL_ID = "fertilizer-reminders";
const SCHEDULED_REMINDERS_KEY = "scheduledNotificationReminders";
const DAILY_WATER_REMINDER_TIME_KEY = "dailyWaterReminderTime";
const FERTILIZER_REMINDER_TIME_KEY = "fertilizerReminderTime";
const DAILY_WATER_REMINDER_ID = "daily-water-plants";
const DEFAULT_FERTILIZER_REMINDER_TIME = { hour: 9, minute: 0 };

export const notificationReminderConfigs = [
  {
    id: DAILY_WATER_REMINDER_ID,
    title: "Water plants reminder",
    body: "Check your garden and water the plants that need care.",
    hour: 16,
    minute: 0,
  },
];

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function initializeNotifications() {
  await configureAndroidNotificationChannel();

  const permissionGranted = await ensureNotificationPermission();
  if (!permissionGranted) {
    await setSetting("notificationsEnabled", "false");
    return { ok: false, reason: "permission-denied" };
  }

  const scheduled = {};

  for (const reminder of notificationReminderConfigs) {
    scheduled[reminder.id] = await scheduleDailyReminder(await hydrateReminderTime(reminder));
  }

  await setSetting("notificationsEnabled", "true");
  await setSetting(SCHEDULED_REMINDERS_KEY, JSON.stringify(scheduled));

  return { ok: true, scheduled };
}

export async function sendTestWaterReminderNotification() {
  await configureAndroidNotificationChannel();

  const permissionGranted = await ensureNotificationPermission();
  if (!permissionGranted) {
    return { ok: false, reason: "permission-denied" };
  }

  const identifier = await Notifications.scheduleNotificationAsync({
    content: {
      title: "Water plants reminder",
      body: "Test reminder: check your plants and water the ones that need care.",
      data: {
        reminderId: "test-water-plants",
        reminderType: "plant-care-test",
      },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 2,
    },
  });

  return { ok: true, identifier };
}

export async function sendTestFertilizerReminderNotification() {
  await configureAndroidNotificationChannel();

  const permissionGranted = await ensureNotificationPermission();
  if (!permissionGranted) {
    return { ok: false, reason: "permission-denied" };
  }

  const identifier = await Notifications.scheduleNotificationAsync({
    content: {
      title: "Fertilizer reminder",
      body: "Test reminder: check your fertilizer timeline.",
      data: {
        reminderId: "test-fertilizer-timeline",
        reminderType: "fertilizer-test",
        url: "/fertilizer-timeline",
      },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 2,
      channelId: FERTILIZER_CHANNEL_ID,
    },
  });

  return { ok: true, identifier };
}

export async function scheduleNoteReminderNotification(note) {
  await configureAndroidNotificationChannel();

  const permissionGranted = await ensureNotificationPermission();
  if (!permissionGranted) {
    return { ok: false, reason: "permission-denied" };
  }

  const seconds =
    Math.max(Number(note.reminderHours) || 0, 0) * 60 * 60 +
    Math.max(Number(note.reminderMinutes) || 0, 0) * 60;

  if (seconds <= 0) {
    return { ok: false, reason: "invalid-time" };
  }

  const identifier = await Notifications.scheduleNotificationAsync({
    content: {
      title: note.title,
      body: note.description || "Note reminder",
      data: {
        noteId: note.id,
        reminderType: "note",
      },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds,
      channelId: NOTES_CHANNEL_ID,
    },
  });

  return { ok: true, identifier };
}

export async function cancelNoteReminderNotification(identifier) {
  if (!identifier) {
    return;
  }

  try {
    await Notifications.cancelScheduledNotificationAsync(identifier);
  } catch {
    // The note can still be deleted if Android already fired or removed it.
  }
}

export async function scheduleFertilizerTaskReminderNotification(task) {
  await configureAndroidNotificationChannel();

  const permissionGranted = await ensureNotificationPermission();
  if (!permissionGranted) {
    return { ok: false, reason: "permission-denied" };
  }

  const dueTime = new Date(task.dueAt).getTime();
  const seconds = Math.ceil((dueTime - Date.now()) / 1000);

  if (!Number.isFinite(dueTime) || seconds <= 0) {
    return { ok: false, reason: "past-due" };
  }

  if (task.notificationIdentifier) {
    await cancelFertilizerTaskReminderNotification(task.notificationIdentifier);
  }

  const identifier = await Notifications.scheduleNotificationAsync({
    content: {
      title: task.title,
      body: task.body || "Fertilizer task reminder",
      data: {
        monthKey: task.monthKey,
        taskId: task.taskId,
        reminderType: "fertilizer",
        url: "/fertilizer-timeline",
      },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds,
      channelId: FERTILIZER_CHANNEL_ID,
    },
  });

  return { ok: true, identifier };
}

export async function cancelFertilizerTaskReminderNotification(identifier) {
  if (!identifier) {
    return;
  }

  try {
    await Notifications.cancelScheduledNotificationAsync(identifier);
  } catch {
    // The task state can still update if Android already fired or removed it.
  }
}

export async function getDailyWaterReminderTime() {
  const defaultReminder = notificationReminderConfigs.find(
    (reminder) => reminder.id === DAILY_WATER_REMINDER_ID
  );
  const fallback = `${String(defaultReminder.hour).padStart(2, "0")}:${String(
    defaultReminder.minute
  ).padStart(2, "0")}`;
  const savedValue = await getSetting(DAILY_WATER_REMINDER_TIME_KEY, fallback);
  const [hourValue, minuteValue] = String(savedValue).split(":");
  const hour = Number(hourValue);
  const minute = Number(minuteValue);

  if (!Number.isInteger(hour) || !Number.isInteger(minute)) {
    return { hour: defaultReminder.hour, minute: defaultReminder.minute };
  }

  return {
    hour: Math.min(Math.max(hour, 0), 23),
    minute: Math.min(Math.max(minute, 0), 59),
  };
}

export async function getFertilizerReminderTime() {
  return getStoredReminderTime(
    FERTILIZER_REMINDER_TIME_KEY,
    DEFAULT_FERTILIZER_REMINDER_TIME
  );
}

export async function updateDailyWaterReminderTime(hour, minute) {
  const normalizedHour = Math.min(Math.max(Number(hour) || 0, 0), 23);
  const normalizedMinute = Math.min(Math.max(Number(minute) || 0, 0), 59);
  const reminder = notificationReminderConfigs.find(
    (item) => item.id === DAILY_WATER_REMINDER_ID
  );

  await setSetting(
    DAILY_WATER_REMINDER_TIME_KEY,
    `${String(normalizedHour).padStart(2, "0")}:${String(normalizedMinute).padStart(2, "0")}`
  );
  await configureAndroidNotificationChannel();

  const permissionGranted = await ensureNotificationPermission();
  if (!permissionGranted) {
    await setSetting("notificationsEnabled", "false");
    return { ok: false, reason: "permission-denied" };
  }

  const identifier = await scheduleDailyReminder({
    ...reminder,
    hour: normalizedHour,
    minute: normalizedMinute,
  });
  await setSetting("notificationsEnabled", "true");
  await setSetting(
    SCHEDULED_REMINDERS_KEY,
    JSON.stringify({ [DAILY_WATER_REMINDER_ID]: identifier })
  );

  return { ok: true, identifier, hour: normalizedHour, minute: normalizedMinute };
}

export async function updateFertilizerReminderTime(hour, minute) {
  const normalizedTime = normalizeReminderTime(hour, minute);

  await setSetting(
    FERTILIZER_REMINDER_TIME_KEY,
    formatStoredReminderTime(normalizedTime.hour, normalizedTime.minute)
  );
  await configureAndroidNotificationChannel();

  const permissionGranted = await ensureNotificationPermission();
  if (!permissionGranted) {
    await setSetting("notificationsEnabled", "false");
    return { ok: false, reason: "permission-denied", ...normalizedTime };
  }

  await setSetting("notificationsEnabled", "true");
  return { ok: true, ...normalizedTime };
}

async function configureAndroidNotificationChannel() {
  if (Platform.OS !== "android") {
    return;
  }

  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: "Plant care reminders",
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: "#2E7D32",
  });
  await Notifications.setNotificationChannelAsync(NOTES_CHANNEL_ID, {
    name: "Note reminders",
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: "#2E7D32",
  });
  await Notifications.setNotificationChannelAsync(FERTILIZER_CHANNEL_ID, {
    name: "Fertilizer reminders",
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: "#2E7D32",
  });
}

async function getStoredReminderTime(key, fallbackTime) {
  const fallback = formatStoredReminderTime(fallbackTime.hour, fallbackTime.minute);
  const savedValue = await getSetting(key, fallback);
  const [hourValue, minuteValue] = String(savedValue).split(":");
  const hour = Number(hourValue);
  const minute = Number(minuteValue);

  if (!Number.isInteger(hour) || !Number.isInteger(minute)) {
    return fallbackTime;
  }

  return normalizeReminderTime(hour, minute);
}

function normalizeReminderTime(hour, minute) {
  return {
    hour: Math.min(Math.max(Number(hour) || 0, 0), 23),
    minute: Math.min(Math.max(Number(minute) || 0, 0), 59),
  };
}

function formatStoredReminderTime(hour, minute) {
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

async function ensureNotificationPermission() {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) {
    return true;
  }

  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

async function scheduleDailyReminder(reminder) {
  await cancelExistingReminderSchedules(reminder.id);

  return Notifications.scheduleNotificationAsync({
    content: {
      title: reminder.title,
      body: reminder.body,
      data: {
        reminderId: reminder.id,
        reminderType: "plant-care",
      },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: reminder.hour,
      minute: reminder.minute,
      channelId: CHANNEL_ID,
    },
  });
}

async function hydrateReminderTime(reminder) {
  if (reminder.id !== DAILY_WATER_REMINDER_ID) {
    return reminder;
  }
  const time = await getDailyWaterReminderTime();
  return { ...reminder, hour: time.hour, minute: time.minute };
}

async function cancelExistingReminderSchedules(reminderId) {
  const scheduledNotifications =
    await Notifications.getAllScheduledNotificationsAsync();

  await Promise.all(
    scheduledNotifications
      .filter((notification) => notification.content?.data?.reminderId === reminderId)
      .map((notification) =>
        Notifications.cancelScheduledNotificationAsync(notification.identifier)
      )
  );
}
