import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Cloud, Download, LogIn, LogOut, Upload, X } from "lucide-react-native";
import { AppHeader, HeaderActionButton } from "../components/AppHeader";
import { useAppDialog } from "../components/AppDialog";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { TextField } from "../components/TextField";
import { useGetSafeAreaInsets } from "../hooks/getSafeAreaInsets";
import {
  createCloudAccount,
  observeCloudUser,
  signInCloudAccount,
  signOutCloudAccount,
} from "../services/cloudAuthService";
import {
  restoreCloudSnapshotToLocal,
  uploadLocalSnapshotToCloud,
} from "../services/cloudSyncService";
import { useTheme } from "../theme/ThemeProvider";

export function DataSettingsScreen({ onBack }) {
  const { theme } = useTheme();
  const { showConfirm, showDialog } = useAppDialog();
  const insets = useGetSafeAreaInsets();
  const themedStyles = createStyles(theme, insets);
  const [cloudUser, setCloudUser] = useState(null);
  const [cloudEmail, setCloudEmail] = useState("");
  const [cloudPassword, setCloudPassword] = useState("");
  const [cloudBusy, setCloudBusy] = useState(false);

  useEffect(() => {
    return observeCloudUser((user) => {
      setCloudUser(user);
      if (user?.email) {
        setCloudEmail(user.email);
      }
    });
  }, []);

  async function handleCreateCloudAccount() {
    if (!validateCloudForm()) {
      return;
    }

    setCloudBusy(true);
    try {
      await createCloudAccount(cloudEmail, cloudPassword);
      await showDialog({
        title: "Cloud account created",
        message: "Now press Upload to Cloud to protect this phone data.",
        variant: "success",
      });
      setCloudPassword("");
    } catch (error) {
      await showDialog({
        title: "Account setup failed",
        message: formatCloudError(error),
        variant: "error",
      });
    } finally {
      setCloudBusy(false);
    }
  }

  async function handleSignInCloudAccount() {
    if (!validateCloudForm()) {
      return;
    }

    setCloudBusy(true);
    try {
      await signInCloudAccount(cloudEmail, cloudPassword);
      await showDialog({
        title: "Signed in",
        message: "Cloud backup is ready for this account.",
        variant: "success",
      });
      setCloudPassword("");
    } catch (error) {
      await showDialog({
        title: "Sign in failed",
        message: formatCloudError(error),
        variant: "error",
      });
    } finally {
      setCloudBusy(false);
    }
  }

  async function handleSignOutCloudAccount() {
    setCloudBusy(true);
    try {
      await signOutCloudAccount();
    } catch (error) {
      await showDialog({
        title: "Sign out failed",
        message: formatCloudError(error),
        variant: "error",
      });
    } finally {
      setCloudBusy(false);
    }
  }

  async function handleUploadCloudBackup() {
    setCloudBusy(true);
    try {
      const result = await uploadLocalSnapshotToCloud({ uploadImages: true });
      await showDialog({
        title: "Cloud backup uploaded",
        message: `${result.plants} plants, ${result.settings} settings, and ${result.fertilizerTaskStates} fertilizer tasks saved to cloud.`,
        variant: "success",
      });
    } catch (error) {
      await showDialog({
        title: "Cloud upload failed",
        message: formatCloudError(error),
        variant: "error",
      });
    } finally {
      setCloudBusy(false);
    }
  }

  async function handleRestoreCloudBackup() {
    const confirmed = await showConfirm({
      title: "Restore cloud backup?",
      message: "Cloud plants and settings will be merged into this phone. Existing local plants will not be deleted.",
      confirmLabel: "Restore",
    });
    if (!confirmed) {
      return;
    }

    setCloudBusy(true);
    try {
      const result = await restoreCloudSnapshotToLocal();
      await showDialog({
        title: result.ok ? "Cloud backup restored" : "No cloud backup",
        message: result.ok ? formatCloudRestoreMessage(result) : result.message,
        variant: result.ok ? "success" : "warning",
      });
    } catch (error) {
      await showDialog({
        title: "Cloud restore failed",
        message: formatCloudError(error),
        variant: "error",
      });
    } finally {
      setCloudBusy(false);
    }
  }

  function validateCloudForm() {
    if (!cloudEmail.trim() || !cloudPassword) {
      showDialog({
        title: "Email and password required",
        message: "Enter your cloud account email and password.",
        variant: "warning",
      });
      return false;
    }
    return true;
  }

  return (
    <View style={themedStyles.screen}>
      <AppHeader icon={Cloud} title="Data & Backup" subtitle="Firebase and Cloudinary">
        <CloseButton onPress={onBack} />
      </AppHeader>
      <ScrollView contentContainerStyle={themedStyles.scroll}>
        <Card style={themedStyles.card}>
          <View style={themedStyles.cloudHeader}>
            <View style={themedStyles.cloudIcon}>
              <Cloud size={22} color={theme.colors.primary} />
            </View>
            <View style={themedStyles.cloudHeaderText}>
              <Text style={themedStyles.cloudTitle}>Cloud Backup</Text>
              <Text style={themedStyles.pageSubtitle}>
                {cloudUser
                  ? `Signed in as ${cloudUser.email || "cloud user"}`
                  : "Sign in to save plants in Firebase and images in Cloudinary."}
              </Text>
            </View>
          </View>

          {!cloudUser ? (
            <>
              <TextField
                label="Email"
                value={cloudEmail}
                onChangeText={setCloudEmail}
                placeholder="you@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                textContentType="emailAddress"
              />
              <TextField
                label="Password"
                value={cloudPassword}
                onChangeText={setCloudPassword}
                placeholder="Minimum 6 characters"
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                textContentType="password"
              />
              <View style={themedStyles.backupActions}>
                <Button
                  title="Create Account"
                  onPress={handleCreateCloudAccount}
                  disabled={cloudBusy}
                  Icon={LogIn}
                  style={themedStyles.actionButton}
                />
                <Button
                  title="Sign In"
                  variant="secondary"
                  onPress={handleSignInCloudAccount}
                  disabled={cloudBusy}
                  style={themedStyles.actionButton}
                />
              </View>
            </>
          ) : (
            <>
              <View style={themedStyles.backupActions}>
                <Button
                  title={cloudBusy ? "Uploading..." : "Upload to Cloud"}
                  onPress={handleUploadCloudBackup}
                  disabled={cloudBusy}
                  Icon={Upload}
                  style={themedStyles.actionButton}
                />
                <Button
                  title="Restore"
                  variant="secondary"
                  onPress={handleRestoreCloudBackup}
                  disabled={cloudBusy}
                  Icon={Download}
                  style={themedStyles.actionButton}
                />
              </View>
              <Button
                title="Sign Out"
                variant="secondary"
                onPress={handleSignOutCloudAccount}
                disabled={cloudBusy}
                Icon={LogOut}
              />
            </>
          )}
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

function formatCloudRestoreMessage(result) {
  const parts = [];
  if (result.plants) {
    parts.push(`${result.plants.inserted} plants added, ${result.plants.skipped} duplicates skipped.`);
  }
  if (result.notes) {
    parts.push(`${result.notes.inserted} notes added.`);
  }
  if (result.fertilizerTaskStates) {
    parts.push(`${result.fertilizerTaskStates.upserted} fertilizer tasks restored.`);
  }
  return parts.join("\n") || "Cloud data restored.";
}

function formatCloudError(error) {
  const code = String(error?.code || "");
  if (code.includes("auth/email-already-in-use")) {
    return "This email already has an account. Use Sign In.";
  }
  if (code.includes("auth/invalid-credential") || code.includes("auth/wrong-password")) {
    return "Email or password is incorrect.";
  }
  if (code.includes("auth/weak-password")) {
    return "Use at least 6 characters for the password.";
  }
  if (code.includes("permission-denied")) {
    return "Firestore rules are blocking access. Add the user-only rules from firestore.rules.";
  }
  return error?.message || "Cloud action failed.";
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
    backupActions: {
      flexDirection: "row",
      gap: 10,
    },
    cloudHeader: {
      flexDirection: "row",
      gap: 12,
      alignItems: "center",
    },
    cloudIcon: {
      width: 48,
      height: 48,
      borderRadius: 18,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.colors.successSurface,
    },
    cloudHeaderText: {
      flex: 1,
      gap: 4,
    },
    cloudTitle: {
      ...theme.typography.title,
      color: theme.colors.text,
    },
    actionButton: {
      flex: 1,
      paddingHorizontal: 12,
    },
  });
}
