import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { getSetting, setSetting } from "../storage/database";

const CHANNEL_ID = "plant-care-reminders";
const SCHEDULED_REMINDERS_KEY = "scheduledNotificationReminders";
const DAILY_WATER_REMINDER_TIME_KEY = "dailyWaterReminderTime";
const DAILY_WATER_REMINDER_ID = "daily-water-plants";

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
