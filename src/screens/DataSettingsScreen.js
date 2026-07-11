import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Database, Download, FolderOpen, Upload, X } from "lucide-react-native";
import { AppHeader, HeaderActionButton } from "../components/AppHeader";
import { useAppDialog } from "../components/AppDialog";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { useGetSafeAreaInsets } from "../hooks/getSafeAreaInsets";
import {
  chooseBackupFolder,
  exportBackup,
  getBackupFolderUri,
  importLatestBackup,
} from "../services/localBackupService";
import { useTheme } from "../theme/ThemeProvider";

export function DataSettingsScreen({ onBack }) {
  const { theme } = useTheme();
  const { showDialog } = useAppDialog();
  const insets = useGetSafeAreaInsets();
  const themedStyles = createStyles(theme, insets);
  const [backupFolderUri, setBackupFolderUri] = useState("");
  const [backupBusy, setBackupBusy] = useState(false);

  useEffect(() => {
    getBackupFolderUri().then(setBackupFolderUri);
  }, []);

  async function handleChooseBackupFolder() {
    setBackupBusy(true);
    try {
      const result = await chooseBackupFolder();
      if (result?.uri) {
        setBackupFolderUri(result.uri);
        await showDialog({
          title: result.existingBackup ? "Backup found" : "Backup enabled",
          message: result.existingBackup
            ? "Existing backup found. Press Import Backup to restore it."
            : "Your plants will be backed up to this phone folder.",
          variant: result.existingBackup ? "info" : "success",
        });
      }
    } catch (error) {
      await showDialog({
        title: "Backup setup failed",
        message: error.message,
        variant: "error",
      });
    } finally {
      setBackupBusy(false);
    }
  }

  async function handleExportBackup() {
    setBackupBusy(true);
    try {
      const result = await exportBackup();
      await showDialog({
        title: result.ok ? "Backup exported" : "Backup not ready",
        message: result.ok ? `${result.count} plants saved to backup.` : result.message,
        variant: result.ok ? "success" : "warning",
      });
    } catch (error) {
      await showDialog({
        title: "Backup failed",
        message: error.message,
        variant: "error",
      });
    } finally {
      setBackupBusy(false);
    }
  }

  async function handleImportBackup() {
    setBackupBusy(true);
    try {
      const result = await importLatestBackup();
      await showDialog({
        title: result.ok ? "Backup imported" : "Import not ready",
        message: result.ok ? formatImportResultMessage(result) : result.message,
        variant: result.ok ? "success" : "warning",
      });
    } catch (error) {
      await showDialog({
        title: "Import failed",
        message: error.message,
        variant: "error",
      });
    } finally {
      setBackupBusy(false);
    }
  }

  return (
    <View style={themedStyles.screen}>
      <AppHeader icon={Database} title="Data & Backup" subtitle="Local data and backup folder">
        <CloseButton onPress={onBack} />
      </AppHeader>
      <ScrollView contentContainerStyle={themedStyles.scroll}>
        <Card style={themedStyles.card}>
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
              title={backupFolderUri ? "Change Folder" : "Create Folder"}
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

function CloseButton({ onPress }) {
  const { theme } = useTheme();
  return (
    <HeaderActionButton onPress={onPress} accessibilityLabel="Close data settings">
      <X size={19} color={theme.colors.text} />
    </HeaderActionButton>
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

function formatImportResultMessage(result) {
  const parts = [`${result.count} plants checked from backup.`];
  if (result.inserted > 0) parts.push(`${result.inserted} new plants added.`);
  if (result.skipped > 0) parts.push(`${result.skipped} duplicates skipped.`);
  if (result.removedDuplicates > 0) {
    parts.push(`${result.removedDuplicates} existing duplicates cleaned.`);
  }
  return parts.join("\n");
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
    card: {
      padding: 24,
      gap: 18,
    },
    pageSubtitle: {
      ...theme.typography.body,
      color: theme.colors.textMuted,
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
