import { Platform } from "react-native";
import * as Haptics from "expo-haptics";
import { getSetting, setSetting } from "../storage/database";

const HAPTICS_ENABLED_KEY = "hapticsEnabled";

let hapticsEnabledCache = true;
let hapticsLoaded = false;

export async function getHapticsEnabled() {
  if (hapticsLoaded) {
    return hapticsEnabledCache;
  }

  const savedValue = await getSetting(HAPTICS_ENABLED_KEY, "true");
  hapticsEnabledCache = savedValue !== "false";
  hapticsLoaded = true;
  return hapticsEnabledCache;
}

export async function setHapticsEnabled(enabled) {
  hapticsEnabledCache = Boolean(enabled);
  hapticsLoaded = true;
  await setSetting(HAPTICS_ENABLED_KEY, enabled ? "true" : "false");

  if (enabled) {
    triggerHaptic("toggleOn");
  }
}

export function triggerHaptic(type = "tap") {
  if (!hapticsEnabledCache) {
    return;
  }

  runHaptic(type).catch(() => {
    // Haptics are optional feedback and should never block the UI.
  });
}

export function withHaptic(onPress, type = "tap") {
  return (...args) => {
    triggerHaptic(type);
    return onPress?.(...args);
  };
}

async function runHaptic(type) {
  if (Platform.OS === "android") {
    const androidType =
      type === "toggleOn"
        ? Haptics.AndroidHaptics.Toggle_On
        : type === "toggleOff"
        ? Haptics.AndroidHaptics.Toggle_Off
        : type === "confirm"
        ? Haptics.AndroidHaptics.Confirm
        : type === "reject"
        ? Haptics.AndroidHaptics.Reject
        : Haptics.AndroidHaptics.Virtual_Key;

    await Haptics.performAndroidHapticsAsync(androidType);
    return;
  }

  if (type === "confirm") {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    return;
  }

  if (type === "reject") {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    return;
  }

  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}
