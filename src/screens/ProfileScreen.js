import { useEffect, useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Camera, Check, UserRound, X } from "lucide-react-native";
import { AppHeader, HeaderActionButton } from "../components/AppHeader";
import { useAppDialog } from "../components/AppDialog";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { TextField } from "../components/TextField";
import { useGetSafeAreaInsets } from "../hooks/getSafeAreaInsets";
import { autoExportBackup, backupImageIfEnabled } from "../services/localBackupService";
import { getSetting, setSetting } from "../storage/database";
import { useTheme } from "../theme/ThemeProvider";

export function ProfileScreen({ onBack }) {
  const { theme } = useTheme();
  const { showDialog } = useAppDialog();
  const insets = useGetSafeAreaInsets();
  const themedStyles = createStyles(theme, insets);
  const [firstName, setFirstName] = useState("Alex");
  const [lastName, setLastName] = useState("Rivera");
  const [avatarUri, setAvatarUri] = useState("");
  const [profileBusy, setProfileBusy] = useState(false);

  useEffect(() => {
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

  async function pickProfileImage() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      await showDialog({
        title: "Permission needed",
        message: "Gallery access is needed to choose a profile image.",
        variant: "warning",
      });
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
      await showDialog({
        title: "Profile saved",
        message: "Your profile is saved locally and included in backup.",
        variant: "success",
      });
    } catch (error) {
      await showDialog({
        title: "Profile save failed",
        message: error.message,
        variant: "error",
      });
    } finally {
      setProfileBusy(false);
    }
  }

  return (
    <View style={themedStyles.screen}>
      <AppHeader icon={UserRound} title="Profile" subtitle="Name and profile image">
        <HeaderActionButton onPress={onBack} accessibilityLabel="Close profile">
          <X size={19} color={theme.colors.text} />
        </HeaderActionButton>
      </AppHeader>

      <ScrollView contentContainerStyle={themedStyles.scroll}>
        <Card style={themedStyles.profileCard}>
          <Pressable style={themedStyles.profileImageBox} onPress={pickProfileImage}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={themedStyles.profileImage} />
            ) : (
              <Camera size={28} color={theme.colors.primary} />
            )}
          </Pressable>
          <Text style={themedStyles.profileHint}>Tap image to change profile photo.</Text>
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
            Icon={Check}
          />
        </Card>
      </ScrollView>
    </View>
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
      paddingBottom: Math.max(insets.bottom, 24) + 24,
    },
    profileCard: {
      padding: 24,
      gap: 18,
    },
    profileImageBox: {
      width: 108,
      height: 108,
      borderRadius: 32,
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
    profileHint: {
      ...theme.typography.bodySmall,
      color: theme.colors.textMuted,
      marginTop: -8,
    },
  });
}
