import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { getSetting, setSetting } from "../storage/database";

const CHANNEL_ID = "plant-care-reminders";
const SCHEDULED_REMINDERS_KEY = "scheduledNotificationReminders";

export const notificationReminderConfigs = [
  {
    id: "daily-water-plants",
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
    scheduled[reminder.id] = await scheduleDailyReminder(reminder);
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
