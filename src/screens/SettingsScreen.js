import { useEffect, useState } from "react";
import { Alert, Image, Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Bell, Camera, Check, Database, Download, FolderOpen, Moon, Palette, Settings, Upload, UserRound } from "lucide-react-native";
import { AppHeader } from "../components/AppHeader";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { TextField } from "../components/TextField";
import { useGetSafeAreaInsets } from "../hooks/getSafeAreaInsets";
import {
  autoExportBackup,
  backupImageIfEnabled,
  chooseBackupFolder,
  exportBackup,
  getBackupFolderUri,
  importLatestBackup,
} from "../services/localBackupService";
import { sendTestWaterReminderNotification } from "../services/notificationService";
import { getSetting, setSetting } from "../storage/database";
import { getThemeFamilyId, getThemeIdForFamilyMode, themeFamilies } from "../theme/themes";
import { useTheme } from "../theme/ThemeProvider";

export function SettingsScreen() {
  const { theme, themeId, setThemeId } = useTheme();
  const insets = useGetSafeAreaInsets();
  const themedStyles = createStyles(theme, insets);
  const selectedFamilyId = getThemeFamilyId(themeId);
  const isDarkMode = theme.mode === "dark";
  const [backupFolderUri, setBackupFolderUri] = useState("");
  const [backupBusy, setBackupBusy] = useState(false);
  const [firstName, setFirstName] = useState("Alex");
  const [lastName, setLastName] = useState("Rivera");
  const [avatarUri, setAvatarUri] = useState("");
  const [profileBusy, setProfileBusy] = useState(false);
  const [notificationBusy, setNotificationBusy] = useState(false);

  useEffect(() => {
    getBackupFolderUri().then(setBackupFolderUri);
    Promise.all([
      getSetting("profileFirstName", "Alex"),
      getSetting("profileLastName", "Rivera"),
      getSetting("profileAvatarUri", ""),
    ]).then(([savedFirstName, savedLastName, savedAvatarUri]) => {
      setFirstName(savedFirstName);
      setLastName(savedLastName);
      setAvatarUri(savedAvatarUri);
    });
  }, []);

  function selectFamily(familyId) {
    setThemeId(getThemeIdForFamilyMode(familyId, theme.mode));
  }

  function toggleDarkMode(nextValue) {
    setThemeId(getThemeIdForFamilyMode(selectedFamilyId, nextValue ? "dark" : "light"));
  }

  async function handleChooseBackupFolder() {
    setBackupBusy(true);
    try {
      const result = await chooseBackupFolder();
      if (result?.uri) {
        setBackupFolderUri(result.uri);
        Alert.alert(
          result.existingBackup ? "Backup found" : "Backup enabled",
          result.existingBackup
            ? "Existing backup found. Press Import Backup to restore it."
            : "Your plants will be backed up to this phone folder."
        );
      }
    } catch (error) {
      Alert.alert("Backup setup failed", error.message);
    } finally {
      setBackupBusy(false);
    }
  }

  async function handleExportBackup() {
    setBackupBusy(true);
    try {
      const result = await exportBackup();
      Alert.alert(result.ok ? "Backup exported" : "Backup not ready", result.ok ? `${result.count} plants saved to backup.` : result.message);
    } catch (error) {
      Alert.alert("Backup failed", error.message);
    } finally {
      setBackupBusy(false);
    }
  }

  async function handleImportBackup() {
    setBackupBusy(true);
    try {
      const result = await importLatestBackup();
      if (result.ok) {
        const [savedFirstName, savedLastName, savedAvatarUri] = await Promise.all([
          getSetting("profileFirstName", "Alex"),
          getSetting("profileLastName", "Rivera"),
          getSetting("profileAvatarUri", ""),
        ]);
        setFirstName(savedFirstName);
        setLastName(savedLastName);
        setAvatarUri(savedAvatarUri);
      }
      Alert.alert(result.ok ? "Backup imported" : "Import not ready", result.ok ? `${result.count} plants imported from backup.` : result.message);
    } catch (error) {
      Alert.alert("Import failed", error.message);
    } finally {
      setBackupBusy(false);
    }
  }

  async function pickProfileImage() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission needed", "Gallery access is needed to choose a profile image.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
      allowsEditing: true,
      aspect: [1, 1],
    });

    if (!result.canceled && result.assets?.[0]?.uri) {
      setAvatarUri(result.assets[0].uri);
    }
  }

  async function saveProfile() {
    setProfileBusy(true);
    try {
      const backedUpAvatarUri = await backupImageIfEnabled(avatarUri);
      await setSetting("profileFirstName", firstName.trim() || "Gardener");
      await setSetting("profileLastName", lastName.trim());
      await setSetting("profileAvatarUri", backedUpAvatarUri);
      setAvatarUri(backedUpAvatarUri);
      await autoExportBackup();
      Alert.alert("Profile saved", "Your profile is saved locally and included in backup.");
    } catch (error) {
      Alert.alert("Profile save failed", error.message);
    } finally {
      setProfileBusy(false);
    }
  }

  async function handleTestNotification() {
    setNotificationBusy(true);
    try {
      const result = await sendTestWaterReminderNotification();
      Alert.alert(
        result.ok ? "Test notification sent" : "Notification permission needed",
        result.ok
          ? "A water plants reminder was sent now."
          : "Allow notifications for MyGarden, then try again."
      );
    } catch (error) {
      Alert.alert("Notification failed", error.message);
    } finally {
      setNotificationBusy(false);
    }
  }

  return (
    <View style={themedStyles.screen}>
      <AppHeader
        icon={Settings}
        title="Settings"
        subtitle="Profile, themes, backup, and reminders"
      />

      <ScrollView contentContainerStyle={themedStyles.scroll}>
        <Card style={themedStyles.settingsCard}>
          <View style={themedStyles.settingsHeader}>
            <UserRound size={22} color={theme.colors.primary} />
            <Text style={themedStyles.settingsTitle}>Profile</Text>
          </View>
          <Pressable style={themedStyles.profileImageBox} onPress={pickProfileImage}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={themedStyles.profileImage} />
            ) : (
              <Camera size={28} color={theme.colors.primary} />
            )}
          </Pressable>
          <TextField
            label="First Name"
            value={firstName}
            onChangeText={setFirstName}
            placeholder="Enter first name"
          />
          <TextField
            label="Last Name"
            value={lastName}
            onChangeText={setLastName}
            placeholder="Enter last name"
          />
          <Button
            title={profileBusy ? "Saving..." : "Save Profile"}
            onPress={saveProfile}
            disabled={profileBusy}
          />
        </Card>

        <Card style={themedStyles.settingsCard}>
        <View style={themedStyles.settingsHeader}>
          <Palette size={22} color={theme.colors.primary} />
          <Text style={themedStyles.settingsTitle}>Theme</Text>
        </View>
        <Text style={themedStyles.cardSubtitle}>
          Select a palette for light and dark mode.
        </Text>
        <View style={themedStyles.themeGrid}>
          {themeFamilies.map((family) => (
            <ThemeFamilyButton
              key={family.id}
              family={family}
              selected={selectedFamilyId === family.id}
              onPress={() => selectFamily(family.id)}
            />
          ))}
        </View>
        <View style={themedStyles.darkModeRow}>
          <View style={themedStyles.darkIcon}>
            <Moon size={18} color={theme.colors.primary} />
          </View>
          <View style={themedStyles.darkText}>
            <Text style={themedStyles.darkTitle}>Dark mode</Text>
            <Text style={themedStyles.darkSubtitle}>
              Uses the selected theme family.
            </Text>
          </View>
          <Switch
            value={isDarkMode}
            onValueChange={toggleDarkMode}
            trackColor={{
              false: theme.colors.surfaceHigh,
              true: theme.colors.secondaryContainer,
            }}
            thumbColor={isDarkMode ? theme.colors.primary : theme.colors.surface}
          />
        </View>
      </Card>
      {/*
      <Card style={themedStyles.settingsCard}>
        <View style={themedStyles.settingsHeader}>
          <Bell size={22} color={theme.colors.primary} />
          <Text style={themedStyles.settingsTitle}>Notifications</Text>
        </View>
        <Text style={themedStyles.pageSubtitle}>
          Daily water plants reminder is scheduled for 4:00 PM on this phone.
        </Text>
        <Button
          title={notificationBusy ? "Sending..." : "Send Test Reminder"}
          variant="secondary"
          onPress={handleTestNotification}
          disabled={notificationBusy}
        />
      </Card>
      */}
      <Card style={themedStyles.settingsCard}>
        <View style={themedStyles.settingsHeader}>
          <Database size={22} color={theme.colors.primary} />
          <Text style={themedStyles.settingsTitle}>Storage</Text>
        </View>
        <Text style={themedStyles.pageSubtitle}>
          User plants are saved with expo-sqlite for fast app use.
        </Text>
        <Text style={themedStyles.pageSubtitle}>
          To survive uninstall, choose a phone folder. MyGarden will keep a
          JSON backup there until you delete it yourself.
        </Text>
        <View style={themedStyles.backupStatus}>
          <FolderOpen size={18} color={theme.colors.primary} />
          <Text style={themedStyles.backupStatusText} numberOfLines={2}>
            {backupFolderUri ? "Backup folder selected" : "No backup folder selected"}
          </Text>
        </View>
        <View style={themedStyles.backupActions}>
          <Button
            title={backupFolderUri ? "Change Folder" : "Create Backup Folder"}
            variant="secondary"
            onPress={handleChooseBackupFolder}
            disabled={backupBusy}
            style={themedStyles.actionButton}
          />
          <Button
            title="Backup Now"
            onPress={handleExportBackup}
            disabled={backupBusy}
            style={themedStyles.actionButton}
          />
        </View>
        <View style={themedStyles.backupActions}>
          <IconNote icon={Upload} text="Auto backup after plant save" />
          <IconNote icon={Download} text="Import after reinstall" />
        </View>
        <Button
          title="Import Backup"
          variant="secondary"
          onPress={handleImportBackup}
          disabled={backupBusy}
        />
      </Card>
      </ScrollView>
    </View>
  );
}

function IconNote({ icon: Icon, text }) {
  const { theme } = useTheme();
  const themedStyles = createStyles(theme, useGetSafeAreaInsets());

  return (
    <View style={themedStyles.iconNote}>
      <Icon size={16} color={theme.colors.primary} />
      <Text style={themedStyles.iconNoteText}>{text}</Text>
    </View>
  );
}

function ThemeFamilyButton({ family, selected, onPress }) {
  const { theme } = useTheme();
  const themedStyles = createStyles(theme, useGetSafeAreaInsets());

  return (
    <Pressable
      style={[
        themedStyles.themeButton,
      ]}
      onPress={onPress}
    >
      <View style={themedStyles.paletteWrap}>
        <View style={themedStyles.paletteCircle}>
          {family.palette.map((color, index) => (
            <View
              key={`${family.id}-${color}-${index}`}
              style={[
                themedStyles.paletteSlice,
                { backgroundColor: color },
              ]}
            />
          ))}
        </View>
        {selected ? (
          <View style={themedStyles.checkCircle}>
            <Check size={13} color={theme.colors.onPrimary} />
          </View>
        ) : null}
      </View>
    </Pressable>
  );
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
      paddingBottom: 132,
    },
    pageTitle: {
      ...theme.typography.headline,
      color: theme.colors.text,
    },
    pageSubtitle: {
      ...theme.typography.body,
      color: theme.colors.textMuted,
      marginTop: 12,
    },
    cardSubtitle: {
      ...theme.typography.bodySmall,
      color: theme.colors.textMuted,
      marginTop: -8,
    },
    settingsCard: {
      padding: 24,
      gap: 18,
      marginTop: 24,
    },
    settingsHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    settingsTitle: {
      ...theme.typography.title,
      color: theme.colors.text,
    },
    profileImageBox: {
      width: 92,
      height: 92,
      borderRadius: 28,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surfaceSoft,
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
    },
    profileImage: {
      width: "100%",
      height: "100%",
    },
    themeGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      columnGap: 10,
      rowGap: 12,
      alignItems: "center",
    },
    themeButton: {
      width: 46,
      height: 46,
      borderRadius: 23,
      alignItems: "center",
      justifyContent: "center",
      overflow: "visible",
    },
    paletteWrap: {
      width: 38,
      height: 38,
      alignItems: "center",
      justifyContent: "center",
      position: "relative",
    },
    paletteCircle: {
      width: 38,
      height: 38,
      borderRadius: 19,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
      flexDirection: "row",
    },
    paletteSlice: {
      flex: 1,
      height: "100%",
    },
    checkCircle: {
      width: 18,
      height: 18,
      borderRadius: 9,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.colors.primary,
      position: "absolute",
      top: -6,
      right: -6,
    },
    darkModeRow: {
      minHeight: 68,
      borderRadius: 22,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surfaceSoft,
      paddingHorizontal: 16,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    darkIcon: {
      width: 38,
      height: 38,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.colors.successSurface,
    },
    darkText: {
      flex: 1,
    },
    darkTitle: {
      ...theme.typography.label,
      color: theme.colors.text,
      fontSize: 15,
    },
    darkSubtitle: {
      ...theme.typography.bodySmall,
      color: theme.colors.textMuted,
      marginTop: 2,
    },
    backupStatus: {
      minHeight: 48,
      borderRadius: 18,
      paddingHorizontal: 14,
      backgroundColor: theme.colors.surfaceSoft,
      borderWidth: 1,
      borderColor: theme.colors.border,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    backupStatusText: {
      ...theme.typography.bodySmall,
      color: theme.colors.textMuted,
      flex: 1,
    },
    backupActions: {
      flexDirection: "row",
      gap: 10,
    },
    actionButton: {
      flex: 1,
      paddingHorizontal: 12,
    },
    iconNote: {
      flex: 1,
      borderRadius: 16,
      backgroundColor: theme.colors.surfaceSoft,
      borderWidth: 1,
      borderColor: theme.colors.border,
      padding: 12,
      gap: 8,
    },
    iconNoteText: {
      ...theme.typography.bodySmall,
      color: theme.colors.textMuted,
    },
  });
}
